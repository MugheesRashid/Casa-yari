# Casa Yari — website

A hand-built, art-directed website for **Casa Yari**, chef Yari Vargas's Puerto Rican
and Honduran restaurant at 2743 W Division St, Humboldt Park, Chicago.

Built with plain HTML5, CSS3 and JavaScript, with **GSAP + ScrollTrigger** for choreography
and **Lenis** for smooth scrolling. No build step, no bundler, no `npm install`.

---

## Run it

Any static file server works. From this folder:

```powershell
npx serve .
# or
npx http-server -p 4173
```

Then open <http://localhost:4173>.

> Opening `index.html` directly from disk also works, but a local server is recommended so
> the vendored scripts and the reduced-motion paths behave exactly as they will in production.

## Files

```
index.html              the whole page — 7 sections + loader + footer
css/style.css           design tokens, layout, reveals, responsive rules
js/main.js              loader, hero timeline, scroll reveals, carousel
js/vendor/gsap.min.js          GSAP 3.12.5 (vendored)
js/vendor/ScrollTrigger.min.js GSAP ScrollTrigger 3.12.5 (vendored)
js/vendor/lenis.min.js         Lenis 1.1.18 (vendored)
```

Everything is vendored locally on purpose: no third-party CDN outage can take the
animation layer down, and there is no supply-chain surface at runtime.

---

## Structure of the page

| Section | Anchor | Purpose |
|---|---|---|
| Loader | — | Ivory screen, authentic logo centred, circular ring completing on a real readiness signal |
| 1 · Hero | `#hero` | Capsule image reveal, staged headline, two CTAs, rotating seal |
| Ticker | — | Verified press coverage only |
| 2 · Our story | `#story` | Chef Yari, the two roots, organic blob portrait |
| 3 · Two islands | `#islands` | Puerto Rico ↔ Honduras, side by side, with real dishes from each |
| 4 · The vegan kitchen | `#vegan` | The plant-based menu Yari taught herself, on a dark green stage |
| 5 · The food | `#specialties` | Organic overlapping blob stage, menu card, drag carousel |
| 6 · The casa | `#experience` | Dining room, three highlights, verified press grid |
| 7 · Visit | `#visit` | Address, hours, phone, directions, reservations |
| Footer | — | Navigation, logo lockup, legal line |

---

## Design tokens

Defined once in `css/style.css` under `:root`.

**Colour** — kept to the agreed proportions:

| Token | Value | Share | Use |
|---|---|---|---|
| `--ivory` | `#F7F3E8` | ~65% | Page backgrounds, light cards |
| `--green` | `#183D2B` | ~25% | Nav, headings, buttons, footer, loader ring |
| `--sage` | `#8FA58A` | ~7% | Hover states, list markers, decorations |
| `--sand` / `--gold` | `#D8C8AC` / `#C9A24B` | ~3% | Highlights, script accents, details |
| `--charcoal` | `#252922` | — | Body text |

**Type** — all sans, with a handwritten accent for the warm/editorial moments:

- `Bricolage Grotesque` — display headings, navigation lockup, menu titles
- `DM Sans` — body copy, labels, buttons
- `Caveat` — handwritten accents (eyebrows, captions, “Ask for these”)

---

## Motion system

| Layer | Technique |
|---|---|
| Entrance | Capsule clip-path open, masked line reveals, staggered fades |
| Scroll | Viewport-triggered reveals, word-by-word `[data-split]` headings, gentle parallax on marked images |
| Micro | Directional button fills, nav underline, card lift, carousel scaling |
| Section | Organic blob morphs, forest-green contrast breaks, ticker marquee |

### Data attributes

- `[data-hero="n"]` — staged into the hero timeline
- `[data-reveal]` — single scroll reveal
- `[data-reveal-group]` — staggered children
- `[data-split]` — headline split into masked words
- `[data-mask-reveal]` — image revealed by a clip-path wipe
- `[data-parallax="-40"]` — signed pixel drift

---

## Loading behaviour

