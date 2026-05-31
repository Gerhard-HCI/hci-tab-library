# HCI Discover Tab

**Version:** `v1.0`
**Origin:** Ported from the Khoa Nov-2026 build, refined in the Rotberg Japan 2026 build.
**Status:** Stable. Do not modify per-build — only the data changes.

A reusable, mobile-first “Discover” tab for HCI itinerary sites. Renders a city selector, a stack of curator “Editor’s Reference” cards, and category cards (Sightseeing / Activities / Shopping) of tappable items that open in Google Maps.

-----

## What’s in this folder

|File       |Purpose                                                                                           |
|-----------|--------------------------------------------------------------------------------------------------|
|`tab.html` |The DOM container. Paste into your tab-panels section.                                            |
|`tab.css`  |All `.disc-*` styles. Paste into your `<style>` block.                                            |
|`tab.js`   |Render logic + the DISCOVER data. Paste into your `<script>` block, then edit the data at the top.|
|`README.md`|This file.                                                                                        |

The data shape is the contract — as long as you supply a valid `DISCOVER` object and `DISCOVER_CITIES` array, the tab renders.

-----

## Three-step integration

1. **Paste `tab.css`** into your site’s `<style>` block. The styles are scoped to `.disc-*` so they won’t collide with the rest of your build.
1. **Paste `tab.html`** into your tab-panels section (next to `<section id="p-itinerary">`, `<section id="p-utilities">`, etc.). The inner container *must* keep `id="discover-content"` — that’s how `tab.js` finds it.
1. **Paste `tab.js`** into your site’s `<script>` block. Edit the `DISCOVER` object and `DISCOVER_CITIES` array near the top to match your trip’s cities.

Add a nav button to your tab bar so users can reach the panel:

```html
<button class="tab" role="tab" data-tab="discover">Discover</button>
```

The tab auto-initialises on `DOMContentLoaded` if the container is present. No manual `init()` call required, but the API is exposed on `window.HCIDiscover` if you need it (see below).

-----

## Data schema

```js
const DISCOVER = {
  // Each top-level key is a city name. The display order in the pill bar
  // is controlled by DISCOVER_CITIES below, not by key order.
  Tokyo: [
    {
      cat: 'Sightseeing',        // section heading — usually 'Sightseeing' / 'Activities' / 'Shopping'
      note: 'Optional caveat',   // optional. Renders as a small italic note above the items.
      items: [
        // Each item is a 3-tuple: [displayName, googleMapsQuery, optionalSubLine]
        ['Senso-ji Temple', 'Senso-ji Temple Asakusa Tokyo', "Tokyo's oldest Buddhist temple · Asakusa"],
        ['Meiji Shrine',    'Meiji Shrine Shibuya Tokyo',    'Major Shinto shrine in Yoyogi forest'],
        // ...
      ]
    },
    { cat: 'Activities', items: [ /* ... */ ] },
    { cat: 'Shopping',   items: [ /* ... */ ] }
  ],
  Kyoto: [ /* same shape */ ],
  // ...
};

const DISCOVER_CITIES = ['Tokyo','Kyoto','Osaka','Nara'];
```

**Item tuple notes:**

- `displayName` — what the user sees. Keep short (≤ 50 chars).
- `googleMapsQuery` — fed to `https://maps.google.com/?q=<encoded>`. Be specific (`'Senso-ji Temple Asakusa Tokyo'` beats `'Senso-ji'`). Add the city when the name is common (`'Komehyo Ginza'` vs `'Komehyo Osaka'`).
- `optionalSubLine` — italic gold caption below the name. Use for context or a specific recommendation. Pass `''` or omit if not needed.

**Section convention:** in the standard reference build, every city has exactly three sections — Sightseeing, Activities, Shopping, in that order, 20 items each (60 per city, 240 total). You can deviate from that shape freely; the tab simply renders whatever sections you give it in the order you give them.

-----

## Editor’s Reference cards

The dark gradient cards above the category list (Scherrer’s Ultimate Shopping List, Rivera’s Ultimate Coffee List) are configured in the `EDITOR_REFS` array further down in `tab.js`. Each card takes:

```js
{
  label: "Editor's Reference",   // small uppercase label
  title: 'The Ultimate Shopping List',
  by:    'John Scherrer',        // appears with © prefix
  body:  'Long-form description …',
  mapUrl:'https://maps.app.goo.gl/...',
  ig:    '@bigtime_makin_it_nice',
  igUrl: 'https://www.instagram.com/...',
  tip:   'Italic closing note …',
  tipFirst: false,               // optional — render tip above the CTAs instead of below
  gradient: '...',               // optional — override the default indigo gradient
  borderColor: '...'             // optional — override the default gold border
}
```

Set `EDITOR_REFS = []` to hide all curator cards. The same cards appear on every city — they’re Japan-wide references, not city-specific.

-----

## Public API (`window.HCIDiscover`)

You generally don’t need this — the tab self-initialises. But it’s available for:

```js
HCIDiscover.render();                       // re-render the current city
HCIDiscover.setCity('Kyoto');               // switch city + re-render
HCIDiscover.setData(newData, newCities);    // swap the entire dataset at runtime
HCIDiscover.getActiveCity();                // returns current city name
```

`setData` is useful for very large multi-trip dashboards where you want one site, many datasets.

-----

## Expected CSS variables

The styles read from these custom properties on `:root`. If a variable is missing, the rule falls back to a sensible default, so the tab still renders on a bare page — but for visual consistency with the rest of an HCI build, the host should define:

```css
:root {
  --rad:        16px;
  --card:       #fff;
  --line:       #e3dccd;
  --line-soft:  #ede7d8;
  --ink:        #0a1733;
  --ink-soft:   #2a3554;
  --ink-mute:   #5b6685;
  --paper-warm: #efeae0;
  --gold:       #b08d4a;
  --serif:      'Cormorant Garamond','Times New Roman',serif;
  --sans:       'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --sh-sm:      0 1px 3px rgba(10,23,51,.06);
}
```

These are the standard HCI Japan-light palette. For Achefabroad’s burnt-orange/terracotta brand or any other theme, override the values upstream — the tab inherits them automatically.

-----

## Changelog

- **v1.1** — `tab.html` reworked to the inner-only pattern: the outer `<section class="panel">` wrapper was removed so the snippet drops cleanly inside whatever panel structure the host site already defines. No CSS or JS changes; existing v1.0 integrations only need to replace `tab.html`.
- **v1.0** — Initial extraction from `Rotberg.html` (May 2026). Wrapped the original Khoa-template code as a self-contained IIFE that auto-initialises and exposes `window.HCIDiscover`. Editor’s Reference cards moved from inline strings into an `EDITOR_REFS` array. CSS variables given inline fallbacks so the tab renders on a bare page. Data, structure, and visual output are byte-equivalent to the Rotberg build.

-----

## Adding / updating a city

1. Add the city to the `DISCOVER` object: `Sapporo: [ {cat:'Sightseeing', items:[...]}, ... ]`.
1. Append it to `DISCOVER_CITIES` in the order you want the pill to appear.
1. Reload. No other code changes needed.

To remove a city, delete both entries. To reorder, just reorder `DISCOVER_CITIES`.

-----

## Adding a new category type

Sections render in whatever order you list them. To add e.g. “Food” or “Coffee” as a fourth category:

```js
Tokyo: [
  { cat: 'Sightseeing', items: [...] },
  { cat: 'Activities',  items: [...] },
  { cat: 'Coffee',      items: [...] },   // new
  { cat: 'Shopping',    items: [...] }
]
```

No CSS or JS changes required.
