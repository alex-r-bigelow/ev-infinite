/* globals d3 */
import { View } from '../../node_modules/uki/dist/uki.esm.js';
import * as THREE from '../../node_modules/three/build/three.module.js';

class ViewportView extends View {
  constructor () {
    super(d3.select('.ViewportView'), [
      { type: 'less', url: 'views/ViewportView/style.less' },
      { type: 'text', url: 'views/ViewportView/template.html' },
      { type: 'text', url: 'views/ViewportView/dust.vert' },
      { type: 'text', url: 'views/ViewportView/dust.frag' }
    ]);
  }
  setup () {
    this.d3el.html(this.resources[1]);

    this._bounds = this.d3el.node().getBoundingClientRect();

    this.setupBodiesLayer();
    this.setupDustField();
    this.setupPlayerShip();
  }
  tick () {
    if (this.quickDrawReady) {
      this.updateBodyCamera();
      this.updateDustField();
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

    const bodies = window.controller.currentSystem.bodies;
    for (const body of bodies) {
      const geometry = new THREE.SphereBufferGeometry(body.radius, 32, 32);

      // TODO: generate textures, rings, size (and geometry for space stations?)
      // based on body.details

      if (body.type === 'Star') {
        const material = new THREE.MeshBasicMaterial({ color: 0xffff99 });
        const bodySphere = new THREE.Mesh(geometry, material);
        const light = new THREE.PointLight(0xffff99);
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
  }
  setupDustField () {
    // Set up the scene, camera, and renderer
    this.dustFieldScene = new THREE.Scene();
    this.dustFieldCamera = new THREE.PerspectiveCamera(
      75, this._bounds.width / this._bounds.height, 0.1, 1000);
    this.dustFieldCamera.position.z = ViewportView.DUST_DEPTH;
    this.dustFieldRenderer = new THREE.WebGLRenderer({
      canvas: this.d3el.select('.dustField').node(),
      alpha: true
    });

    // Dust field
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(
      new Float32Array(ViewportView.NUM_PARTICLES * 3), 3));
    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dustWindow: { value: ViewportView.DUST_WINDOW },
        offset: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: this.resources[2],
      fragmentShader: this.resources[3],
      transparent: true
    });
    this.dustField = new THREE.Points(geometry, this.dustMaterial);
    this.dustFieldScene.add(this.dustField);

    const pointList = this.dustField.geometry.attributes.position.array;
    for (let i = 0; i < ViewportView.NUM_PARTICLES; i++) {
      pointList[i * 3] = THREE.Math.randFloat(-ViewportView.DUST_WINDOW / 2, ViewportView.DUST_WINDOW / 2);
      pointList[i * 3 + 1] = THREE.Math.randFloat(-ViewportView.DUST_WINDOW / 2, ViewportView.DUST_WINDOW / 2);
      pointList[i * 3 + 2] = THREE.Math.randFloat(0, -ViewportView.DUST_DEPTH);
    }
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
  draw () {
    this._bounds = this.d3el.node().getBoundingClientRect();
    this.d3el.selectAll('svg')
      .attr('width', this._bounds.width)
      .attr('height', this._bounds.height);

    this.bodyRenderer.setSize(this._bounds.width, this._bounds.height);
    this.bodyCamera.aspect = this._bounds.width / this._bounds.height;
    this.bodyCamera.updateProjectionMatrix();

    this.dustFieldRenderer.setSize(this._bounds.width, this._bounds.height);
    this.dustFieldCamera.aspect = this._bounds.width / this._bounds.height;
    this.dustFieldCamera.updateProjectionMatrix();

    this.quickDrawReady = true;
    this.quickDraw();
  }
  quickDraw () {
    if (this.quickDrawReady) {
      this.drawPlayerShip();
      this.bodyRenderer.render(this.bodyScene, this.bodyCamera);
      this.dustFieldRenderer.render(this.dustFieldScene, this.dustFieldCamera);
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
ViewportView.NUM_PARTICLES = 5000;
ViewportView.DUST_WINDOW = 800;
ViewportView.DUST_DEPTH = 100;
export default ViewportView;
