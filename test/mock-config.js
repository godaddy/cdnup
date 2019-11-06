const endpoint = 'http://localhost:4572';
const bucket = 'test-cdnup';

module.exports = {
  check: `${ endpoint }/${ bucket }/`,
  acl: 'public-read',
  prefix: bucket,
  pkgcloud: {
    accessKeyId: 'fakeId',
    secretAccessKey: 'fakeKey',
    provider: 'amazon',
    forcePathBucket: true,
    endpoint
  }
};
