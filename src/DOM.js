import cleanupTagInfo from "./AllHtmlElements.js";
let notAllowedAttributes = /(^action|allow|contenteditable|data$)|(^on)|download/i;
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

export const DOM = {
  getRestricted: emphasizeTag => Object.entries(cleanupTagInfo)
    .reduce( (acc, val) =>
      !val[1].allowed && [...acc, (emphasizeTag && val[0] === emphasizeTag ? "***" : "") + val[0]] || acc, [] ),
  notAllowedAttributes,
  cleanupTagInfo,
  setAllowance: (tag, allowed = false) => {
    if (cleanupTagInfo[tag]) {
      cleanupTagInfo[tag] = { ...cleanupTagInfo[tag], allowed: allowed }
    }
  },
  notAllowedAttrs: attrsRegExp => {
    if (attrsRegExp && attrsRegExp instanceof RegExp) {
      notAllowedAttributes = attrsRegExp;
    }
    return notAllowedAttributes;
  },
  fromHtml: (htmlStr, node = document.body) => {
    const nwElem = htmlToVirtualElement(htmlStr);
    if (!nwElem) {
      throw new RangeError(`${htmlStr} contains no valid elements`);
    }
    node.appendChild(nwElem);
    return nwElem;
  }
};
