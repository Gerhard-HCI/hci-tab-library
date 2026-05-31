/* ════════════════════════════════════════════════════════════════════════════
   HCI UTILITIES TAB — v1.0 — SCRIPT
   Source: gerhard-hci/hci-tab-library/utilities

   Self-contained module. Renders into <div id="utilities-content">.
   Auto-initialises on DOMContentLoaded if the container exists.

   API exposed on window.HCIUtilities:
     HCIUtilities.render()                  re-render everything
     HCIUtilities.setData(utilObj)          replace dataset at runtime
     HCIUtilities.getData()                 read the active dataset
     HCIUtilities.setRate(jpyPerUsd)        update FX rate without full re-render
     HCIUtilities.clearTracker()            wipe localStorage tracker state

   FIVE SECTIONS — each is optional. Set { enabled:false } to hide a section
   while keeping its data; omit it entirely to drop it from the build.

   1. TRACKER  — restaurant tracker. Reads meals from data.tracker.meals if
                 provided, otherwise from window.TRIP.days[].stops where
                 type==='meal'. Tick to toggle done state; persisted in
                 localStorage under tracker.storageKey.

   2. DIETARY  — per-person allergy lists + "Show the chef" Japanese card.
                 Pure content; no interaction.

   3. FX       — two-way JPY ↔ USD converter. Editing either input updates
                 the other live. Editable rate.

   4. ETIQUETTE — Dining etiquette blocks (fragrance, counter rules,
                 cancellations). Universal Japan content with venue-specific
                 phrasing overridable per build.

   5. NOTES    — Travel notes (Suica, Shinkansen, eSIM, power, Happy Camper
                 contact line, serious shopping reference).

   See README.md for the full data schema.
   ════════════════════════════════════════════════════════════════════════════ */

