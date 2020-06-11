// -------------------------------------------
// for production you'll probably only need $
// -------------------------------------------

import { $, log, debugLog, setTagPermission, getRestricted, allowUnknownHtmlTags } from "./JQueryLike.js";

export const main = () => {
  // to follow tag creation etc. use debugLog.on
  debugLog.off();

  console.clear();

  $( [
      `<h2>Testing a JQ-alike html helper library</h2>`,
      `<p>
          Some jQuery-stuff is too good to loose. So here's a jQuery lite attempt.
          <a href="https://github.com/KooiInc/JQLike/" target="_blank">Code on githbub</a>
        </p>`] );

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

 // allow this temporarily
  allowUnknownHtmlTags.on();
  $( `<XStyle>&lt;XStyle> is not a valid tag but it will render, 
    because <code>allowUnknownHtmlTags.on</code> was just called</XStyle>` )
    .attr({ style: "color: orange" });

  // now disallow again
  allowUnknownHtmlTags.off();
  $( `<SomethingUnknown>&lt;SomethingUnknow> is not a valid tag and it will not render</SomethingUnknown>` )
    .attr({ style: "color: orange" });

  /** this will throw but the error is caught (see console) */
  $(`XStyle&lt;XStyleWill throw&lt;/XStyle>/XStyle>`);

  /** disallow <pre> for added html */
  setTagPermission("pre", false);

  /** <pre> will not be rendered */
  $(`<div id="nopre" style="margin-top:1rem">
    notAllowedTags now: <code>${getRestricted("pre").join(", ")}</code>, so<br>
    no <code>&lt;pre></code> here<pre>will not be rendered</pre></div>`)
    .html(`<p>
      <i>TEST append html</i> (<code>html([...], true)</code>)
      (dependancy chain originates from JQueryLike)</p>`, true);

  /** throws (no element after cleanup), but caught */
  $("<pre>This will not render and throw (silently)</pre>").addClass("booh");

  /** reallow <pre> */
  setTagPermission("pre", true);
  $(
    `<div>
      notAllowedTags reset: <code>${getRestricted("pre").join(", ")}</code>, so
      <pre style="margin-top:0">This &lt;pre&gt; is allowed again</pre>
     </div>`
  );

  $(`<div>
      <code>
        $("&lt;div/&gt;").html("test html() extension function for a newly created element from html string")
      </code> result =&gt;
    </div>`)
  $(`<div/>`).html(`test html() extension function for a newly created element from html string`);

  $([`<p data-p></p>`, `<p data-p class="boeia"></p>`])
    .html("Test multiple elems (<code>$([...])</code>) <i>and</i> <code>html([...])</code> in one go", true)
    .single(1)
    .html(`
      <br>&nbsp;&nbsp;=> Test single([index]) extension for newly created elements (second should show this 
      text <i>and</i> all text should be green)`
      , true)
    .css({color: "green"});
};
