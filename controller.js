import keyBindings from './config/keyBindings.js';

import PlayerShip from './models/PlayerShip/PlayerShip.js';

import ViewportView from './views/ViewportView/ViewportView.js';

class Controller {
  constructor () {
    this.playerShip = new PlayerShip();

    this.views = {
      ViewportView: new ViewportView()
    };
    this.setupEventListeners();
  }
  setupEventListeners () {
    this.pressedKeys = {};

    window.onresize = () => {
      this.renderAllViews();
    };
    window.onload = () => {
      this.startGameLoop();
    };
    window.onkeydown = event => {
      this.pressedKeys[event.key] = true;
    };
    window.onkeyup = event => {
      delete this.pressedKeys[event.key];
    };
  }
  renderAllViews (quick = false) {
    for (const view of Object.values(this.views)) {
      if (quick) {
        view.quickDraw();
      } else {
        view.render();
      }
    }
  }
  update () {
    // Respond to user input
    if (this.pressedKeys[keyBindings['turnLeft']]) {
      this.playerShip.currentShip.turnLeft();
    }
    if (this.pressedKeys[keyBindings['turnRight']]) {
      this.playerShip.currentShip.turnRight();
    }

    // TODO: AI actions...
  }
  startGameLoop () {
    const timestamp = () => {
      return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
    };

    let now;
    let dt = 0;
    let last = timestamp();
    let step = 1 / 60;

    const frame = () => {
      now = timestamp();
      dt = dt + Math.min(1, (now - last) / 1000);
      while (dt > step) {
        dt = dt - step;
        this.update(step);
      }
      this.renderAllViews(true);
      last = now;
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }
}

window.controller = new Controller();
