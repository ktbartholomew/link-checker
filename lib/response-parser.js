var jsdom = require('jsdom');
var Q = require('q');

var queue = require('./queue');
var stats = require('./stats');

var evaluateResponse = function (err, res) {
  // handle bad network errors and status codes
  if(err) {
    // err is populated for 400+ responses, and we can get a better diagnosis by
    // parsing res in those cases.
    var errorMessage;

    if(!res) {
      errorMessage = err.toString();
    }
    else {
      errorMessage = res.error.toString();
    }

    stats.addCheckedLink({
      url: this,
      broken: true
    });

    console.log('[ BROKEN ] %s (%s)', this.toString(), errorMessage);
    return;
  }

  if(this.match('^' + stats.baseUrl)) {
    loadDOM(res)
    .then(function (window) {
      return parseLinks(window);
    })
    .catch(function (error) {
      console.log('Unable to parse ' + this);
    });
  }

  stats.addCheckedLink({
    url: this,
    ok: true
  });
  console.log('[   OK   ] %s', this.toString());
};

var loadDOM = function (response) {
  return Q.Promise(function (resolve, reject) {
    jsdom.env(response.text, [], {url: response.request.url}, function (err, window) {
      if (err) {
        return reject(err);
      }

      return resolve(window);
    });
  });
};

var parseLinks = function (window) {
  var links = window.document.querySelectorAll('a[href]');
  Array.prototype.forEach.call(links, function (link) {
    // Trim off anchor links
    if(link.href.indexOf('#') !== -1) {
      link.href = link.href.substr(0, link.href.indexOf('#'));
    }


    queue.push(link.href);
  });
};

module.exports = {
  parse: evaluateResponse
};
