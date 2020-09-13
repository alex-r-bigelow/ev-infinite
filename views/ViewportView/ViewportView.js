/* globals uki, d3 */
import * as THREE from '../../node_modules/three/build/three.module.js';

class ViewportView extends uki.View {
  constructor (options = {}) {
    options.d3el = d3.select('.ViewportView');
    options.resources = options.resources || [];
    options.resources.push(...[
      { type: 'less', url: 'views/ViewportView/style.less' },
      { type: 'text', url: 'views/ViewportView/template.html', name: 'template' },
      { type: 'text', url: 'views/ViewportView/pointField.vert', name: 'pointFieldVert' },
      { type: 'text', url: 'views/ViewportView/pointField.frag', name: 'pointFieldFrag' }
    ]);
    super(options);
  }

  async setup () {
    await super.setup(...arguments);
    this.d3el.html(this.getNamedResource('template'));

    const bounds = this.getBounds();

    this.setupBodiesLayer(bounds);
    this.setupDustField(bounds);
    this.setupStarField(bounds);
    this.setupPlayerShip();
  }

  getBounds () {
    // Temporarily set canvas and SVG elements to size 0,0 so that the correct
    // size can be determined from CSS
    this.d3el.selectAll('svg, canvas')
      .attr('width', 0)
      .attr('height', 0);
    const bounds = this.d3el.node().getBoundingClientRect();
    // Apply the new bounds to svg and canvas elements
    this.d3el.selectAll('svg, canvas')
      .attr('width', bounds.width)
      .attr('height', bounds.height);

    // Cache the bounds for quickDraw to use without it having to resize
    // everything
    this._bounds = bounds;
    return bounds;
  }

  tick () {
    if (this.quickDrawReady) {
      this.updateBodyCamera();
      this.updateDustField();
      this.updateStarField();
    }
  }

  setupBodiesLayer (bounds) {
    // Set up the scene, camera, and renderer
    this.bodyScene = new THREE.Scene();
    this.bodyCamera = new THREE.PerspectiveCamera(
      50, bounds.width / bounds.height, 0.1, 1000);
    this.bodyCamera.position.z = 3;
    this.bodyRenderer = new THREE.WebGLRenderer({
      canvas: this.d3el.select('.bodies').node(),
      alpha: true
    });

    this.populateBodiesLayer();
  }

