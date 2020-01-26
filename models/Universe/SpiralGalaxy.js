import Galaxy from './Galaxy.js';

class SpiralGalaxy extends Galaxy {
  constructor (bulgeRadius, barAngle, barRadius, barThickness, armLayers, outerRadius) {
    super(outerRadius);
    this.bulgeRadius = bulgeRadius;
    this.barAngle = barAngle;
    this.barThickness = barThickness;
    this.barRadius = barRadius;
    this.armLayers = armLayers;
  }
  computeStarDensity ({ x, y }) {
    const theta = Math.atan2(y, x);
    const radius = Math.sqrt(x ** 2 + y ** 2);

    const bulgeDensity = radius > this.bulgeRadius ? 0
      : 1 - (x ** 2 + y ** 2) / this.bulgeRadius ** 2;

    const barDistance = Math.abs(radius * Math.cos(theta - this.barAngle));
    const barOffset = Math.sqrt(radius ** 2 - barDistance ** 2);
    const barDensity = radius > this.barRadius || barOffset > this.barThickness
      ? 0 : 1 - barOffset / this.barThickness;

    const layerThickness = (this.outerRadius - this.barRadius) / this.armLayers;
    let angleOffset = theta - this.barAngle;
    angleOffset = Math.atan2(Math.sin(angleOffset), Math.cos(angleOffset));
    angleOffset = ((angleOffset + Math.PI) % Math.PI) / Math.PI;
    const offsetRadius = radius - this.barRadius + layerThickness * angleOffset;
    const armDensity = (offsetRadius % layerThickness) / layerThickness;

    const taperingDensity = 1 - (x ** 2 + y ** 2) / this.outerRadius ** 2;
    return Math.min(taperingDensity, Math.max(bulgeDensity, barDensity, armDensity));
  }
}
export default SpiralGalaxy;
