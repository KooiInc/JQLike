import {createElementFromHtmlString} from "./DOM.js";

/**
 * iterator used for most
 * extensions. Also exposed as '[ExtCollection].each'
 * @param extCollection
 * @param callback
 * @returns ExtCollection instance
 */
const loop = (extCollection, callback) => {
  for (let i = 0; i < extCollection.collection.length; i += 1) {
    callback(extCollection.collection[i], i);
  }
  return extCollection;
};

/* region common helpers */
const isVisible = el => {
  const {currentStyle} = el;
  const computedStyle = currentStyle || getComputedStyle(el);
  const invisible = "hidden" === computedStyle.visibility;
  const noDisplay = "none" === computedStyle.display;
  const offscreen = el.offsetTop < 0 || (el.offsetLeft + el.offsetWidth) < 0 || el.offsetLeft > document.body.offsetWidth;
  const noOpacity = +computedStyle.opacity === 0;

  return offscreen || noOpacity || noDisplay || invisible
    ? false
    : !(el instanceof HTMLBodyElement)
      ? isVisible(el.parentNode) : true;
};
/* endregion common helpers */

/* region style color toggling helpers */
/**
 * Convert abbreviated hex color (eg #000) to full
 * @param hex
 * @returns {string}
 */
const hex2Full = hex => {
  hex = (hex.trim().startsWith("#") ? hex.slice(1) : hex).trim();
  return hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
};
/**
 * convert hex color to rgb(a)
 * @param hex
 * @param opacity
 * @returns {string}
 */
const hex2RGBA = (hex, opacity = 100) => {
  hex = hex2Full(hex.slice(1));
  const op = opacity % 100 !== 0;
  return `rgb${op ? "a" : ""}(${
    parseInt(hex.slice(0, 2), 16)}, ${
    parseInt(hex.slice(2, 4), 16)}, ${
    parseInt(hex.slice(-2), 16)}${op ? `, ${opacity/100}` : ""})`;
};
/** endregion */

/* region handling helper */
const getStyle = elem => getComputedStyle(elem);
const addHandler = (() => {
  /**
   * Note:
   * all handlers use event delegation.
   * For every eventType there will be exactly one
   * handler, added to the document.
   * The handler iterates over the (wrapped) handler
   * functions created with the factory
   * function [handlerFn].
   */
  let handlers = {};

  /**
   * handles evt.type
   * from the array of handlers for it
   * @param evt
   */
  const metaHandler = evt => {
    const handlersForType = handlers[evt.type];
    for (let i = 0; i < handlersForType.length; i += 1) {
      if (handlersForType[i](evt)) {
        break;
      }
    }
  };

  /**
   * wraps a handler (from $([]).on/ON) and returns
   * a new handler function
   * @param extCollection
   * @param maybeSelectorOrCallback
   * @param callback
   * @returns {function(...[*]=)}
   */
  const handlerFnFactory = (extCollection, maybeSelectorOrCallback, callback) => {
    return evt => {
      const target = !(maybeSelectorOrCallback instanceof Function) &&
          evt.target.closest(maybeSelectorOrCallback);
      if (target || maybeSelectorOrCallback instanceof Function) {
        return maybeSelectorOrCallback instanceof Function
          ? maybeSelectorOrCallback(evt, extCollection)
          : callback(evt, extCollection);
      }
      return false;
    }
  };

  return (extCollection, type, selectorOrCb, callback) => {
    if (!Object.keys(handlers).find(t => t === type)) {
      document.addEventListener(type, metaHandler);
    }

    const fn = handlerFnFactory(extCollection, selectorOrCb, callback);
    handlers = handlers[type]
      ? { ...handlers, [type]: handlers[type].concat(fn) }
      : { ...handlers, [type]: [fn] };
  };
})();
/* endregion */

/* region extension methods */

/**
 * toggle [classname] of [el]
 * @param el
 * @param className
 * @returns {boolean}
 */
const toggleClass= (el, className) => el.classList.toggle(className);

/**
 * swap [classname] with [...nwClassnames] of [el]
 * @param el
 * @param className
 * @param nwClassName
 * @returns {boolean}
 */
const swapClass = (el, className, ...nwClassNames) => {
  el.classList.remove(className);
  nwClassNames.forEach(name => el.classList.add(name))
}

/**
 * remove the element from the DOM tree
 * @param el
 * @returns {{parentNode}|*}
 */
const remove = el => el.parentNode && el.parentNode.removeChild(el);

/**
 * Does (first) element contain a (or one of a set of) classNames?
 * @type {{fn: (function(*, ...[*]): unknown)}}
 */
