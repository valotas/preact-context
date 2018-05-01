import { h, Component, ComponentConstructor, RenderableProps } from "preact";

export interface ProviderProps<T> {
  value: T;
}

export interface ConsumerProps<T> {
  render?: (val: T) => any;
}

export interface Context<T> {
  Provider: ComponentConstructor<ProviderProps<T>, {}>;
  Consumer: ComponentConstructor<ConsumerProps<T>, { value: T }>;
}

type StateUpdater<T> = (val: T) => void;

function noop() {}

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

    shouldComponentUpdate(nextProps: RenderableProps<ProviderProps<T>>) {
      const { value, children } = this.props;
      return value !== nextProps.value || children !== nextProps.children;
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
      return r;
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
