# Light Street Trio

Standalone static page at `/light-street-trio/`. Serve the repository root with
any static HTTP server, then open that path. No build step or runtime package
dependencies are required. This page is intentionally absent from the existing
site navigation and does not load the shared site stylesheet or header scripts.

## Content

- Left to right: Kai Knorr — bass; Jordan Call — guitar; Jon Tigert — drums.
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
Font: locally hosted Archivo Black, with its license and source notes in
`assets/fonts/light-street-trio/`.

Original photos were left unchanged at
`C:/Users/Jordan Call/Desktop/Guitar Trio/website assets/`, and copied to the
repository's existing ignored `photos-originals/light-street-trio/` directory.
Only optimized grayscale WebP derivatives are shipped, under
`assets/images/web/light-street-trio/`. Each image has a 320px variant and a
variant at the crop's native resolution; none were enlarged.

Square crops in original-image pixels (left, top, width, height):

| Original | Crop |
| --- | --- |
| jordan call.jpg | 220, 102, 580, 580 |
| kai knorr.png | 0, 42, 340, 340 |
| jon tigert.jpg | 0, 32, 390, 390 |

Derivatives use WebP quality 86. The album cover is only a design reference and
is not included on the page. The small supplied bassist and drummer photos limit
sharpness on high-density displays.

## Verification

The rendered page was checked in Chrome at desktop, tablet, and phone widths
from 320px to 1440px, including both sides of the layout breakpoint. Checks cover
image loading, title and portrait layout, overflow, keyboard focus, and automated
WCAG AA accessibility rules. The existing image-integrity check also passes.
The Formspree POST was intercepted locally to check fields and validation;
no test message was sent. Instagram embedding was checked with the actual post
and with its request blocked. Its availability remains controlled by Instagram.
