import { Model } from '../../node_modules/uki/dist/uki.esm.js';
import IntrospectableMixin from '../../utils/IntrospectableMixin.js';

class Ship extends IntrospectableMixin(Model) {
  constructor () {
    super();
    this.direction = 0;

    this.velocityX = 0;
    this.velocityY = 0;

    this.radius = 16;

    this.turnRate = Math.PI / 32;
    this.forwardRate = 0.5;
    this.maxVelocity = 20;

    this.x = 0;
    this.y = 0;
  }
  getSvg () {
    // Dummy placeholder that just draws a triangle; do something sexier in the future
    const backRadius = this.radius * Math.sqrt(2) / 2;
    return `<path fill="#E6AB02" d="M${this.radius},0L${-backRadius},${backRadius}L${-backRadius},${-backRadius}Z"></path>`;
  }
  tick () {
    this.x += Ship.SYSTEM_SCALE_FACTOR * this.velocityX;
    this.y += Ship.SYSTEM_SCALE_FACTOR * this.velocityY;
  }
  turnLeft () {
    this.direction = (this.direction - this.turnRate) % (2 * Math.PI);
  }
  turnRight () {
    this.direction = (this.direction + this.turnRate) % (2 * Math.PI);
  }
  accelerate () {
    this.velocityX += this.forwardRate * Math.cos(this.direction);
    this.velocityY += this.forwardRate * Math.sin(this.direction);

    this.capVelocity();
  }
  capVelocity () {
    // Cap the velocity
    let velocity = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    velocity = Math.min(velocity, this.maxVelocity);
    if (velocity <= 0.25) {
      velocity = 0;
    }
    let vAngle = Math.atan2(this.velocityY, this.velocityX);

    this.velocityX = velocity * Math.cos(vAngle);
    this.velocityY = velocity * Math.sin(vAngle);
  }
}
Ship.SYSTEM_SCALE_FACTOR = 0.001;
export default Ship;
