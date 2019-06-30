import { Model } from '../../node_modules/uki/dist/uki.esm.js';
import seedrandom from '../../node_modules/seedrandom/seedrandom.min.js';

class SolarSystem extends Model {
  constructor ({ id, x, y }) {
    super();

    this.id = id;
    this.coordinates = { x, y };

    const numberGenerator = seedrandom(this.coordinates);

    // Ensure at least one major solar system body (stars, planets, stations)
    this.numBodies = Math.ceil(SolarSystem.MAX_BODIES * numberGenerator());
    this.bodySeed = numberGenerator.int32();
  }
  getGravityTree () {
    // TODO: one way to make this game more interesting would be to allow for
    // more interesting star / brown dwarf types. See
    // https://en.wikipedia.org/wiki/Astronomical_object for ideas.
    // For now, we follow some naive logic to generate basic stars, planets,
    // moons, and space stations

    let objectCount = this.numBodies;

    const getStars = () = > {

    }


    const numberGenerator = seedrandom(this.bodySeed);
    // 30000000 Earth masses = upper range of stellar mass black holes
    // 1 Earth mass = what we want most solar system bodies to look like
    // 0.001 Earth masses = dwarf planet
    const massDistribution = normalDistribution(0.001, )

    const isBinarySystem = this.numBodies > 5 && numberGenerator() < 0.01;
  }
}

SolarSystem.MAX_BODIES = 32;
export default SolarSystem;
