/* globals d3 */
import seedrandom from '../../solarSystem_modules/seedrandom/seedrandom.min.js';
import SolarSystem from '../SolarSystem/SolarSystem.js';

class Cell {
  constructor (coordinates, radius) {
    this.coordinates = coordinates;

    // We want the outer edge of the galaxy to taper off at the edges w.r.t. the
    // square of the distance; this ensures that, once either coordinate reaches
    // the radius, there will be no stars
    const starDensity = 1 - (this.coordinates.x ** 2 + this.coordinates.y ** 2) / radius ** 2;

    const numberGenerator = seedrandom(this.coordinates);
    this.cellId = numberGenerator.int32();

    // 1. How many solarSystems in this cell?
    const numSolarSystems = Math.floor(starDensity * (Cell.MIN_NODES +
      numberGenerator() * (Cell.MAX_NODES - Cell.MIN_NODES)));

    // 2. Where are those solarSystems?
    this.solarSystems = [];
    const locations = {};
    let i = 0;
    while (i < numSolarSystems) {
      // Ensure some basic separation of the solarSystems
      let newSolarSystem = new SolarSystem({
        id: this.cellId + '_' + i,
        x: this.coordinates.x + Math.round(20 * numberGenerator()) / 20,
        y: this.coordinates.y + Math.round(20 * numberGenerator()) / 20
      });
      const key = newSolarSystem.x + '_' + newSolarSystem.y;
      if (!locations[key]) {
        // Prevent solarSystems from being in the same place... even though the odds are small,
        // the galaxy is huge... so it's going to happen at some point, by definition
        this.solarSystems.push(newSolarSystem);
        i++;
      }
    }

    // We need to generate three additional seeds that can be (reproducably) used
    // later to generate internal links, links to the right, and links to the bottom
    this.internalLinkSeed = numberGenerator.int32();
    this.rightLinkSeed = numberGenerator.int32();
    this.bottomLinkSeed = numberGenerator.int32();
  }
  discourageLongLinks (link, numberGenerator) {
    return numberGenerator() <= 1 - Math.sqrt((link.target.x - link.source.x) ** 2 +
                                              (link.target.y - link.source.y) ** 2);
  }
  generateInternalLinks () {
    if (this.links) {
      return this.links;
    }
    const numberGenerator = seedrandom(this.internalLinkSeed);
    this.links = Cell.VORONOI(this.solarSystems).links()
      .filter(d => this.discourageLongLinks(d, numberGenerator));
    return this.links;
  }
  generateRightLinks (rightCell) {
    if (this.rightLinks) {
      return this.rightLinks;
    }
    const numberGenerator = seedrandom(this.rightLinkSeed);
    const allSolarSystems = this.solarSystems.concat(rightCell.solarSystems);
    this.rightLinks = Cell.VORONOI(allSolarSystems).links()
      .filter(d => {
        // Only consider edges that cross between cells
        if ((d.source.x < this.coordinates.x + 1 && d.target.x >= this.coordinates.x + 1) ||
            (d.target.x < this.coordinates.x + 1 && d.source.x >= this.coordinates.x + 1)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    return this.rightLinks;
  }
  generateBottomLinks (bottomCell) {
    if (this.bottomLinks) {
      return this.bottomLinks;
    }
    const numberGenerator = seedrandom(this.bottomLinkSeed);
    const allSolarSystems = this.solarSystems.concat(bottomCell.solarSystems);
    this.bottomLinks = Cell.VORONOI(allSolarSystems).links()
      .filter(d => {
        // Only consider edges that cross between cells
        if ((d.source.y < this.coordinates.y + 1 && d.target.y >= this.coordinates.y + 1) ||
            (d.target.y < this.coordinates.y + 1 && d.source.y >= this.coordinates.y + 1)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    return this.bottomLinks;
  }
}

// For all solarSystems, we want precision to two decimal places past zero;
// Javascript can support about 13 digits with that precision
Cell.VORONOI = d3.voronoi().x(d => d.x).y(d => d.y);
Cell.PERCENTAGE_OF_LINKS_TO_KEEP = 0.25;
Cell.MIN_NODES = 5;
Cell.MAX_NODES = 15;

export default Cell;
