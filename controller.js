/* globals d3 */
import ViewportView from './views/ViewportView/ViewportView.js';

class Controller {
  constructor () {
    this.views = {
      ViewportView: new ViewportView()
    };

    window.onresize = () => {
      this.renderAllViews();
    };
  }
  renderAllViews () {
    for (const view of Object.values(this.views)) {
      view.render();
    }
  }
}

window.controller = new Controller();
