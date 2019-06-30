import { Model } from '../../node_modules/uki/dist/uki.esm.js';
import Cell from './Cell.js';

class Galaxy extends Model {
  constructor (radius) {
    super();

    // Javascript can support about 13 digits with the precision that we need to
    // store the coordinates; this puts a hard limit on galaxy size at 10^16
    // solar systems (because, you know, we totally need things bigger than the
    // IC 1101, the largest observed galaxy to date, which has O(10^14) stars)
    this.radius = Math.min(radius, 9999999999999);
    this.currentCells = {};
  }

  getGraph (cellViewport) {
    // Throw away cells that are now out of the viewport
    for (const key of Object.keys(this.currentCells)) {
      const cell = this.currentCells[key];
      if (cell.coordinates.x < cellViewport.left ||
          cell.coordinates.x > cellViewport.right ||
          cell.coordinates.y < cellViewport.top ||
          cell.coordinates.y > cellViewport.bottom) {
        delete this.currentCells[key];
      }
    }

    // Construct the graph to show the user, adding
    // any new cells along the way
    const graph = {
      nodes: [],
      links: []
    };

    for (let x = cellViewport.left; x <= cellViewport.right; x += 1) {
      for (let y = cellViewport.top; y <= cellViewport.bottom; y += 1) {
        const key = x + '_' + y;
        if (!this.currentCells[key]) {
          this.currentCells[key] = new Cell({ x, y }, this.radius);
        }
        let cell = this.currentCells[key];
        graph.nodes = graph.nodes.concat(cell.solarSystems);
        graph.links = graph.links.concat(cell.generateInternalLinks());
        if (x > cellViewport.left) {
          let leftLinks = this.currentCells[(x - 1) + '_' + y].generateRightLinks(cell);
          graph.links = graph.links.concat(leftLinks);
        }
        if (y > cellViewport.top) {
          let topLinks = this.currentCells[x + '_' + (y - 1)].generateBottomLinks(cell);
          graph.links = graph.links.concat(topLinks);
        }
      }
    }

    return graph;
  }

  getASolarSystem (roughDistance = 0, roughAngle = Math.random() * 2 * Math.PI) {
    // get the first node in the cell that closest fits these parameters

    let cell;
    while (true) {
      cell = new Cell({
        x: Math.round(roughDistance * Math.cos(roughAngle)),
        y: Math.round(roughDistance * Math.sin(roughAngle))
      }, this.radius);
      if (cell.solarSystems.length > 0) {
        return cell.solarSystems[0];
      } else {
        console.log('Hit an empty cell! Reducing distance by a factor of 0.9...');
        roughDistance *= 0.9;
      }
    }
  }
}
export default Galaxy;
