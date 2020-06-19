// all extensions
import { cleanupHtml, element2DOM, insertPositions } from "./DOM.js";

// the allmighty iterator
// noinspection JSUnusedGlobalSymbols
const loop = (extCollection, callback) => {
  for (let i = 0; i < extCollection.collection.length; i += 1) {
    callback(extCollection.collection[i]);
  }
  return extCollection;
};

// style color toggling helpers
const hex2Full = hex => {
  hex = (hex.trim().startsWith("#") ? hex.slice(1) : hex).trim();
  return hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
};
const hex2RGBA = (hex, opacity = 100) => {
  hex = hex2Full(hex.slice(1));
  const op = opacity % 100 !== 0;
  return `rgb${op ? "a" : ""}(${
    parseInt(hex.slice(0, 2), 16)}, ${
    parseInt(hex.slice(2, 4), 16)}, ${
    parseInt(hex.slice(-2), 16)}${op ? `, ${opacity/100}` : ""})`;
};

const { addHandler } = (() => {
  // all handlers use event delegation.
  // For every eventType there will be exactly one
  // handler.
  // The handler iterates over the handler functions
  // created with the factory [handlerFn].
  let handlers = {};
  const metaHandler = evt => {
    const handlersForType = handlers[evt.type];
    for (let i = 0; i < handlersForType.length; i += 1) {
      if (handlersForType[i](evt)) {
        break;
      }
    }
  };
  const getTarget = (selectr, extCollection, origin, includeParent) => {
    return (selectr instanceof Function)
    ? extCollection.collection.find(el => el.isSameNode(origin))
    : extCollection.collection
        .find(elem =>
          (includeParent && elem.isSameNode(origin) ||
            [...elem.querySelectorAll(selectr)]
              .find(el => el.isSameNode(origin))));
  };
  const handlerFn = (extCollection, selectr, callback, includeParent) => {
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

  return {
    addHandler: (extCollection, type, selectorOrCb, callback, includeParent) => {
      if (!Object.keys(handlers).find(t => t === type)) {
        document.addEventListener(type, metaHandler);
      }
      const fn = handlerFn(extCollection, selectorOrCb, callback, includeParent);
      handlers = handlers[type]
        ? { ...handlers, [type]: [...handlers[type], fn] }
        : { ...handlers, [type]: [fn] };
    }
  };
})();


// noinspection JSUnusedGlobalSymbols
const extensions = {
    toggleClass: (el, className) => el.classList.toggle(className),
    addClass: (el, classNames) =>
      (Array.isArray(classNames) ? classNames : [classNames]).forEach(cn =>
        el.classList.add(cn)
      ),
    removeClass: (el, classNames) =>
      (Array.isArray(classNames) ? classNames : [classNames]).forEach(cn =>
        el.classList.remove(cn)
      ),
    attr: (el, keyValuePairs) =>
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const isData = key.toLowerCase() === "data";
        const isStyle = key.toLowerCase() === "style";
        if ((isData || isStyle) && value instanceof Object) {
          Object.entries(value).forEach(([key, value]) => {
              if (isStyle) {
                el.style[key] = value;
              } else {
                el.setAttribute(`data-${key}`, value)
              }
            } );
        } else {
          el.setAttribute(key, value);
        }
      }),
    text: {
      fn: (extCollection, textValue) =>
        [...extCollection.collection]
          .reduce((acc, el) => {
            if (textValue) {
              el.textContent = textValue;
            }
            return [...acc, el.innerText];
          }, [])
          .join(" ")
    },
    css: (el, css) =>
      Object.entries(css).forEach( ([key, value]) => el.style[key] = value ),
    appendText: (el, value) => el.textContent += value,
    html: {
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
    },
    toggleAttr: (el, name, value) =>
      el.hasAttribute(name)
        ? el.removeAttribute(name)
        : el.setAttribute(name, value),
    toggleStyleFragments: (el, styleValues) =>
      // Note: this may fail, because browsers may reformat
      // style values in their own way. See the color stuf
      // for example. Use rgba if you want to toggle opacity
      // for a color too
      Object.entries(styleValues).forEach( ([key, value]) => {
          if (value instanceof Function) {
            value = value(el);
          }

          if (/color/i.test(key)) {
            value = value.startsWith(`#`)
              ? hex2RGBA(value)
              : value.replace(/(,|,\s{2,})(\w)/g, (...args) => `, ${args[2]}`);
          }

          el.style[key] = `${el.style[key]}` === `${value}` ? "" : value;
        }),
    each: {
      fn: loop
    },
    single: {
      fn: (extCollection, index = 0) => {
        if (extCollection.collection.length > 0 && index < extCollection.collection.length) {
          return new extCollection.constructor(extCollection.collection[index]);
        } else {
          return extCollection;
        }
      }
    },
    first: {
      fn: extCollection => {
        if (extCollection.collection.length > 0) {
          return extCollection.collection[0];
        }
        return undefined;
      }
    },
    // handlers always use event delegation
    on: {
      fn: (extCollection, type, selectorOrCb, callback, includeParent = false) => {
        addHandler(extCollection, type, selectorOrCb, callback, includeParent);
        return extCollection;
      }
    },
  };

export {
  loop,
  extensions,
};
