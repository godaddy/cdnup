'use strict';

describe('File', function () {
  var File = require('../file');
  var assume = require('assume');

  describe('#contentType', function () {
    it('looks up the content type', function () {
      var file = new File(5, {}, {});

      assume(file.contentType('hello.js')).equals('application/javascript');
      assume(file.contentType('hello.html')).equals('text/html');
      assume(file.contentType('hello.dfadfasdf')).equals('application/octet-stream');
    });

    it('allows prefers override over `mime` library', function () {
      var file = new File(5, {}, {
        mime: {
          '.svgs': 'text/plain',
          '.html': 'fake/news'
        }
      });

      assume(file.contentType('hello.html')).equals('fake/news');
      assume(file.contentType('hello.svgs')).equals('text/plain');
    });
  });
});
