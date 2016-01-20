var superagent = require('superagent');
var Q = require('q');

var queue = require('./queue');
var responseParser = require('./response-parser');
var deferred = Q.defer();

var watchQueue = function () {
  var waitingRetries = 0;

  // Loop over the queue and start concurrent requests for all the links.
  while(queue.links.length !== 0) {
    var link = queue.links.shift();

    superagent(link)
    .end(responseParser.parse.bind(link));
  }

  // The queue will get exhausted almost instantly, so we want to wait for the
  // responses to come back and the queue to be filled again.
  // Let's check in every 100ms
  var retry = setInterval(function () {
    // Keep track of how many times we've re-checked the queue
    waitingRetries++;

    // If we've checked more than 60 times (6s of waiting) and it's still
    // empty, let's assume there are no more links to check and we're done.
    if(waitingRetries >= 60) {
      clearInterval(retry);
      console.log('ALL DONE!');
      return deferred.resolve();
    }

    // If the queue is full again, reset the count and start looping over the
    // queue again.
    if(queue.links.length !== 0) {
      waitingRetries = 0;
      clearInterval(retry);
      return watchQueue();
    }

  }, 100);

  return deferred.promise;
};

module.exports = {
  start: watchQueue
};
