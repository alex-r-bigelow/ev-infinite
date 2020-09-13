/* globals uki */
import Ship from '../Ship/Ship.js';

class PlayerShip extends uki.Model {
  constructor () {
    super();
    this.currentShip = new Ship();
  }
}
export default PlayerShip;
