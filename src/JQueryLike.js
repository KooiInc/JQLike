// some DOM plumbing
import cleanupTagInfo from "./AllHtmlElements.js";
import extensions from "./Extensions.js";

const getRestricted = emphasizeTag => Object.entries(cleanupTagInfo)
  .reduce( (acc, val) =>
    !val[1].allowed && [...acc, (emphasizeTag && val[0] === emphasizeTag ? "***" : "") + val[0]] || acc, [] )
let notAllowedAttributes = /(^action|allow|contenteditable|data$)|(^on)|download/i;
const setAllowance = (tag, allowed = false) => {
  if (cleanupTagInfo[tag]) {
    cleanupTagInfo[tag] = { ...cleanupTagInfo[tag], allowed: allowed }
  }
};
let useLogging = false;
const cleanupHtml = elem => {
  const template = document.createElement("template");
  template.innerHTML = `<div id="placeholder">${elem.outerHTML}</div>`;
  const el2Clean = template.content.querySelector("#placeholder");
  el2Clean.querySelectorAll("*").forEach(child => {
    if (child.nodeType !== 3) {
      [...child.attributes]
        .forEach(attr => {
          if (notAllowedAttributes.test(attr.name.trim())) {
            child.removeAttribute(attr.name);
          }
        });
      if ( Object.values(cleanupTagInfo)
            .find(c => c.allowed === false && child instanceof c.elem) ) {
        child.parentNode.removeChild(child);
      }
    }
  });
  return el2Clean.firstChild;
};
const htmlToVirtualElement = html => {
  const placeholder = document.createElement("div");
  placeholder.innerHTML = html;
  return placeholder.children.length
    ? cleanupHtml(placeholder.firstChild)
    : undefined;
};
const fromHtml = (htmlStr, node = document.body) => {
  const nwElem = htmlToVirtualElement(htmlStr);
  if (!nwElem) {
    throw new RangeError(`${htmlStr} contains no valid elements`);
  }
  node.appendChild(nwElem);
  return nwElem;
};
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
    log: log,
    debugLog: logVal => (useLogging = logVal),
    notAllowedAttrs: attrsRegExp => {
      if (attrsRegExp && attrsRegExp instanceof RegExp) {
        notAllowedAttributes = attrsRegExp;
      }
      return notAllowedAttributes;
    },
    getRestricted,
    setAllowance,
  };
};
