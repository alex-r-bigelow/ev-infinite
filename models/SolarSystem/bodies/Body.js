import { markovName } from '../../../utils/nameGenerator.js';
import IntrospectableMixin from '../../../utils/IntrospectableMixin.js';

class Body extends IntrospectableMixin(class {}) {
  constructor (layer, seed) {
    super();
    this.layer = layer;
    this.seed = seed;
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
  get details () {
    if (!this._detailsCache) {
      this._detailsCache = this.computeDetails();
    }
    return this._detailsCache;
  }
  computeDetails () {
    const numberGenerator = new Math.seedrandom(this.seed); // eslint-disable-line new-cap
    return {
      name: markovName(window.controller.dialect, numberGenerator)
    };
  }
}
export default Body;
