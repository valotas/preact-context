import { JSDOM } from "jsdom";
import {
  h,
  render as preactRender,
  options,
  Component
} from "preact"; /**@jsx h */
import { expect, use } from "chai";
import sinonChai from "sinon-chai";
import { createSandbox } from "sinon";
import { createContext } from "./context";

use(sinonChai);

describe("contex", () => {
  const sandbox = createSandbox();
  const render = (comp: JSX.Element) =>
    preactRender(comp, scratch, scratch.lastChild as Element);
  let scratch: HTMLDivElement;

  before(() => {
    const anyGlobal = global as any;
    let document = anyGlobal.document;
    if (!document) {
      // we are not running in a browser, create a Jsdom document
      document = anyGlobal.document = new JSDOM(
        `<body></body>`
      ).window.document;
    }
    scratch = document.createElement("div");
    document.body.appendChild(scratch);
  });

  beforeEach(() => {
    options.debounceRendering = (r: any) => r();
  });

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

    describe("nested Providers", () => {
      it("passes the updated value to the sub consumer", () => {
        const ctx = createContext(10);

        render(
          <ctx.Provider value={12}>
            <ctx.Consumer>
              {(value: number) => (
                <div>
                  <span className="result">{value}</span>
                  <ctx.Provider value={value * 10}>
                    <ctx.Consumer>
                      {(value: number) => (
                        <span className="nested-result">{value}</span>
                      )}
                    </ctx.Consumer>
                  </ctx.Provider>
                </div>
              )}
            </ctx.Consumer>
          </ctx.Provider>
        );

        const result = document.querySelector(".result");
        expect(result).not.to.be.null;
        expect(result!.innerHTML).to.eq("12");

        const nested = document.querySelector(".nested-result");
        expect(nested).not.to.be.null;
        expect(nested!.innerHTML).to.eq("120");
      });
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
        "Both children and a render function are defined. Children will be used"
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
      const componentDidUpdate = sandbox.spy(
        ctx.Provider.prototype,
        "componentDidUpdate"
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
      expect(componentDidUpdate).to.have.been.calledOnce;
    });

    it("updates the Consumer's value even if indirection is not rendered", () => {
      class Indirection extends Component<any, {}> {
        shouldComponentUpdate() {
          return false;
        }
        render() {
          return this.props.children[0];
        }
      }

      const ctx = createContext("The Default Context");

      render(
        <ctx.Provider value="The Provided Context">
          <Indirection>
            <ctx.Consumer>
              {(value: string) => `Hi from '${value}'`}
            </ctx.Consumer>
          </Indirection>
        </ctx.Provider>
      );
      expect(scratch.innerHTML).to.eq("Hi from 'The Provided Context'");

      // rerender with updated value
      render(
        <ctx.Provider value="The Updated Context">
          <Indirection>
            <ctx.Consumer>
              {(value: string) => `Hi from '${value}'`}
            </ctx.Consumer>
          </Indirection>
        </ctx.Provider>
      );

      expect(scratch.innerHTML).to.eq("Hi from 'The Updated Context'");
    });
  });
});
