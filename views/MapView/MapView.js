/* globals d3, uki */

class MapView extends uki.ui.ModalView {
  constructor (options = {}) {
    options.resources = options.resources || [];
    options.resources.push(...[
      { type: 'less', url: 'views/MapView/style.less' },
      { type: 'text', url: 'views/MapView/template.html', name: 'template' }
    ]);
    options.buttonSpecs = [{
      label: 'Close',
      primary: true,
      onclick: () => { window.controller.resume(); }
    }];
    super(options);
  }

  async setup () {
    await super.setup(...arguments);
    this.d3el.classed('MapView', true);

    this.modalContentEl.html(this.getNamedResource('template'));

    this.currentTransform = d3.zoomIdentity;

    this.modalContentEl.select('svg')
      .call(d3.zoom()
        .on('zoom', event => {
          this.currentTransform = event.transform;
          this.modalContentEl.selectAll('.systems, .links')
            .attr('transform', event.transform);
        })
        .on('end', () => { this.render(); }));

    this.d3el.select('.ok.button')
      .on('click', () => { window.controller.resume(); });
  }

  async draw () {
    await super.draw(...arguments);

    const width = window.innerWidth - 200;
    const height = window.innerHeight - 200;
    this.modalContentEl.select('svg')
      .attr('width', width)
      .attr('height', height);

    // 200px per cell, centered at 0,0
    this.xScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([width / 2 - 200, width / 2 + 200]);
    this.yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([height / 2 - 200, height / 2 + 200]);

    // For now, just use the full radius of the universe (we're keeping
    // it small-ish enough to fit in memory / draw completely)
    const r = window.controller.universe.outerRadius;
    const graph = window.controller.universe.getGraph({
      left: -r,
      top: -r,
      right: r,
      bottom: r
    });

    this.drawSystems(graph);
    this.drawLinks(graph);
    // TODO: draw pre-rendered galactic textures, etc; don't bother rendering
    // individual systems beyond this.currentTransform.k < 0.1 or so
  }

  drawSystems (graph) {
    let systems = this.modalContentEl.select('.systems').selectAll('.system')
      .data(graph.nodes, d => d.id);
    systems.exit().remove();
    const systemsEnter = systems.enter().append('g').classed('system', true);
    systems = systems.merge(systemsEnter);

    systemsEnter.append('circle').attr('r', 4);

    systemsEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 15);
    systems.select('text')
      .text(d => d.details.name)
      .style('display', this.currentTransform.k < 0.75 ? 'none' : null);

    systems.attr('transform', d => {
      const x = this.xScale(d.coordinates.x);
      const y = this.yScale(d.coordinates.y);
      return `translate(${x},${y})`;
    });

    systems.classed('targeted', d => {
      return window.controller.targetSystem !== null && d.id === window.controller.targetSystem.id;
    }).classed('current', d => d.id === window.controller.currentSystem.id);

    systemsEnter.on('click', (event, d) => {
      window.controller.setTargetSystem(d);
    });
  }

  drawLinks (graph) {
    const targetedLinkLookup = {};
    for (const { source, target } of window.controller.targetPath) {
      targetedLinkLookup[source.id + '_' + target.id] = true;
    }

    let links = this.modalContentEl.select('.links').selectAll('.link')
      .data(graph.links, d => d.source.id + '_' + d.target.id);
    links.exit().remove();
    const linksEnter = links.enter().append('g').classed('link', true);
    links = links.merge(linksEnter);

    linksEnter.append('line');

    links.select('line')
      .attr('x1', d => this.xScale(d.source.coordinates.x))
      .attr('y1', d => this.yScale(d.source.coordinates.y))
      .attr('x2', d => this.xScale(d.target.coordinates.x))
      .attr('y2', d => this.yScale(d.target.coordinates.y));

    links.classed('targeted', d => {
      return targetedLinkLookup[d.source.id + '_' + d.target.id] ||
        targetedLinkLookup[d.target.id + '_' + d.source.id];
    });
  }
}
export default MapView;
