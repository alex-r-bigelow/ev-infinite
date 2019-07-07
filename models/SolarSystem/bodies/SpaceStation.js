import Body from './Body.js';

class SpaceStation extends Body {
  constructor () {
    super(...arguments);
    this.radius = 0.25;
  }
}
export default SpaceStation;