  setupDustField (bounds) {
    // Set up the scene, camera, and renderer
    this.dustFieldScene = new THREE.Scene();
    this.dustFieldCamera = new THREE.PerspectiveCamera(
      75, bounds.width / bounds.height, 0.1, ViewportView.DUST_DEPTH * 2);
    this.dustFieldCamera.position.z = ViewportView.DUST_DEPTH;
    this.dustFieldRenderer = new THREE.WebGLRenderer({
      canvas: this.d3el.select('.dustField').node(),
      alpha: true
    });

    // Dust field
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(ViewportView.NUM_DUST_PARTICLES * 3), 3));
    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        window: { value: ViewportView.DUST_WINDOW },
        offset: { value: new THREE.Vector2(0, 0) },
        dotSize: { value: 2.0 }
      },
      vertexShader: this.getNamedResource('pointFieldVert'),
      fragmentShader: this.getNamedResource('pointFieldFrag'),
      transparent: true
    });
    this.dustField = new THREE.Points(geometry, this.dustMaterial);
    this.dustFieldScene.add(this.dustField);

    const pointList = this.dustField.geometry.attributes.position.array;
    for (let i = 0; i < ViewportView.NUM_DUST_PARTICLES; i++) {
      pointList[i * 3] = THREE.Math.randFloat(-ViewportView.DUST_WINDOW / 2, ViewportView.DUST_WINDOW / 2);
      pointList[i * 3 + 1] = THREE.Math.randFloat(-ViewportView.DUST_WINDOW / 2, ViewportView.DUST_WINDOW / 2);
      pointList[i * 3 + 2] = THREE.Math.randFloat(0, -ViewportView.DUST_DEPTH);
    }
  }

  setupStarField (bounds) {
    this.starFieldScene = new THREE.Scene();
    this.starFieldCamera = new THREE.PerspectiveCamera(
      75, bounds.width / bounds.height, 0.1, ViewportView.STAR_DEPTH * 2);
    this.starFieldCamera.position.z = ViewportView.STAR_DEPTH;
    this.starFieldRenderer = new THREE.WebGLRenderer({
      canvas: this.d3el.select('.starField').node(),
      alpha: true
    });

    // Star field
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(ViewportView.NUM_STARS * 3), 3));
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        window: { value: ViewportView.STAR_WINDOW },
        offset: { value: new THREE.Vector2(0, 0) },
        dotSize: { value: 2.0 }
      },
      vertexShader: this.getNamedResource('pointFieldVert'),
      fragmentShader: this.getNamedResource('pointFieldFrag'),
      transparent: true
    });
    this.starField = new THREE.Points(geometry, this.starMaterial);
    this.starFieldScene.add(this.starField);

    const pointList = this.starField.geometry.attributes.position.array;
    for (let i = 0; i < ViewportView.NUM_STARS; i++) {
      pointList[i * 3] = THREE.Math.randFloat(-ViewportView.STAR_WINDOW / 2, ViewportView.STAR_WINDOW / 2);
      pointList[i * 3 + 1] = THREE.Math.randFloat(-ViewportView.STAR_WINDOW / 2, ViewportView.STAR_WINDOW / 2);
      pointList[i * 3 + 2] = THREE.Math.randFloat(0, -ViewportView.STAR_DEPTH);
    }
  }

  populateBodiesLayer () {
    // Remove any old bodies
    while (this.bodyScene.children.length > 0) {
      this.bodyScene.remove(this.bodyScene.children[0]);
    }
    // Add the new ones
    const bodies = window.controller.currentSystem.bodies;
    for (const body of bodies) {
      const geometry = new THREE.SphereBufferGeometry(body.radius, 32, 32);

      // TODO: generate textures, rings, size (and geometry for space stations?)
      // based on body.details

      if (body.type === 'Star') {
        const material = new THREE.MeshBasicMaterial({ color: 0xffff99 });
        const bodySphere = new THREE.Mesh(geometry, material);
        const light = new THREE.PointLight(0xffff99, body.radius, 0, 2);
        light.add(bodySphere);
        light.position.x = body.coordinates.x;
        light.position.y = -body.coordinates.y;
        this.bodyScene.add(light);
      } else {
        const material = new THREE.MeshPhongMaterial({ color: 0xbada55 });
        const bodySphere = new THREE.Mesh(geometry, material);
        bodySphere.position.x = body.coordinates.x;
        bodySphere.position.y = -body.coordinates.y;
        this.bodyScene.add(bodySphere);
      }
    }
    // Very weak ambient light
    this.bodyScene.add(new THREE.AmbientLight(0xffffff, 0.1));
  }

  updateBodyCamera () {
    const ship = window.controller.playerShip.currentShip;
    this.bodyCamera.position.x = ship.x;
    this.bodyCamera.position.y = -ship.y;
  }

  updateDustField () {
    const ship = window.controller.playerShip.currentShip;
    this.dustMaterial.uniforms.offset.value = new THREE.Vector2(
      -ViewportView.SYSTEM_SCALE_FACTOR * ship.x % ViewportView.DUST_WINDOW,
      ViewportView.SYSTEM_SCALE_FACTOR * ship.y % ViewportView.DUST_WINDOW
    );
  }

  updateStarField () {
    const ship = window.controller.playerShip.currentShip;
    this.starMaterial.uniforms.offset.value = new THREE.Vector2(
      -ViewportView.SYSTEM_SCALE_FACTOR * ship.x % ViewportView.STAR_WINDOW,
      ViewportView.SYSTEM_SCALE_FACTOR * ship.y % ViewportView.STAR_WINDOW
    );
  }

  async draw () {
    await super.draw(...arguments);

    const bounds = this.getBounds();

    this.bodyRenderer.setSize(bounds.width, bounds.height);
    this.bodyCamera.aspect = bounds.width / bounds.height;
    this.bodyCamera.updateProjectionMatrix();
    this.populateBodiesLayer();

    this.dustFieldRenderer.setSize(bounds.width, bounds.height);
    this.dustFieldCamera.aspect = bounds.width / bounds.height;
    this.dustFieldCamera.updateProjectionMatrix();

    this.starFieldRenderer.setSize(bounds.width, bounds.height);
    this.starFieldCamera.aspect = bounds.width / bounds.height;
    this.starFieldCamera.updateProjectionMatrix();

    this.quickDrawReady = true;
    this.quickDraw();
  }

  quickDraw () {
    if (this.quickDrawReady) {
      this.drawPlayerShip(this._bounds);
      this.bodyRenderer.render(this.bodyScene, this.bodyCamera);
      this.dustFieldRenderer.render(this.dustFieldScene, this.dustFieldCamera);
      this.starFieldRenderer.render(this.starFieldScene, this.starFieldCamera);
    }
  }

  setupPlayerShip () {
    const ship = window.controller.playerShip.currentShip;
    this.d3el.select('.playerShip')
      .html(ship.getSvg());
  }

  drawPlayerShip (bounds) {
    const ship = window.controller.playerShip.currentShip;
    this.d3el.select('.playerShip')
      .attr('transform', `translate(${bounds.width / 2},${bounds.height / 2}) rotate(${180 * ship.direction / Math.PI})`);
  }
}
ViewportView.SYSTEM_SCALE_FACTOR = 100;
ViewportView.NUM_DUST_PARTICLES = 1000;
ViewportView.DUST_WINDOW = 400;
ViewportView.DUST_DEPTH = 50;
ViewportView.NUM_STARS = 3000;
ViewportView.STAR_WINDOW = 10000;
ViewportView.STAR_DEPTH = 3000;
export default ViewportView;
