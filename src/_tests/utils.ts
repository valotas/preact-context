import { JSDOM } from "jsdom";
import expect from "expect";

export function setUpJsdomIfNotBrowser() {
  const anyGlobal = global as any;
  let document = anyGlobal.document;
  if (!document) {
    // we are not running in a browser, create a Jsdom document
    document = anyGlobal.document = new JSDOM(`<body></body>`).window.document;
  }
  return document;
}

export function html(el: HTMLElement, selector?: string) {
  if (!selector) {
    return el.innerHTML;
  }

  const elements = el.querySelectorAll(selector);
  expect(elements.length).toEqual(1);
  return elements[0].innerHTML;
}
