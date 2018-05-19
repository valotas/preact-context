import { h, Component, ComponentConstructor, RenderableProps } from "preact";
import {
  BitmaskFactory,
  createEmitter,
  ContextValueEmitter,
  noopContext
} from "./context-value-emitter";

export interface ProviderProps<T> {
  value: T;
}

export interface ConsumerProps<T> {
  render?: (val: T) => any;
  unstable_observedBits?: number;
}

export type ConsumerState<T> = ProviderProps<T>;

export interface Context<T> {
  Provider: ComponentConstructor<ProviderProps<T>, {}>;
  Consumer: ComponentConstructor<ConsumerProps<T>, ConsumerState<T>>;
}

function getRenderer<T>(props: RenderableProps<ConsumerProps<T>>) {
  const { children, render } = props;
  return (children && children[0]) || render;
}

const MAX_SIGNED_31_BIT_INT = 1073741823;

const defaultBitmaskFactory: BitmaskFactory<any> = () => MAX_SIGNED_31_BIT_INT;
let ids = 0;

export function createContext<T>(
  value: T,
  bitmaskFactory: BitmaskFactory<T> = defaultBitmaskFactory
): Context<T> {
  const key = `_preactContextProvider-${ids++}`;

  class Provider extends Component<ProviderProps<T>, any> {
    private _contextProvider: ContextValueEmitter<T>;

    constructor(props: ProviderProps<T>) {
      super(props);
      this._contextProvider = createEmitter(props.value, bitmaskFactory);
    }

    getChildContext() {
      return {
        [key]: this._contextProvider
      };
    }

    componentDidUpdate() {
      this._contextProvider.val(this.props.value);
    }

    render() {
      const { children } = this.props;
      if (children && children.length > 1) {
        // preact does not support fragments,
        // therefore we wrap the children in a span
        return h("span", null, children);
      }
      return ((children && children[0]) || null) as JSX.Element;
    }
  }

  class Consumer extends Component<ConsumerProps<T>, ConsumerState<T>> {
    constructor(props?: ConsumerProps<T>, ctx?: any) {
      super(props, ctx);
      this.state = { value: this.getContextProvider().val() || value };
    }

    componentDidMount() {
      this.getContextProvider().register(this.updateContext);
    }

    shouldComponentUpdate(
      nextProps: ConsumerProps<T>,
      nextState: ConsumerState<T>
    ) {
      return (
        this.state.value !== nextState.value ||
        getRenderer(this.props) !== getRenderer(nextProps)
      );
    }

    componentWillUnmount() {
      this.getContextProvider().unregister(this.updateContext);
    }

    componentDidUpdate(_: any, __: any, prevCtx: any) {
      const previousProvider = prevCtx[key];
      if (previousProvider === this.context[key]) {
        return;
      }
      (previousProvider || noopContext).unregister(this.updateContext);
      this.componentDidMount();
    }

    render() {
      const { render } = this.props;
      const r = getRenderer(this.props);
      if (render && render !== r) {
        console.warn(
          "Both children and a render function are defined. Children will be used"
        );
      }
      if (typeof r === "function") {
        return r(this.state.value || value);
      }
      console.warn(
        "Consumer is expecting a function as one and only child but didn't find any"
      );
    }

    private updateContext = (value: T, bitmask: number) => {
      const { unstable_observedBits } = this.props;
      let observed =
        unstable_observedBits === undefined || unstable_observedBits === null
          ? MAX_SIGNED_31_BIT_INT
          : unstable_observedBits;
      observed = observed | 0;

      if ((observed & bitmask) === 0) {
        return;
      }
      this.setState({ value });
    };

    private getContextProvider(): ContextValueEmitter<T> {
      return this.context[key] || noopContext;
    }
  }

  return {
    Provider: Provider as ComponentConstructor<ProviderProps<T>, {}>,
    Consumer: Consumer as ComponentConstructor<
      ConsumerProps<T>,
      ConsumerState<T>
    >
  };
}
