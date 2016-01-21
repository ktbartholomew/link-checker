var url = require('url');
var superagent = require('superagent');
var jsdom = require('jsdom');
var program = require('commander');

var Queue = require('./queue');

module.exports = {
  /**
   * Fetch a URL, update the Link object indicating whether it was ok or broken.
   *
   * @param link Link (passed by reference)
   * @param callback Function called immediately if link is broken, otherwise
   *        called after response is parsed by jsdom
   */
  fetch: function (link, callback) {
    link.pending = true;

    superagent.get(link.url)
    .end(function (error, response) {

      if(error) {
        link.broken = true;
        link.error = error;
        callback();
      }
      else {
        link.ok = true;
        this.parseResponse(link, response, callback);
      }

      Queue.emit('response', link);
    }.bind(this));
  },
  parseResponse: function (link, response, callback) {
    // Don't dig into third-party URLs, or same-domain URLs above our base path
    if(!link.url.match('^' + Queue.baseUrl)) {
      return callback();
    }

    // Don't waste time trying to parse a non-HTML response for a DOM.
    if(response.type !== 'text/html') {
      return callback();
    }

    // Evaluate the response as a DOM so we can crawl through its elements
    jsdom.env(response.text, [], {url: link.url}, function (err, window) {
      // Bail out!
      if(err) {
        return callback();
      }

      // Is link checking enabled?
      if(program.links) {
        this.parseLinks(link, window);
      }

      // Is image checking enabled?
      if(program.images) {
        this.parseImages(link, window);
      }

      // Is asset checking enabled?
      if(program.assets) {
        this.parseAssets(link, window);
      }

      callback();
    }.bind(this));
  },
  /**
   * Loop through the DOM in window finding all hyperlink-looking tags and
   * adding them to the queue.
   *
   * @param link {Link} Link object of the page we're parsing
   * @param window {Window} DOM of the page we're parsing
   */
  parseLinks: function (link, window) {
    var links = window.document.querySelectorAll('a[href]');
    Array.prototype.forEach.call(links, function (element) {
      var foundLink = {
        url: element.href,
        html: element.outerHTML,
        referrer: link.url
      };

      if(foundLink.url.indexOf('#') !== -1) {
        foundLink.url = foundLink.url.substr(0, foundLink.url.indexOf('#'));
      }

      if(['http:', 'https:'].indexOf(url.parse(foundLink.url).protocol) === -1) {
        return;
      }

      Queue.add(foundLink);
    });
  },

  /**
   * Loop through the DOM in window finding all <img> tags and
   * adding them to the queue.
   *
   * @param link {Link} Link object of the page we're parsing
   * @param window {Window} DOM of the page we're parsing
   */
  parseImages: function (link, window) {
    var images = window.document.querySelectorAll('img[src]');
    Array.prototype.forEach.call(images, function (element) {
      // Sometimes we'll get data: URIs and we can't fetch those.
      if(['http:', 'https:'].indexOf(url.parse(element.src).protocol) === -1) {
        return;
      }

      Queue.add({
        url: element.src,
        html: element.outerHTML,
        referrer: link.url
      });
    });
  },

  /**
   * Loop through the DOM in window finding all <link> and <script> tags and
   * adding them to the queue.
   *
   * @param link {Link} Link object of the page we're parsing
   * @param window {Window} DOM of the page we're parsing
   */
  parseAssets: function (link, window) {
    var assets = window.document.querySelectorAll('script[src], link[href]');

    Array.prototype.forEach.call(assets, function (element) {
      if(['http:', 'https:'].indexOf(url.parse(url.resolve(link.url, element.href || element.src)).protocol) === -1) {
        return;
      }

      Queue.add({
        url: url.resolve(link.url, element.href || element.src),
        html: element.outerHTML,
        referrer: link.url
      });
    });
  }
};
