// import resolve from "rollup-plugin-node-resolve";
// import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";

export default [
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
