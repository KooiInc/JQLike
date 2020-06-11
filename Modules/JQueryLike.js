import { extensions, getRestricted, setTagPermission, fromHtml, loop, log, debugLog, logStatus, allowUnknownHtmlTags  }
  from "./Extensions.js";

// the prototype initializer
const initializePrototype = (ctor, extensions) => {
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
  function ExtendedNodeList(selectorOrHtml, root = document.body) {
    if (ExtendedNodeList.prototype.isSet === undefined) {
      initializePrototype(ExtendedNodeList, extensions);
    }

    this.collection = [];

    try {
      if (selectorOrHtml) {
        if (selectorOrHtml instanceof HTMLElement) {
          this.collection = [selectorOrHtml];
        } else if ( selectorOrHtml.constructor === Array ||
          `${selectorOrHtml}`.trim().startsWith("<") ) {

          if (logStatus()) {
            log(`trying to create ... [${selectorOrHtml}]`);
          }

          if (Array.isArray(selectorOrHtml)) {
            selectorOrHtml.forEach( html =>
               this.collection.push(fromHtml(html, root)) );
          } else {
            this.collection = [fromHtml(selectorOrHtml, root)];
          }

          if (logStatus()) {
            log(`created element: *clean: [${this.collection[0].outerHTML}]`);
          }
        } else if (selectorOrHtml) {
          this.collection = root.querySelectorAll(selectorOrHtml);
        } else {
          log(`No css selector, assign empty collection`);
        }
        return this;
      }
    } catch (err) {
      const msg = `Caught jql selector or html error:\n${err.stack ? err.stack : err.message}`;
      if (logStatus()) {
        log(msg);
      } else {
        console.log(msg);
      }
    }
  }

  return {
    $: (...args) => new ExtendedNodeList(...args),
  };
})().$;

export { $, debugLog, log, getRestricted, setTagPermission, allowUnknownHtmlTags };
