// all extensions
export default {
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
      if (key.toLowerCase() === "data") {
        Object.entries(value).forEach(([key, value]) =>
          el.setAttribute(`data-${key}`, value)
        );
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
    Object.entries(css).forEach(([key, value]) => (el.style[key] = value)),
  appendText: (el, value) => (el.textContent += value),
  html: {
    fn: (extCollection, htmlValue) =>
      [...extCollection.collection]
        .reduce((acc, el) => {
          if (htmlValue) {
            el.innerHTML = htmlValue;
            el.parentNode.replaceChild(cleanupHtml(el), el);
          }
          return [...acc, el.innerHTML];
        }, [])
        .join(" ")
  },
  appendHtml: (el, value) => {
    if (value) {
      el.innerHTML += value;
      el.parentNode.replaceChild(cleanupHtml(el), el);
    }
  },
  toggleAttr: (el, name, value) =>
    el.hasAttribute(name)
      ? el.removeAttribute(name)
      : el.setAttribute(name, value),
  each: {
    fn: (collection, callback) => iterate(collection, callback)
  },
  single: {
    fn: extCollection => {
      if (extCollection.collection.length > 0) {
        const nwCollection = new this.constructor();
        nwCollection.collection = [extCollection.collection[0]];
        return nwCollection;
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
  }
};
