import expect from "expect";
import {
  Component,
  RenderableProps,
  h,
  render as preactRender
} from "preact"; /**@jsx h */
import * as sinon from "sinon";
import defaultCreateContext from "../context";
import { createContext } from "../context";
import { html } from "./utils";

const Empty = () => null;

describe("context", () => {
  const sandbox = sinon.createSandbox();

  let scratch: HTMLDivElement;

  const render = (comp: JSX.Element) =>
    preactRender(comp, scratch, scratch.lastChild as Element);

  before(() => {
    scratch = document.createElement("div");
    document.body.appendChild(scratch);
  });

  afterEach(() => {
    render(<Empty />);
    sandbox.restore();
  });

  it("exports a createContext function", () => {
    expect(createContext).toBeDefined();
  });

  it("exports a default function", () => {
    expect(createContext).toEqual(defaultCreateContext);
  });

  describe("createContext", () => {
    it("creates an object with a Provider", () => {
      const ctx = createContext("");
      expect(ctx).toHaveProperty("Provider");
    });

    it("creates an object with a Consumer", () => {
      const ctx = createContext("");
      expect(ctx).toHaveProperty("Consumer");
    });
  });

  describe("Provider", () => {
    it("returns the given children as is", () => {
      const ctx = createContext("");
      render(<ctx.Provider value="a value">Hi from provider</ctx.Provider>);

      expect(html(scratch)).toEqual("Hi from provider");
    });

    it("updates the value accordingly", () => {
      const ctx = createContext(1);
      const componentDidUpdate = sandbox.spy(
        ctx.Provider.prototype,
        "componentDidUpdate"
      );
      render(
        <ctx.Provider value={2}>
          <ctx.Consumer>{(value: string) => `result: '${value}'`}</ctx.Consumer>
        </ctx.Provider>
      );
      expect(html(scratch)).toEqual("result: '2'");

      // rerender
      render(
        <ctx.Provider value={3}>
          <ctx.Consumer>{(value: string) => `result: '${value}'`}</ctx.Consumer>
        </ctx.Provider>
      );

      expect(html(scratch)).toEqual("result: '3'");
      sinon.assert.calledOnce(componentDidUpdate);
    });

    it("accepts many children by wrapping them into a span", () => {
      const ctx = createContext(1);

      render(
        <ctx.Provider value={2}>
          <div />
          <ctx.Consumer>{(value: string) => `result: '${value}'`}</ctx.Consumer>
        </ctx.Provider>
      );
      expect(html(scratch)).toEqual("<span><div></div>result: '2'</span>");
    });
  });

  describe("Consumer", () => {
    it("executes the given children function", () => {
      const ctx = createContext("");
      render(
        <ctx.Provider value="init">
          <ctx.Consumer>{() => "Hi from function"}</ctx.Consumer>
        </ctx.Provider>
      );

      expect(html(scratch)).toEqual("Hi from function");
    });

    it("executes the given render function", () => {
      const ctx = createContext("");
      render(
        <ctx.Provider value="init">
          <ctx.Consumer render={() => "Hi from render"} />
        </ctx.Provider>
      );

      expect(html(scratch)).toEqual("Hi from render");
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

      sinon.assert.calledWith(
        warn,
        "Both children and a render function are defined. Children will be used"
      );
    });

    it("warns if used without a Provider", () => {
      const ctx = createContext("The Default Context");
      const warn = sandbox.stub(console, "warn");
      render(
        <ctx.Consumer>{(value: string) => `Hi from '${value}'`}</ctx.Consumer>
      );

      sinon.assert.calledWith(warn, "Consumer used without a Provider");
    });

    it("has access to the default value if no provider is given", () => {
      const ctx = createContext("The Default Context");
      sandbox.stub(console, "warn");
      render(<ctx.Consumer render={value => `Hi from '${value}'`} />);
      expect(html(scratch)).toEqual("Hi from 'The Default Context'");
    });

    it("has access to the provided value", () => {
      const ctx = createContext("The Default Context");
      render(
        <ctx.Provider value="The Provided Context">
          <ctx.Consumer>{(value: string) => `Hi from '${value}'`}</ctx.Consumer>
        </ctx.Provider>
      );
      expect(html(scratch)).toEqual("Hi from 'The Provided Context'");
    });

    it("make use of the provided value on init (should not cause a rerender)", () => {
      const ctx = createContext("The Default Context");
      let renderCounter = 0;
      render(
        <ctx.Provider value="The Provided Context">
          <ctx.Consumer>
            {(value: string) => {
              renderCounter++;
              return `'${value}' rendered ${renderCounter} times`;
            }}
          </ctx.Consumer>
        </ctx.Provider>
      );
      expect(html(scratch)).toEqual("'The Provided Context' rendered 1 times");
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
      expect(scratch.innerHTML).toEqual("Hi from 'The Provided Context'");

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

      expect(html(scratch)).toEqual("Hi from 'The Updated Context'");
    });

    it("warns if it is given a children other than a function", () => {
      const ctx = createContext("The Default Context");
      const warn = sandbox.stub(console, "warn");

      render(<ctx.Consumer>Nothing</ctx.Consumer>);

      sinon.assert.calledWith(
        warn,
        "Consumer is expecting a function as one and only child but didn't find any"
      );
    });

    it("Renders nothing if no function child or render is given", () => {
      const ctx = createContext("The Default Context");
      sandbox.stub(console, "warn");

      render(<ctx.Consumer>Something</ctx.Consumer>);

      expect(html(scratch)).toEqual("");
    });

    it("does not rerender if context has not been changed", () => {
      const ctx = createContext("The Default Context");
      sandbox.stub(console, "warn");
      let renderCounter = 0;
      const printValue = (value: any) => (
        <span className="result">
          &apos;
          {value}
          &apos; rendered {++renderCounter} times
        </span>
      );

      render(
        <ctx.Provider value="provided context">
          <ctx.Consumer render={printValue} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'provided context' rendered 1 times"
      );

      // rerender
      render(
        <ctx.Provider value="provided context">
          <ctx.Consumer render={printValue} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'provided context' rendered 1 times"
      );
    });

    it("does not rerender if context instance has not been changed", () => {
      const ctx = createContext({ prop: "da prop" });
      sandbox.stub(console, "warn");
      let renderCounter = 0;
      const printValue = (value: any) => (
        <span className="result">
          &apos;
          {value.prop}
          &apos; rendered {++renderCounter} times
        </span>
      );

      const updatedContext = { prop: "updated prop" };
      render(
        <ctx.Provider value={updatedContext}>
          <ctx.Consumer render={printValue} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 1 times"
      );

      // rerender
      render(
        <ctx.Provider value={updatedContext}>
          <ctx.Consumer render={printValue} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 1 times"
      );
    });

    it("does rerender if context instance changes", () => {
      const ctx = createContext({ prop: "da prop" });
      sandbox.stub(console, "warn");
      let renderCounter = 0;
      const printValue = (value: any) => (
        <span className="result">
          &apos;
          {value.prop}
          &apos; rendered {++renderCounter} times
        </span>
      );

      render(
        <ctx.Provider value={{ prop: "updated prop" }}>
          <ctx.Consumer render={printValue} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 1 times"
      );

      // rerender
      render(
        <ctx.Provider value={{ prop: "updated prop" }}>
          <ctx.Consumer render={printValue} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 2 times"
      );
    });

    it("skips rerendering with bitmask", () => {
      const ctx = createContext({ foo: 0, bar: 0 }, (a, b) => {
        let result = 0;
        if (a.foo !== b.foo) {
          result |= 0b01;
        }
        if (a.bar !== b.bar) {
          result |= 0b10;
        }
        return result;
      });

      function TheProvider(props: any) {
        return (
          <ctx.Provider value={{ foo: props.foo, bar: props.bar }}>
            {props.children}
          </ctx.Provider>
        );
      }

      let fooCounter = 0;
      function Foo() {
        return (
          <ctx.Consumer unstable_observedBits={0b01}>
            {(value: any) => {
              fooCounter++;
              return (
                <span className="foo">
                  Foo: {value.foo}, rendered {fooCounter} times
                </span>
              );
            }}
          </ctx.Consumer>
        );
      }

      let barCounter = 0;
      function Bar() {
        return (
          <ctx.Consumer unstable_observedBits={0b10}>
            {(value: any) => {
              barCounter++;
              return (
                <span className="bar">
                  Bar: {value.bar}, rendered {barCounter} times
                </span>
              );
            }}
          </ctx.Consumer>
        );
      }

      class Indirection extends Component<any, any> {
        shouldComponentUpdate() {
          return false;
        }
        render() {
          return <div className="indirection">{this.props.children}</div>;
        }
      }

      function App({ foo, bar }: any) {
        return (
          <TheProvider foo={foo} bar={bar}>
            <Indirection>
              <Foo />
              <Bar />
            </Indirection>
          </TheProvider>
        );
      }

      render(<App foo={1} bar={1} />);
      expect(html(scratch, ".foo")).toEqual("Foo: 1, rendered 1 times");
      expect(html(scratch, ".bar")).toEqual("Bar: 1, rendered 1 times");

      // Update only foo
      render(<App foo={2} bar={1} />);
      expect(html(scratch, ".foo")).toEqual("Foo: 2, rendered 2 times");
      expect(html(scratch, ".bar")).toEqual("Bar: 1, rendered 1 times");

      // Update only bar
      render(<App foo={2} bar={2} />);
      expect(html(scratch, ".foo")).toEqual("Foo: 2, rendered 2 times");
      expect(html(scratch, ".bar")).toEqual("Bar: 2, rendered 2 times");

      // Update both
      render(<App foo={3} bar={3} />);
      expect(html(scratch, ".foo")).toEqual("Foo: 3, rendered 3 times");
      expect(html(scratch, ".bar")).toEqual("Bar: 3, rendered 3 times");
    });

    it("rerenders if provided render function changes", () => {
      const ctx = createContext({ prop: "da prop" });
      sandbox.stub(console, "warn");
      let renderCounter = 0;
      function printValue(value: any) {
        return (
          <span className="result">
            &apos;
            {value.prop}
            &apos; rendered {++renderCounter} times
          </span>
        );
      }

      const updatedContext = { prop: "updated prop" };
      render(
        <ctx.Provider value={updatedContext}>
          <ctx.Consumer render={printValue.bind(null)} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 1 times"
      );

      // rerender
      render(
        <ctx.Provider value={updatedContext}>
          <ctx.Consumer render={printValue.bind(null)} />
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 2 times"
      );
    });

    it("rerenders if provided child function changes", () => {
      const ctx = createContext({ prop: "da prop" });
      sandbox.stub(console, "warn");
      let renderCounter = 0;
      const printValue = (value: any) => (
        <span className="result">
          &apos;
          {value.prop}
          &apos; rendered {++renderCounter} times
        </span>
      );

      const updatedContext = { prop: "updated prop" };
      render(
        <ctx.Provider value={updatedContext}>
          <ctx.Consumer>{printValue}</ctx.Consumer>
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 1 times"
      );

      // rerender
      render(
        <ctx.Provider value={updatedContext}>
          <ctx.Consumer>{(value: any) => printValue(value)}</ctx.Consumer>
        </ctx.Provider>
      );

      expect(html(scratch, ".result")).toEqual(
        "'updated prop' rendered 2 times"
      );
    });
  });

  describe("nested contextes", () => {
    it("Provider passes the updated value to the sub consumer", () => {
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

      expect(html(scratch, ".result")).toEqual("12");
      expect(html(scratch, ".nested-result")).toEqual("120");
    });

    it("each context can consume other contextes", () => {
      const numContext = createContext(10);
      const textContext = createContext("hi");

      render(
        <numContext.Provider value={12}>
          <numContext.Consumer>
            {(num: number) => (
              <div>
                <span className="result">{num}</span>
                <textContext.Provider value={`consumed num: ${num}`}>
                  <div>
                    <span className="nested-number">{num}</span>
                    <textContext.Consumer>
                      {(text: string) => (
                        <span className="nested-result">{text}</span>
                      )}
                    </textContext.Consumer>
                  </div>
                </textContext.Provider>
              </div>
            )}
          </numContext.Consumer>
        </numContext.Provider>
      );

      expect(html(scratch, ".result")).toEqual("12");
      expect(html(scratch, ".nested-number")).toEqual("12");
      expect(html(scratch, ".nested-result")).toEqual("consumed num: 12");
    });

    it("each context provides the value to it's consumer", () => {
      const numContext = createContext(10);
      const textContext = createContext("hi");
      sandbox.stub(console, "warn");

      render(
        <numContext.Provider value={12}>
          <numContext.Consumer>
            {(value: number) => (
              <div>
                <span className="result">{value}</span>
                <numContext.Consumer>
                  {(value: number) => (
                    <span className="number-result">{value}</span>
                  )}
                </numContext.Consumer>
                <textContext.Consumer>
                  {(value: string) => (
                    <span className="text-result">{value}</span>
                  )}
                </textContext.Consumer>
              </div>
            )}
          </numContext.Consumer>
        </numContext.Provider>
      );

      expect(html(scratch, ".result")).toEqual("12");
      expect(html(scratch, ".number-result")).toEqual("12");
      expect(html(scratch, ".text-result")).toEqual("hi");
    });

    it("different branches", () => {
      const numContext = createContext(10);
      const textContext = createContext("hi");
      sandbox.stub(console, "warn");

      function TextConsumer(props: RenderableProps<any>) {
        return (
          <textContext.Consumer>
            {(value: string) => (
              <div className={`text-consumer c${props.id}`}>
                <span className="value">{value}</span>
                {props.children}
              </div>
            )}
          </textContext.Consumer>
        );
      }

      function NumberConsumer(props: RenderableProps<any>) {
        return (
          <numContext.Consumer>
            {(value: string) => (
              <div className={`num-consumer c${props.id}`}>
                <span className="value">{value}</span>
                {props.children}
              </div>
            )}
          </numContext.Consumer>
        );
      }

      render(
        <numContext.Provider value={12}>
          <TextConsumer id="1" />
          <NumberConsumer id="2" />
          <textContext.Provider value="twelve">
            <TextConsumer id="3">
              <NumberConsumer id="4" />
              <numContext.Provider value={120}>
                <TextConsumer id="5" />
                <NumberConsumer id="6" />
              </numContext.Provider>
            </TextConsumer>
            <NumberConsumer id="6">
              <TextConsumer />
            </NumberConsumer>
          </textContext.Provider>
        </numContext.Provider>
      );

      expect(html(scratch, ".c1 .value")).toEqual("hi");
      expect(html(scratch, ".c2 .value")).toEqual("12");
      expect(html(scratch, ".c3 .c5 .value")).toEqual("twelve");
      expect(html(scratch, ".c3 .c6 .value")).toEqual("120");
    });
  });
});
