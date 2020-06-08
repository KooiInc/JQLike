import { fromHtml } from "./DOM.js";

let useLogging = false;
const debugLog = { get on() { useLogging = true; }, get off() { useLogging = false; } };
const log = txt => {
  if (!document.querySelector("#jql_logger")) {
    const logBlock = fromHtml(`<pre id="jql_logger"></pre>`, document.body);

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
  }
  document.querySelector("#jql_logger").textContent += `.${txt}\n`;
};
const logStatus = () => useLogging;

export {log, debugLog, logStatus};
