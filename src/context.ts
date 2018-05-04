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

function getRenderer<T>(props: RenderableProps<ConsumerProps<T>>) {
  const { children, render } = props;
  return (children && children[0]) || render;
}

interface IContextProvider<T> {
  register: (updater: StateUpdater<T>) => void;
  unregister: (updater: StateUpdater<T>) => void;
  setValue: (value: T) => void;
}

class ContextProvider<T> implements IContextProvider<T> {
  private _value: T;
  private _updaters: Array<StateUpdater<T>> = [];

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  register(updater: StateUpdater<T>) {
    this._updaters.push(updater);
    updater(this._value);
    return () => this.unregister(updater);
  }

  unregister(updater: StateUpdater<T>) {
    this._updaters = this._updaters.filter(i => i !== updater);
  }

  setValue(newValue: T) {
    if (newValue === this._value) {
      return;
    }
    this._value = newValue;
    this._updaters.forEach(up => up(newValue));
  }
}

const noopContext: IContextProvider<any> = {
  register(_: StateUpdater<any>) {
    console.warn("Consumer used without a Provider");
  },
  unregister(_: StateUpdater<any>) {
    // do nothing
  },
  setValue(_: any) {
    //do nothing;
  }
};

let ids = 0;

export function createContext<T>(value: T): Context<T> {
  const key = `_preactContextProvider-${ids++}`;

  class Provider extends Component<ProviderProps<T>, any> {
    private _contextProvider: IContextProvider<T>;

    constructor(props: ProviderProps<T>) {
      super(props);
      this._contextProvider = new ContextProvider(props.value);
    }

    getChildContext() {
      return {
        [key]: this._contextProvider
      };
    }

    componentDidUpdate() {
      this._contextProvider.setValue(this.props.value);
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

  class Consumer extends Component<ConsumerProps<T>, ConsumerState<T>> {
    constructor(props?: ConsumerProps<T>, ctx?: any) {
      super(props, ctx);
      this.state = { value };
    }

    componentDidMount() {
      (this.context[key] || noopContext).register(this.updateContext);
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
      (this.context[key] || noopContext).unregister(this.updateContext);
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

    private updateContext = (value: T) => this.setState({ value });
  }

  return {
    Provider: Provider as ComponentConstructor<ProviderProps<T>, {}>,
    Consumer: Consumer as ComponentConstructor<ConsumerProps<T>, { value: T }>
  };
}
