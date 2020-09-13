/* globals d3, uki */

class MiniMapView extends uki.ui.SvgView {
  constructor (options = {}) {
    options.d3el = d3.select('.MiniMapView svg');
    options.resources = options.resources || [];
    options.resources.push(...[
      { type: 'less', url: 'views/MiniMapView/style.less' },
      { type: 'text', url: 'views/MiniMapView/template.svg', name: 'template' }
    ]);
    super(options);
  }

  async setup () {
    await super.setup(...arguments);
    this.d3el.html(this.getNamedResource('template'));
  }

  async draw () {
    await super.draw(...arguments);

    this._size = this.getBounds().width;

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
    if (bodies.length <= 1) {
      min = Math.min(min, -4);
      max = Math.max(max, 4);
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

    bodyDotsEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 15);
    bodyDots.select('text')
      .text(d => d.details.name);

    // Draw the orbits
    const orbitList = bodies.map(d => {
      let { x, y } = d.orbitCenter;
      x = this.scale(x);
      y = this.scale(y);
      const r = Math.sqrt((x - this.scale(d.coordinates.x)) ** 2 +
                          (y - this.scale(d.coordinates.y)) ** 2);
      return { x, y, r };
    });
    let orbits = this.d3el.select('.orbits')
      .selectAll('.orbit').data(orbitList);
    orbits.exit().remove();
    const orbitsEnter = orbits.enter().append('circle').classed('orbit', true);
    orbits = orbits.merge(orbitsEnter);

    orbits
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.r);
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
