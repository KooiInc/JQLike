const cleanupTagInfo = {
  a: {elem: HTMLAnchorElement, allowed: true},
  area: {elem: HTMLAreaElement, allowed: false},
  audio: {elem: HTMLAudioElement, allowed: false},
  br: {elem: HTMLBRElement, allowed: true},
  base: {elem: HTMLBaseElement, allowed: false},
  body: {elem: HTMLBodyElement, allowed: false},
  button: {elem: HTMLButtonElement, allowed: true},
  canvas: {elem: HTMLCanvasElement, allowed: false},
  dl: {elem: HTMLDListElement, allowed: true},
  data: {elem: HTMLDataElement, allowed: false},
  datalist: {elem: HTMLDataListElement, allowed: true},
  div: {elem: HTMLDivElement, allowed: true},
  embed: {elem: HTMLEmbedElement, allowed: false},
  fieldset: {elem: HTMLFieldSetElement, allowed: true},
  form: {elem: HTMLFormElement, allowed: false},
  frameset: {elem: HTMLFrameSetElement, allowed: false},
  hr: {elem: HTMLHRElement, allowed: true},
  head: {elem: HTMLHeadElement, allowed: false},
  iframe: {elem: HTMLIFrameElement, allowed: false},
  img: {elem: HTMLImageElement, allowed: true},
  input: {elem: HTMLInputElement, allowed: true},
  li: {elem: HTMLLIElement, allowed: true},
  label: {elem: HTMLLabelElement, allowed: true},
  legend: {elem: HTMLLegendElement, allowed: true},
  link: {elem: HTMLLinkElement, allowed: false},
  map: {elem: HTMLMapElement, allowed: false},
  media: {elem: HTMLMediaElement, allowed: false},
  meta: {elem: HTMLMetaElement, allowed: false},
  meter: {elem: HTMLMeterElement, allowed: true},
  ol: {elem: HTMLOListElement, allowed: true},
  object: {elem: HTMLObjectElement, allowed: false},
  optgroup: {elem: HTMLOptGroupElement, allowed: true},
  option: {elem: HTMLOptionElement, allowed: true},
  p: {elem: HTMLParagraphElement, allowed: true},
  param: {elem: HTMLParamElement, allowed: true},
  picture: {elem: HTMLPictureElement, allowed: true},
  pre: {elem: HTMLPreElement, allowed: true},
  progress: {elem: HTMLProgressElement, allowed: false},
  quote: {elem: HTMLQuoteElement, allowed: true},
  script: {elem: HTMLScriptElement, allowed: false},
  select: {elem: HTMLSelectElement, allowed: true},
  source: {elem: HTMLSourceElement, allowed: false},
  span: {elem: HTMLSpanElement, allowed: true},
  style: {elem: HTMLStyleElement, allowed: true},
  caption: {elem: HTMLTableCaptionElement, allowed: true},
  td: {elem: HTMLTableCellElement, allowed: true},
  col: {elem: HTMLTableColElement, allowed: true},
  table: {elem: HTMLTableElement, allowed: true},
  tr: {elem: HTMLTableRowElement, allowed: true},
  template: {elem: HTMLTemplateElement, allowed: false},
  textarea: {elem: HTMLTextAreaElement, allowed: true},
  time: {elem: HTMLTimeElement, allowed: true},
  title: {elem: HTMLTitleElement, allowed: true},
  track: {elem: HTMLTrackElement, allowed: true},
  ul: {elem: HTMLUListElement, allowed: true},
  video: {elem: HTMLVideoElement, allowed: false}
};

if (window["HTMLContentElement"]) {
  cleanupTagInfo.content = {elem: window["HTMLContentElement"], allowed: false};
}

const emphasize = str => `***${str}***`;

const cleanupHtml = elem => {
  const template = document.createElement("template");
  template.innerHTML = `<div id="placeholder">${elem.outerHTML}</div>`;
  const el2Clean = template.content.querySelector("#placeholder");
  el2Clean.querySelectorAll("*").forEach(child => {
    if (child.nodeType !== 3) {
      [...child.attributes]
        .forEach(attr => {
          if (notAllowedAttributes.test(attr.name.trim())) {
            console.info(`HTML cleanup: attribute [${attr.name}] not allowed: removed`);
            child.removeAttribute(attr.name);
          }
        });
      const tagNotAllowed = Object.values(cleanupTagInfo)
        .find( value => !value.allowed && child instanceof value.elem);
      if (tagNotAllowed) {
        console.info(`HTML cleanup: tag [${tagNotAllowed.elem.name}] not allowed: removed`);
        child.parentNode.removeChild(child);
      }
    }
  });
  return el2Clean.firstChild;
};

let notAllowedAttributes = /(^action|allow|contenteditable|data$)|(^on)|download/i;

// optionally emphasize a tag in the reporting [emphasizeTag]
const getRestricted = emphasizeTag =>
  Object.entries(cleanupTagInfo)
    .reduce((acc, [key, value]) =>
      !value.allowed &&
      [...acc, (emphasizeTag && key === emphasizeTag ? emphasize(key) : key)] ||
      acc
      , []);

// set [allowed] state (boolean) for [tag] (string)
const setTagPermission = (tagName, allowed = false) => {
  if (cleanupTagInfo[tagName]) {
    cleanupTagInfo[tagName] = {...cleanupTagInfo[tagName], allowed: allowed};
  }
};

// get or set currently disallowed attributes regular expression
// noinspection JSUnusedGlobalSymbols
const getOrSetrestrictedAttributes = attrsRegExp => {
  if (attrsRegExp && attrsRegExp instanceof RegExp) {
    notAllowedAttributes = attrsRegExp;
  }
  return notAllowedAttributes;
};

export {cleanupHtml, getRestricted, setTagPermission, getOrSetrestrictedAttributes};
