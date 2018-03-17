import { JSDOM } from "jsdom";
import { h, render as preactRender } from "preact"; /**@jsx h */
import { expect } from "chai";
import * as context from "./context";

const { document } = new JSDOM(`<body><div id="scratch"></div></body>`).window;
const anyGlobal = global as any;
anyGlobal.document = anyGlobal.document || document;

const scratch = document.getElementById("scratch") as HTMLDivElement;
const render = (comp: JSX.Element) =>
  preactRender(comp, scratch, scratch || undefined);

describe("contex", () => {
  it("exposes a createContext function", () => {
    expect(context.createContext).to.exist;
  });

  describe("createContext", () => {
    it("creates an object with a Provider", () => {
      const ctx = context.createContext();
      expect(ctx).haveOwnProperty("Provider");
    });

    it("creates an object with a Consumer", () => {
      const ctx = context.createContext();
      expect(ctx).haveOwnProperty("Consumer");
    });
  });

  describe("Provider", () => {
    it("returns the given children as is", () => {
      const ctx = context.createContext();
      const value = {};
      render(<ctx.Provider value={value}>Hi from provider</ctx.Provider>);

      expect(scratch.innerHTML).to.eq("Hi from provider");
    });
  });

  describe("Consumer", () => {
    it("returns the given children as is", () => {
      const ctx = context.createContext();
      render(<ctx.Consumer>Hi from consumer</ctx.Consumer>);

      expect(scratch.innerHTML).to.eq("Hi from consumer");
    });
  });
});