/* ════ BEGIN UTILITIES TAB v1.0 ════ */
(function(){
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// [EDIT] DATA — replace this UTILITIES object with your trip's data.
// Sensible defaults are pre-filled for the Rotberg Japan 2026 build, which
// is representative of a standard HCI Japan programme. Override fields per
// client; set any section's `enabled:false` (or omit the section) to hide.
// ─────────────────────────────────────────────────────────────────────────────
  var UTILITIES = {

    // ─── 1. TRACKER ─────────────────────────────────────────────────────
    tracker: {
      enabled: true,
      title: 'Confirmed Tables',
      note: "All reservations have been made in <strong>Dr. Hans-Jörg Rotberg's</strong> name — please present this name at the door.",
      showLegend: true,
      // Persist ticked-off states. Set to null to disable persistence.
      // Use a unique key per trip so multiple itineraries don't conflict.
      storageKey: 'hci-tracker-default',
      // If `meals` is provided, use it directly. Otherwise the tracker reads
      // from window.TRIP.days[].stops (where stop.type==='meal') if present.
      // Each meal: { id?, title, date, city, time?, style?, covers?, status,
      //              gerhardJoins?, mapsQuery? }
      meals: null
    },

    // ─── 2. DIETARY NOTES ───────────────────────────────────────────────
    dietary: {
      enabled: true,
      title: 'Dietary Notes',
      showCritical: true,
      criticalLabel: 'Critical',
      note: 'Submitted via the Happy Camper diet form · last updated 20 May 2026. Flagged in advance with every confirmed counter — please re-confirm in person on arrival at each meal.',
      people: [
        { name: 'Dr. Hans-Jörg Rotberg', items: [
          { it: 'Uni · sea urchin · 雲丹',              sv: 'Avoid', svClass: 'avoid' },
          { it: 'Organ meats · hormone cuts · ホルモン', sv: 'Avoid', svClass: 'avoid' }
        ]},
        { name: 'Greta Rotberg', items: [
          { it: 'Squid · イカ',                          sv: 'Mild allergy', svClass: 'allergy' },
          { it: 'Octopus · タコ',                        sv: 'Mild allergy', svClass: 'allergy' },
          { it: 'Namako · sea cucumber · ナマコ',        sv: 'Avoid', svClass: 'avoid' },
          { it: 'Uni · sea urchin · 雲丹',              sv: 'Avoid', svClass: 'avoid' },
          { it: 'Organ meats · hormone cuts · ホルモン', sv: 'Avoid', svClass: 'avoid' }
        ]}
      ],
      showChef: {
        enabled: true,
        label: '📱 Show the chef · Japanese',
        lines: [
          { ja: 'アレルギーがあります', ro: 'Arerugii ga arimasu — I have allergies' },
          { ja: '食べられません',       ro: 'Taberaremasen — I cannot eat …' }
        ],
        summary: {
          jp: 'イカ・タコ・ナマコ・雲丹 (ウニ)・ホルモン',
          en: 'Squid · Octopus · Sea cucumber · Sea urchin · Organ meats'
        },
        footer: 'Show this card to any waitstaff or chef who needs the full list — copy/screenshot for offline use.'
      }
    },

    // ─── 3. FX CONVERTER ────────────────────────────────────────────────
    fx: {
      enabled: true,
      title: '¥ JPY · USD Converter',
      rate: 158.78,           // 1 USD = X JPY — update per trip
      initialJpy: 10000,
      leftLabel: 'Japanese Yen',
      rightLabel: 'US Dollar',
      rightDecimals: 2
    },

    // ─── 4. DINING ETIQUETTE ────────────────────────────────────────────
    etiquette: {
      enabled: true,
      title: 'Dining Etiquette',
      blocks: [
        { title: 'Fragrance', criticalLabel: 'Critical', html:
          "<p>No perfume, cologne, scented oils, or hair products on dinner nights — <em>non-negotiable at every counter on this trip</em>. Laundry detergents included. The chef's composition relies on guests being able to read aroma; a small oversight here can compromise the entire room.</p>" },
        { title: '🍣 At the counter', kind: 'list', items: [
          { em: '⏱',  html: '<strong>Punctuality is precise.</strong> Omakase meals begin simultaneously for all guests. Arriving late disrupts the chef\'s timing and cannot be accommodated.' },
          { em: '💍', html: '<strong>Protect the counter.</strong> Many counters are crafted from a single piece of Hinoki cypress — remove rings, bracelets and watches before sitting.' },
          { em: '📷', html: '<strong>Photography.</strong> Food only — never the chef, never other guests at the counter.' },
          { em: '💴', html: '<strong>Cash on departure.</strong> Several venues prefer cash for ancillaries — sake supplements, gratuities, small purchases. Carry roughly <strong>¥80,000</strong> in yen at all times.' },
          { em: '🙇', html: '<strong>Thank the chef.</strong> A sincere <em>gochisousama deshita</em> is more appreciated than any tip — tipping is not customary in Japan.' }
        ]},
        { title: '🤝 A note on cancellations', html:
          "<p>Happy Camper's access to these tables is built on years of relationship with individual chefs and owners. <em>Cancellations at this level are treated as serious breaches of trust</em> — once confirmed, every table below is a firm commitment. If anything must change, please flag it to Gerhard at the earliest possible moment.</p>" }
      ]
    },

    // ─── 5. TRAVEL NOTES ────────────────────────────────────────────────
    notes: {
      enabled: true,
      title: 'Travel Notes',
      sections: [
        { h4: '🚄 Getting around', kind: 'list', items: [
          { em: '📱', html: '<strong>Suica.</strong> Add a Suica card to Apple/Google Wallet — covers subway, bus and train across Tokyo, Kyoto and Osaka. Top up via your linked card.' },
          { em: '🚅', html: '<strong>Shinkansen.</strong> Reserved Green Car seats recommended for major transfers — book via SmartEX (smartex.jp).' },
          { em: '🚖', html: '<strong>Taxis.</strong> JapanTaxi and GO are the two reliable apps for Tokyo, Kyoto and Osaka — both accept foreign credit cards. Hotel concierges will call a taxi on request.' },
          { em: '💴', html: '<strong>Cash society.</strong> ATMs at 7-Eleven and Japan Post accept international cards. Several venues prefer cash for ancillaries.' },
          { em: '📶', html: '<strong>eSIM.</strong> Activate before landing — Airalo, HolaFly or YO all work well. 4G/5G coverage is excellent everywhere on the itinerary.' },
          { em: '⚡', html: '<strong>Power.</strong> 100 V at 50/60 Hz. Two-pronged sockets. European travellers need a voltage adapter.' }
        ]},
        { h4: '💬 Direct line to Happy Camper', html:
          '<p class="util-p">A direct WhatsApp line to Tomoko runs throughout the trip (<strong>+81 90 6158 9006</strong>) — the fastest channel for restaurant confirmations, last-minute changes, or anything that needs sorting on the ground.</p>' },
        { h4: '🗺 For serious shopping', html:
          '<p class="util-p">John Scherrer\'s <strong>Ultimate Shopping List</strong> — a hand-built Google Map covering Japan\'s most considered shops — is the single best on-the-ground reference. Find it in the <strong>Discover</strong> tab, or open it <a href="https://maps.app.goo.gl/y5dzkZR4L56yY3po8?g_st=i" target="_blank" rel="noopener">directly here</a>. Most useful when combined with your live location.</p>' }
      ]
    }
  };

// ─────────────────────────────────────────────────────────────────────────────
// RENDERING — do not modify below this line when porting.
// ─────────────────────────────────────────────────────────────────────────────

  var DATA = UTILITIES;

  // Status label dictionary — used in the tracker badge text
  var STATUS_LABEL = {
    confirmed:'Confirmed', requested:'Requested', 'walk-in':'Walk-in',
    self:'Self-booked', suggestion:'Suggestion',
    tentative:'Tentative', transfer:'Transfer'
  };
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function hasItems(a){ return Array.isArray(a) && a.length>0; }
  function enabled(s){ return s && s.enabled!==false; }

  // Parse an ISO date like '2026-05-25' into a UTC date (avoids tz drift)
  function parseISO(iso){
    if(!iso) return null;
    var p=String(iso).split('-');
    return new Date(Date.UTC(+p[0], +p[1]-1, +p[2]));
  }

  // localStorage helpers — wrapped in try/catch since private mode can throw
  function lsGet(key){
    if(!key) return null;
    try { var v = window.localStorage.getItem(key); return v?JSON.parse(v):null; }
    catch(e){ return null; }
  }
  function lsSet(key, value){
    if(!key) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch(e){ /* quota exceeded, private mode, etc — silently ignore */ }
  }
  function lsRemove(key){
    if(!key) return;
    try { window.localStorage.removeItem(key); }
    catch(e){}
  }

  // Build a meal-row key for tracker state. Stable across renders.
  function mealKey(m){
    return String(m.id || ((m.title||'') + '|' + (m.date||'')));
  }

  // ─── 1. TRACKER ────────────────────────────────────────────────────────────

  // Pull meal list from explicit data, or from window.TRIP if available.
  function gatherMeals(tracker){
    if(hasItems(tracker.meals)) return tracker.meals.slice();
    var trip = (typeof window!=='undefined') ? window.TRIP : null;
    if(!trip || !Array.isArray(trip.days)) return [];
    var seen={}, out=[];
    trip.days.forEach(function(d){
      if(!d || !Array.isArray(d.stops)) return;
      d.stops.forEach(function(s){
        if(!s || s.type!=='meal' || !s.title) return;
        // Skip suggestion meals that don't have a cover count assigned
        if(s.status==='suggestion' && !s.covers) return;
        var k = s.title+'|'+d.date;
        if(seen[k]) return;
        seen[k]=true;
        out.push({
          title:s.title, date:d.date, city:d.city, time:s.time,
          style:s.style, covers:s.covers, status:s.status,
          gerhardJoins:s.gerhardJoins
        });
      });
    });
    return out;
  }

  function trackerCard(tracker){
    if(!enabled(tracker)) return '';
    var meals = gatherMeals(tracker);
    var ticked = lsGet(tracker.storageKey) || [];
    var tickedSet = {}; ticked.forEach(function(k){ tickedSet[k]=true; });

    var rowsHtml = meals.length ? meals.map(function(m){
      var dt = parseISO(m.date), dl='';
      if(dt){
        dl = dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()].slice(0,3);
        if(m.time) dl += ' · ' + m.time;
      } else if(m.time){ dl = m.time; }
      var meta = [dl, m.city, m.style].filter(Boolean).join(' · ');
      var stxt = STATUS_LABEL[m.status] || m.status || '';
      var ptxt = m.covers ? (stxt+' · '+m.covers) : stxt;
      var gj = m.gerhardJoins ? ' <span class="gj">· Gerhard joins</span>' : '';
      var key = mealKey(m);
      var checkedClass = tickedSet[key] ? ' checked' : '';
      return '<div class="util-tr'+checkedClass+'" data-meal-key="'+esc(key)+'">'
        +'<div class="util-tr-info">'
        +  '<div class="n">'+esc(m.title)+gj+'</div>'
        +  '<div class="m">'+esc(meta)+'</div>'
        +'</div>'
        +'<span class="util-cp '+esc(m.status||'')+'">'+esc(ptxt)+'</span>'
      +'</div>';
    }).join('') : '<div class="util-empty">No meals to track yet — add to your itinerary data or window.TRIP.</div>';

    var legend = tracker.showLegend ?
      '<div class="util-legend">'
      +'<span class="util-b confirmed">Confirmed</span>'
      +'<span class="util-b requested">Requested</span>'
      +'<span class="util-b walk-in">Walk-in</span>'
      +'<span class="util-b self">Self-booked</span>'
      +'<span class="util-b suggestion">Suggestion</span>'
      +'</div>' : '';

    var noteHtml = tracker.note ? '<div class="util-note">'+tracker.note+'</div>' : '';

    return '<div class="util-card" data-section="tracker">'
      +'<h3>'+esc(tracker.title||'Confirmed Tables')+'</h3>'
      +noteHtml
      +legend
      +'<div class="util-tracker-rows">'+rowsHtml+'</div>'
      +'</div>';
  }

  function wireTracker(root, tracker){
    if(!enabled(tracker)) return;
    root.querySelectorAll('[data-meal-key]').forEach(function(row){
      var info = row.querySelector('.util-tr-info');
      if(!info) return;
      info.addEventListener('click', function(){
        row.classList.toggle('checked');
        // Persist
        var keys = [];
        root.querySelectorAll('.util-tr.checked').forEach(function(r){
          keys.push(r.getAttribute('data-meal-key'));
        });
        lsSet(tracker.storageKey, keys);
      });
    });
  }

  // ─── 2. DIETARY ────────────────────────────────────────────────────────────

  function dietaryCard(dietary){
    if(!enabled(dietary)) return '';

    var people = hasItems(dietary.people) ? dietary.people.map(function(p){
      var items = hasItems(p.items) ? p.items.map(function(it){
        return '<li><span class="it">'+esc(it.it||'')+'</span>'
          +'<span class="sv '+esc(it.svClass||'avoid')+'">'+esc(it.sv||'')+'</span></li>';
      }).join('') : '';
      var badge = hasItems(p.items) ? ' <span class="util-badge-mini">'+p.items.length+(p.items.length===1?' item':' items')+'</span>' : '';
      return '<div class="util-diet-person">'
        +'<div class="util-diet-name">'+esc(p.name||'')+badge+'</div>'
        +'<ul class="util-diet-list">'+items+'</ul>'
      +'</div>';
    }).join('') : '';

    var chef = '';
    if(enabled(dietary.showChef)){
      var c = dietary.showChef;
      var lines = hasItems(c.lines) ? c.lines.map(function(l){
        return '<div class="util-diet-jp-line">'+esc(l.ja||'')
          +(l.ro?'<span class="ro">'+esc(l.ro)+'</span>':'')+'</div>';
      }).join('') : '';
      var summary = c.summary ? '<div class="util-diet-jp-line summary">'
        +'<strong>'+esc(c.summary.jp||'')+'</strong>'
        +(c.summary.en?'<span class="ro">'+esc(c.summary.en)+'</span>':'')
        +'</div>' : '';
      chef = '<div class="util-diet-jp" role="note">'
        +'<div class="util-diet-jp-label">'+esc(c.label||'Show the chef')+'</div>'
        +lines
        +summary
        +(c.footer?'<div class="util-diet-jp-en">'+esc(c.footer)+'</div>':'')
        +'</div>';
    }

    var head = '<div class="util-diet-head"><h3>'+esc(dietary.title||'Dietary Notes')+'</h3>'
      +(dietary.showCritical!==false ? '<span class="util-crit">'+esc(dietary.criticalLabel||'Critical')+'</span>':'')
      +'</div>';
    var note = dietary.note ? '<div class="util-note">'+dietary.note+'</div>' : '';

    return '<div class="util-card" data-section="dietary">'+head+note+people+chef+'</div>';
  }

  // ─── 3. FX CONVERTER ───────────────────────────────────────────────────────

  function fxCard(fx){
    if(!enabled(fx)) return '';
    var rate = +(fx.rate) || 1;
    var initJpy = +(fx.initialJpy) || 10000;
    var initUsd = (initJpy/rate).toFixed(fx.rightDecimals==null?2:fx.rightDecimals);
    return '<div class="util-card" data-section="fx">'
      +'<h3>'+esc(fx.title||'¥ JPY · USD Converter')+'</h3>'
      +'<div class="util-fx">'
      +  '<div class="util-fxf"><label for="util-fx-jpy">'+esc(fx.leftLabel||'Japanese Yen')+'</label>'
      +    '<input id="util-fx-jpy" type="number" inputmode="numeric" value="'+initJpy+'" min="0"></div>'
      +  '<div class="util-fxsw" aria-hidden="true">⇄</div>'
      +  '<div class="util-fxf"><label for="util-fx-usd">'+esc(fx.rightLabel||'US Dollar')+'</label>'
      +    '<input id="util-fx-usd" type="number" inputmode="decimal" value="'+initUsd+'" min="0" step="0.01"></div>'
      +'</div>'
      +'<div class="util-fxrt"><span>1 USD = <strong id="util-fx-rate">'+rate+'</strong> JPY</span>'
      +  '<button type="button" id="util-fx-edit">edit</button></div>'
      +'</div>';
  }

  function wireFx(root, fx){
    if(!enabled(fx)) return;
    var jpyEl = root.querySelector('#util-fx-jpy');
    var usdEl = root.querySelector('#util-fx-usd');
    var rateEl = root.querySelector('#util-fx-rate');
    var editBtn = root.querySelector('#util-fx-edit');
    if(!jpyEl || !usdEl || !rateEl) return;

    var rate = +(fx.rate) || 1;
    var decimals = fx.rightDecimals==null ? 2 : fx.rightDecimals;

    function fromJpy(){
      var v = parseFloat(jpyEl.value);
      if(isNaN(v)){ usdEl.value=''; return; }
      usdEl.value = (v/rate).toFixed(decimals);
    }
    function fromUsd(){
      var v = parseFloat(usdEl.value);
      if(isNaN(v)){ jpyEl.value=''; return; }
      jpyEl.value = Math.round(v*rate);
    }
    jpyEl.addEventListener('input', fromJpy);
    usdEl.addEventListener('input', fromUsd);

    if(editBtn){
      editBtn.addEventListener('click', function(){
        var input = window.prompt('New rate — 1 USD = ? JPY', String(rate));
        if(input==null) return;
        var n = parseFloat(input);
        if(!isNaN(n) && n>0){
          rate = n;
          fx.rate = n;          // mutate live so re-renders preserve it
          rateEl.textContent = n;
          fromJpy();
        }
      });
    }
  }

  // ─── 4. ETIQUETTE ──────────────────────────────────────────────────────────

  function etiquetteCard(etq){
    if(!enabled(etq) || !hasItems(etq.blocks)) return '';
    var blocks = etq.blocks.map(function(b){
      var title = '<div class="util-et">'+esc(b.title||'')
        +(b.criticalLabel?' <span class="util-crit">'+esc(b.criticalLabel)+'</span>':'')
        +'</div>';
      var body;
      if(b.kind==='list' && hasItems(b.items)){
        body = '<ul>'+b.items.map(function(it){
          return '<li data-em="'+esc(it.em||'•')+'">'+(it.html||'')+'</li>';
        }).join('')+'</ul>';
      } else {
        body = b.html || '';
      }
      return '<div class="util-eb">'+title+body+'</div>';
    }).join('');
    return '<div class="util-card" data-section="etiquette">'
      +'<h3>'+esc(etq.title||'Dining Etiquette')+'</h3>'
      +blocks
      +'</div>';
  }

  // ─── 5. NOTES ──────────────────────────────────────────────────────────────

  function notesCard(nts){
    if(!enabled(nts) || !hasItems(nts.sections)) return '';
    var sections = nts.sections.map(function(s){
      var head = s.h4 ? '<h4>'+esc(s.h4)+'</h4>' : '';
      if(s.kind==='list' && hasItems(s.items)){
        var lis = s.items.map(function(it){
          return '<li data-em="'+esc(it.em||'•')+'">'+(it.html||'')+'</li>';
        }).join('');
        return head + '<ul class="util-nl">'+lis+'</ul>';
      }
      return head + (s.html||'');
    }).join('');
    return '<div class="util-card" data-section="notes">'
      +'<h3>'+esc(nts.title||'Travel Notes')+'</h3>'
      +sections
      +'</div>';
  }

  // ─── ORCHESTRATION ─────────────────────────────────────────────────────────

  function renderUtilities(){
    var root = document.getElementById('utilities-content');
    if(!root) return;
    var d = DATA || {};
    root.innerHTML =
        trackerCard(d.tracker)
      + dietaryCard(d.dietary)
      + fxCard(d.fx)
      + etiquetteCard(d.etiquette)
      + notesCard(d.notes);

    // Wire up interactive widgets
    wireTracker(root, d.tracker || {});
    wireFx(root, d.fx || {});
  }

  // Public API
  window.HCIUtilities = {
    render: renderUtilities,
    setData: function(data){ if(data && typeof data==='object'){ DATA = data; renderUtilities(); } },
    getData: function(){ return DATA; },
    setRate: function(jpyPerUsd){
      if(!DATA.fx) return;
      var n = parseFloat(jpyPerUsd);
      if(isNaN(n) || n<=0) return;
      DATA.fx.rate = n;
      var rateEl = document.getElementById('util-fx-rate');
      if(rateEl){ rateEl.textContent = n; }
      // Re-derive USD from current JPY
      var jpyEl = document.getElementById('util-fx-jpy');
      var usdEl = document.getElementById('util-fx-usd');
      if(jpyEl && usdEl){
        var v = parseFloat(jpyEl.value);
        if(!isNaN(v)){ usdEl.value = (v/n).toFixed(DATA.fx.rightDecimals==null?2:DATA.fx.rightDecimals); }
      }
    },
    clearTracker: function(){
      if(DATA.tracker && DATA.tracker.storageKey){ lsRemove(DATA.tracker.storageKey); }
      renderUtilities();
    }
  };

  // Auto-init if container exists at load time
  function autoInit(){ if(document.getElementById('utilities-content')) renderUtilities(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();
})();
/* ════ END UTILITIES TAB ════ */
