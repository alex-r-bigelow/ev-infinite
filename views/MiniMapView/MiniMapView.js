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

    this.drawCurrentSystem();

    this.quickDrawReady = true;
    this.quickDraw();
  }
  quickDraw () {
    if (this.quickDrawReady) {
      this.drawShips();
    }
  }
  drawCurrentSystem () {
    const bodies = window.controller.currentSystem.bodies;

    // The minimap is always square; use the system's widest dimension to scale,
    // and center the other dimension
    let min = 0;
    let max = 0;
    for (const b of bodies) {
      min = Math.min(min, b.coordinates.x, b.coordinates.y);
      max = Math.max(max, b.coordinates.x, b.coordinates.y);
    }
    const margin = this.emSize;
    const scale = d3.scaleLinear()
      .domain([min, max])
      .range([margin, this._size - margin]);

    // Draw the dots
    let bodyDots = this.d3el.select('.system')
      .selectAll('.bodyDot').data(bodies);
    bodyDots.exit().remove();
    const bodyDotsEnter = bodyDots.enter().append('g').classed('bodyDot', true);
    bodyDots = bodyDots.merge(bodyDotsEnter);

    bodyDots.attr('transform', d => `translate(${scale(d.coordinates.x)},${scale(d.coordinates.y)})`);
    bodyDots.classed('star', d => d.type === 'Star')
      .classed('planet', d => d.type === 'Planet')
      .classed('spaceStation', d => d.type === 'SpaceStation');

    bodyDotsEnter.append('circle')
      .attr('r', 4);
  }
  drawShips () {
    // TODO
  }
}
export default MiniMapView;
