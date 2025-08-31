// Debug module fallback for client-side
module.exports = function debug() {
  // No-op function for client-side
  return function() {};
};

module.exports.enabled = function() {
  return false;
};

module.exports.names = [];
module.exports.skips = [];