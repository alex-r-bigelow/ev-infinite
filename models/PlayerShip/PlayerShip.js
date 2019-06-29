import { Model } from '../../node_modules/uki/dist/uki.esm.js';
import Ship from '../Ship/Ship.js';

class PlayerShip extends Model {
  constructor () {
    super();
    this.currentShip = new Ship();
  }
}
export default PlayerShip;
