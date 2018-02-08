'use strict';

/* eslint no-invalid-this: 0 */

var debug = require('diagnostics')('cdn:file');
var Backoff = require('backo');
var one = require('one-time');
var reads = require('reads');
var path = require('path');
var mime = require('mime');

/**
 * Representation of a single file operation for the CDN.
 *
 * @constructor
 * @param {Number} retries Amount of retries.
 * @param {CDNUp} cdn CDN reference.
 * @param {Object} options Additional configuration.
 * @api private
 */
function File(retries, cdn, options) {
  options = options || {};

  this.backoff = new Backoff({ min: 100, max: 20000 });
  this.mime = options.mime || {};
  this.retries = retries || 5;
  this.client = cdn.client;
  this.cdn = cdn;
}

/**
 * Find the correct contentType for a given filename.
 *
 * @param {String} filename Name of the file.
 * @returns {String} The content type.
 * @api public
 */
File.prototype.contentType = function contentType(filename) {
  var ext = path.extname(filename);

  //
  // If we're provided with a custom mime lookup object we should prefer that
  // over the mime library;
  //
  if (ext in this.mime) return this.mime[ext];

  return mime.lookup(filename);
};

/**
 * Create a new file on the CDN.
 *
 * @param {String} what Thing that needs to be written.
 * @param {String} as Target filename.
 * @param {Function} fn Completion callback.
 * @api private
 */
File.prototype.create = function create(what, as, fn) {
  var file = this;

  this.attempt(function attempt(next) {
    debug('attempting to write file to cdn: %s', as);
    reads(what)
      .pipe(file.client.upload({
        acl: file.cdn.acl,
        container: file.cdn.bucket,
        remote: as,
        contentType: file.contentType(as)
      }))
      .once('error', next)
      .once('success', next.bind(null, null));
  }, fn);
};

/**
 * Poor mans retry handler.
 *
 * @param {Function} action Function that needs to do something that can be retried.
 * @param {Function} fn Completion callback if we run out of reties.
 * @returns {Object} the result of calling fn with the specified 'this' value
 * @api private
 */
File.prototype.attempt = function attempt(action, fn) {
  var file = this;

  if (!file.retries) return fn(new Error('Max retires exhausted'));
  if (file.retries) action(one(function next(err) {
    if (!err) return fn.apply(this, arguments);

    if (err && typeof err === 'string' && /NoSuchBucket/.test(err)) {
      return file.cdn.init((error) => {
        if (error) return fn(error);

        file.attempt(action, fn);
      });
    }
    //
    // Other failure, which could be totally random so we should try again in
    // due time.
    //
    file.retries--;
    debug('recieved a failed attempt, we have %d retries left', file.retries);
    setTimeout(() => file.attempt(action, fn), file.backoff.duration());
  }));
};

//
// Expose the File instance.
//
module.exports = File;
