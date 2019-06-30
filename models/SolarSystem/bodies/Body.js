import IntrospectableMixin from '../../../utils/IntrospectableMixin.js';

class Body extends IntrospectableMixin(class {}) {
  constructor (mass, orbitalRadius, coordinates) {
    super();

    // Vaguely realistic physics numbers
    this.mass = mass;
    this.orbitalRadius = orbitalRadius;

    // Convenience numbers for unrealistic drawing
    this.coordinates = coordinates;

    this.satellites = [];
  }
}
export default Body;
