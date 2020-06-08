// some DOM plumbing
import cleanupTagInfo from "./AllHtmlElements.js";

let notAllowedAttributes = /(^action|allow|contenteditable|data$)|(^on)|download/i;
const emphasize = str => `***${str}***`;

// clean html based from disallowed tags and/or attributes
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
        .find(c => !c.allowed && child instanceof c.elem) ) {
        child.parentNode.removeChild(child);
      }
    }
  });
  return el2Clean.firstChild;
};

// create DOM object from html string
const htmlToVirtualElement = htmlString => {
  const placeholder = document.createElement("div");
  placeholder.innerHTML = htmlString;
  return placeholder.children.length
    ? cleanupHtml(placeholder.firstChild)
    : undefined;
};

// retrieve currently disallowed html tags
// optionally emphasize a tag in the reporting [emphasizeTag]
const getRestricted = emphasizeTag =>
  Object.entries(cleanupTagInfo)
    .reduce( ( acc, [key, value] ) =>
      !value.allowed &&
        [...acc, (emphasizeTag && key === emphasizeTag ? emphasize(key) : key)] ||
        acc
      , [] );

// set [allowed] state (boolean) for [tag] (string)
const setTagPermission = (tagName, allowed = false) => {
  if (cleanupTagInfo[tagName]) {
    cleanupTagInfo[tagName] = { ...cleanupTagInfo[tagName], allowed: allowed }
  }
};

// get or set currently disallowed attributes regular expression
const notAllowedAttrs = attrsRegExp => {
  if (attrsRegExp && attrsRegExp instanceof RegExp) {
    notAllowedAttributes = attrsRegExp;
  }
  return notAllowedAttributes;
};

// create DOM element from [htmlStr], within [root]
// The resulting element is always cleaned using the
// attrbutes/tags settings
const fromHtml = (htmlStr, root = document.body) => {
  const nwElem = htmlToVirtualElement(htmlStr);

  if (!nwElem) {
    throw new RangeError(`"${htmlStr}" contains no valid element(s)`);
  }
  root.appendChild(nwElem);
  return nwElem;
};

export {
  getRestricted,
  cleanupTagInfo,
  setTagPermission,
  notAllowedAttrs,
  fromHtml,
  cleanupHtml,
};
