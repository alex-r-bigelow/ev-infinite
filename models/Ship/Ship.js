import { Model } from '../../node_modules/uki/dist/uki.esm.js';

class Ship extends Model {
  constructor () {
    super();
    this.direction = 0;

    this.velocityX = 0;
    this.velocityY = 0;

    this.radius = 16;

    this.turnRate = Math.PI / 32;
    this.accelerationRate = 0.5;
    this.brakeRate = 0.95;
    this.maxVelocity = 20;

    this.x = 0;
    this.y = 0;
  }
  getSvg () {
    // Dummy placeholder that just draws a triangle; do something sexier in the future
    const backRadius = this.radius * Math.sqrt(2) / 2;
    return `<path fill="#E6AB02" d="M${this.radius},0L${-backRadius},${backRadius}L${-backRadius},${-backRadius}Z"></path>`;
  }
  turnLeft () {
    this.direction = (this.direction - this.turnRate) % (2 * Math.PI);
  }
  turnRight () {
    this.direction = (this.direction + this.turnRate) % (2 * Math.PI);
  }
}
export default Ship;
