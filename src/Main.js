// see also
// https://codesandbox.io/s/domandjquerylikecombination
import { jql } from "./JQueryLike.js";
const { $, log, debugLog, setAllowance, getRestricted } = jql();

export const main = () => {
  debugLog(true);
  $(`<h2>Testing a DOM Helper (using proxy) and JQ-alike stuff</h2>`);

  const colors = {
    Red: "Green",
    Green: "Red"
  };
  const uselessTestHandler = evt => {
    const origin = evt.target;

    if (origin.dataset.colorshift) {
      $("[data-test]").attr({ style: `color:${origin.dataset.colorshift}` });
      origin.dataset.colorshift = colors[origin.dataset.colorshift];
    }
  };
  document.addEventListener("click", uselessTestHandler);

  /** add some elements to the body */
  $(`<div>Hi, I am test. Check the color button</div>`)
    .addClass("testxyz")
    .attr({ data: { test: "test!" } });

  $(`<div class="testxyz">Me too, but will not participate in colorization`);

  $(`<div>Also one for the color button!`)
    .addClass("testxyz")
    .attr({ data: { test: "test!", somethingElse: "not important" } });

  $(`[data-test]`).attr({ style: "color:green" });

  /** button */
  $(`<button data-colorshift= "Red"></button>`);

  /** '<script>' and 'onclick' will not be rendered after the following*/
  $(`<p data="notallowed!" 
        onclick="alert('hi, this will be removed!')"
        id="cleanupTesting">
        <span>Hi, I am an added paragraph from html string.</span>
        <!--there should not be a script tag after this -->
        <script>alert('HI?')></script>
        <span style="display:block">Html is cleaned: check log</span>
      </p>`).css({
    color: "red",
    backgroundColor: "#EEE",
    padding: "4px",
    marginTop: "1.5rem",
    maxWidth: "inherit",
    border: "1px solid #777"
  });

  log(`QED - the html is clean:\n${$("#cleanupTesting").html()}`);
  
  $(
    `<XStyle>&lt;XStyle> is not a valid tag but it will not throw</XStyle>`
  ).attr({ style: "color: orange" });

  /** this will throw but the error is caught (see console) */
  $(`XStyle&lt;XStyleWill throw&lt;/XStyle>/XStyle>`);

  /** disallow <pre> for added html */
  setAllowance("pre", false);

  /** <pre> will not be rendered */
  $(`<div id="nopre" style="margin-top:1rem">
    notAllowedTags now: <code>${getRestricted("pre").join(", ")}</code>, so
    no <code>&lt;pre></code> here<pre>will not be rendered</pre></div>`);
  log(`*test noPre, previous was rendered to: ${$("#nopre").html()}`);

  /** throws (no element after cleanup), but caught */
  $("<pre>This will not render and throw (silently)</pre>").addClass("booh");

  /** reallow <pre> */
  setAllowance("pre", true);
  $(
    `<div>
      <p>notAllowedTags reset: <code>${getRestricted("pre").join(", ")}</code>, so</p>
      <pre>Yes! &lt;pre&gt; is allowed again</pre>
     </div>`
  );

  /** what is not allowed (via notAllowedAttrs without attributes)? */
  log(`*Currently not allowed attributes: ${notAllowedAttrs()}`);
};
