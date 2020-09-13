/* globals uki */
import keyBindings from './config/keyBindings.js';
import language from './data/language.js';

import { constructChain } from './utils/nameGenerator.js';

import PlayerShip from './models/PlayerShip/PlayerShip.js';
// import SpiralGalaxy from './models/Universe/SpiralGalaxy.js';
import Galaxy from './models/Universe/Galaxy.js';

import ViewportView from './views/ViewportView/ViewportView.js';
import MiniMapView from './views/MiniMapView/MiniMapView.js';

import MapView from './views/MapView/MapView.js';
import PauseView from './views/PauseView/PauseView.js';

class Controller {
  constructor () {
    this.keyBindings = keyBindings;

    this.paused = false;

    // this.universe = new SpiralGalaxy(9, Math.PI / 4, 18, 6, 1.25, 36);
    this.universe = new Galaxy(9);
    this.currentSystem = this.universe.getASolarSystem();
    this.targetSystem = null;
    this.targetPath = [];
    this.playerShip = new PlayerShip();

    this.views = {
      ViewportView: new ViewportView(),
      MiniMapView: new MiniMapView()
    };
    this.setupEventListeners();

    // TODO: generate different dialects in different regions of space
    this.dialect = constructChain(language.names
      .filter(d => d.country === 'Japan')
      .map(d => d.name));
  }

  setupEventListeners () {
    this.pressedKeys = {};

    window.onresize = () => {
      this.renderAllViews();
    };
    window.onload = () => {
      this.startGameLoop();
    };
    window.onblur = () => {
      this.pressedKeys = {};
    };
    window.onkeydown = event => {
      this.pressedKeys[event.key] = true;

      if (event.key === this.keyBindings.pause) {
        if (this.paused && !uki.modal?.visible) {
          this.resume();
        } else {
          this.pause();
        }
      }
      if (event.key === this.keyBindings.showMap) {
        this.pause(new MapView());
      }
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

  tick () {
    // Don't update any game state while paused
    if (this.paused) {
      return;
    }

    // Respond to user input
    if (this.pressedKeys[this.keyBindings.turnLeft]) {
      this.playerShip.currentShip.turnLeft();
    }
    if (this.pressedKeys[this.keyBindings.turnRight]) {
      this.playerShip.currentShip.turnRight();
    }
    if (this.pressedKeys[this.keyBindings.accelerate]) {
      this.playerShip.currentShip.accelerate();
    }
    if (this.pressedKeys[this.keyBindings.initiateJump]) {
      if (this.targetPath.length > 0) {
        const nextSystem = this.targetPath[0].target;
        this.playerShip.currentShip.initiateJump(this.currentSystem, nextSystem);
      }
      delete this.pressedKeys[this.keyBindings.initiateJump];
    }

    // TODO: AI actions...

    // Game physics updates
    this.playerShip.currentShip.tick();

    // ViewportView needs to tick with the clock as well for some of its effects
    this.views.ViewportView.tick();
  }

  startGameLoop () {
    const timestamp = () => {
      return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
    };

    let now;
    let dt = 0;
    let last = timestamp();
    const step = 1 / 60;

    const frame = () => {
      now = timestamp();
      dt = dt + Math.min(1, (now - last) / 1000);
      while (dt > step) {
        dt = dt - step;
        this.tick(step);
      }
      this.renderAllViews(true);
      last = now;
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }

  pause (modal = new PauseView()) {
    if (this.paused) {
      // already paused
      return;
    }
    this.paused = true;
    uki.showModal(modal);
  }

  resume () {
    this.paused = false;
    uki.hideModal();
  }

  setTargetSystem (system) {
    if (system === null) {
      this.targetPath = [];
    } else {
      this.targetPath = this.universe.getPathBetweenSystems(this.currentSystem, system);
    }
    this.targetSystem = this.targetPath.length === 0 ? null : system;
    this.renderAllViews(false);
  }

  switchToNextSystem () {
    if (this.targetPath.length > 0) {
      const nextSystem = this.targetPath.splice(0, 1)[0].target;
      this.currentSystem = nextSystem;
      if (this.targetPath.length === 0) {
        this.targetSystem = null;
      }
      this.renderAllViews();
    }
  }
}

window.controller = new Controller();
