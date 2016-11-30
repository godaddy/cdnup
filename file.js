'use strict';

/* eslint no-invalid-this: 0 */

var debug = require('diagnostics')('cdn:file');
var reads = require('reads');
var mime = require('mime');
var one = require('one-time');

/**
 * Representation of a single file operation for the CDN.
 *
 * @constructor
 * @param {Number} retries Amount of retries.
 * @param {CDNUp} cdn CDN reference.
 * @api private
 */
function File(retries, cdn) {
  this.retries = retries || 5;
  this.cdn = cdn;
  this.client = cdn.client;
}

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
  // Use the target as the `what` could be a stream
  var type = mime.lookup(as);

  this.attempt(function attempt(next) {
    debug('attempting to write file to cdn: %s', as);
    reads(what)
      .pipe(file.client.upload({
        acl: file.cdn.acl,
        container: file.cdn.bucket,
        remote: as,
        contentType: type
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
 *
 * @returns {Object} the result of calling fn with the specified 'this' value
 * @api private
 */
File.prototype.attempt = function attempt(action, fn) {
  var file = this;

  if (!file.retries) return fn(new Error('Max retires exhausted'));
  if (file.retries) action(one(function next(err) {
    if (!err) return fn.apply(this, arguments);

    if (err && typeof err === 'string' && /NoSuchBucket/.test(err)) {
      return file.cdn.init((err) => {
        if (err) return fn(err);

        file.attempt(action, fn);
      });
    }
    //
    // Other failure, which could be totally random so we should try again in
    // due time.
    //
    file.retries--;
    debug('recieved a failed attempt, we have %d retries left', file.retries);
    setImmediate(() => file.attempt(action, fn));
  }));
};

//
// Expose the File instance.
//
module.exports = File;
