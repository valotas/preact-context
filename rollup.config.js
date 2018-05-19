const path = require("path");
const commonjs = require("rollup-plugin-commonjs");
const nodeResolve = require("rollup-plugin-node-resolve");
const nodeGlobals = require("rollup-plugin-node-globals");
const nodeBuiltins = require("rollup-plugin-node-builtins");
const pkg = require("./package.json");

const loadPreactContextMin = preactContextId => {
  return {
    load: id => {
      if (id === preactContextId) {
        return `
          export var createContext = function() {
            var pc = window.preactContext;
            return pc.createContext.apply(pc, arguments);
          }`;
      }
    }
  };
};

function createOutput({ file } = {}) {
  return {
    name: "preactContextTests",
    format: "iife",
    globals: { preact: "preact" },
    file
  };
}

function createTestConfig({ input, output } = {}) {
  const preactContextId = path.resolve("./dist/esm/context.js");

  return {
    input,
    external: ["preact"],
    context: "window",
    plugins: [
      loadPreactContextMin(preactContextId),
      nodeResolve({ browser: true }),
      commonjs({ include: "node_modules/**" }),
      nodeGlobals(),
      nodeBuiltins()
    ],
    output: createOutput({ file: output })
  };
}

const defaultConfig = [
  // browser-friendly UMD build
  {
    input: pkg.module,
    external: ["preact"],
    context: "window",
    output: {
      name: "preactContext",
      file: pkg.browser.replace("min.", ""),
      format: "iife",
      globals: {
        preact: "preact"
      }
    }
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: pkg.module,
    external: ["preact"],
    context: "global",
    output: [{ file: pkg.main, format: "cjs" }]
  }
];

module.exports = function(args) {
  const config = [].concat(defaultConfig);
  if (args.includeSpecFiles) {
    delete args.includeSpecFiles;
    config.push(
      createTestConfig({
        input: "./dist/esm/_tests/context.Spec.js",
        output: "./dist/test.Spec.js"
      })
    );
  }
  return config;
};
module.exports.createTestConfig = createTestConfig;
