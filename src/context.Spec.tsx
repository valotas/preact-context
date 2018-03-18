import { JSDOM } from "jsdom";
import { h, render as preactRender } from "preact"; /**@jsx h */
import { expect, use } from "chai";
import sinonChai from "sinon-chai";
import { createSandbox } from "sinon";
import { createContext } from "./context";

use(sinonChai);

const { document } = new JSDOM(`<body><div id="scratch"></div></body>`).window;
const anyGlobal = global as any;
anyGlobal.document = anyGlobal.document || document;

const scratch = document.getElementById("scratch") as HTMLDivElement;
const render = (comp: JSX.Element) =>
  preactRender(comp, scratch, scratch.lastChild as Element);

describe("contex", () => {
  const sandbox = createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it("exposes a createContext function", () => {
    expect(createContext).to.exist;
  });

  describe("createContext", () => {
    it("creates an object with a Provider", () => {
      const ctx = createContext("");
      expect(ctx).haveOwnProperty("Provider");
    });

    it("creates an object with a Consumer", () => {
      const ctx = createContext("");
      expect(ctx).haveOwnProperty("Consumer");
    });
  });

  describe("Provider", () => {
    it("returns the given children as is", () => {
      const ctx = createContext("");
      render(<ctx.Provider value="a value">Hi from provider</ctx.Provider>);

      expect(scratch.innerHTML).to.eq("Hi from provider");
    });
  });

  describe("Consumer", () => {
    it("returns the given children as is", () => {
      const ctx = createContext("");
      render(
        <ctx.Provider value="init">
          <ctx.Consumer>Hi from consumer</ctx.Consumer>
        </ctx.Provider>
      );

      expect(scratch.innerHTML).to.eq("Hi from consumer");
    });

    it("executes the given children function", () => {
      const ctx = createContext("");
      render(
        <ctx.Provider value="init">
          <ctx.Consumer>{() => "Hi from function"}</ctx.Consumer>
        </ctx.Provider>
      );

      expect(scratch.innerHTML).to.eq("Hi from function");
    });

    it("executes the given render function", () => {
      const ctx = createContext("");
      render(
        <ctx.Provider value="init">
          <ctx.Consumer render={() => "Hi from render"} />
        </ctx.Provider>
      );

      expect(scratch.innerHTML).to.eq("Hi from render");
    });

    it("warns if both a render and children are given", () => {
      const ctx = createContext("");
      const warn = sandbox.stub(console, "warn");
      render(
        <ctx.Provider value="init">
          <ctx.Consumer render={() => "Hi from render"}>
            Hi from children
          </ctx.Consumer>
        </ctx.Provider>
      );
      expect(warn).to.have.been.calledWith(
        "Both children and a render function is define. Children will be used"
      );
    });

    it("warns if used without a Provide", () => {
      const ctx = createContext("The Default Context");
      const warn = sandbox.stub(console, "warn");
      render(
        <ctx.Consumer>{(value: string) => `Hi from '${value}'`}</ctx.Consumer>
      );

      expect(warn).to.have.been.calledWith("Consumer used without a Provider");
    });

    it("has access to the default value if no provider is given", () => {
      const ctx = createContext("The Default Context");
      sandbox.stub(console, "warn");
      render(<ctx.Consumer render={value => `Hi from '${value}'`} />);
      expect(scratch.innerHTML).to.eq("Hi from 'The Default Context'");
    });

    it("has access to the provided value", () => {
      const ctx = createContext("The Default Context");
      render(
        <ctx.Provider value="The Provided Context">
          <ctx.Consumer>{(value: string) => `Hi from '${value}'`}</ctx.Consumer>
        </ctx.Provider>
      );
      expect(scratch.innerHTML).to.eq("Hi from 'The Provided Context'");
    });

    it("updates the value accordingly", () => {
      const ctx = createContext("The Default Context");
      const componentWillReceiveProps = sandbox.spy(
        ctx.Provider.prototype,
        "componentWillReceiveProps"
      );
      render(
        <ctx.Provider value="The Provided Context">
          <ctx.Consumer>{(value: string) => `Hi from '${value}'`}</ctx.Consumer>
        </ctx.Provider>
      );

      // rerender
      render(
        <ctx.Provider value="The updated context">
          <ctx.Consumer>{(value: string) => `Hi from '${value}'`}</ctx.Consumer>
        </ctx.Provider>
      );

      expect(scratch.innerHTML).to.eq("Hi from 'The updated context'");
      expect(componentWillReceiveProps).to.have.been.calledWithMatch({
        value: "The updated context"
      });
    });
  });
});
