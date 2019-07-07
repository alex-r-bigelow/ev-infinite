/* globals d3 */
import { View } from '../../node_modules/uki/dist/uki.esm.js';

class MiniMapView extends View {
  constructor () {
    super(d3.select('.MiniMapView'), [
      { type: 'less', url: 'views/MiniMapView/style.less' },
      { type: 'text', url: 'views/MiniMapView/template.html' }
    ]);
  }
  setup () {
    this.d3el.html(this.resources[1]);
  }
  draw () {
    this._size = this.d3el.node().getBoundingClientRect().width;
    this.d3el.select('svg')
      .attr('width', this._size)
      .attr('height', this._size);

    this.quickDrawReady = true;
    this.quickDraw();
  }
  quickDraw () {
    if (this.quickDrawReady) {
      this.drawCurrentSystem();
      this.drawPlayerShip();
      this.drawShips();
    }
  }
  drawCurrentSystem () {
    const bodies = window.controller.currentSystem.bodies;

    // The minimap is always square; use the system's widest dimension to scale,
    // and center the other dimension (include the player's coordinates in case
    // they're flying far out of the system)
    const playerCoords = [
      window.controller.playerShip.currentShip.x,
      window.controller.playerShip.currentShip.y
    ];
    let min = Math.min(...playerCoords);
    let max = Math.max(...playerCoords);
    for (const b of bodies) {
      min = Math.min(min, b.coordinates.x, b.coordinates.y);
      max = Math.max(max, b.coordinates.x, b.coordinates.y);
    }
    const margin = this.emSize;
    this.scale = d3.scaleLinear()
      .domain([min, max])
      .range([margin, this._size - margin]);

    // Draw the dots
    let bodyDots = this.d3el.select('.system')
      .selectAll('.bodyDot').data(bodies);
    bodyDots.exit().remove();
    const bodyDotsEnter = bodyDots.enter().append('g').classed('bodyDot', true);
    bodyDots = bodyDots.merge(bodyDotsEnter);

    bodyDots.attr('transform', d => `translate(${this.scale(d.coordinates.x)},${this.scale(d.coordinates.y)})`);
    bodyDots.classed('star', d => d.type === 'Star')
      .classed('planet', d => d.type === 'Planet')
      .classed('spaceStation', d => d.type === 'SpaceStation');

    bodyDotsEnter.append('circle')
      .attr('r', 4);
  }
  drawPlayerShip () {
    const ship = window.controller.playerShip.currentShip;
    const x = this.scale(ship.x);
    const y = this.scale(ship.y);
    const angle = 180 * ship.direction / Math.PI;
    this.d3el.select('.playerShip')
      .attr('transform', `translate(${x},${y}) rotate(${angle})`);
  }
  drawShips () {
    // TODO
  }
}
export default MiniMapView;
