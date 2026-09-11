# Light Street Trio

Standalone static page at `/light-street-trio/`. Serve the repository root with
any static HTTP server, then open that path. No build step or runtime package
dependencies are required. This page is intentionally absent from the existing
site navigation and does not load the shared site stylesheet or header scripts.

## Content

- Desktop, left to right: Kai Knorr — bass; Jordan Call — guitar; Jon Tigert — drums.
- Mobile, top to bottom: Jordan Call, Kai Knorr, Jon Tigert.
- The three lorem ipsum sentences are intentional placeholders requested by the
  owner. Replace the `.lst-description` paragraph when final wording is supplied.
- Rehearsal: https://www.instagram.com/p/Dcy6YfcCWx5/
- Booking: the same native HTML form destination as `contact.html`,
  `https://formspree.io/f/mgvzkbkl`. The owner's follow-up request for this form
  superseded the original brief's email-link-only contact section. Formspree
  handles delivery and the confirmation page. The form works without JavaScript.

The Instagram frame loads only after selecting **Load rehearsal video** and does
not autoplay. Its verified origin and frame source are checked before accepting
height updates. The direct Instagram link also works with JavaScript disabled or
the embed blocked. No Instagram media or thumbnail is stored in this repository.

## Assets

Styles: `assets/css/light-street-trio.css`, scoped beneath `.lst-page`.
Script: `assets/js/light-street-trio.js`, used only for the video embed.
Fonts: locally hosted Anton for the band title and musician names, with Barlow
Condensed Medium at 22px for the instrument labels. Licenses and source notes are in
`assets/fonts/light-street-trio/`. Local comparison samples for Oswald Regular
and Libre Baskerville Italic are in the ignored
`.local/light-street-trio-preview/instrument-font-options.html` file.

Original photos were left unchanged at
`C:/Users/Jordan Call/Desktop/Guitar Trio/website assets/`, and copied to the
repository's existing ignored `photos-originals/light-street-trio/` directory.
Only optimized grayscale WebP derivatives are shipped, under
`assets/images/web/light-street-trio/`. Each image has a 320px variant and a
variant at the crop's native resolution; none were enlarged.

Square crops in original-image pixels (left, top, width, height):

| Original | Crop |
| --- | --- |
| jordan call.jpg | 145, 40, 720, 720 |
| kai knorr.png | 0, 35, 392, 392 |
| jon tigert.jpg | 0, 0, 647, 647 |

Derivatives use WebP quality 86. The album cover is only a design reference and
is not included on the page. The small supplied bassist and drummer photos limit
sharpness on high-density displays. The wider crops show more of the instruments;
Jon's derivative now uses his whole supplied photograph, including the original
flag overlay, which is grayscale along with the rest of the image.

## Palette

The owner's supplied colors are used exactly: red `#C04652`, green `#A3BF50`,
and blue `#15ACD1`. The background remains `#faf8f2`. Instrument labels, other
supporting text, and keyboard focus outlines use near-black `#24251f`.

On this cream background, the green and blue have contrast ratios of approximately
1.95:1 and 2.52:1, below the WCAG AA text thresholds. They were retained to honor
the owner's request not to deviate significantly from these hexes. The musician
names in those colors therefore have a known contrast limitation; automated
accessibility checks report it. Red is approximately 4.66:1.

## Verification

The rendered page was checked in Chrome at desktop, tablet, and phone widths
from 320px to 1440px, including both sides of the layout breakpoint. Checks cover
image loading, title and portrait layout, overflow, keyboard focus, and automated
WCAG AA accessibility rules. The existing image-integrity check also passes.
The Formspree POST was intercepted locally to check fields and validation;
no test message was sent. Instagram embedding was checked with the actual post
and with its request blocked. Its availability remains controlled by Instagram.
