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
  }
  draw () {
    const bounds = this.d3el.node().getBoundingClientRect();
    this.d3el.select('svg')
      .attr('width', bounds.width)
      .attr('height', bounds.height);
  }
}
export default ViewportView;
