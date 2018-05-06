import { JSDOM } from "jsdom";

(function(g: any) {
  if (!g.document) {
    // we are not running in a browser, create a Jsdom document
    g.document = new JSDOM(`<body></body>`).window.document;
  }
})(global);
