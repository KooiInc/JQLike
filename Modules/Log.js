import { createElementFromHtmlString } from "./DOM.js";

let useLogging = false;
const debugLog = { on: () => useLogging = true, off: () => useLogging = false, };
const log = txt => {
  if (!useLogging) { return; }
  if (!document.querySelector("#jql_logger")) {
    const logBlock = createElementFromHtmlString(`<pre id="jql_logger"></pre>`, document.body);
    Object.entries( {
         maxHeight: "200px",
         overflow: "auto",
         position: "fixed",
         bottom: "0.5rem",
         left: "1rem",
         right: "1rem",
         padding: "0.5rem 1rem",
         maxWidth: "inherit",
         border: "1px dotted #777",
      } ).forEach( ([key, value]) => logBlock.style[key] = value);
    document.body.appendChild(logBlock);
  }
  document.querySelector("#jql_logger").textContent += `.${txt}\n`;
};
const logStatus = () => useLogging;

export {log, debugLog, logStatus};
