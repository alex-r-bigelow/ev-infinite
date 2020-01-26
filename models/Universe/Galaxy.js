import { Model } from '../../node_modules/uki/dist/uki.esm.js';
import Cell from './Cell.js';

class Galaxy extends Model {
  constructor (outerRadius) {
    super();

    // Javascript can support about 13 digits with the precision that we need to
    // store the coordinates; this puts a hard limit on galaxy size at 10^16
    // solar systems (because, you know, we totally need things bigger than the
    // IC 1101, the largest observed galaxy to date, which has O(10^14) stars)
    this.outerRadius = Math.min(outerRadius, 9999999999999);
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
          const coordinates = { x, y };
          this.currentCells[key] = new Cell(coordinates, this.computeStarDensity(coordinates));
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
      const coordinates = {
        x: Math.round(roughDistance * Math.cos(roughAngle)),
        y: Math.round(roughDistance * Math.sin(roughAngle))
      };
      cell = new Cell(coordinates, this.computeStarDensity(coordinates));
      if (cell.solarSystems.length > 0) {
        return cell.solarSystems[0];
      } else {
        console.log('Hit an empty cell! Reducing distance by a factor of 0.9...');
        roughDistance *= 0.9;
      }
    }
  }
  getPathBetweenSystems (a, b) {
    if (a.id === b.id) {
      return [];
    }

    const cellsOnTheWay = {};

    // Cell coordinates
    const aC = {
      x: Math.floor(a.coordinates.x),
      y: Math.floor(a.coordinates.y)
    };
    const bC = {
      x: Math.floor(b.coordinates.x),
      y: Math.floor(b.coordinates.y)
    };

    // Shortcut for flagging a kernel of cells along the straight line
    const k = 1; // k = 2 means a kernel thats 5x5
    const addCells = (x, y) => {
      for (let xk = x - k; xk <= x + k; xk++) {
        for (let yk = y - k; yk <= y + k; yk++) {
          const key = xk + '_' + yk;
          if (!cellsOnTheWay[key]) {
            const coordinates = { x: xk, y: yk };
            cellsOnTheWay[key] = new Cell(coordinates, this.computeStarDensity(coordinates));
          }
        }
      }
    };

    // Use Bresenham algorithm for cells in a straight line from a to b
    const dx = Math.abs(aC.x - bC.x);
    const dy = Math.abs(aC.y - bC.y);
    const sx = (aC.x < bC.x) ? 1 : -1;
    const sy = (aC.y < bC.y) ? 1 : -1;
    let err = dx - dy;

    let x = aC.x;
    let y = aC.y;

    while (true) {
      addCells(x, y);

      if (x === bC.x && y === bC.y) {
        break;
      }
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    // Connect all the cells to each other
    for (const cell of Object.values(cellsOnTheWay)) {
      const x = cell.coordinates.x;
      const y = cell.coordinates.y;
      const key = x + '_' + y;
      cellsOnTheWay[key].generateInternalLinks();
      const leftCell = cellsOnTheWay[(x - 1) + '_' + y];
      if (leftCell) {
        leftCell.generateRightLinks(cellsOnTheWay[key]);
      }
      const topCell = cellsOnTheWay[x + '_' + (y - 1)];
      if (topCell) {
        topCell.generateBottomLinks(cellsOnTheWay[key]);
      }
    }

    // Set up Dijkstra's algorithm, and find the duplicate of a in this new
    // network
    const unvisited = {};
    const distances = {};
    const previousNodes = {};
    let currentNode;
    for (const cell of Object.values(cellsOnTheWay)) {
      for (const system of cell.solarSystems) {
        if (system.id === a.id) {
          currentNode = system;
          distances[system.id] = 0;
          continue;
        }
        unvisited[system.id] = system;
        distances[system.id] = Infinity;
      }
    }

    // Run Dijkstra's algorithm
    const visit = (node) => {
      const distance = distances[node.id] + 1;
      for (const neighborId of Object.keys(node.loadedNeighbors)) {
        if (unvisited[neighborId] && (distances[neighborId] === undefined || distance < distances[neighborId])) {
          distances[neighborId] = distance;
          previousNodes[neighborId] = node;
        }
      }
      delete unvisited[node.id];
    };
    while (true) {
      visit(currentNode);
      const closestId = Object.keys(unvisited).sort((aId, bId) => {
        return distances[aId] - distances[bId];
      })[0];
      if (!closestId || !isFinite(distances[closestId])) {
        // No path exists on a straight-ish line, so return early with our best
        // partial guess
        break;
      } else {
        currentNode = unvisited[closestId];
      }
      if (currentNode.id === b.id) {
        break;
      }
    }

    // Trace back from currentNode, but purge any links so it's lighter weight
    const path = [];
    currentNode.loadedNeighbors = {};
    while (previousNodes[currentNode.id]) {
      previousNodes[currentNode.id].loadedNeighbors = {};
      path.unshift({
        source: previousNodes[currentNode.id],
        target: currentNode
      });
      currentNode = previousNodes[currentNode.id];
    }
    return path;
  }
  computeStarDensity ({ x, y }) {
    // Default is to model an elliptical galaxy according to de Vaucouleur's law
    // (TODO: for now, I'm cheating w/an inverse square thing)
    return 1 - (x ** 2 + y ** 2) / this.outerRadius ** 2;
  }
}
export default Galaxy;
