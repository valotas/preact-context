const ci = String(process.env.CI).match(/^(1|true)$/gi);
const sauceLabs = false;

const sauceLabsLaunchers = {
  sl_chrome: {
    base: "SauceLabs",
    browserName: "chrome",
    platform: "Windows 10"
  }
  /* sl_firefox: {
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
  } */
};

module.exports = config =>
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["browserify", "mocha"],

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
    browsers: sauceLabs
      ? Object.keys(sauceLabsLaunchers)
      : ["FirefoxHeadless", "ChromeHeadlessNoSandbox"],

    customLaunchers: sauceLabs
      ? sauceLabsLaunchers
      : {
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
        },

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
      require("karma-browserify")
    ]
  });
