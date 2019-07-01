import IntrospectableMixin from '../../../utils/IntrospectableMixin.js';

class Body extends IntrospectableMixin(class {}) {
  constructor (layer) {
    super();
    this.layer = layer;
    this.orbiting = [];
    this.satellites = [];
  }
}
export default Body;
