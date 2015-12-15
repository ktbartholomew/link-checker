# Recursive Link Checker

Supply a URL to a starting page (like your website's home page) and it will crawl your site, reporting any links that appear broken.

## Installation

```
npm install
```

or, pull the Docker image:

```
docker pull ktbartholomew/link-checker .
```

## Usage

The link checker needs a URL to get things started. Provide this as a command line flag, or as an environment variable:

```
$ node index.js -u http://www.example.com
$ node index.js --url http://www.example.com
$ CHECK_URL=http://www.example.com node index.js
$ docker run --rm ktbartholomew/link-checker -u http://www.example.com
```
