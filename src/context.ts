import { h, Component, ComponentConstructor, RenderableProps } from "preact";
import {
  BitmaskFactory,
  createEmitter,
  ContextValueEmitter,
  noopEmitter
} from "./context-value-emitter";
import { getOnlyChildAndChildren } from "./utils";

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
  const { child } = getOnlyChildAndChildren(props);
  return child || props.render;
}

const MAX_SIGNED_31_BIT_INT = 1073741823;

const defaultBitmaskFactory: BitmaskFactory<any> = () => MAX_SIGNED_31_BIT_INT;
let ids = 0;

function _createContext<T>(
  value: T,
  bitmaskFactory?: BitmaskFactory<T>
): Context<T> {
  const key = `_preactContextProvider-${ids++}`;

  class Provider extends Component<ProviderProps<T>, any> {
    private _emitter: ContextValueEmitter<T>;

    constructor(props: ProviderProps<T>) {
      super(props);
      this._emitter = createEmitter(
        props.value,
        bitmaskFactory || defaultBitmaskFactory
      );
    }

    getChildContext() {
      return { [key]: this._emitter };
    }

    componentDidUpdate() {
      this._emitter.val(this.props.value);
    }

    render() {
      const { child, children } = getOnlyChildAndChildren(this.props);
      if (child) {
        return child;
      }
      // preact does not support fragments,
      // therefore we wrap the children in a span
      return h("span", null, children);
    }
  }

  class Consumer extends Component<ConsumerProps<T>, ConsumerState<T>> {
    constructor(props?: ConsumerProps<T>, ctx?: any) {
      super(props, ctx);
      this.state = { value: this._getEmitter().val() || value };
    }

    componentDidMount() {
      this._getEmitter().register(this._updateContext);
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
      this._getEmitter().unregister(this._updateContext);
    }

    componentDidUpdate(_: any, __: any, prevCtx: any) {
      const previousProvider = prevCtx[key];
      if (previousProvider === this.context[key]) {
        return;
      }
      (previousProvider || noopEmitter).unregister(this._updateContext);
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

    private _updateContext = (value: T, bitmask: number) => {
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

    private _getEmitter(): ContextValueEmitter<T> {
      return this.context[key] || noopEmitter;
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

// named and default export in order to have less problems with bundlers
export default _createContext;
export const createContext = _createContext;
