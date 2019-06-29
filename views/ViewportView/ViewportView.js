/* globals d3 */
import { View } from '../../node_modules/uki/dist/uki.esm.js';

class ViewportView extends View {
  constructor () {
    super(d3.select('.ViewportView'), [
      { type: 'less', url: 'views/ViewportView/style.less' },
      { type: 'text', url: 'views/ViewportView/template.html' }
    ]);
  }
  setup () {
    this.d3el.html(this.resources[1]);

    this.setupPlayerShip();
  }
  draw () {
    this._bounds = this.d3el.node().getBoundingClientRect();
    this.d3el.selectAll('svg, canvas')
      .attr('width', this._bounds.width)
      .attr('height', this._bounds.height);

    this.quickDrawReady = true;
    this.quickDraw();
  }
  quickDraw () {
    if (this.quickDrawReady) {
      this.drawPlayerShip();
      this.drawStarField();
    }
  }
  drawStarField () {
    // TODO
  }
  setupPlayerShip () {
    const ship = window.controller.playerShip.currentShip;
    this.d3el.select('.playerShip')
      .html(ship.getSvg());
  }
  drawPlayerShip () {
    const ship = window.controller.playerShip.currentShip;
    this.d3el.select('.playerShip')
      .attr('transform', `translate(${this._bounds.width / 2},${this._bounds.height / 2}) rotate(${180 * ship.direction / Math.PI})`);
  }
}
export default ViewportView;
