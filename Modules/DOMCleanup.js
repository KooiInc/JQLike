// alllow or disallow unknown tags (default: false)
let lenient = false;
const allowUnknownHtmlTags = {
  on: () => lenient = true,
  off: () => lenient = false,
};

// initial set of tags and allowances
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
  hr: {elem: HTMLHRElement, allowed: true},
  head: {elem: HTMLHeadElement, allowed: false},
  output: {elem: 	HTMLOutputElement, allowed: true},
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
  details: {elem: HTMLDetailsElement, allowed: true},
  dialog: {elem: HTMLDialogElement, allowed: true},
  ul: {elem: HTMLUListElement, allowed: true},
  video: {elem: HTMLVideoElement, allowed: false},
  del: {elem: HTMLModElement, allowed: true},
  ins: {elem: HTMLModElement, allowed: true},
  slot: {elem: HTMLSlotElement, allowed: false},
  blockquote: {elem: HTMLQuoteElement, allowed: true},
  summary: {name: "summary", allowed: true},
  main: {name: "main", allowed: true},
  address: {name: "address", allowed: true},
  colgroup:  {name: "colgroup", allowed: true},
  tbody:  {name: "tbody", allowed: true},
  tfoot:  {name: "tfoot", allowed: true},
  th:  {name: "th", allowed: true},
  dd:  {name: "dd", allowed: true},
  dt:  {name: "dt", allowed: true},
  figcaption:  {name: "figcaption", allowed: true},
  figure:  {name: "figure", allowed: true},
  i:  {name: "i", allowed: true},
  b:  {name: "b", allowed: true},
  code: {name: "code", allowed: true},
  h1:  {name: "h1", allowed: true},
  h2: {name: "h2", allowed: true},
  h3: {name: "h3", allowed: true},
  h4: {name: "h4", allowed: true},
  abbr: {name: "abbr", allowed: true},
  bdo: {name: "bdo", allowed: true},
  dfn: {name: "dfn", allowed: true},
  em:  {name: "em", allowed: true},
  kbd:  {name: "kbd", allowed: true},
  mark:  {name: "mark", allowed: true},
  q:  {name: "1", allowed: true},
  rb:  {name: "rb", allowed: true},
  rp:  {name: "rp", allowed: true},
  rt:  {name: "rt", allowed: true},
  ruby:  {name: "ruby", allowed: true},
  s:  {name: "s", allowed: true},
  samp:  {name: "samp", allowed: true},
  small:  {name: "small", allowed: true},
  strong:  {name: "strong", allowed: true},
  sup:  {name: "sup", allowed: true},
  sub:  {name: "sub", allowed: true},
  u:  {name: "u", allowed: true},
  var:  {name: "var", allowed: true},
  wbr:  {name: "wbr", allowed: true},
  noscript:  {name: "noscript", allowed: true},
  isAllowed(elem) {
    const tagInSet = Object.values(this)
      .find(tag => tag.elem && elem instanceof tag.elem ||
        (elem.nodeName || "").toLowerCase() === tag.name);
    return (tagInSet && tagInSet.allowed) ||
       lenient && !tagInSet;
  }
};

// regex not allowed attributes
let notAllowedAttributes = /(^action|allow|contenteditable|data$)|(^on)|download/i;

// cleanup a given html element
const cleanupHtml = elem => {
  const template = document.createElement("template");
  template.innerHTML = `<div id="placeholder">${elem.outerHTML}</div>`;
  const el2Clean = template.content.querySelector("#placeholder");
  el2Clean.querySelectorAll("*").forEach(child => {
    if (child.nodeType !== 3) {
      [...child.attributes]
        .forEach(attr => {
          if (notAllowedAttributes.test(attr.name.trim())) {
            console.info(`DOM cleanup message: attribute [${attr.name}] removed`);
            child.removeAttribute(attr.name);
          }
        });
      const tagInSet = cleanupTagInfo.isAllowed(child);
      if (!tagInSet) {
        console.info(`DOM cleanup message: tag [${child.nodeName.toLowerCase()}] removed`);
        child.parentNode.removeChild(child);
      }
    }
  });
  return el2Clean.firstChild;
};

// get restricted tags
// optionally emphasize a tag in the reporting [emphasizeTag]
const emphasize = str => `***${str}***`;
const getRestricted = emphasizeTag =>
  Object.entries(cleanupTagInfo)
    .reduce((acc, [key, value]) =>
      !value.allowed &&
      [...acc, (emphasizeTag && key === emphasizeTag ? emphasize(key) : key)] ||
      acc
      , []);

// set [allowed] state (boolean) for [tagName] (string)
const setTagPermission = (tagName, allowed = false) => {
  if (cleanupTagInfo[tagName]) {
    cleanupTagInfo[tagName] = {
      ...cleanupTagInfo[tagName.toLowerCase()],
      allowed: allowed };
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

export { cleanupHtml, getRestricted, setTagPermission, getOrSetrestrictedAttributes, allowUnknownHtmlTags };
