import Body from './Body.js';

class Star extends Body {
  constructor () {
    super(...arguments);
    this.radius = 1;
  }
}
export default Star;
