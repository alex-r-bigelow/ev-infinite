import IntrospectableMixin from '../../../utils/IntrospectableMixin.js';

class Body extends IntrospectableMixin(class {}) {
  constructor (layer) {
    super();
    this.layer = layer;
    this.orbiting = [];
    this.satellites = [];
  }
  get orbitCenter () {
    let x = 0;
    let y = 0;
    for (const parent of this.orbiting) {
      x += parent.coordinates.x;
      y += parent.coordinates.y;
    }
    if (this.orbiting.length > 0) {
      x = x / this.orbiting.length;
      y = y / this.orbiting.length;
    }
    return { x, y };
  }
}
export default Body;
