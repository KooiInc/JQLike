import {importAsync} from "https://cdn.jsdelivr.net/gh/KooiInc/DOM-Utilities@v1.1.2/SmallHelpers.js";

const importJQModuleURL = "https://cdn.jsdelivr.net/gh/KooiInc/DOM-Utilities@v1.1.2/JQueryLike.js";
const version = /@/.test(importJQModuleURL) && importJQModuleURL.split("@")[1].split("/")[0] || "master";

export const MAIN = () => importAsync(importJQModuleURL, module => RUN(module, version));

/** the actual code here */
function RUN(module, version) {
  const {$, util} = module;
  
  const { setTagPermission, getRestricted, allowUnknownHtmlTags, insertPositions, closestSibling, debugLog } = util;

  /** to follow tag creation etc. use debugLog.on */
  debugLog.off();
  
  console.clear();
  
  /** create the html for this page */
  $([
    `<h2>Testing a JQ-alike html helper library (version: <span style="color:red">${version}</span>)</h2>`,
    `<p data-starttext>
      Some jQuery-stuff is too good to loose. So here's a jQuery lite attempt.
      <a href="https://github.com/KooiInc/DOM-Utilities" target="_blank">Code on githbub</a>
    </p>`]);

  /** button handler */
  const uselessTestHandler = evt => {
    if (evt.target.nodeName === "BUTTON") {
      $("[data-colorchange]").toggleStyleFragments({
        color: el => el.dataset.colorchange || "#6666ff",
        backgroundColor: "rgba(255,255,0,0.25)",
        fontWeight: "700"
      });
    }
  };

  /** add some elements to the body */
  $(`<div>Hi, I am test. Check the color button</div>`)
    .addClass("testxyz")
    .attr({ data: { test: "test!", colorchange: "blue" } });

  $(`<div class="testxyz">Me too, but will not participate in colorization</div>`)

  $(`<div>Also one for the color button!</div>`)
    .addClass("testxyz")
    .attr({ data: { test: "test!", somethingElse: "not important", colorchange: "magenta" } });

  /** create a button */
  $(`<div><button>toggleStyleFragments for *[data-colorchange]</button></div>`)
    .on("click", "button", uselessTestHandler, true);

  /** create a handler for the image */  
  const imgChange = evt => {
    const img = closestSibling(evt.target, "img");
    img.src = "";
    img.src = `https://picsum.photos/400/200?${Math.random() * 10}`;
  };

  /** create a (clickable) image */
  $(`<div>
   <img class="randomImg" src="https://picsum.photos/400/200" alt="a random image"/>
   <div class="caption">Just click if you don't like the image</div>
 </div>`)
    .css({ display: "inline-block", margin: "0.5rem 0", cursor: "pointer", clear: "both" })
    .on("click", ".caption, img", imgChange);

  /** 
   * '<script>' and 'onclick' will not be rendered after the following
   *  for all <span> whithin the element a click handler
   */
  $(`<p data="notallowed!" 
    onclick="alert('hi, this will be removed!')"
    id="cleanupTesting">
    <span>Hi, I am an added paragraph from html string.</span>
    <!--there should not be a script tag after this -->
    <script>alert('HI?')></script>
    <span style="display:block" data-colorchange>Html is cleaned: check log</span>
    <label style="display:block">
        <span>(span nested within label) A click handler is defined for all &lt;span&gt; within this paragraph</span>
    </label>
    </span>
  </p>`)
    .css({
      color: "red",
      backgroundColor: "#EEE",
      padding: "4px",
      marginTop: "1rem",
      maxWidth: "inherit",
      border: "1px solid #777",
      cursor: "pointer"
    })
    .on("click", "span", evt => {
      const target = evt.target;
      target.querySelector("b") && target.removeChild(target.querySelector("b"));
      const prevTxt = target.innerHTML;
      target.innerHTML += `<b style="color:green"> Hi, you clicked!</b>`;
      setTimeout(() => target.innerHTML = prevTxt, 2000);
    });

  /* allow unknown tags this temporarily */
  allowUnknownHtmlTags.on();
  $(`<XStyle>&lt;XStyle> is not a valid tag but it will render, 
because <code>allowUnknownHtmlTags.on</code> was just called.
It is inserted @ after the header subtext
</XStyle>`, document.querySelector("[data-starttext]"), insertPositions.AfterEnd)
    .attr({ style: { color: "orange" } });

  /** now disallow again  */
  allowUnknownHtmlTags.off();
  
  /** <SomethingUnknown> will not render. A html comment is shown within the html tree */
  $([`<SomethingUnknown>NO SIR</SomethingUnknown>`,
    `<div>&lt;SomethingUnknow> not rendered because <code>allowUnknownHtmlTags.off</code> was called: 
    see comment in html. This element is inserted afther the previous &lt;xstyle&gt; element</div>` ], 
      document.querySelector("xstyle"))
    .css({ color: "orange", fontWeight: "bold", marginTop: "0.7rem" });

  /** this will throw but the error is caught (see console) */
  $("XStyle\\&lt\\;XStyleWill throw\\&lt\\;\\/XStyle>\\/XStyle>");

  /** disallow <pre> for added html */
  setTagPermission("pre", false);

  /** nested <pre> will just not be rendered */
  $(`<div id="nopre" style="margin-top:1rem">
      notAllowedTags now: <code>${getRestricted("pre").filter(v => v !== "isAllowed").join(", ")}</code><br>
      so no <code>&lt;pre></code> here
      <pre>will not be rendered</pre>
    </div>`)
    .html(`<p>
      <i>TEST append html</i> (<code>html([...], true)</code>)
      (dependancy chain originates from JQueryLike)</p>`, true)
    .css( { 
      border: "1px solid #999",
      padding: "5px",
      marginBottom: "0.8rem", } );

  /** shows comment in html or not rendered element (not an allowed tag)*/
  $("<pre>This is not rendered</pre>").addClass("booh");

  /** reallow <pre> */
  setTagPermission("pre", true);
  $(
    `<div data-colorchange="#cc3300">
      <h4 style="margin-top: 0">(this div contains a handler)</h4>
      notAllowedTags reset: <span class="code">${getRestricted("pre").join(", ")}</span>, so
      <pre style="margin-top:0.5rem;margin-bottom:0">This &lt;pre&gt; is allowed again</pre>
    </div>` )
    .on("click", () => alert("hi there! Handled?"))
    .css({ 
      cursor: "pointer",
      border: "1px solid #999",
      padding: "5px",
      marginBottom: "0.8rem", });

  $(`<div>
      <b>statement =></b> <code style="white-space:pre-wrap">
  $("&lt;div/>")
    .on("click", "b:nth-of-type(2)", (evt, elem) => elem.toggleStyleFragments({ color: "red" })
    .html("&lt;b>result =&gt;&lt;/b> test &lt;code>html()&lt;/code> / chaining (&lt;b>click me&lt;/b>)")
    .find$("b:nth-of-type(2)").css({ cursor: "pointer" })
        </code>
     </div>`);

  $(`<div id="tssk"/>`)
    .on("click", "b:nth-of-type(2)", (evt, elem) => elem.toggleStyleFragments({ color: "red" }))
    .html(`<b>result =&gt;</b> test <code>.html()</code> / chaining (<b>click me</b>)`)
    .find$("b:nth-of-type(2)").css({ cursor: "pointer" });

  $([`<p data-p></p>`, `<p data-p class="boeia"></p>`])
    .html("Test multiple elems (<code>$([...])</code>) <i>and</i> <code>html([...])</code> in one go", true)
    .single(1)
    .html(`&nbsp;&nbsp;=> Test single([index]) extension for newly created elements (second should show this 
        text <i>and</i> all text should be green)`, true)
    .css({ color: "green" });
}

/** uncomment for testing with local cdn (and uncomment other import statements above)
 *  import {$, util} from "http://cdn.nicon.nl/modules/JQueryLike.js";
 *  RUN({$, util}, "DEBUG");
 */ 