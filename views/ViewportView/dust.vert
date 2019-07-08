uniform float dustWindow;
uniform vec2 offset;

void main() {
  float halfWindow = dustWindow / 2.0;
  vec4 mvPosition = vec4( position, 1.0 );

  // Offset the x coordinate
  mvPosition[0] += offset[0];
  // Wrap the x coordinate
  if (mvPosition[0] > halfWindow) {
    mvPosition[0] -= dustWindow;
  } else if (mvPosition[0] < -halfWindow) {
    mvPosition[0] += dustWindow;
  }

  // Offset the y coordinate
  mvPosition[1] += offset[1];
  // Wrap the y coordinate
  if (mvPosition[1] > halfWindow) {
    mvPosition[1] -= dustWindow;
  } else if (mvPosition[1] < -halfWindow) {
    mvPosition[1] += dustWindow;
  }

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
  gl_PointSize = 2.0;
}
