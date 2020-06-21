import {cleanupHtml} from "./DOM.js";

/**
 * Private: iterator used for most
 * extensions.
 * @param extCollection
 * @param callback
 * @returns ExtCollection instance
 */
const loop = (extCollection, callback) => {
  for (let i = 0; i < extCollection.collection.length; i += 1) {
    callback(extCollection.collection[i]);
  }
  return extCollection;
};

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
   * get the target from the collection
   * that is associated with the handler
   * (via handlerFnFactor)
   * @param selectr
   * @param extCollection
   * @param origin
   * @param includeParent
   * @returns Element
   */
  const getTarget = (selectr, extCollection, origin, includeParent) => {
    return (selectr instanceof Function)
    ? extCollection.collection.find(el => el.isSameNode(origin))
    : extCollection.collection
        .find(elem =>
          (includeParent && elem.isSameNode(origin) ||
            [...elem.querySelectorAll(selectr)]
              .find(el => el.isSameNode(origin))));
  };

  /**
   * wraps a handler (from .on) and returns
   * a new handler function
   * @param extCollection
   * @param selectr
   * @param callback
   * @param includeParent
   * @returns {function(...[*]=)}
   */
  const handlerFnFactory = (extCollection, selectr, callback, includeParent) => {
    return evt => {
      const target = getTarget(selectr, extCollection, evt.target, includeParent);
      if (target) {
        selectr instanceof Function
          ? selectr(evt, extCollection)
          : callback(evt, extCollection);
        return true;
      }
      return false;
    }
  };

  return (extCollection, type, selectorOrCb, callback, includeParent) => {
    if (!Object.keys(handlers).find(t => t === type)) {
      document.addEventListener(type, metaHandler);
    }
    const fn = handlerFnFactory(extCollection, selectorOrCb, callback, includeParent);
    handlers = handlers[type]
      ? {...handlers, [type]: [...handlers[type], fn]}
      : {...handlers, [type]: [fn]};
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
 * remove [classNames] from [el]. Classnames may be single string
 * or array
 * @param el
 * @param classNames
 * @returns {*}
 */
const removeClass = (el, classNames) =>
  (Array.isArray(classNames) ? classNames : [classNames]).forEach(cn =>
    el.classList.remove(cn)
  );

/**
 * add [classNames] to [el]. Classnames may be single string
 * or array
 * @param el
 * @param classNames
 * @returns {*}
 */
const addClass = (el, classNames) =>
  (Array.isArray(classNames) ? classNames : [classNames]).forEach(cn =>
    el.classList.add(cn)
  );

/**
 * style [el]. css  must be key-value pairs
 * @param el
 * @param keyValuePairs
 */
const css = (el, keyValuePairs) =>
  Object.entries(keyValuePairs).forEach( ([key, value]) => el.style[key] = value );

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
 * Set attributes for element [el].
 * attributes must be key-value pairs
 * style and data-attributes must also be key-value pairs
 * @param el
 * @param keyValuePairs
 */
const attr = (el, keyValuePairs) =>
  Object.entries(keyValuePairs).forEach(([key, value]) => {
    if (key.toLowerCase() === "style") {
      css(el, value);
    } else if (key.toLowerCase() === "data") {
      data(el, value);
    } else if (value instanceof Object) {
      Object.entries(value).forEach(([key, value]) => el.style[key] = value );
    } else {
      el.setAttribute(key, value);
    }
  });

/**
 * set textValue for each element in the
 * collection of [extCollection] and return
 * a string from the joined array of text
 * values from all elements in the collection
 * overwrites current textContent of [el]
 * @type {{fn: (function(*, *=): string)}}
 */
const text = {
  fn: (extCollection, textValue) =>
    [...extCollection.collection]
      .reduce((acc, el) => {
        if (textValue) {
          el.textContent = textValue;
        }
        return [...acc, el.innerText];
      }, [])
      .join(" ")
};

// noinspection JSUnusedLocalSymbols
/**
 * add [value] to the textConten of [el]
 * @param el
 * @param value
 * @returns {*}
 */
const appendText = (el, value) => el.textContent += value;

/**
 * set innerHtml for [el]
 * the innerHTML is sanitized (see DOMCleanup)
 * @type {{fn: html.fn}}
 */
const html = {
  fn: (extCollection, htmlValue, append) => {
    if (!htmlValue) {
      return [...extCollection.collection]
        .reduce((acc, el) => [...acc, el.innerHTML], []).join(" # ");
    }
    extCollection.collection = [...extCollection.collection]
      .reduce((acc, el, i) => {
        let elNw = el.cloneNode(true);
        if (append) {
          elNw.innerHTML += htmlValue;
        } else {
          elNw.innerHTML = htmlValue;
        }
        elNw = cleanupHtml(elNw);
        requestAnimationFrame( function() {
          if (el.parentNode) {
            el.parentNode.replaceChild(elNw, el);
            // MUST be replaced (for event handling)
            extCollection.collection[i] = elNw;
          }
        } );
        return [...acc, el];
      }, []);
    return extCollection;
  }
};

/**
 * toggle attribute [name] with [value] for [el]
 * @param el
 * @param name
 * @param value
 */
const toggleAttr = (el, name, value) =>
  el.hasAttribute(name)
    ? el.removeAttribute(name)
    : el.setAttribute(name, value);

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
 * return [el] with index [index] from the
 * collection of the ExtendedNodeList instance
 * (if it exists, otherwise the collection)
 * @type {{fn: single.fn}}
 */
const single = {
  fn: (extCollection, index = 0) => {
    if (extCollection.collection.length > 0 && index < extCollection.collection.length) {
      return new extCollection.constructor(extCollection.collection[index]);
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
  fn: extCollection => {
    if (extCollection.collection.length > 0) {
      return extCollection.collection[0];
    }
    return undefined;
  }
};

/**
 * add handler for event [type] using a selector
 * for subelements or a callback [selectorOrCb].
 * With a css selector optionally include the element
 * the handler is defined for [includeParent]
 * @type {{fn: (function(*=, *=, *=, *=, *=): *)}}
 */
const on = {
  fn: (extCollection, type, selectorOrCb, callback, includeParent = false) => {
    addHandler(extCollection, type, selectorOrCb, callback, includeParent);
    return extCollection;
  }
};
/* endregion */

const extensions = {
  toggleClass, addClass, removeClass, attr,
  text, css, html, toggleAttr, toggleStyleFragments,
  each, single, first, on, };

export { loop,  extensions, };
