/* globals d3 */
import SolarSystem from '../SolarSystem/SolarSystem.js';

class Cell {
  constructor (coordinates, galaxy) {
    this.coordinates = coordinates;
    this.galaxy = galaxy;

    const numberGenerator = new Math.seedrandom(this.coordinates); // eslint-disable-line new-cap
    this.cellId = numberGenerator.int32();

    // 1. How many solarSystems in this cell?
    const starDensity = this.galaxy.computeStarDensity(this.coordinates);
    const numSolarSystems = Math.floor(starDensity * (Cell.MIN_NODES +
      numberGenerator() * (Cell.MAX_NODES - Cell.MIN_NODES)));

    // 2. Where are those solarSystems?
    this.solarSystems = [];
    const locations = {};
    let i = 0;
    while (i < numSolarSystems) {
      // Ensure some basic separation of the solarSystems by assigning them
      // to a 1/5 x 1/5 subsection of the cell
      const newSolarSystem = new SolarSystem({
        id: this.cellId + '_' + i,
        x: this.coordinates.x + Math.round(5 * numberGenerator()) / 5,
        y: this.coordinates.y + Math.round(5 * numberGenerator()) / 5
      });
      // Prevent solarSystems from being in the same subsection
      const key = newSolarSystem.coordinates.x + '_' + newSolarSystem.coordinates.y;
      if (!locations[key]) {
        locations[key] = newSolarSystem;
        // Perturb the coordinates a little within their subsections to avoid
        // a rectilinear look
        newSolarSystem.coordinates.x += numberGenerator() / 8;
        newSolarSystem.coordinates.y += numberGenerator() / 8;
        this.solarSystems.push(newSolarSystem);
        i++;
      }
    }

    // We need to generate three additional seeds that can be (reproducibly) used
    // later to generate internal links, links to the right, and links to the bottom
    this.internalLinkSeed = numberGenerator.int32();
    this.rightLinkSeed = numberGenerator.int32();
    this.bottomLinkSeed = numberGenerator.int32();
  }

  discourageLongLinks (link, numberGenerator) {
    const length = Math.sqrt(
      (link.target.coordinates.x - link.source.coordinates.x) ** 2 +
      (link.target.coordinates.y - link.source.coordinates.y) ** 2);
    return numberGenerator() <= 1 - length;
  }

  connectNeighbors (linkList) {
    for (const link of linkList) {
      link.source.loadNeighbor(link.target);
      link.target.loadNeighbor(link.source);
    }
  }

  getAllPossibleLinks (solarSystemList) {
    const delaunay = d3.Delaunay.from(solarSystemList, d => d.coordinates.x, d => d.coordinates.y);
    const links = [];
    for (let i = 0; i < delaunay.halfedges.length; i++) {
      const j = delaunay.halfedges[i];
      if (j < i) continue;
      links.push({
        source: solarSystemList[delaunay.triangles[i]],
        target: solarSystemList[delaunay.triangles[j]]
      });
    }
    let lastH = delaunay.hull[delaunay.hull.length - 1];
    for (const h of delaunay.hull) {
      links.push({
        source: solarSystemList[lastH],
        target: solarSystemList[h]
      });
      lastH = h;
    }
    return links;
  }

  generateInternalLinks () {
    if (this.links) {
      return this.links;
    }
    const numberGenerator = new Math.seedrandom(this.internalLinkSeed); // eslint-disable-line new-cap
    this.links = this.getAllPossibleLinks(this.solarSystems)
      .filter(d => this.discourageLongLinks(d, numberGenerator));
    this.connectNeighbors(this.links);
    return this.links;
  }

  generateRightLinks (rightCell) {
    if (this.rightLinks) {
      return this.rightLinks;
    }
    const numberGenerator = new Math.seedrandom(this.rightLinkSeed); // eslint-disable-line new-cap
    const allSolarSystems = this.solarSystems.concat(rightCell.solarSystems);
    this.rightLinks = this.getAllPossibleLinks(allSolarSystems)
      .filter(d => {
        // Only consider edges that cross between cells
        const sourceLeft = d.source.coordinates.x < this.coordinates.x + 1;
        const targetRight = d.target.coordinates.x >= this.coordinates.x + 1;
        const targetLeft = d.target.coordinates.x < this.coordinates.x + 1;
        const sourceRight = d.source.coordinates.x >= this.coordinates.x + 1;
        if ((sourceLeft && targetRight) || (targetLeft && sourceRight)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    this.connectNeighbors(this.rightLinks);
    return this.rightLinks;
  }

  generateBottomLinks (bottomCell) {
    if (this.bottomLinks) {
      return this.bottomLinks;
    }
    const numberGenerator = new Math.seedrandom(this.bottomLinkSeed); // eslint-disable-line new-cap
    const allSolarSystems = this.solarSystems.concat(bottomCell.solarSystems);
    this.bottomLinks = this.getAllPossibleLinks(allSolarSystems)
      .filter(d => {
        // Only consider edges that cross between cells
        const sourceTop = d.source.coordinates.y < this.coordinates.y + 1;
        const targetBottom = d.target.coordinates.y >= this.coordinates.y + 1;
        const targetTop = d.target.coordinates.y < this.coordinates.y + 1;
        const sourceBottom = d.source.coordinates.y >= this.coordinates.y + 1;
        if ((sourceTop && targetBottom) || (targetTop && sourceBottom)) {
          return this.discourageLongLinks(d, numberGenerator);
        } else {
          return false;
        }
      });
    this.connectNeighbors(this.bottomLinks);
    return this.bottomLinks;
  }
}

// For all solarSystems, we want precision to two decimal places past zero;
// Javascript can support about 13 digits with that precision
Cell.PERCENTAGE_OF_LINKS_TO_KEEP = 0.25;
Cell.MIN_NODES = 5;
Cell.MAX_NODES = 10;

export default Cell;
