// some DOM plumbing
import {cleanupHtml, getRestricted, setTagPermission} from "./DOMCleanup.js";

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

// create DOM element from [htmlStr], within [root]
// The resulting element is always cleaned using the
// attrbutes/tags settings
const fromHtml = (htmlStr, root = document.body, position = adjacents.BeforeEnd) => {
  const nwElem = htmlToVirtualElement(htmlStr);

  if (!nwElem) {
    throw new RangeError(`"${htmlStr}" contains no valid element(s)`);
  }
  root.insertAdjacentElement(position, nwElem);
  return nwElem;
};

export {
  getRestricted,
  setTagPermission,
  fromHtml,
  cleanupHtml,
};
