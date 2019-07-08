/* globals  jStat */
import { Model } from '../../node_modules/uki/dist/uki.esm.js';
import Star from './bodies/Star.js';
import Planet from './bodies/Planet.js';
import SpaceStation from './bodies/SpaceStation.js';

class SolarSystem extends Model {
  constructor ({ id, x, y }) {
    super();

    this.id = id;
    this.coordinates = { x, y };
  }
  get bodies () {
    if (this._bodyCache) {
      return this._bodyCache;
    }

    this._bodyCache = [];
    const numberGenerator = new Math.seedrandom(this.coordinates); // eslint-disable-line new-cap

    const initBody = layer => {
      const r = numberGenerator();
      let result;
      if (layer === 0) {
        // Center odds: 0.5% SpaceStation, 4.5% Planet, 95% Star
        result = r < 0.005 ? new SpaceStation(layer)
          : r < 0.05 ? new Planet(layer) : new Star(layer);
      } else if (layer === 1) {
        // Layer 1 odds: 1% SpaceStation, 97% Planet, 2% Star
        result = r < 0.01 ? new SpaceStation(layer)
          : r < 0.98 ? new Planet(layer) : new Star(layer);
      } else if (layer === 2) {
        // Layer 2 odds: 4% SpaceStation, 96% Planet, 0% Star
        result = r < 0.04 ? new SpaceStation(layer) : new Planet(layer);
      }
      this._bodyCache.push(result);
      return result;
    };

    const createSystem = (origin, layer, distance, angle) => {
      const bodies = [initBody(layer)];
      const center = {
        x: origin.x + distance * Math.cos(angle),
        y: origin.y + distance * Math.sin(angle)
      };
      const separationFactor = (3 - layer) ** 2;
      let separation = jStat.normal.inv(numberGenerator(), separationFactor, 0.2 * separationFactor);
      if (numberGenerator() < 0.05) {
        // 5% chance of binary systems or subsystems
        bodies.push(initBody(layer));
        const binaryAngle = 2 * Math.PI * numberGenerator();
        bodies[0].coordinates = {
          x: center.x + separation * Math.cos(binaryAngle),
          y: center.y + separation * Math.sin(binaryAngle)
        };
        bodies[1].coordinates = {
          x: center.x - separation * Math.cos(binaryAngle),
          y: center.y - separation * Math.sin(binaryAngle)
        };
        // Give more space for things orbiting this binary
        separation = separation * 2;
      } else {
        bodies[0].coordinates = center;
      }

      // Generate things orbiting this body / binary (as long as they're not
      // space stations)
      if (layer < 2 && !bodies.every(d => d.type === 'SpaceStation')) {
        const numSatellites = Math.round(jStat.normal.inv(numberGenerator(), 1.5, 2));
        for (let i = 0; i < numSatellites; i++) {
          const satellites = createSystem(center, layer + 1, separation, numberGenerator() * 2 * Math.PI);
          for (const body of bodies) {
            body.satellites = body.satellites.concat(satellites);
          }
          for (const satellite of satellites) {
            satellite.orbiting = bodies;
          }
          separation += jStat.normal.inv(numberGenerator(), 3 - layer, 0.2);
        }
      }
      return bodies;
    };

    createSystem({ x: 0, y: 0 }, 0, 0, 0);

    return this._bodyCache;
  }
}
export default SolarSystem;
