import {log, logStatus} from "./Log.js";
import {
  createElementFromHtmlString,
  element2DOM,
  insertPositions,
} from "./DOM.js";

import { extensions, loop } from "./Extensions.js";

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
  function ExtendedNodeList(selectorOrHtml, root = document.body, position = insertPositions.BeforeEnd ) {
    if (ExtendedNodeList.prototype.isSet === undefined) {
      initializePrototype(ExtendedNodeList, extensions);
    }

    this.collection = [];
    const cleanupCollection = () => this.collection = this.collection.reduce( (acc, elem) =>
      !elem.dataset.elementInvalid && [...acc, element2DOM(elem, root, position)] || acc, []
    );

    try {
      const isArray = Array.isArray(selectorOrHtml);
      if (selectorOrHtml) {
        if (selectorOrHtml instanceof HTMLElement) {
          this.collection = [selectorOrHtml];
        } else if ( isArray ||
            `${selectorOrHtml}`.trim().startsWith("<") ) {

          if (logStatus()) {
            log(`trying to create ... [${selectorOrHtml}]`);
          }

          if (isArray) {
            selectorOrHtml.forEach( html =>
               this.collection.push(createElementFromHtmlString(html, root)) );

          } else {
            this.collection = [createElementFromHtmlString(selectorOrHtml, root)];
          }
          // remove erroneous elems
          cleanupCollection();

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

export default $;
