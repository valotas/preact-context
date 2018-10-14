import expect from "expect";
import {
  Component,
  h,
  options,
  render as preactRender,
  RenderableProps
} from "preact"; /**@jsx h */
import * as sinon from "sinon";
import { createContext } from "../context";
import { Empty } from "./utils";

const updateTimeout = 1000;

interface MessageContainer {
  message: string;
}

const { Provider, Consumer } = createContext<MessageContainer>({
  message: "initial"
});

const MyProvider = ({
  message,
  children
}: RenderableProps<MessageContainer>) => {
  return (
    <Provider value={{ message: message }}>
      <div className="my-provider">{children}</div>
    </Provider>
  );
};

interface MyConsumerProps {
  name: string;
}

const MyConsumer = (props: RenderableProps<MyConsumerProps>) => (
  <Consumer>
    {({ message }: MessageContainer) => {
      return <div className={`consumer ${props.name}`}>{message}</div>;
    }}
  </Consumer>
);

class App extends Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      flag: false
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ flag: true });
    }, updateTimeout);
  }

  render() {
    return (
      <div className="app">
        <MyProvider message={this.state.flag ? "Not the initial value" : ""}>
          {this.state.flag && <MyConsumer name="a" />}
          <MyConsumer name="b" />
          <MyConsumer name="c" />
        </MyProvider>
      </div>
    );
  }
}

describe("issue20", () => {
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
  });

  afterEach(() => {
    sandbox.clock.runAll();
    sandbox.restore();
  });

  it("renders initially .b and .c", () => {
    render(<App />);

    expect(scratch.querySelectorAll(".b")).toHaveLength(1);
    expect(scratch.querySelectorAll(".c")).toHaveLength(1);
  });

  it("renders initially only 2 consumers", () => {
    render(<App />);

    expect(scratch.querySelectorAll(".consumer")).toHaveLength(2);
  });

  it(`renders 3 consumers after ${updateTimeout}ms`, () => {
    render(<App />);

    sandbox.clock.tick(updateTimeout);

    expect(scratch.querySelectorAll(".consumer")).toHaveLength(3);
  });

  it(`renders consumers have the same message after ${updateTimeout}ms`, () => {
    render(<App />);

    sandbox.clock.tick(updateTimeout);

    const divs = scratch.querySelectorAll(".consumer");
    expect(divs[0].innerHTML).toEqual(divs[1].innerHTML);
    expect(divs[1].innerHTML).toEqual(divs[2].innerHTML);
  });
});
