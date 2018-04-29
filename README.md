# React's new Context Api for preact [![Build Status](https://travis-ci.org/valotas/preact-context.svg?branch=master)](https://travis-ci.org/valotas/preact-context)

This package provides the `createContext` factory function that can be used
in order to create a context:

```js
import { h } from "preact";
import { createContext } from "preact-context";

const Theme = createContext("dark");
```

The returned object contains two components: a `Provider` and a `Consumer`.

## The `Consumer`

It can be used in order to consume the provided object:

```jsx
<Theme.Consumer>
  {theme => `Selected theme: ${theme}`}
</Theme.Consumer>
```

Alternatively, it can also be used with a render property:

```jsx
<Theme.Consumer render={theme => `Selected theme: ${theme}`} />
```

## The `Provider`

can be used in order to update the value of a context:

```jsx
<Theme.Provider value="sunny">
```

will change "dark" to "sunny" and notify all it's consumers of the change.

# Development

This project has been written with [typescript](https://www.typescriptlang.org/).
The `watch` script will watch for changes, compile and run the tests.

```
$ npm i
$ npm run watch
```
