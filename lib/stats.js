var baseUrl = '';

var links = {
  checked: []
};

var counts = {
  total: 0,
  broken: 0,
  ok: 0
};

module.exports = {
  addCheckedLink: function (options) {
    if (links.checked.indexOf(options.url.toString()) != -1) {
      return;
    }

    links.checked.push(options.url.toString());

    counts.total++;

    if(options.broken) {
      counts.broken++;
    }

    if(options.ok) {
      counts.ok++;
    }
  },
  isLinkChecked: function (url) {
    return (links.checked.indexOf(url) !== -1);
  },
  getStats: function () {
    return counts;
  },
  get baseUrl() {
    return baseUrl;
  },
  set baseUrl(val) {
    baseUrl = val;
  }
};
