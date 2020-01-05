uniform float window;
uniform vec2 offset;
uniform float dotSize;

void main() {
  float halfWindow = window / 2.0;
  vec4 mvPosition = vec4( position, 1.0 );

  // Offset the x coordinate
  mvPosition[0] += offset[0];
  // Wrap the x coordinate
  if (mvPosition[0] > halfWindow) {
    mvPosition[0] -= window;
  } else if (mvPosition[0] < -halfWindow) {
    mvPosition[0] += window;
  }

  // Offset the y coordinate
  mvPosition[1] += offset[1];
  // Wrap the y coordinate
  if (mvPosition[1] > halfWindow) {
    mvPosition[1] -= window;
  } else if (mvPosition[1] < -halfWindow) {
    mvPosition[1] += window;
  }

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
  gl_PointSize = dotSize;
}
