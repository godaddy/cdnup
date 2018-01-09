'use strict';

var debug = require('diagnostics')('cdn:up');
var EventEmitter = require('eventemitter3');
var File = require('./file');
var url = require('url');
var pkgcloud = require('pkgcloud-aws');

/**
 * CDNup is our CDN management API.
 *
 * Options:
 *
 * - sharding: Use DNS sharding.
 * - env: Optional forced environment.
 * - url/urls: Array or string of a URL that we use to build our assets URLs
 *
 * @constructor
 * @param {String} bucket bucket location of where you want the files to be stored.
 * @param {Object} options Configuration for the CDN uploading.
 * @api public
 */
function CDNUp(bucket, options) {
  options = options || {};

  this.sharding = !!options.sharding;
  this.urls = arrayify(options.url || options.urls);
  this.check = options.check;
  this.bucket = bucket;
  this.client = pkgcloud.storage.createClient(options.pkgcloud || {});
  this.acl = options.acl || 'public-read';
  this.subdomain = options.subdomain;
}

//
// Inherit from the event emitter so we can more easily queue callbacks to
// prevent duplicate mounting.
//
CDNUp.prototype = new EventEmitter();
CDNUp.prototype.constructor = CDNUp;

/**
 * Init the bucket for the storage container
 *
 * @param {Function} fn Completion callback
 *
 * @returns {CDNUp} The current instance (for fluent/chaining API).
 * @api public
 */
CDNUp.prototype.init = function init(fn) {
  var cdn = this;

  if (cdn.listeners('init').length) return cdn.once('init', fn);
  debug('init container %s', this.bucket);

  this.client.createContainer(this.bucket, cdn.emit.bind(cdn, 'init'));

  return cdn.once('init', fn);
};

/**
 * Upload a new file on to the CDN.
 *
 * @param {Stream|String|Buffer} what Things that needs to uploaded.
 * @param {String} as Name for the file.
 * @param {Function} fn Completion callback.
 *
 * @returns {Object} this The CDN
 * @api public
 */
CDNUp.prototype.upload = function upload(what, as, fn) {
  var file = new File(5, this);
  var cdn = this;

  file.create(what, as, function uploaded(err, f) {
    if (err) return fn(err);
    //
    // Yes, yet another url.resolve. This is required because node's URL.resolve
    // cannot handle multiple paths. So url.resolve(one, two, tree) fails but
    // multiple calls work fine. It's documented, but annoying as fuck.
    //
    fn(null, url.resolve(cdn.url(f), as));
  });

  return this;
};

/**
 * Return the URL and path we are uploading our files to
 * @returns {String} URL + path to the CDN
 * @api public
 */
CDNUp.prototype.url = function () {
  //
  // Figure out which subdomain/url prefix we want to use so assets can
  // maximize the
  //
  var prefix = this.sharding
    ? this.urls[Math.floor(Math.random() * this.urls.length)]
    : this.urls[0];

  // Either use the given URL as the root, or if we are using subdomain based
  // buckets for our given endpoint, append
  prefix = prefix
    || (this.client.protocol
      + (this.subdomain ? `${this.bucket}.` : '')
      + this.client.endpoint);
  //
  // Needs to end with `/` or the URL.resolve will replace the last path.
  //
  var root = prefix;
  if (!this.subdomain) root = url.resolve(prefix, this.bucket);
  if (root.charAt(root.length - 1) !== '/') root = root + '/';

  return root;
};

/**
 * Return the URL of the `file` specified to use when checking for the
 * existence of that file within the CDN. If your CDN is behind a firewall
 * or other limited network scenario this will be necessary.
 * @param {String} file File to (potentially) transform.
 * @returns {String} URL + path to the CDN for the file
 * @api public
 */
CDNUp.prototype.checkUrl = function (file) {
  if (!this.check) return file;

  const parsed = url.parse(file);
  return this.check.replace(/\/$/, '') + parsed.pathname;
};

//
// Force a single string to an array if necessary
//
function arrayify(urls) {
  var tmp = Array.isArray(urls) ? urls : [urls];
  return tmp.filter(Boolean);
}

//
// Expose the module.
//
module.exports = CDNUp;
