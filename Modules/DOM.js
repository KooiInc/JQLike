// some DOM plumbing
import {cleanupHtml, getRestricted, setTagPermission, allowUnknownHtmlTags} from "./DOMCleanup.js";

// insert Element position helper
const adjacents = {
  BeforeBegin: "beforebegin", // before element
  AfterBegin: "afterbegin",   // before first child
  BeforeEnd: "beforeend",     // after last child
  AfterEnd: "afterend" };     // after element

// create DOM object from html string
const htmlToVirtualElement = htmlString => {
  const placeholder = document.createElement("div");
  placeholder.innerHTML = htmlString;
  return placeholder.children.length
    ? cleanupHtml(placeholder.firstChild)
    : undefined;
};

// add Element to [root] on position [position]
const element2DOM = (elem, root = document.body, position = adjacents.BeforeEnd) => {
  root.insertAdjacentElement(position, elem);
}

// create DOM element from [htmlStr
// The resulting element is always cleaned using the
// attrbutes/tags settings. Use element2DOM to
// insert/append etc. it into your DOM
const createElementFromHtmlString = htmlStr => {
  let nwElem = htmlToVirtualElement(htmlStr);

  if (!nwElem) {
    const report = `${htmlStr.slice(0, htmlStr.indexOf(">") + 1)}...${
      htmlStr.slice(htmlStr.lastIndexOf("<"))}`;
    console.log(`DOM message: no valid element(s) in [${report}]`);
    // create an empty element with data attribute
    nwElem = document.createElement("div");
    nwElem.dataset.invalidElement = `${report}`;
  }
  return nwElem;
};

export {
  getRestricted,
  setTagPermission,
  createElementFromHtmlString,
  element2DOM,
  cleanupHtml,
  allowUnknownHtmlTags,
  adjacents as insertPositions,
};
