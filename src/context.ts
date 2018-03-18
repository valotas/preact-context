import { Component, ComponentConstructor } from "preact";

type StateUpdater<T> = (val: T) => void;

interface ContextProvider<T> {
  push: (updater: StateUpdater<T>) => T;
  pop: (updater: StateUpdater<T>) => void;
  context: any;
}

export interface ProducerProps<T> {
  value: T;
}

export interface ConsumerProps<T> {
  render?: (val: T) => any;
}

export interface Context<T> {
  Provider: ComponentConstructor<ProducerProps<T>, {}>;
  Consumer: ComponentConstructor<ConsumerProps<T>, { value: T }>;
}

export function createContext<T>(value: T): Context<T> {
  const context = {
    default: value
  };

  class Provider extends Component<ProducerProps<T>, any> {
    private subscribers: any[];

    constructor(props?: ProducerProps<T>, ctx?: any) {
      super(props, ctx);
      this.subscribers = [];
    }

    getChildContext() {
      const provider: ContextProvider<T> = {
        push: this.push,
        pop: this.pop,
        context: context
      };
      let providers = this.context.providers;
      if (providers) {
        providers.push(provider);
      } else {
        providers = [provider];
      }
      return { providers };
    }

    componentWillReceiveProps(nextProps: ProducerProps<T>) {
      if (this.props.value !== nextProps.value) {
        this.subscribers.forEach(subscriber => subscriber(nextProps.value));
      }
    }

    render() {
      const { children } = this.props;
      const result = children && children[0];
      return result || null;
    }

    private push = (updater: StateUpdater<T>) => {
      this.subscribers.push(updater);
      return this.props.value;
    };

    private pop = (updater: StateUpdater<T>) => {
      this.subscribers = this.subscribers.filter(i => i !== updater);
    };
  }

  class Consumer extends Component<ConsumerProps<T>, { value: T }> {
    private provider: ContextProvider<T> | null;

    constructor(props?: ConsumerProps<T>, ctx?: any) {
      super(props, ctx);
      this.provider = findProvider<T>(ctx.providers, context);
      if (!this.provider) {
        console.warn("Consumer used without a Provider");
        return;
      }
      const value = this.provider.push(this.updateContext);
      this.state = { value };
    }

    componentWillUnmount() {
      if (this.provider) {
        this.provider.pop(this.updateContext);
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
    Provider: Provider as ComponentConstructor<ProducerProps<T>, {}>,
    Consumer: Consumer as ComponentConstructor<ConsumerProps<T>, { value: T }>
  };
}

function findProvider<T>(
  providers: ContextProvider<T>[] = [],
  context: any
): ContextProvider<T> | null {
  return providers.reduce<ContextProvider<T> | null>((p, current) => {
    if (p) {
      return p;
    }
    return current.context === context ? current : null;
  }, null);
}
