const path = require("path");
const sauceLabs = process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY;

const sauceLabsLaunchers = {
  sl_chrome: {
    base: "SauceLabs",
    browserName: "chrome",
    platform: "Windows 10"
  },
  sl_firefox: {
    base: "SauceLabs",
    browserName: "firefox",
    platform: "Windows 10"
  },
  sl_safari: {
    base: "SauceLabs",
    browserName: "safari",
    platform: "OS X 10.11"
  },
  sl_edge: {
    base: "SauceLabs",
    browserName: "MicrosoftEdge",
    platform: "Windows 10"
  },
  sl_ie_11: {
    base: "SauceLabs",
    browserName: "internet explorer",
    version: "11.103",
    platform: "Windows 10"
  },
  sl_ie_10: {
    base: "SauceLabs",
    browserName: "internet explorer",
    version: "10.0",
    platform: "Windows 7"
  },
  sl_ie_9: {
    base: "SauceLabs",
    browserName: "internet explorer",
    version: "9.0",
    platform: "Windows 7"
  }
};

const customLaunchers = Object.assign(sauceLabs ? sauceLabsLaunchers : {}, {
  FirefoxHeadless: {
    base: "Firefox",
    flags: ["-headless"]
  },
  ChromeHeadlessNoSandbox: {
    base: "Chrome",
    flags: [
      "--no-sandbox",
      // See https://chromium.googlesource.com/chromium/src/+/lkgr/headless/README.md
      "--headless",
      "--disable-gpu",
      "--remote-debugging-port=9222"
    ]
  }
});

const inlineCoreJs = () => {
  function inline(files) {
    files.unshift({
      pattern: path.resolve("./node_modules/core-js/client/core.js"),
      included: true,
      served: true,
      watched: false
    });
  }

  inline.$inject = ["config.files"];

  return inline;
};

module.exports = config =>
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to u  se
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["browserify", "mocha", "inline-mocha-fix"],

    // list of files / patterns to load in the browser
    files: ["dist/**/*.Spec.js"],

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "dist/**/*.js": ["browserify"]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress"].concat(sauceLabs ? "saucelabs" : []),

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    browserNoActivityTimeout: 5 * 60 * 1000,
    browserLogOptions: { terminal: true },
    browserConsoleLogOptions: { terminal: true },

    transports: ["polling", sauceLabs ? "" : "websocket"].filter(t => !!t),

    customLaunchers,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 2,

    plugins: [
      require("karma-mocha"),
      require("karma-chrome-launcher"),
      require("karma-firefox-launcher"),
      require("karma-sauce-launcher"),
      require("karma-browserify"),
      {
        "framework:inline-mocha-fix": ["factory", inlineCoreJs()]
      }
    ]
  });
