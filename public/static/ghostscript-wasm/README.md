# ghostscript-wasm

`ghostscript` compiled to WASM via Emscripten.

```sh
npm install --save @jspawn/ghostscript-wasm
```

## Examples

See the `tests` directory for examples.

## Notes

Need to comment out the AMD export in `gs.js` to avoid issues when using with monaco editor.

```js
else if (typeof define === 'function' && define['amd'])
  define([], function () { return Module; });
```
