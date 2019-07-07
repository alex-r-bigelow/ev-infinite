/* globals d3 */
import Modal from '../Modal/Modal.js';

class MapView extends Modal {
  constructor () {
    super([
      { type: 'less', url: 'views/MapView/style.less' },
      { type: 'text', url: 'views/MapView/template.html' }
    ]);
  }
  setup () {
    super.setup();
    this.d3el.html(this.resources[1]);

    this.d3el.select('svg')
      .call(d3.zoom()
        .on('zoom', () => {
          this.d3el.selectAll('.systems, .links')
            .attr('transform', d3.event.transform);
        }));

    this.d3el.select('.ok.button')
      .on('click', () => { window.controller.resume(); });
  }
  draw () {
    const width = window.innerWidth - 200;
    const height = window.innerHeight - 200;
    this.d3el.select('svg')
      .attr('width', width)
      .attr('height', height);

    // For now, just use the full radius of the universe (we're keeping
    // it small-ish enough to fit in memory / draw completely)
    const r = window.controller.universe.radius;
    const graph = window.controller.universe.getGraph({
      left: -r,
      top: -r,
      right: r,
      bottom: r
    });

    // 200px per cell, centered at 0,0
    const xScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([width / 2 - 200, width / 2 + 200]);
    const yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([height / 2 - 200, height / 2 + 200]);

    let systems = this.d3el.select('.systems').selectAll('.system')
      .data(graph.nodes, d => d.id);
    systems.exit().remove();
    const systemsEnter = systems.enter().append('g').classed('system', true);
    systems = systems.merge(systemsEnter);

    systemsEnter.append('circle').attr('r', 4);

    systems.attr('transform', d => {
      const x = xScale(d.coordinates.x);
      const y = yScale(d.coordinates.y);
      return `translate(${x},${y})`;
    });

    let links = this.d3el.select('.links').selectAll('.link')
      .data(graph.links, d => d.source.id + '_' + d.target.id);
    links.exit().remove();
    const linksEnter = links.enter().append('g').classed('link', true);
    links = links.merge(linksEnter);

    linksEnter.append('line');

    links.select('line')
      .attr('x1', d => xScale(d.source.coordinates.x))
      .attr('y1', d => yScale(d.source.coordinates.y))
      .attr('x2', d => xScale(d.target.coordinates.x))
      .attr('y2', d => yScale(d.target.coordinates.y));
  }
}
export default MapView;
