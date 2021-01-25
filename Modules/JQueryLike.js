/*
 centralized import
 partly exported as [util]
*/
import {
  debugLog,
  log,
  logStatus
} from "./Log.js";

import {
  setTagPermission,
  getRestricted,
  allowUnknownHtmlTags,
} from "./DOMCleanup.js";

import {
  createElementFromHtmlString,
  element2DOM,
  insertPositions,
  closestSibling,
} from "./DOM.js";

/* local */
import {
  extensions,
  loop,
} from "./Extensions.js";

/* the prototype initializer */
const initializePrototype = (ctor, extensions) => {
  Object.entries(extensions).forEach(([key, lambda]) => {
    ctor.prototype[key] = function (...args) {
      return lambda.fn
        ? lambda.fn(this, ...args)
        : loop(this, el => lambda(el, ...args));
    };
  });
  ctor.prototype.isSet = true;
};

// -------------------------------------------------------------------- //
const {$, util} = (() => {
  function ExtendedNodeList(
    inputObject,
    root = document.body,
    position = insertPositions.BeforeEnd) {

    if (ExtendedNodeList.prototype.isSet === undefined) {
      initializePrototype(ExtendedNodeList, extensions);
    }

    this.collection = [];
    this.cssSelector = inputObject && inputObject.trim && inputObject || null;
    const cleanupAndAppendCollection = () => this.collection = this.collection.reduce((acc, elem) =>
      !(elem || {dataset: {}}).dataset["elementInvalid"] ? [...acc, element2DOM(elem, root, position)] : acc, []
    );

    const selectorRoot = root !== document.body &&
      (inputObject.constructor === String &&
        inputObject.toLowerCase() !== "body") ? root : document;

    try {
      const isArray = Array.isArray(inputObject);
      this.collection = [];

      if (inputObject instanceof HTMLElement) {
        this.collection = [inputObject];
      } else if (inputObject instanceof NodeList) {
        this.collection = [...inputObject];
      } else if (inputObject instanceof ExtendedNodeList) {
        this.collection = inputObject.collection;
      } else if (isArray || `${inputObject}`.trim().startsWith("<") && `${inputObject}`.trim().endsWith(">")) {
        log(`trying to create ... [${inputObject}]`);

        if (isArray) {
          inputObject.forEach(htmlFragment => {
            this.collection.push(createElementFromHtmlString(htmlFragment));
          });
        } else {
          const nwElem = createElementFromHtmlString(inputObject);
          this.collection = [nwElem];
        }
        // remove erroneous elems and append to DOM
        cleanupAndAppendCollection();
        log(`created element: *clean: [${this.collection[0].outerHTML}]`);
      } else if (inputObject && inputObject.trim) {
        this.collection = [...selectorRoot.querySelectorAll(inputObject)];
      }
      return this;
    } catch (err) {
      const msg = `Caught jql selector or html error:\n${err.stack ? err.stack : err.message}`;
      log(msg);
    //^ only if logStatus = on, so
      console.log(msg);
    }
  }

  return {
    $: (...args) => new ExtendedNodeList(...args),
    util: {
      debugLog,
      log,
      logStatus,
      setTagPermission,
      allowUnknownHtmlTags,
      insertPositions,
      getRestricted,
      closestSibling
    }
  };
})();

export {$, util};