const hasClass = {
  fn: (extCollection, ...classNames) => {
    const firstElem = extCollection.first();
    return classNames.find(name => {
      firstElem.classList.contains(name)
    });
  },
}

/**
 * remove [classNames] from [el]. Classnames may be single string
 * or array
 * @param el
 * @param classNames
 * @returns {*}
 */
const removeClass = (el, ...classNames) =>
  classNames.forEach( cn => el.classList.remove(cn) );

/**
 * add [classNames] to [el]. Classnames may be single string
 * or array
 * @param el
 * @param classNames
 * @returns {*}
 */
const addClass = (el, ...classNames) =>
  classNames.forEach( cn => el.classList.add(cn) );

/**
 * style [el]. css  must be key-value pairs
 * @param el
 * @param keyOrKvPairs
 */
const css = (el, keyOrKvPairs, value) => {
  if (value) {
    keyOrKvPairs = {[keyOrKvPairs]: value === "empty" ? "" : value};
  }
  Object.entries(keyOrKvPairs).forEach(([key, value]) => el.style[key] = value);
}

/**
 * set data-attribute for [el]
 * attributes must be key-value pairs
 * @param el
 * @param keyValuePairs
 */
const data = (el, keyValuePairs) => {
  // noinspection JSValidateTypes
  Object.entries(keyValuePairs).forEach( ([key, value]) => el.dataset[key] = value );
}

/**
 * set 'Props' values from attr
 * @param el
 * @param keyValuePairs
 */
const assignAttrValues = (el, keyValuePairs) =>
  Object.entries(keyValuePairs).forEach( ([key, value]) => {
    if (key.toLowerCase() === "class") {
      el.classList.add(`${value}`);
    } else {
      el[key] = value;
    }
  } );


/**
 * Set attributes for element [el].
 * attributes must be key-value pairs
 * style and data-attributes must also be key-value pairs
 * @param el
 * @param keyOrObj
 */
const attr = (el, keyOrObj, value) => {
    if (value) {
      keyOrObj = {[keyOrObj]: value};
    }

    if (!value && keyOrObj.constructor === String) {
      return el.getAttribute(keyOrObj);
    }

    Object.entries(keyOrObj).forEach(([key, value]) => {
      const keyCompare = key.toLowerCase();

      if (["style", "data"].includes(keyCompare)) {
        if (keyCompare === "style") {
          css(el, value);
        } else if (keyCompare === "data") {
          data(el, value);
        }
      } else {
        if (value instanceof Object) {
          assignAttrValues(el, value);
        } else {
          el.setAttribute(key, value);
        }
      }
    });
  }

/**
 * set textValue for each element in the
 * collection of [extCollection] and return
 * a string from the joined array of text
 * values from all elements in the collection
 * overwrites current textContent of [el]
 * Note: uses textContent, so no html here
 * @type {{fn: (function(*, *=): string)}}
 */
const text = {
  fn: (extCollection, textValue, append) => {
    const el = extCollection.first();

    if (!el) {
      return "";
    }

    if (!textValue) {
      return el.textContent;
    } else if (append) {
      el.textContent += textValue;
    } else {
      el.textContent = textValue;
    }

    return extCollection;
  },
};

const is ={
  fn:  (extCollection, checkValue) => {
    const firstElem = extCollection.first();

    switch(checkValue) {
      case ":visible": {
        return isVisible(firstElem);
      }
      case ":hidden": return !isVisible(firstElem);
      case ":disabled": return firstElem.getAttribute("readonly") || firstElem.getAttribute("disabled");
      default: return true;
    }
  }
}

/**
 * remove element content
 * @param el
 * @returns {*|string}
 */
const empty = el => el && (el.textContent = "");
const clear = empty;

/**
 * check if element(s) exist
 * @type {{fn: (function(*): boolean)}}
 */
const isEmpty = {
  fn: extCollection => extCollection.collection.length < 1,
};

/**
 * set innerHtml for [el]
 * the innerHTML is always sanitized (see DOMCleanup)
 * @type {{fn: html.fn}}
 */
const html = {
  fn: (extCollection, htmlValue, append) => {
    if (htmlValue === undefined) {
      const firstEl = extCollection.first();
      if (firstEl) {
        return firstEl.innerHTML;
      }
      return "";
    }

    if (extCollection.collection.length) {
      const el2Change = extCollection.first();
      if (`{htmlValue}`.trim().length < 1) {
        el2Change.textContent = "";
      } else {
        const nwElement = createElementFromHtmlString(`<div>${htmlValue}</div>`);

        if (append) {
          el2Change.innerHTML += nwElement.innerHTML;
        } else {
          el2Change.innerHTML = nwElement.innerHTML;
        }
      }
    }

    return extCollection;
  }
};

