define(function(require) {
  const bdd = require('intern!bdd');
  const assert = require('intern/chai!assert');

  // This is how to load regular Node modules.
  const fs = require('intern/dojo/node!fs');

  // Create a sub-suite with `bdd.describe`. Sub-suites can
  // have their own sub-suites; just use `bdd.describe`
  // within a suite.
  //
  // Use `bdd.before` to define a function that will
  // run before the suite starts, `bdd.after` to define a
  // function that will run after the suite ends, `bdd.beforeEach`
  // to define a function that will run before each test or sub-suite,
  // and `bdd.afterEach` to define a function that will run after each
  // test or sub-suite.
  //
  // Use `bdd.it` to define actual test cases.
  //
  // Within a test, throwing an `Error` object will cause the test to fail.
  // Returning a promise will make the test async; if the promise
  // eventually resolves then the test will pass. If the promise
  // eventually rejects then the test will fail. Reject with a descriptive
  // `Error` object please.
  //
  // Within a test, `this` refers to a test suite object. You can use it
  // to skip the test or do other test-specific things.
  //
  // `this.remote` is null for unit tests.

  bdd.describe('Node unit', function() {
    bdd.describe('Build process', function() {
      bdd.it('should output readable expected files and only expected files', function() {
        // Please keep this list alphabetically sorted. It is case sensitive.
        var expectedFiles = [
          'dist/bundle.css',
          'dist/bundle.css.map',
          'dist/bundle.js',
          'dist/bundle.js.map',
          'dist/images/bugzilla.png',
          'dist/images/bugzilla@2x.png',
          'dist/images/favicon-196.png',
          'dist/images/favicon.ico',
          'dist/images/github.png',
          'dist/images/github@2x.png',
          'dist/images/html5.png',
          'dist/images/html5@2x.png',
          'dist/images/ios-icon-180.png',
          'dist/images/mdn.png',
          'dist/images/mdn@2x.png',
          'dist/images/tabzilla-static.png',
          'dist/images/tabzilla-static-high-res.png',
          'dist/index.html',
          'dist/manifest.json',
          'dist/offline-worker.js',
          'dist/status.json'
        ];

        var ignoreDirs = [
          'dist/cache',
        ];

        function processPath(path) {
          return new Promise(function(resolve, reject) {
            if (ignoreDirs.indexOf(path) > -1) {
              resolve();
            }
            fs.stat(path, function(statErr, stats) {
              if (statErr) {
                return reject(path + ': ' + statErr);
              }

              if (stats.isFile()) {
                return fs.access(path, fs.F_OK | fs.R_OK, function(accessErr) {
                  if (accessErr) {
                    return reject(path + ': ' + accessErr);
                  }

                  var index = expectedFiles.indexOf(path);
                  if (index === -1) {
                    return reject(new Error('Unexpected file: ' + path));
                  }
                  expectedFiles.splice(index, 1);

                  return resolve();
                });
              }

              if (stats.isDirectory()) {
                return fs.readdir(path, function(readErr, files) {
                  if (readErr) {
                    return reject(path + ': ' + readErr);
                  }

                  var promises = files.map(function(filename) {
                    var filepath = path + '/' + filename;
                    return processPath(filepath);
                  });

                  return Promise.all(promises)
                    .then(resolve)
                    .catch(reject);
                });
              }

              return reject(path + ' is not a file or a directory');
            });
          });
        }

        return processPath('dist').then(function() {
          if (expectedFiles.length !== 0) {
            throw new Error('File(s) not found: ' + expectedFiles);
          }
        });
      });
    });

    bdd.describe('Engine', function() {
      bdd.before(function() {
        // This modifies the node module loader to work with es2015 modules.
        // All subsequent `require` calls that use the node module loader
        // will use this modified version and will be able to load es2015
        // modules.
        require('intern/dojo/node!babel-core/register');
      });

      bdd.describe('fixtureParser', function() {
        bdd.it('should something', function() {
          // The node module loader for some reason has wacky path resolution.
          // I wish we didn't have to have all these '..' but, alas.
          var FixtureParser = require('intern/dojo/node!../../../../engine/fixtureParser');
          var fp = new FixtureParser('asdf');
          assert(fp);
        });
      });
    });
  });
});
