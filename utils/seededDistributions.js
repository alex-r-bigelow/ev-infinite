import seedrandom from '../node_modules/seedrandom/seedrandom.min.js';

function normalDistribution (seed, min, max, skew) {
  /**
   * Seeded adaptation of this StackOverflow answer:
   * https://stackoverflow.com/a/49434653/1058935
   */
  const generator = seedrandom(seed);
  function getNumber () {
    let u = 0;
    let v = 0;
    while (u === 0) u = generator(); // Converting [0,1) to (0,1)
    while (v === 0) v = generator();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = getNumber(); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
  }

  return getNumber;
}

function exponentialDistribution (lambda = 5) {

}

export default {
  uniformDistribution: seedrandom,
  normalDistribution
};
