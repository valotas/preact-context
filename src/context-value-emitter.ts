export type StateUpdater<T> = (val: T, bitmask: number) => void;

export type BitmaskFactory<T> = (a: T, b: T) => number;

export interface ContextValueEmitter<T> {
  register: (updater: StateUpdater<T>) => void;
  unregister: (updater: StateUpdater<T>) => void;
  val: (value?: T) => T;
}

export function createEmitter<T>(
  initialValue: T,
  bitmaskFactory: BitmaskFactory<T>
): ContextValueEmitter<T> {
  let registeredUpdaters: Array<StateUpdater<T>> = [];
  let value = initialValue;
  return {
    register(updater: StateUpdater<T>) {
      registeredUpdaters.push(updater);
      updater(value, 0);
    },
    unregister(updater: StateUpdater<T>) {
      registeredUpdaters = registeredUpdaters.filter(i => i !== updater);
    },
    val(newValue?: T) {
      if (newValue === undefined || newValue == value) {
        return value;
      }

      let diff = bitmaskFactory(value, newValue);
      diff = diff |= 0;

      value = newValue;
      registeredUpdaters.forEach(up => up(newValue, diff));
      return value;
    }
  };
}

export const noopContext: ContextValueEmitter<any> = {
  register(_: StateUpdater<any>) {
    console.warn("Consumer used without a Provider");
  },
  unregister(_: StateUpdater<any>) {
    // do nothing
  },
  val(_: any) {
    //do nothing;
  }
};
