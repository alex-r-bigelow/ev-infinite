import keyBindings from './config/keyBindings.js';

import PlayerShip from './models/PlayerShip/PlayerShip.js';
import Galaxy from './models/Universe/Galaxy.js';

import ViewportView from './views/ViewportView/ViewportView.js';
import MiniMapView from './views/MiniMapView/MiniMapView.js';

class Controller {
  constructor () {
    this.universe = new Galaxy(100);
    this.currentSystem = this.universe.getASolarSystem();
    this.playerShip = new PlayerShip();

    this.views = {
      ViewportView: new ViewportView(),
      MiniMapView: new MiniMapView()
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
    // TODO: show / hide modals

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
