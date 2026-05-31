# HCI Utilities Tab

**Version:** `v1.0`
**Origin:** Ported from the Rotberg Japan 2026 build.
**Status:** Stable. Do not modify per-build — only the data changes.

A reusable, mobile-first “Utilities” tab for HCI itinerary sites. Renders five sections in one tab: a restaurant tracker with localStorage persistence, per-person dietary notes with a “show the chef” Japanese card, a live JPY ↔ USD converter, dining etiquette, and travel notes. Each section is independently configurable and can be hidden by setting `enabled: false`.

-----

## What’s in this folder

|File       |Purpose                                                                                                                       |
|-----------|------------------------------------------------------------------------------------------------------------------------------|
|`tab.html` |The DOM container. Paste inside your existing utilities panel section.                                                        |
|`tab.css`  |All `.util-*` styles. Fully namespaced — no class collisions.                                                                 |
|`tab.js`   |Render logic + the UTILITIES data + FX/tracker interactivity. Paste into your `<script>` block, then edit the data at the top.|
|`README.md`|This file.                                                                                                                    |

-----

## Three-step integration

1. **Paste `tab.css`** into your site’s `<style>` block. All classes are prefixed `util-*` so they cannot collide with the rest of your build.
1. **Paste `tab.html`** inside your existing utilities panel. The container *must* keep `id="utilities-content"` — that’s how `tab.js` finds it.
1. **Paste `tab.js`** into your site’s `<script>` block. Edit the `UTILITIES` object near the top to match your trip’s data.

Add a nav button to your tab bar so users can reach the panel:

```html
<button class="tab" role="tab" data-tab="utilities">Utilities</button>
```

The tab auto-initialises on `DOMContentLoaded`. No manual `init()` call required.

-----

## The five sections

Each section is an independent block. Set `enabled: false` to hide one while keeping its data; omit it entirely to drop it from the build.

### 1. Tracker (restaurant tracker with persistence)

A list of meal stops on the trip, each with a status badge (Confirmed / Requested / Walk-in / Self-booked / Suggestion). Tap a row to mark it “done” — strikethrough applied and the state persisted in `localStorage` under the configured `storageKey`.

**Data sources** (in order of precedence):

1. If `tracker.meals` is provided in the data, use that directly.
1. Otherwise, the tracker reads from `window.TRIP.days[].stops` if present — every stop where `stop.type === 'meal'`. This is the natural integration with the future itinerary core module.
1. If neither is available, the tracker renders an empty-state message.

```js
tracker: {
  enabled: true,
  title: 'Confirmed Tables',
  note: "All reservations made in <strong>Dr. Hans-Jörg Rotberg's</strong> name.",
  showLegend: true,
  storageKey: 'hci-tracker-rotberg-2026',  // unique per trip
  meals: null  // null → read from window.TRIP
}
```

To supply meals directly:

```js
meals: [
  { title:'Sushi Nakano', date:'2026-05-26', city:'Tokyo', time:'20:30',
    style:'Sushi · Omakase', covers:'2 covers', status:'confirmed' },
  { title:'Maeda', date:'2026-05-29', city:'Kyoto', time:'19:00',
    style:'Kyo-ryori · Counter', covers:'2 covers', status:'confirmed',
    gerhardJoins:true }
]
```

**Meal fields:** `title` (required), `date` (ISO `YYYY-MM-DD`), `city`, `time`, `style`, `covers`, `status`, `gerhardJoins`. Optional `id` used as the tracker key; defaults to `title|date`.

**Status values:** `confirmed`, `requested`, `walk-in`, `self`, `suggestion`, `tentative`, `transfer`.

**localStorage:** keys are scoped to the page origin (so multiple trip URLs on different paths share state if hosted on the same domain — set unique `storageKey` per trip). Wrapped in try/catch — private-mode or quota-exceeded errors are silently ignored.

### 2. Dietary notes

Per-person allergy and avoidance lists, with a dark “show the chef” card containing Japanese phrases for use at counters.

```js
dietary: {
  enabled: true,
  title: 'Dietary Notes',
  showCritical: true,        // pink "Critical" badge in the heading
  criticalLabel: 'Critical',
  note: 'Submitted via the Happy Camper diet form …',
  people: [
    { name: 'Dr. Hans-Jörg Rotberg', items: [
      { it: 'Uni · sea urchin · 雲丹', sv: 'Avoid', svClass: 'avoid' }
    ]}
  ],
  showChef: {
    enabled: true,
    label: '📱 Show the chef · Japanese',
    lines: [
      { ja: 'アレルギーがあります', ro: 'Arerugii ga arimasu — I have allergies' }
    ],
    summary: {
      jp: 'イカ・タコ・ナマコ・雲丹 (ウニ)・ホルモン',
      en: 'Squid · Octopus · Sea cucumber · Sea urchin · Organ meats'
    },
    footer: 'Show this card to any waitstaff or chef …'
  }
}
```

**Item fields:** `it` (the item name), `sv` (severity label, displayed in pill), `svClass` (either `'avoid'` for muted pink/red, or `'allergy'` for solid sakura pink).

For trips with no dietary concerns, set `dietary: { enabled:false }` or omit the section.

### 3. FX converter

Two-way live JPY ↔ USD calculator. Editing either input updates the other. The rate is editable via an inline `edit` link.

```js
fx: {
  enabled: true,
  title: '¥ JPY · USD Converter',
  rate: 158.78,           // 1 USD = X JPY
  initialJpy: 10000,
  leftLabel: 'Japanese Yen',
  rightLabel: 'US Dollar',
  rightDecimals: 2
}
```

