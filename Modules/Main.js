import { debugLog, log } from "./Log.js";
import $ from "./JQueryLike.js";
import { setTagPermission, getRestricted, allowUnknownHtmlTags, } from "./DOMCleanup.js";
import { insertPositions, closestSibling } from "./DOM.js" ;

export const main = () => {
  // to follow tag creation etc. use debugLog.on
  debugLog.off();
  console.clear();

  $( [
      `<h2>Testing a JQ-alike html helper library</h2>`,
      `<p data-starttext>
          Some jQuery-stuff is too good to loose. So here's a jQuery lite attempt.
          <a href="https://github.com/KooiInc/JQLike/" target="_blank">Code on githbub</a>
        </p>`] );

  const uselessTestHandler = evt => {
    const origin = evt.target;

    if (origin.nodeName === "BUTTON") {
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

  $(`<div class="testxyz">Me too, but will not participate in colorization`)

  $(`<div>Also one for the color button!`)
    .addClass("testxyz")
    .attr({ data: { test: "test!", somethingElse: "not important", colorchange: "magenta" } });

  /** button */
  $(`<div><button>toggleStyleFragments for *[data-colorchange]</button></div>`)
      .on("click", "button", uselessTestHandler, true);

  const imgChange = evt => {
    const img = closestSibling(evt.target, "img");
    img.src = "";
    img.src = `https://picsum.photos/400/200?${Math.random()*10}`;
    console.log(`why is this spontanuously changing? ${new Date().toLocaleTimeString()} ${img.src}`);
  };

  $(`<div>
       <img class="randomImg" src="https://picsum.photos/400/200"></img>
       <div class="caption">Just click if you don't like the image</div>
     </div>`)
    .css({display: "inline-block", margin: "0.5rem 0", cursor: "pointer", clear: "both"})
    .on("click", ".caption, img", imgChange);

  /** '<script>' and 'onclick' will not be rendered after the following*/
  $(`<p data="notallowed!" 
        onclick="alert('hi, this will be removed!')"
        id="cleanupTesting">
        <span>Hi, I am an added paragraph from html string.</span>
        <!--there should not be a script tag after this -->
        <script>alert('HI?')></script>
        <span style="display:block" data-colorchange>Html is cleaned: check log
          <br><span>(Nested) A click handler is defined for all &lt;span&gt;
           within this paragraph (see console)</span>
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
      .on("click", "span", evt => console.log(`Hi, you clicked a <${
        evt.target.nodeName}>, and the text is "${
        evt.target.textContent}"`));

 // allow this temporarily
  allowUnknownHtmlTags.on();
  $( `<XStyle>&lt;XStyle> is not a valid tag but it will render, 
    because <code>allowUnknownHtmlTags.on</code> was just called.
    It is inserted @ after the header subtext
    </XStyle>`, document.querySelector("[data-starttext]"), insertPositions.AfterEnd )
    .attr({ style: {color: "orange"} });

  // now disallow again
  allowUnknownHtmlTags.off();
  // todo: array of values
  $( [`<SomethingUnknown>&lt;SomethingUnknow> is not a valid tag and it will not render</SomethingUnknown>`,
    `<div>&lt;SomethingUnknow> rendered as empty div[data-jql-invalid], because <code>allowUnknownHtmlTags.off</code>
        was just called. This element is inserted afther the previous &lt;xstyle&gt; element</div>`,
    ], document.querySelector("xstyle"), insertPositions.AfterEnd)
  .css({color: "orange", fontWeight: "bold", marginTop: "0.7rem"});

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
    `<div data-colorchange="#cc3300">
      notAllowedTags reset: <code>${getRestricted("pre").join(", ")}</code>, so
      <pre style="margin-top:0">This &lt;pre&gt; is allowed again</pre>
     </div>`
  )
  .on("click", "*", () => alert("hi there! Works?"), true)
  .css({cursor: "pointer"});

  $(`<div>
      <code>
        $("&lt;div/&gt;").html("test html() extension function for a newly created element from html string")
      </code> result =&gt;
    </div>`);

  $(`<div/>`)
    .css({cursor: "pointer"})
    .html(`test html() extension function for a newly created element from html string`)
    .on("click", (evt, self) => self.toggleStyleFragments({color: "red"}));


  $([`<p data-p></p>`, `<p data-p class="boeia"></p>`])
    .html("Test multiple elems (<code>$([...])</code>) <i>and</i> <code>html([...])</code> in one go", true)
    .single(1)
    .html(`
      <br>&nbsp;&nbsp;=> Test single([index]) extension for newly created elements (second should show this 
      text <i>and</i> all text should be green)`
      , true)
    .css({color: "green"});
};