The loader advances on a **real** readiness signal — the logo and hero image decoding plus
`document.fonts.ready` — with a 1.2s minimum dwell so it feels deliberate (0.48s for
returning visitors, via `sessionStorage`).

Three independent failsafes release the page regardless:
`5200ms` inside `runLoader`, a `6400ms` boot watchdog, and a `load + 3000ms` last resort.
`loaderDone` serialises them, so the loader can never be shown twice or trap a visitor.

---

## Accessibility

- Semantic landmarks, one `<h1>`, skip link, `lang="en"`
- Every control is keyboard reachable with a visible focus ring
- The carousel responds to ←, →, Home and End, exposes `aria-live` position, disables
  its arrows at the ends, and its buttons are 52px (46px on the smallest phones)
- Autoplay stops permanently on interaction and pauses on hover/focus/`document.hidden`
- The mobile menu is a dark overlay with **focus containment**, `aria-expanded`, a live
  `aria-label`, Escape to close, and focus returned to the toggle
- `prefers-reduced-motion` neutralises every loop and transition in CSS *and* skips the
  JavaScript timelines, so no content depends on animation to become visible
- All images carry `width`/`height` (no layout shift) and `alt` text; below-the-fold
  images are `loading="lazy"`

---

## Verified business information

Sourced from the restaurant's live site (casayari.com) during the build. Only verified
figures are used — nothing about awards, hours, prices, testimonials or capacity is invented.

- **Address** 2743 W Division St, Chicago, IL 60622
- **Phone** 773-756-5088
- **Email** casa.dyari@yahoo.com
- **Hours** Mon–Wed closed · Thu 5–9pm · Fri–Sat 5–10pm · Sun 4–8pm
- **Reservations** Resy (`resy.com/cities/chicago-il/venues/casa-yari`); parties of 4 or fewer
  are recommended to book on peak nights; 6–8 guests required by phone or email; no groups over 8
- **Opened** 2013
- **Press** Chicago magazine, The Infatuation, Eater Chicago, VegWorld, WGN,
  Best of Logan Square

> **Note on imagery.** The photographs are served from the restaurant's own GoDaddy CDN
> using its resizing endpoint, and the logo is the genuine Casa Yari logo unmodified. They
> are hot-linked so the site always reflects the restaurant's current asset library — swap
> the URLs in `index.html` for locally hosted files when the final imagery is chosen.
>
> Dish names on the site are taken from the live menu. Prices are deliberately omitted so
> the site can never quote a stale figure.

### New sections — where the content came from

Both new sections were drafted from the restaurant's own live pages, not invented:

- **Two islands (`#islands`)** — built out of the About page's own framing (“Mother's from a
  little town in Puerto Rico called Lares. Father is an immigrant… from Honduras, family
  resides in Progreso”) and dishes pulled verbatim from the live menu: pastelón, mofongo of
  the month, la caribeña and Mami's vegan bowl on the Puerto Rican side; pollo chuco,
  marmahón de pollo, dobladas and plátano catracho on the Honduran side.
- **The vegan kitchen (`#vegan`)** — built on the About page's own line that she “taught
  herself to be able to cook vegan & vegetarian to offer those options at her restaurant”,
  with the dishes taken from the menu's dedicated 🌱 section: pastelón vegano, vegan mofongo
  de ropa vieja, vegan jackfruit paella, mushrooms & tajadas, alitas de coliflor and Mami's
  vegan bowl.

No prices, no awards and no claims appear in either section that are not sourced above.

---

## Things worth knowing before production

1. **Hours** are published from the restaurant's structured data and its “open today” widget.
   Worth a confirmation call before launch.
2. **Brunch** is marked “coming soon” on the source site, and **catering is paused** while the
   restaurant trains staff for a new location — neither is advertised here, on purpose.
3. **Images** are hot-linked (see above). Local hosting is the one change needed for a fully
   self-contained deployment.
4. The canvas particle-dispersion typography that was in the first draft has been **removed**
   at the client's request. Headlines use the `[data-split]` masked-word reveal instead,
   which needs no per-letter canvas and always degrades to plain text.
