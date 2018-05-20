# React's `createContext` for preact

[![Build Status](https://travis-ci.org/valotas/preact-context.svg?branch=master)](https://travis-ci.org/valotas/preact-context)
[![npm](https://img.shields.io/npm/v/preact-context.svg)](https://www.npmjs.com/package/preact-context)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/valotas.svg)](https://saucelabs.com/u/valotas)

This is an implementation of react's [new context api][rfcs]. You can read more
about it on [react's documentation][react-context-doc] page.

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
<Theme.Consumer>{theme => <p>Selected theme: {theme}</p>}</Theme.Consumer>
```

Alternatively, it can also be used with a render property:

```jsx
<Theme.Consumer render={theme => <p>Selected theme: {theme}</p>} />
```

## The `Provider`

can be used in order to update the value of a context:

```jsx
<Theme.Provider value="sunny">
```

will change "dark" to "sunny" and notify all it's consumers of the change.

# Development

This project has been written with [typescript][typescript].
The `watch` script will watch for changes, compile and run the tests.

```
$ npm i
$ npm run watch
```

# License

Licensed under the [Apache License, Version 2.0](LICENSE)

# Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs][saucelabs]

[rfcs]: https://github.com/acdlite/rfcs/blob/new-version-of-context/text/0000-new-version-of-context.md
[react-context-doc]: https://reactjs.org/docs/context.html
[typescript]: https://www.typescriptlang.org/
[saucelabs]: https://saucelabs.com
