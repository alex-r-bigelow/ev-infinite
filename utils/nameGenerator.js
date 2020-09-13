// nameGenerator.js
// written and released to the public domain by drow <drow@bin.sh>
// http://creativecommons.org/publicdomain/zero/1.0/

// Modified by Alex Bigelow to be less stateful, use ES6 exports, pass eslint,
// and support number generators other than Math.random (e.g. if you want seeded
// results from something like seedrandom) on 21 July 2019

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// construct markov chain from list of names

function constructChain (list) {
  var chain = {};

  var i;
  for (i = 0; i < list.length; i++) {
    var names = list[i].split(/\s+/);
    chain = incrChain(chain, 'parts', names.length);

    var j;
    for (j = 0; j < names.length; j++) {
      var name = names[j];
      chain = incrChain(chain, 'nameLen', name.length);

      var c0 = name.substr(0, 1);
      chain = incrChain(chain, 'initial', c0);

      var string = name.substr(1);
      var lastC = c0;

      while (string.length > 0) {
        var c = string.substr(0, 1);
        chain = incrChain(chain, lastC, c);

        string = string.substr(1);
        lastC = c;
      }
    }
  }
  return scaleChain(chain);
}

function incrChain (chain, key, token) {
  if (chain[key]) {
    if (chain[key][token]) {
      chain[key][token]++;
    } else {
      chain[key][token] = 1;
    }
  } else {
    chain[key] = {};
    chain[key][token] = 1;
  }
  return chain;
}

function scaleChain (chain) {
  var tableLen = {};

  var key;
  for (key in chain) {
    tableLen[key] = 0;

    var token;
    for (token in chain[key]) {
      var count = chain[key][token];
      var weighted = Math.floor(Math.pow(count, 1.3));

      chain[key][token] = weighted;
      tableLen[key] += weighted;
    }
  }
  chain.tableLen = tableLen;
  return chain;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// construct name from markov chain

function markovName (chain, generator = Math.random) {
  var parts = selectLink(chain, 'parts', generator);
  var names = [];

  var i;
  for (i = 0; i < parts; i++) {
    var nameLen = selectLink(chain, 'nameLen', generator);
    var c = selectLink(chain, 'initial', generator);
    var name = c;
    var lastC = c;

    while (name.length < nameLen) {
      c = selectLink(chain, lastC, generator);
      name += c;
      lastC = c;
    }
    names.push(name);
  }
  return names.join(' ');
}

function selectLink (chain, key, generator) {
  var len = chain.tableLen[key];
  var idx = Math.floor(generator() * len);

  var t = 0;
  for (const token in chain[key]) {
    t += chain[key][token];
    if (idx < t) {
      return token;
    }
  }
  return '-';
}

export { constructChain, markovName };
