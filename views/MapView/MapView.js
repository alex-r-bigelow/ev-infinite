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

    this.d3el.select('.ok.button')
      .on('click', () => { window.controller.resume(); });
  }
  draw () {}
}
export default MapView;
