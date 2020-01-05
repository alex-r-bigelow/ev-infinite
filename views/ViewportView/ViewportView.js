/* globals d3 */
import { View } from '../../node_modules/uki/dist/uki.esm.js';
import * as THREE from '../../node_modules/three/build/three.module.js';

class ViewportView extends View {
  constructor () {
    super(d3.select('.ViewportView'), [
      { type: 'less', url: 'views/ViewportView/style.less' },
      { type: 'text', url: 'views/ViewportView/template.html' },
      { type: 'text', url: 'views/ViewportView/pointField.vert' },
      { type: 'text', url: 'views/ViewportView/pointField.frag' }
    ]);
  }
  setup () {
    this.d3el.html(this.resources[1]);

    this._bounds = this.d3el.node().getBoundingClientRect();

    this.setupBodiesLayer();
    this.setupDustField();
    this.setupStarField();
    this.setupPlayerShip();
  }
  tick () {
    if (this.quickDrawReady) {
      this.updateBodyCamera();
      this.updateDustField();
      this.updateStarField();
    }
  }
  setupBodiesLayer () {
    // Set up the scene, camera, and renderer
    this.bodyScene = new THREE.Scene();
    this.bodyCamera = new THREE.PerspectiveCamera(
      50, this._bounds.width / this._bounds.height, 0.1, 1000);
    this.bodyCamera.position.z = 3;
    this.bodyRenderer = new THREE.WebGLRenderer({
      canvas: this.d3el.select('.bodies').node(),
      alpha: true
    });

    this.populateBodiesLayer();
  }
  setupDustField () {
    // Set up the scene, camera, and renderer
    this.dustFieldScene = new THREE.Scene();
    this.dustFieldCamera = new THREE.PerspectiveCamera(
      75, this._bounds.width / this._bounds.height, 0.1, ViewportView.DUST_DEPTH * 2);
    this.dustFieldCamera.position.z = ViewportView.DUST_DEPTH;
    this.dustFieldRenderer = new THREE.WebGLRenderer({
      canvas: this.d3el.select('.dustField').node(),
      alpha: true
    });

    // Dust field
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(
      new Float32Array(ViewportView.NUM_DUST_PARTICLES * 3), 3));
    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        window: { value: ViewportView.DUST_WINDOW },
        offset: { value: new THREE.Vector2(0, 0) },
        dotSize: { value: 2.0 }
      },
      vertexShader: this.resources[2],
      fragmentShader: this.resources[3],
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
  setupStarField () {
    this.starFieldScene = new THREE.Scene();
    this.starFieldCamera = new THREE.PerspectiveCamera(
      75, this._bounds.width / this._bounds.height, 0.1, ViewportView.STAR_DEPTH * 2);
    this.starFieldCamera.position.z = ViewportView.STAR_DEPTH;
    this.starFieldRenderer = new THREE.WebGLRenderer({
      canvas: this.d3el.select('.starField').node(),
      alpha: true
    });

    // Star field
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(
      new Float32Array(ViewportView.NUM_STARS * 3), 3));
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        window: { value: ViewportView.STAR_WINDOW },
        offset: { value: new THREE.Vector2(0, 0) },
        dotSize: { value: 2.0 }
      },
      vertexShader: this.resources[2],
      fragmentShader: this.resources[3],
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
  draw () {
    this._bounds = this.d3el.node().getBoundingClientRect();
    this.d3el.selectAll('svg')
      .attr('width', this._bounds.width)
      .attr('height', this._bounds.height);

    this.bodyRenderer.setSize(this._bounds.width, this._bounds.height);
    this.bodyCamera.aspect = this._bounds.width / this._bounds.height;
    this.bodyCamera.updateProjectionMatrix();
    this.populateBodiesLayer();

    this.dustFieldRenderer.setSize(this._bounds.width, this._bounds.height);
    this.dustFieldCamera.aspect = this._bounds.width / this._bounds.height;
    this.dustFieldCamera.updateProjectionMatrix();

    this.starFieldRenderer.setSize(this._bounds.width, this._bounds.height);
    this.starFieldCamera.aspect = this._bounds.width / this._bounds.height;
    this.starFieldCamera.updateProjectionMatrix();

    this.quickDrawReady = true;
    this.quickDraw();
  }
  quickDraw () {
    if (this.quickDrawReady) {
      this.drawPlayerShip();
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
  drawPlayerShip () {
    const ship = window.controller.playerShip.currentShip;
    this.d3el.select('.playerShip')
      .attr('transform', `translate(${this._bounds.width / 2},${this._bounds.height / 2}) rotate(${180 * ship.direction / Math.PI})`);
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
