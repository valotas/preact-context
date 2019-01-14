import expect from "expect";
import {
  Component,
  h,
  options,
  render as preactRender
} from "preact"; /**@jsx h */
import * as sinon from "sinon";
import { createContext } from "../context";
import { Empty } from "./utils";

interface X {}

const RequiredContext = createContext<X>({
  message: "initial"
});
const RequiredProvider = RequiredContext.Provider;
const RequiredConsumer = RequiredContext.Consumer;

const RequiredComponent = () => (
  <RequiredConsumer>
    {() => {
      return <div className="component" />;
    }}
  </RequiredConsumer>
);

class RequiredAppWith extends Component<any, any> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <RequiredProvider value={{}}>
        <div className="app">
          <RequiredComponent />
        </div>
      </RequiredProvider>
    );
  }
}

class RequiredAppWithout extends Component<any, any> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <div className="app">
        <RequiredComponent />
      </div>
    );
  }
}

const OptionalContext = createContext<X>(
  {
    message: "initial"
  },
  undefined,
  {
    providerOptional: true
  }
);
const OptionalProvider = OptionalContext.Provider;
const OptionalConsumer = OptionalContext.Consumer;

const OptionalComponent = () => (
  <OptionalConsumer>
    {() => {
      return <div className="component" />;
    }}
  </OptionalConsumer>
);

class OptionalAppWith extends Component<any, any> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <OptionalProvider value={{}}>
        <div className="app">
          <OptionalComponent />
        </div>
      </OptionalProvider>
    );
  }
}

class OptionalAppWithout extends Component<any, any> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <div className="app">
        <OptionalComponent />
      </div>
    );
  }
}

describe("createContext with providerOptional=false (default)", () => {
  const sandbox = sinon.createSandbox();
  let scratch: HTMLDivElement;

  const render = (comp: JSX.Element) =>
    preactRender(comp, scratch, scratch.lastChild as Element);

  before(() => {
    scratch = document.createElement("div");
    document.body.appendChild(scratch);
  });

  beforeEach(() => {
    render(<Empty />);
    sandbox.useFakeTimers();
    options.debounceRendering = r => r();
    sinon.spy(console, "warn");
  });

  afterEach(() => {
    sandbox.clock.runAll();
    sandbox.restore();
    (console.warn as any).restore();
  });

  it("does not warn when a provider is used", () => {
    render(<RequiredAppWith />);
    expect((console.warn as any).callCount).toEqual(0);
  });

  it("warns when no provider is used", () => {
    render(<RequiredAppWithout />);
    expect((console.warn as any).callCount).toEqual(1);
  });
});

describe("createContext with providerOptional=true", () => {
  const sandbox = sinon.createSandbox();
  let scratch: HTMLDivElement;

  const render = (comp: JSX.Element) =>
    preactRender(comp, scratch, scratch.lastChild as Element);

  before(() => {
    scratch = document.createElement("div");
    document.body.appendChild(scratch);
  });

  beforeEach(() => {
    render(<Empty />);
    sandbox.useFakeTimers();
    options.debounceRendering = r => r();
    sinon.spy(console, "warn");
  });

  afterEach(() => {
    sandbox.clock.runAll();
    sandbox.restore();
    (console.warn as any).restore();
  });

  it("does not warn when a provider is used", () => {
    render(<OptionalAppWith />);
    expect((console.warn as any).callCount).toEqual(0);
  });

  it("does not warn when no provider is used", () => {
    render(<OptionalAppWithout />);
    expect((console.warn as any).callCount).toEqual(0);
  });
});