/**
 * Toggle attribute [name] with [value] for [el]
 * @param el
 * @param name
 * @param value
 */
const toggleAttr = (el, name, value) =>
  el.hasAttribute(name)
    ? el.removeAttribute(name)
    : el.setAttribute(name, value);

/**
 * Remove some attribute from element
 * @param el
 * @param name
 */
const removeAttr = (el, name) => el.removeAttribute(name);

/**
 * toggle individual style properties for [el]
 * properties must be key-value pairs
 * Note: this may fail, because browsers may reformat
 * style values in their own way. See the color stuf
 * for example. Use rgba if you want to toggle opacity
 * for a color too
 * @param el
 * @param keyValuePairs
 */
const toggleStyleFragments = (el, keyValuePairs) =>
  Object.entries(keyValuePairs).forEach( ([key, value]) => {
    if (value instanceof Function) {
      value = value(el);
    }

    if (/color/i.test(key)) {
      value = value.startsWith(`#`)
        ? hex2RGBA(value)
        : value.replace(/(,|,\s{2,})(\w)/g, (...args) => `, ${args[2]}`);
    }

    el.style[key] = `${el.style[key]}` === `${value}` ? "" : value;
  });

/**
 * alias for loop
 * @type {{fn: (function(*, *): *)}}
 */
const each = {
  fn: loop
};

/**
 * Retrieve the value of an input element (if applicable)
 * @type {{fn: (function(*, *=): (null|*))}}
 */
const val = {
  fn: (extCollection, value2Set = null) => {
    const firstElem = extCollection.first();
    if (!firstElem) { return null; }
    if ([HTMLInputElement, HTMLSelectElement].includes(firstElem.constructor)) {
      if (value2Set || typeof value2Set === "string") {
        firstElem.value = value2Set;
      }
      return firstElem.value;
    }
    return null
  }
}

/**
 * replace [oldChild] with [newChild]
 * multiple todo (replace with htmlstr, chainable)
 * @type {{fn: replace.fn}}
 */
const replace = {
  fn: (extCollection, oldChild, newChild) => {
    const firstElem = extCollection.first();

    if (newChild.constructor === extCollection.constructor) {
      newChild = newChild.first();
    }

    if (firstElem && oldChild) {
      oldChild = oldChild.constructor === String
          ? firstElem.querySelector(oldChild)
          : oldChild.constructor === extCollection.constructor
            ? oldChild.first()
            : oldChild;

      if (oldChild && newChild) {
        oldChild.replaceWith(newChild);
      }
    }

    return extCollection;
  },
}

/**
 * Append something to the first element of [extCollection]
 * @type {{fn: append.fn}}
 */
const append = {
  fn: (extCollection, elem2Append) => {
    const firstElem = extCollection.first();

    if (elem2Append instanceof extCollection.constructor) {
      elem2Append = elem2Append.first();
    }

    if (firstElem && elem2Append) {
      if (elem2Append.constructor === String) {
        new extCollection.constructor(elem2Append, firstElem);
      } else {
        firstElem.appendChild(elem2Append);
      }
    }

    return extCollection;
  },
};

/**
 * Append element to some other extCollection
 * @type {{fn: append.fn}}
 */
const appendTo = {
  fn: (extCollection, extCollection2AppendTo) => {
    const firstElem = extCollection.first();

    if ( extCollection2AppendTo.constructor !== extCollection.constructor ) {
      extCollection2AppendTo = new extCollection.constructor(extCollection2AppendTo);
    }

    extCollection2AppendTo.append(extCollection);

    return extCollection2AppendTo;
  },
};

/**
 * insert element before other element, or first of collection
 * @type {{fn: append.fn}}
 */
const insert = {
  fn: (extCollection, elem, insertBeforeElem) => {
    const firstElem = extCollection.first();

    if (insertBeforeElem) {
      insertBeforeElem = insertBeforeElem.constructor === String
        ? firstElem.querySelector(insertBeforeElem)
        : insertBeforeElem.constructor === extCollection.constructor
          ? insertBeforeElem.first()
          : insertBeforeElem;
    } else {
      insertBeforeElem = firstElem.childNodes[0];
    }

    if ( elem.constructor === extCollection.constructor ) {
      elem = elem.first();
    }

    firstElem.insertBefore(elem, insertBeforeElem);

    return extCollection;
  },
};

