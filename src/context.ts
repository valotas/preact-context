import { h, Component, ComponentConstructor, RenderableProps } from "preact";

export interface ProviderProps<T> {
  value: T;
}

export interface ConsumerProps<T> {
  render?: (val: T) => any;
}

export type ConsumerState<T> = ProviderProps<T>;

export interface Context<T> {
  Provider: ComponentConstructor<ProviderProps<T>, {}>;
  Consumer: ComponentConstructor<ConsumerProps<T>, { value: T }>;
}

type StateUpdater<T> = (val: T) => void;

function noop() {}

function sameRenderFunction<T>(
  props: RenderableProps<ConsumerProps<T>>,
  nextProps: RenderableProps<ConsumerProps<T>>
) {
  if (props.render !== nextProps.render) {
    return false;
  }

  const children = props.children || [];
  const nextChildren = nextProps.children || [];
  if (children.length !== nextChildren.length) {
    return false;
  }
  if (children[0] !== nextChildren[0]) {
    return false;
  }
  return true;
}

class ContextProvider<T> {
  value: T;
  private updaters: Array<StateUpdater<T>> = [];

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  register(updater: StateUpdater<T>) {
    this.updaters.push(updater);
    updater(this.value);
    return () => (this.updaters = this.updaters.filter(i => i !== updater));
  }

  setValue(newValue: T) {
    if (newValue === this.value) {
      return;
    }
    this.value = newValue;
    this.updaters.forEach(up => up(newValue));
  }
}

let ids = 0;

export function createContext<T>(value: T): Context<T> {
  const key = `_preactContextProvider-${ids++}`;

  class Provider extends Component<ProviderProps<T>, any> {
    private contextProvider: ContextProvider<T>;

    constructor(props: ProviderProps<T>) {
      super(props);
      this.contextProvider = new ContextProvider(props.value);
    }

    getChildContext() {
      return {
        [key]: this.contextProvider
      };
    }

    componentDidUpdate() {
      this.contextProvider.setValue(this.props.value);
    }

    render() {
      const { children } = this.props;
      if (children && children.length > 1) {
        // preact does not support fragments,
        // therefore we wrap the children in a span
        return h("span", null, children);
      }
      const result = children && children[0];
      return (result || null) as JSX.Element;
    }
  }

  class Consumer extends Component<ConsumerProps<T>, { value: T }> {
    private unregister: () => void;

    constructor(props?: ConsumerProps<T>, ctx?: any) {
      super(props, ctx);
      this.unregister = noop;
      this.state = { value };
    }

    componentDidMount() {
      this.register();
    }

    shouldComponentUpdate(
      nextProps: ConsumerProps<T>,
      nextState: ConsumerState<T>
    ) {
      return (
        this.state.value !== nextState.value ||
        !sameRenderFunction(this.props, nextProps)
      );
    }

    componentWillUnmount() {
      this.unregister();
    }

    componentDidUpdate(_: any, __: any, prevCtx: any) {
      if (prevCtx[key] === this.context[key]) {
        return;
      }
      this.unregister();
      this.unregister = noop;
      this.register();
    }

    render() {
      const { children, render } = this.props;
      const r = (children && children[0]) || render;
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

    private updateContext = (value: T) => this.setState({ value });

    private register() {
      const provider = this.context[key];
      if (provider) {
        this.unregister = provider.register(this.updateContext);
      } else {
        console.warn("Consumer used without a Provider");
      }
    }
  }

  return {
    Provider: Provider as ComponentConstructor<ProviderProps<T>, {}>,
    Consumer: Consumer as ComponentConstructor<ConsumerProps<T>, { value: T }>
  };
}
