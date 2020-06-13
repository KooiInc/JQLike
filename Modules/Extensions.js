// all extensions
import { cleanupHtml } from "./DOM.js";

// the allmighty iterator
// noinspection JSUnusedGlobalSymbols
const loop = (extCollection, callback) => {
  for (let i = 0; i < extCollection.collection.length; i += 1) {
    callback(extCollection.collection[i]);
  }
  return extCollection;
};

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
          .reduce((acc, el) => {
            if (append) {
              el.innerHTML += htmlValue;
            } else {
              el.innerHTML = htmlValue;
            }
            requestAnimationFrame( function() {
              el.parentNode && el.parentNode.replaceChild(cleanupHtml(el), el);
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
    each: {
      fn: loop
    },
    single: {
      fn: (extCollection, index = 0) => {
        if (extCollection.collection.length > 0 && index < extCollection.collection.length) {
          return new extCollection
            .constructor(extCollection.collection[index]);
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
  };

export {
  loop,
  extensions,
};
