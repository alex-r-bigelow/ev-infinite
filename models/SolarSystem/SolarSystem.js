/* globals d3, jStat */
import { Model } from '../../node_modules/uki/dist/uki.esm.js';
import { createFromMass } from './bodies/index.js';

class SolarSystem extends Model {
  constructor ({ id, x, y }) {
    super();

    this.id = id;
    this.coordinates = { x, y };

    const numberGenerator = new Math.seedrandom(this.coordinates); // eslint-disable-line new-cap

    // Ensure at least one major solar system body (stars, planets, stations)
    this.numBodies = Math.ceil(SolarSystem.MAX_BODIES * numberGenerator());
    this.bodySeed = numberGenerator.int32();
  }
  get bodies () {
    if (this._bodyCache) {
      return this._bodyCache;
    }

    this._bodyCache = [];
    const numberGenerator = new Math.seedrandom(this.bodySeed); // eslint-disable-line new-cap

    const createSystem = parent => {
      const nBodies = Math.min(
        this.numBodies - this._bodyCache.length,
        Math.ceil(jStat.exponential.inv(numberGenerator(), 1))
      );
      // Each subsystem should be orders of magnitude smaller than its parent
      const targetMasses = [SolarSystem.MIN_MASS_DECAY * parent.mass, SolarSystem.MAX_MASS_DECAY * parent.mass];
      const massScale = d3.scaleLog().domain(targetMasses);

      // We want local things roughly 10x closer to each other than the parent
      // system, but don't let things get closer than 0.2 AU
      const targetRadii = [SolarSystem.MIN_RADIUS_DECAY * parent.orbitalRadius, SolarSystem.MAX_RADIUS_DECAY * parent.orbitalRadius];
      const radiusScale = d3.scaleLinear().range(targetRadii);

      for (let b = 0; b < nBodies; b++) {
        // I manually played with these numbers to get a reasonable sampling
        // of different celestial body types
        const mass = massScale.invert(jStat.normal.inv(numberGenerator(), 0.5, 0.3));
        const orbitalRadius = radiusScale(numberGenerator());
        const angleOffset = 2 * Math.PI * numberGenerator();
        const angle = angleOffset + b * 2 * Math.PI / nBodies;
        const coordinates = {
          x: parent.coordinates.x + orbitalRadius * Math.cos(angle),
          y: parent.coordinates.y + orbitalRadius * Math.sin(angle)
        };

        const satellite = createFromMass(mass, orbitalRadius, coordinates);
        if (parent.satellites) {
          parent.satellites.push(satellite);
        }
        this._bodyCache.push(satellite);
      }
    };

    let parentNo = 0;
    while (this._bodyCache.length < this.numBodies) {
      if (this._bodyCache.length === 0) {
        // Root level; start with a pre-decayed dummy parent
        createSystem({
          mass: SolarSystem.MAX_STAR_SIZE / SolarSystem.MAX_MASS_DECAY,
          orbitalRadius: SolarSystem.MAX_ORBITAL_RADIUS / SolarSystem.MAX_RADIUS_DECAY,
          coordinates: { x: 0, y: 0 }
        });
      } else {
        // Create a subsystem for the biggest thing we haven't yet touched
        createSystem(this._bodyCache[parentNo]);
        parentNo++;
      }
    }

    return this._bodyCache;
  }
}

SolarSystem.MAX_BODIES = 10;
SolarSystem.MAX_STAR_SIZE = 10000000; // Earth masses; max is roughly a stellar mass black hole
SolarSystem.MAX_MASS_DECAY = 0.01;
SolarSystem.MIN_MASS_DECAY = 0.0001;
SolarSystem.MAX_ORBITAL_RADIUS = 50; // 50 AU
SolarSystem.MIN_RADIUS_DECAY = 0.5;
SolarSystem.MAX_RADIUS_DECAY = 0.75;
export default SolarSystem;
