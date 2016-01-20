var stats = require('./stats');

var queue = [];


module.exports = {
  links: queue,
  push: function (item) {
    if (queue.indexOf(item) !== -1 || stats.isLinkChecked(item)) {
      return;
    }

    queue.push(item);
  }
};
