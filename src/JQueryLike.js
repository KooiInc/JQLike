// some DOM plumbing
import extensions from "./Extensions.js";
import {DOM} from "./DOM.js";
const {getRestricted, fromHtml, setAllowance, notAllowedAttrs} = DOM;

let useLogging = false;
const log = txt => {
  if (!document.querySelector("#jql_logger")) {
    const logEl = fromHtml(`<pre id="jql_logger"></pre>`, document.body);
    logEl.style.maxHeight = "200px";
    logEl.style.overflow = "auto";
    logEl.style.position = "fixed";
    logEl.style.bottom = "0.5rem";
    logEl.style.left = "1rem";
    logEl.style.right = "1rem";
    logEl.style.padding = "0.5rem 1rem";
    logEl.style.maxWidth = "inherit";
    logEl.style.border = "1px dotted #777";
  }
  document.querySelector("#jql_logger").textContent += `.${txt}\n`;
};
// the allmighty iterator
const iterate = (extCollection, callback) => {
  for (let i = 0; i < extCollection.collection.length; i += 1) {
    callback(extCollection.collection[i]);
  }
  return extCollection;
};

// the prototype initializer
const setPrototype = (ctor, extensions) => {
  Object.entries(Object.getOwnPropertyDescriptors(Element.prototype)).forEach(
    ([key, { value }]) => {
      if (value instanceof Function) {
        ctor.prototype[key] = function(...args) {
          return iterate(this, elem => value.apply(elem, args));
        };
      }
    }
  );

  Object.entries(Object.getOwnPropertyDescriptors(NodeList.prototype)).forEach(
    ([key, { value }]) => {
      if (value instanceof Function) {
        ctor.prototype[key] = function(lambda) {
          this.collection[key](lambda);
          return this;
        };
      }
    }
  );

  Object.entries(extensions).forEach(([key, lambda]) => {
    ctor.prototype[key] = function(...args) {
      return lambda.fn
        ? lambda.fn(this, ...args)
        : iterate(this, el => lambda(el, ...args));
    };
  });

  ctor.prototype.isSet = true;
};

// -------------------------------------------------------------------- //
export const jql = () => {
  function ExtendedNodeList(selector, root = document.body) {
    if (ExtendedNodeList.prototype.isSet === undefined) {
      setPrototype(ExtendedNodeList, extensions);
    }

    try {
      if ( String(selector).trim().startsWith("<") ) {
        if (useLogging) {
          log(`trying to create ... [${selector}]`);
        }
        this.collection = [fromHtml(selector, root)];
        if (useLogging) {
          log(`created element: *clean: [${this.collection[0].outerHTML}]`);
        }
      } else if (selector) {
        this.collection = root.querySelectorAll(selector);
      } else {
        log(`No css selector, assign empty collection`);
        this.collection = [];
      }
    } catch (err) {
      const msg = `jql selector or html error: "${err.message}"`;
      if (useLogging) { log(msg); } else { console.log(msg); }
      this.collection = [];
    }
  }

  return {
    $: (...args) => new ExtendedNodeList(...args),
    log,
    debugLog: { on: () => useLogging = true, off: useLogging = false },
    notAllowedAttrs,
    getRestricted,
    setAllowance,
  };
};
