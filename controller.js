/* globals d3 */
import keyBindings from './config/keyBindings.js';
import language from './data/language.js';

import { constructChain } from './utils/nameGenerator.js';

import PlayerShip from './models/PlayerShip/PlayerShip.js';
import Galaxy from './models/Universe/Galaxy.js';

import ViewportView from './views/ViewportView/ViewportView.js';
import MiniMapView from './views/MiniMapView/MiniMapView.js';

import MapView from './views/MapView/MapView.js';

class Controller {
  constructor () {
    this.paused = false;

    this.universe = new Galaxy(15);
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

      if (event.key === keyBindings['pause']) {
        if (this.paused && !this.modal) {
          this.resume();
        } else {
          this.pause();
        }
      }
      if (event.key === keyBindings['showMap']) {
        this.pause(MapView);
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
    if (!quick && this.modal) {
      this.modal.render();
    }
  }
  tick () {
    // Don't update any game state while paused
    if (this.paused) {
      return;
    }

    // Respond to user input
    if (this.pressedKeys[keyBindings['turnLeft']]) {
      this.playerShip.currentShip.turnLeft();
    }
    if (this.pressedKeys[keyBindings['turnRight']]) {
      this.playerShip.currentShip.turnRight();
    }
    if (this.pressedKeys[keyBindings['accelerate']]) {
      this.playerShip.currentShip.accelerate();
    }
    if (this.pressedKeys[keyBindings['initiateJump']]) {
      if (this.targetPath.length > 0) {
        const nextSystem = this.targetPath[0].target;
        this.playerShip.currentShip.initiateJump(this.currentSystem, nextSystem);
      }
      delete this.pressedKeys[keyBindings['initiateJump']];
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
    let step = 1 / 60;

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
  pause (Modal) {
    if (this.paused) {
      // already paused
      return;
    }
    this.paused = true;
    if (!Modal) {
      d3.select('.modal .contents').html(`<h1>Paused</h1><p>Hit ${keyBindings['pause']} to resume</p>`);
    } else {
      this.modal = new Modal();
    }
    d3.select('.modal').style('display', null);
  }
  resume () {
    this.paused = false;
    delete this.modal;
    d3.select('.modal').style('display', 'none');
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
