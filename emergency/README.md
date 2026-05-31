# HCI Emergency Tab

**Version:** `v1.0`
**Origin:** Ported from the Rotberg Japan 2026 build.
**Status:** Stable. Do not modify per-build — only the data changes.

A reusable, mobile-first "Emergency" tab for HCI itinerary sites. Renders one-tap emergency numbers, trip-operator 24h contacts, English-speaking hospitals, embassy/consulate contacts, and a quick-reference of essential Japanese phrases. Every section is data-driven; sensible defaults are provided for the parts that don't change between builds.

---

## What's in this folder

| File | Purpose |
| --- | --- |
| `tab.html` | The DOM container. Paste into your tab-panels section. |
| `tab.css` | All `.em-*` styles. Fully namespaced — no class collisions. |
| `tab.js` | Render logic + the EMERGENCY data. Paste into your `<script>` block, then edit the data at the top. |
| `README.md` | This file. |

The data shape is the contract — as long as you supply a valid `EMERGENCY` object, the tab renders. Every section is optional, so empty/missing sections are simply hidden.

---

## Three-step integration

1. **Paste `tab.css`** into your site's `<style>` block. All classes are prefixed `em-*` so they cannot collide with the rest of your build.
2. **Paste `tab.html`** into your tab-panels section. The inner container *must* keep `id="emergency-content"` — that's how `tab.js` finds it.
3. **Paste `tab.js`** into your site's `<script>` block. Edit the `EMERGENCY` object near the top to match your trip's contacts.

Add a nav button to your tab bar so users can reach the panel:

