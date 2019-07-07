import Body from './Body.js';

class Planet extends Body {
  constructor () {
    super(...arguments);
    this.radius = 0.5;
  }
}
export default Planet;
