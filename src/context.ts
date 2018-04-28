import { Component, ComponentConstructor } from "preact";

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

class ContextProvider<T> {
  value: T;
  updaters: Array<StateUpdater<T>> = [];

  constructor(defaultValue: T) {
    this.value = defaultValue;
  }

  register(updater: StateUpdater<T>) {
    this.updaters.push(updater);
    updater(this.value);
    return () => (this.updaters = this.updaters.filter(i => i !== updater));
  }

  setValue(newValue: T) {
    this.value = newValue;
    this.updaters.forEach(up => up(newValue));
  }
}

export function createContext<T>(value: T): Context<T> {
  class Provider extends Component<ProviderProps<T>, any> {
    private contextProvider: ContextProvider<T>;

    constructor(props?: ProviderProps<T>, ctx?: any) {
      super(props, ctx);
      this.contextProvider = new ContextProvider(value);
      if (props) {
        this.contextProvider.value = props.value;
      }
    }

    getChildContext() {
      return { contextProvider: this.contextProvider };
    }

    componentDidUpdate(prevProps: ProviderProps<T>) {
      const { value } = this.props;
      if (value !== prevProps.value) {
        this.contextProvider.setValue(value);
      }
    }

    render() {
      const { children } = this.props;
      const result = children && children[0];
      return result || null;
    }
  }

  class Consumer extends Component<ConsumerProps<T>, { value: T }> {
    private unregister?: () => void;

    constructor(props?: ConsumerProps<T>, ctx?: any) {
      super(props, ctx);

      const provider = ctx ? ctx.contextProvider : null;
      if (!provider) {
        console.warn("Consumer used without a Provider");
        return;
      }
      this.unregister = provider.register(this.updateContext);
      this.state = { value: provider.value };
    }

    componentWillUnmount() {
      if (this.unregister) {
        this.unregister();
      }
    }

    render() {
      const { children, render } = this.props;
      const r = (children && children[0]) || render;
      if (render && render !== r) {
        console.warn(
          "Both children and a render function is define. Children will be used"
        );
      }
      if (typeof r === "function") {
        return r(this.state.value || value);
      }
      return r;
    }

    private updateContext = (value: T) => {
      this.setState({ value });
    };
  }

  return {
    Provider: Provider as ComponentConstructor<ProviderProps<T>, {}>,
    Consumer: Consumer as ComponentConstructor<ConsumerProps<T>, { value: T }>
  };
}