Update the rate per trip — it’s roughly 150–160 JPY/USD in 2026; check before each new build.

### 4. Etiquette

Three (or more) blocks of dining etiquette. Each block can be a paragraph or a list, and can carry a pink “Critical” badge in its title.

```js
etiquette: {
  enabled: true,
  title: 'Dining Etiquette',
  blocks: [
    { title:'Fragrance', criticalLabel:'Critical', html:'<p>No perfume …</p>' },
    { title:'🍣 At the counter', kind:'list', items:[
      { em:'⏱',  html:'<strong>Punctuality …</strong>' },
      { em:'💍', html:'<strong>Protect the counter …</strong>' }
    ]},
    { title:'🤝 A note on cancellations', html:'<p>Happy Camper\'s access …</p>' }
  ]
}
```

For paragraph blocks, pass `html` (already wrapped in `<p>` tags). For list blocks, set `kind:'list'` and pass `items` (each with an `em` glyph and inline `html`).

The Fragrance block typically lists specific venues per trip (e.g. “particular care before Sushi Nakano, Maeda and Sushi Nihee”) — update the `html` field with the current trip’s omakase counters.

### 5. Notes

Travel notes, structured the same way as etiquette but with `h4` subheadings inside one card.

```js
notes: {
  enabled: true,
  title: 'Travel Notes',
  sections: [
    { h4:'🚄 Getting around', kind:'list', items:[
      { em:'📱', html:'<strong>Suica.</strong> Add a Suica card …' }
    ]},
    { h4:'💬 Direct line to Happy Camper', html:'<p class="util-p">A direct WhatsApp line …</p>' }
  ]
}
```

For non-list sections, use the `util-p` class on your paragraph to inherit the standard travel-note typography.

-----

## Public API (`window.HCIUtilities`)

You generally don’t need this — the tab self-initialises. Available methods:

```js
HCIUtilities.render();                // re-render everything
HCIUtilities.setData(newData);        // replace the whole dataset at runtime
HCIUtilities.getData();               // returns the current dataset
HCIUtilities.setRate(160);            // update FX rate live (no full re-render)
HCIUtilities.clearTracker();          // wipe localStorage tracker state + re-render
```

`setRate` is useful for a future automatic FX-API integration. `clearTracker` is useful when starting a new trip on the same domain.

-----

## Per-build customisation cheatsheet

The fields that almost always need updating for a new client:

1. **`tracker.note`** — guest name on the reservations
1. **`tracker.storageKey`** — unique key per trip (e.g. `'hci-tracker-mueller-2026'`)
1. **`dietary.people`** — per-guest allergy/avoidance lists
1. **`dietary.showChef.summary.jp` / `.en`** — combined avoidance summary for chef cards
1. **`fx.rate`** — current JPY/USD rate
1. **`etiquette.blocks[0].html`** — Fragrance block, often mentions specific omakase venues for the trip
1. **`notes.sections`** — any trip-specific dates, Tomoko’s WhatsApp line (Happy Camper office), references

Universal content (Suica, eSIM, gochisousama, etc.) stays as-is across builds.

-----

## Expected CSS variables

The styles read from these custom properties on `:root`. If a variable is missing, the rule falls back to a sensible default so the tab renders on a bare page. For visual consistency:

```css
:root {
  --rad:        16px;
  --rad-sm:     10px;
  --card:       #fff;
  --paper:       #f7f4ee;
  --paper-warm: #efeae0;
  --line:       #e3dccd;
  --line-soft:  #ede7d8;
  --ink:        #0a1733;
  --ink-soft:   #2a3554;
  --ink-mute:   #5b6685;
  --gold:       #b08d4a;
  --gold-soft:  #c9a55c;
  --sakura:     #d9748a;
  --serif:      'Cormorant Garamond','Times New Roman',serif;
  --sh-sm:      0 1px 3px rgba(10,23,51,.06);
}
```

The status badge colours (Confirmed green, Requested cyan, Walk-in yellow, Self-booked pink, Suggestion blue) are baked directly into the CSS — they’re standard HCI booking-status semantics that shouldn’t vary between builds. Override only if the brand demands it.

-----

## Differences from Rotberg source

- All CSS classes renamed `util-*` (was generic `.card`, `.fx`, `.fxf`, `.eb`, `.tr`, `.cp`, `.nl`, `.resn`, `.legend`, `.diet-*`). Self-contained, collision-free.
- Static markup replaced by a data-driven render — every section configurable.
- **Restaurant tracker now persists** via localStorage. Tap a row to mark done, state survives reloads.
- **FX rate editable inline** — the `edit` link prompts for a new rate without page reload.
- Tracker integrates with `window.TRIP` if it exists, or accepts an explicit meals list — works standalone today, plugs into Itinerary core when it’s extracted.
- All user-supplied strings HTML-escaped where text-only (titles, names, items). Long-form content fields (etiquette `html`, notes `html`) accept inline HTML by design — author content is trusted.

-----

## Changelog

- **v1.0** — Initial extraction from `Rotberg.html` (May 2026). Five sections combined into one data-driven module. Restaurant tracker reads from `window.TRIP` or explicit meal list, with localStorage-backed completion state. FX converter has live two-way binding and editable rate. Smoke-tested in Node: 47 assertions covering render output, TRIP integration, localStorage persistence across re-renders, public API methods, hidden-section handling, and XSS-safe escaping.
