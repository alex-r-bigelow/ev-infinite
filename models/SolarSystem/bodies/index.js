import Star from './Star.js';
import Planet from './Planet.js';
import SpaceStation from './SpaceStation.js';

function createFromMass (mass) {
  // Our rough translation from mass to type of thing:
  // 30000000 Earth masses = upper range of stellar mass black holes
  // 300000 Earth masses = mass of sun
  // 1 Earth mass = what we want most solar system bodies to look like
  // 0.001 Earth masses = dwarf planet
  // 0.0000001 Earth masses = space station
  // (this is still huge; probably Death Star-sized)

  // TODO: one way to make this game more interesting would be to allow for more
  // interesting black hole / star / brown dwarf / planet / dwarf planet types.
  // See https://en.wikipedia.org/wiki/Astronomical_object for ideas. For now,
  // we follow some naive logic to generate basic stars, planets, and space
  // stations
  if (mass > 20000) {
    return new Star(...arguments);
  } else if (mass > 0.0000001) {
    return new Planet(...arguments);
  } else {
    return new SpaceStation(...arguments);
  }
}

export { Star };
export { Planet };
export { SpaceStation };
export { createFromMass };
