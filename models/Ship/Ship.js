/* globals uki */

class Ship extends uki.utils.IntrospectableMixin(uki.Model) {
  constructor () {
    super();
    this.jumpingStage = -1;
    this.jumpLastVelocity = null;
    this.jumpDirection = null;

    this.direction = 0;

    this.velocityX = 0;
    this.velocityY = 0;

    this.radius = 16;

    this.turnRate = Math.PI / 32;
    this.forwardRate = 0.5;
    this.maxVelocity = 40;

    this.x = 0;
    this.y = 0;
  }

  getSvg () {
    // Dummy placeholder that just draws a triangle; do something sexier in the future
    const backRadius = this.radius * Math.sqrt(2) / 2;
    return `<path fill="#E6AB02" d="M${this.radius},0L${-backRadius},${backRadius}L${-backRadius},${-backRadius}Z"></path>`;
  }

  tick () {
    let velocity;
    switch (this.jumpingStage) {
      case -1:
        break;
      case 0:
        // Slowing down
        velocity = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (velocity > this.jumpLastVelocity) {
          this.velocityX = 0;
          this.velocityY = 0;
          this.jumpingStage = 1;
        } else {
          this.jumpLastVelocity = velocity;
          this.velocityX += this.forwardRate * Math.cos(this.direction + Math.PI);
          this.velocityY += this.forwardRate * Math.sin(this.direction + Math.PI);
        }
        break;
      case 1:
        // Rotating
        const remainingAngle = this.normalizeAngle(this.jumpDirection - this.direction);
        const turnRate = this.turnRate * Math.sign(remainingAngle);
        if (Math.abs(turnRate) > Math.abs(remainingAngle)) {
          this.direction = this.jumpDirection;
          this.jumpingStage = 2;
        } else {
          this.direction = this.normalizeAngle(this.direction + turnRate);
        }
        break;
      case 2:
        // Launching
        this.velocityX += Ship.HYPERSPACE_SPEED_FACTOR * this.forwardRate * Math.cos(this.direction);
        this.velocityY += Ship.HYPERSPACE_SPEED_FACTOR * this.forwardRate * Math.sin(this.direction);
        velocity = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (velocity > Ship.HYPERSPACE_JUMP_THRESHOLD * this.maxVelocity) {
          // Switch systems and give us some space to slow down
          window.controller.switchToNextSystem();
          this.x = -Ship.HYPERSPACE_SLOWDOWN_DISTANCE * this.velocityX;
          this.y = -Ship.HYPERSPACE_SLOWDOWN_DISTANCE * this.velocityY;
          this.jumpingStage = 3;
        }
        break;
      case 3:
        // Slowing down
        this.velocityX -= Ship.HYPERSPACE_SLOWDOWN_FACTOR * this.forwardRate * Math.cos(this.jumpDirection);
        this.velocityY -= Ship.HYPERSPACE_SLOWDOWN_FACTOR * this.forwardRate * Math.sin(this.jumpDirection);
        velocity = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
        if (velocity < this.maxVelocity) {
          // Finally slow enough
          this.jumpingStage = -1;
          this.jumpLastVelocity = null;
          this.jumpDirection = null;
        }
    }
    this.x += Ship.SYSTEM_SCALE_FACTOR * this.velocityX;
    this.y += Ship.SYSTEM_SCALE_FACTOR * this.velocityY;
  }

  turnLeft () {
    this.direction = this.normalizeAngle(this.direction - this.turnRate);
    this.cancelJump();
  }

  turnRight () {
    this.direction = this.normalizeAngle(this.direction + this.turnRate);
    this.cancelJump();
  }

  accelerate () {
    this.velocityX += this.forwardRate * Math.cos(this.direction);
    this.velocityY += this.forwardRate * Math.sin(this.direction);
    this.cancelJump();
    if (this.jumpingStage < 2) {
      this.capVelocity();
    }
  }

  capVelocity () {
    // Cap the velocity
    let velocity = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    velocity = Math.min(velocity, this.maxVelocity);
    if (velocity <= 0.25) {
      velocity = 0;
    }
    const vAngle = Math.atan2(this.velocityY, this.velocityX);

    this.velocityX = velocity * Math.cos(vAngle);
    this.velocityY = velocity * Math.sin(vAngle);
  }

  normalizeAngle (theta) {
    return Math.atan2(Math.sin(theta), Math.cos(theta));
  }

  cancelJump () {
    if (this.jumpingStage < 2) {
      this.jumpingStage = -1;
      this.jumpLastVelocity = null;
      this.jumpDirection = null;
    }
  }

  initiateJump (sourceSystem, targetSystem) {
    if (this.jumpingStage === -1) {
      this.jumpingStage = 0;
      this.jumpLastVelocity = Math.sqrt(this.velocityX ** 2, this.velocityY ** 2);
      this.jumpDirection = Math.atan2(
        targetSystem.coordinates.y - sourceSystem.coordinates.y,
        targetSystem.coordinates.x - sourceSystem.coordinates.x);
    }
  }
}
Ship.SYSTEM_SCALE_FACTOR = 0.001;
Ship.HYPERSPACE_JUMP_THRESHOLD = 100;
Ship.HYPERSPACE_SPEED_FACTOR = 30;
Ship.HYPERSPACE_SLOWDOWN_FACTOR = 10.5;
Ship.HYPERSPACE_SLOWDOWN_DISTANCE = 0.2;
export default Ship;