/**
 * return [el] with index [index] from the
 * collection of the ExtendedNodeList instance
 * (if it exists, otherwise the collection)
 * @type {{fn: single.fn}}
 */
const single = {
  fn: (extCollection, indexOrSelector = "0") => {
    if (extCollection.collection.length > 0) {
      if (isNaN(+indexOrSelector) && extCollection.find(indexOrSelector)) {
        return extCollection.find$(indexOrSelector);
      }
      const index = +indexOrSelector;
      return index < extCollection.collection.length
        ? new extCollection.constructor(extCollection.collection[indexOrSelector])
        : extCollection;
    } else {
      return extCollection;
    }
  }
};

/**
 * return first [el] from the
 * collection of the ExtendedNodeList instance
 * (if it exists, otherwise undefined)
 * @type {{fn: first.fn}}
 */
const first = {
  fn: (extCollection, asExtCollection = false) => {
    if (extCollection.collection.length > 0) {
      return asExtCollection
        ? extCollection.single()
        : extCollection.collection[0];
    }
    return undefined;
  }
};

/**
 * return first [el] from the
 * collection of the ExtendedNodeList instance
 * (if it exists, otherwise undefined)
 * @type {{fn: first.fn}}
 */
const first$ = {
  fn: (extCollection, indexOrSelector) => extCollection.single(indexOrSelector)
};

/**
 * find stuff in a collection and return a NodeList
 * @type {{fn: (function(*, *=): *)}}
 */
const find = {
  fn: (extCollection, selector) => {
    const firstElem = extCollection.first();
    return firstElem && firstElem.querySelectorAll(selector) || [];
  }
};

/**
 * find stuff in a collection and return a new extCollection
 * @type {{fn: (function(*, *=): *)}}
 */
const find$ = {
  fn: (extCollection, selector) => {
    const firstElem = extCollection.first();
    return firstElem && selector && new extCollection.constructor(firstElem.querySelector(selector)) || null;
  }
};

/**
 * Return property/attribute [prop] of first element from collection
 * @param el
 * @param prop
 * @returns {*}
 */
const prop = {
  fn: (extCollection, property, value) => {
    const firstElem = extCollection.first();
    if (firstElem && property in firstElem) {
      if (value) {
        firstElem[property] = value;
      }
      return firstElem[property];
    }
    return null;
  },
};

/**
 * add handler for event [type] using a selector
 * for subelements or a callback [selectorOrCb].
 * With a css selector optionally include the element
 * the handler is defined for [includeParent]
 * Note: you can only add handlers using a css-selector
 *   e.g. $("#someElem").on("click", someHandlerFunction)
 *   => it does not matter if $("#someElem") exists
 * @type {{fn: (function(*=, *=, *=, *=, *=): *)}}
 */
const on = {
  fn: (extCollection, type, selectorOrCb, callback) => {
    const forThisSelector = selectorOrCb instanceof Function && extCollection.cssSelector ? true : false;
    callback = forThisSelector ? selectorOrCb : callback;
    selectorOrCb = forThisSelector ? extCollection.cssSelector : selectorOrCb;
    addHandler(extCollection, type, selectorOrCb, callback);
    return extCollection;
  }
};

/**
 * add delegated handler(s) for event [type]
 * using one or more [callbacks].
 * @type {{fn: (function(*=, *=, *=, *=, *=): *)}}
 */
const ON = {
  fn: (extCollection, type, ...callbacks) => {
    callbacks.forEach(cb => addHandler(extCollection, type, cb));
    return extCollection;
  }
};

/**
 * add delegated handlers for multiple event types
 * using one or more types and one or more callbacks.
 * * e.g. typesAndCallbacks => {click: [handler1, handler2], change: handlerx}
 * @type {{fn: (function(*=, *=, *=, *=, *=): *)}}
 */
const onAll = {
  fn: (extCollection, typesAndCallbacks) => {
    if (typesAndCallbacks) {
      Object.entries(typesAndCallbacks).forEach( ([key, handlers]) => {
        if (handlers.constructor === Array && handlers.length) {
          handlers.forEach( handler => handler instanceof Function && addHandler(extCollection, key, handler));
        } else if (handlers instanceof Function) {
          addHandler(extCollection, key, handlers);
        }
      });
    }
    return extCollection;
  }
};

/* endregion */

const extensions = {
  toggleClass, addClass, removeClass, attr, removeAttr,
  text, css, html, toggleAttr, toggleStyleFragments, find,
  find$, each, single, first, first$, on, ON, empty, remove,
  isEmpty, val, hasClass, is, swapClass, clear, append,
  replace, appendTo, insert, prop, onAll};

export { loop,  extensions, };