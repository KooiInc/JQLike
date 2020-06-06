import { extensions, getRestricted, setAllowance, fromHtml, notAllowedAttrs, loop  } from "./Extensions.js";
import { log, debugLog, logStatus } from "./Log.js";

// the prototype initializer
const setPrototype = (ctor, extensions) => {
  Object.entries(Object.getOwnPropertyDescriptors(Element.prototype))
    .filter( propDescriptr => propDescriptr.value instanceof Function)
    .forEach( ([key, { value }]) =>
      ctor.prototype[key] = function(...args) {
        return loop(this, elem => value.apply(elem, args));
    } );

  Object.entries(Object.getOwnPropertyDescriptors(NodeList.prototype))
    .filter( propDescriptr => propDescriptr.value instanceof Function)
    .forEach( ([key]) => {
        ctor.prototype[key] = function(lambda) {
          this.collection[key](lambda);
          return this;
        };
    } );

  Object.entries(extensions).forEach(([key, lambda]) => {
    ctor.prototype[key] = function(...args) {
      return lambda.fn
        ? lambda.fn(this, ...args)
        : loop(this, el => lambda(el, ...args));
    };
  });

  ctor.prototype.isSet = true;
};

// -------------------------------------------------------------------- //
const $ = (() => {
  function ExtendedNodeList(selector, root = document.body) {
    if (ExtendedNodeList.prototype.isSet === undefined) {
      setPrototype(ExtendedNodeList, extensions);
    }

    try {
      if ( String(selector).trim().startsWith("<") ) {
        if (logStatus()) {
          log(`trying to create ... [${selector}]`);
        }
        this.collection = [fromHtml(selector, root)];
        if (logStatus()) {
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
      if (logStatus()) { log(msg); } else { console.log(msg); }
      this.collection = [];
    }
  }

  return {
    $: (...args) => new ExtendedNodeList(...args),
  };
})().$;

export { $, debugLog, log, notAllowedAttrs, getRestricted, setAllowance };