\`\`\`html
<button class="tab" role="tab" data-tab="emergency">Emergency</button>
\`\`\`

The tab auto-initialises on `DOMContentLoaded`. No manual `init()` call required.

---

## Data schema

\`\`\`js
const EMERGENCY = {
  // ─── Top buttons: emergency services ─────────────────────────────────
  // Default = Japan. Override for trips to other countries.
  services: [
    { emoji:'🚓', label:'Police',           number:'110' },
    { emoji:'🚑', label:'Ambulance / Fire', number:'119' }
  ],

  // ─── Trip operator 24h contacts ──────────────────────────────────────
  // First contact gets the primary (dark) "Call" button; subsequent ones
  // get the outlined "alt" button. Override the default with `primary:true`
  // or `primary:false` on a specific contact.
  operatorTitle: 'Happy Camper · 24h',     // card heading
  operatorContacts: [
    { emoji:'⛩', name:'Gerhard', role:'Happy Camper · Japan line · WhatsApp',  tel:'+818069892107', primary:true },
    { emoji:'🍱', name:'Tomoko',  role:'Happy Camper · Tokyo office · backup', tel:'+819061589006' }
  ],

  // ─── English-speaking hospitals ──────────────────────────────────────
  // Curate per the trip's actual city itinerary.
  hospitalsTitle: 'English-speaking hospitals',
  hospitals: [
    { emoji:'🏥', name:"St. Luke's International", note:'Tokyo · Chuo · English staff 24/7', mapsQuery:"St. Luke's International Hospital Tokyo" }
  ],

  // ─── Embassies / consulates ──────────────────────────────────────────
  // Default = both German (Tokyo + Osaka) and US (Tokyo + Osaka-Kobe),
  // since most HCI clients are one or the other. Trim or extend per guest
  // nationality.
  embassiesTitle: 'Embassies',
  embassies: [
    { emoji:'🇩🇪', name:'German Embassy Tokyo',    tel:'+81357917700' },
    { emoji:'🇺🇸', name:'US Embassy Tokyo',        tel:'+81332245000' }
  ],

  // ─── Essential phrases ───────────────────────────────────────────────
  // Default = standard HCI Japan set (reservation, thanks, help).
  phrasesTitle: 'Essential Japanese',
  phrases: [
    { ja:'予約しています', romaji:'Yoyaku shiteimasu', en:'I have a reservation' }
  ]
};
\`\`\`

### Field reference

| Field | Required | Notes |
| --- | --- | --- |
| `services[].emoji` | optional | Defaults to nothing; recommend keeping (🚓, 🚑). |
| `services[].label` | optional | Small uppercase label above the number. |
| `services[].number` | **yes** | The number dialled. Will be cleaned of non-digit characters in the `tel:` link. |
| `operatorContacts[].emoji` | optional | A glyph or country flag. |
| `operatorContacts[].name` | **yes** | Display name. |
| `operatorContacts[].role` | optional | Small italic line beneath the name. |
| `operatorContacts[].tel` | **yes** | International format, e.g. `+818069892107`. Spaces, parens and dashes are stripped automatically. |
| `operatorContacts[].primary` | optional | `true` → dark button; `false` → outlined "alt" button. Defaults to `true` for the first contact, `false` for the rest. |
| `hospitals[].name` | **yes** | Display name. |
| `hospitals[].note` | optional | City + specialty caption. |
| `hospitals[].mapsQuery` | optional | Google Maps query for the Map button. Defaults to the hospital name. |
| `embassies[].name` | **yes** | Display name. |
| `embassies[].tel` | **yes** | Phone number. Also displayed beneath the name. |
| `phrases[].ja` | **yes** | The phrase in Japanese script. |
| `phrases[].romaji` | optional | Romaji transliteration (gold italic). |
| `phrases[].en` | optional | English translation (small grey). |

### Hiding a section

Any section omitted from the EMERGENCY object, or set to `null` / `[]`, will not render. So a minimal config that only shows operator contacts looks like:

\`\`\`js
const EMERGENCY = {
  services: null,
  operatorContacts: [{ emoji:'⛩', name:'Gerhard', role:'Japan line', tel:'+818069892107' }],
  hospitals: null,
  embassies: null,
  phrases: null
};
\`\`\`

---

## Public API (`window.HCIEmergency`)

You generally don't need this — the tab self-initialises. But it's available for:

\`\`\`js
HCIEmergency.render();              // re-render the current data
HCIEmergency.setData(newData);      // replace the whole dataset at runtime
HCIEmergency.getData();             // returns the current dataset
\`\`\`

`setData` is useful for multi-trip dashboards or for swapping between Happy Camper and Achefabroad operator contacts on the same page.

---

## Expected CSS variables

The styles read from these custom properties on `:root`. If a variable is missing, the rule falls back to a sensible default — so the tab renders on a bare page — but for visual consistency with the rest of an HCI build, the host should define:

\`\`\`css
:root {
  --rad:        16px;
  --rad-sm:     10px;
  --card:       #fff;
  --line:       #e3dccd;
  --line-soft:  #ede7d8;
  --ink:        #0a1733;
  --ink-soft:   #2a3554;
  --ink-mute:   #5b6685;
  --gold:       #b08d4a;
  --serif:      'Cormorant Garamond','Times New Roman',serif;
  --sh-sm:      0 1px 3px rgba(10,23,51,.06);
}
\`\`\`

These are the standard HCI Japan-light palette. For Achefabroad's burnt-terracotta brand or any other theme, override the values upstream — the tab inherits them automatically.

---

## Per-build customisation cheatsheet

The most common edits when starting a new build:

1. **Operator contacts** — Happy Camper builds keep Gerhard + Tomoko as-is. Achefabroad builds replace both. Change `operatorTitle` accordingly.
2. **Hospitals** — list only the cities visited. Tokyo always; Kyoto if the trip visits; otherwise omit.
3. **Embassies** — defaults cover German (Tokyo + Osaka) and US (Tokyo + Osaka-Kobe), since most HCI clients hold one of those passports. For single-nationality groups, trim to just the relevant pair. For multinational groups, leave both; for other nationalities, replace entirely (the Maps query inside the `tel:` link strips formatting automatically, so spaces and parens are fine).
4. **Services** — leave as Japan defaults unless trip extends to another country.
5. **Phrases** — leave as standard set unless the trip has special needs (e.g. allergies — add `アレルギーがあります / Arerugii ga arimasu / I have an allergy`).

---

## Differences from Rotberg source

- All CSS classes renamed `em-*` (was generic `.card`, `.cr`, `.cb`, `.eg`, `.eb-btn`, `.ph`). This makes the tab fully self-contained — no risk of conflicting with host styles for other tabs.
- Static markup replaced by a data-driven render — every section is configurable.
- Smart defaults pre-fill the universally-stable content (110, 119, the standard Japanese phrase set) so a new build only edits what's different.
- Phone numbers automatically stripped of formatting characters before forming the `tel:` link, so you can write `+81 80 6989 2107` or `+818069892107` interchangeably in the data.
- All user-supplied strings are HTML-escaped to prevent XSS from unexpected characters in names or roles.

---

## Changelog

- **v1.0** — Initial extraction from `Rotberg.html` (May 2026). Reworked from hardcoded HTML into a data-driven module with sensible defaults. Classes namespaced `em-*` for collision-free drop-in. Public API on `window.HCIEmergency`. Default embassies cover both German (Tokyo + Osaka) and US (Tokyo + Osaka-Kobe), since most HCI clients are one or the other. Smoke-tested in Node: default data renders correctly; setData with sparse data hides empty sections; setData with formatted phone numbers cleans the tel: links; HTML-escaping prevents script injection through name/role fields.
