/* ════════════════════════════════════════════════════════════════════════════
   HCI EMERGENCY TAB — v1.0 — SCRIPT
   Source: gerhard-hci/hci-tab-library/emergency

   Self-contained module. Renders into <div id="emergency-content">.
   Auto-initialises on DOMContentLoaded if the container exists.

   API exposed on window.HCIEmergency:
     HCIEmergency.render()                   re-render
     HCIEmergency.setData(emergencyObj)      replace dataset at runtime
     HCIEmergency.getData()                  read the active dataset

   DATA SHAPE — every section is optional; pass null or [] to hide it,
   omit it to use the default (where one exists). See README.md for full
   schema and examples.

     EMERGENCY = {
       services: [             // defaults to Japan (110 police, 119 ambulance)
         { emoji:'🚓', label:'Police', number:'110' },
         { emoji:'🚑', label:'Ambulance / Fire', number:'119' }
       ],
       operatorTitle: 'Happy Camper · 24h',
       operatorContacts: [     // trip operator team — no default
         { emoji:'⛩', name:'Gerhard', role:'…', tel:'+8180…', primary:true }
       ],
       hospitals: [            // English-speaking hospitals — no default
         { emoji:'🏥', name:'…', note:'…', mapsQuery:'…' }
       ],
       embassiesTitle: 'Embassies',
       embassies: [            // nationality-specific — no default
         { emoji:'🇩🇪', name:'…', tel:'+813…' }
       ],
       phrases: [              // defaults to the standard HCI Japan set
         { ja:'…', romaji:'…', en:'…' }
       ]
     };

   EDIT BELOW: replace the EMERGENCY object with your trip's data.
   Sensible defaults are pre-filled for Japan emergency numbers and
   essential phrases — override only what's different per build.
   ════════════════════════════════════════════════════════════════════════════ */

/* ════ BEGIN EMERGENCY TAB v1.0 ════ */
(function(){
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// [EDIT] DATA — replace this EMERGENCY object with the contacts for your
// current build. Schema documented in README.
// ─────────────────────────────────────────────────────────────────────────────
  var EMERGENCY = {
    // Top-row services. Default = Japan (110 / 119). Override for other countries.
    services: [
      { emoji:'🚓', label:'Police',            number:'110' },
      { emoji:'🚑', label:'Ambulance / Fire',  number:'119' }
    ],

    // Trip-operator contacts. Defaults to standard Happy Camper team.
    operatorTitle: 'Happy Camper · 24h',
    operatorContacts: [
      { emoji:'⛩', name:'Gerhard', role:'Happy Camper · Japan line · WhatsApp',  tel:'+818069892107', primary:true },
      { emoji:'🍱', name:'Tomoko',  role:'Happy Camper · Tokyo office · backup line', tel:'+819061589006' }
    ],

    // English-speaking hospitals. Curate per trip's cities.
    hospitalsTitle: 'English-speaking hospitals',
    hospitals: [
      { emoji:'🏥', name:"St. Luke's International",   note:'Tokyo · Chuo · English staff 24/7',  mapsQuery:"St. Luke's International Hospital Tokyo" },
      { emoji:'🏥', name:'Tokyo Midtown Medical',      note:'Roppongi · International clinic',    mapsQuery:'Tokyo Midtown Medical Center' },
      { emoji:'🏥', name:'Japan Baptist Hospital',     note:'Kyoto · English-speaking staff',     mapsQuery:'Japan Baptist Hospital Kyoto' }
    ],

    // Embassies / consulates. Set per guest nationality. Defaults include
    // both German and US contacts — most HCI clients are one or the other.
    // For single-nationality groups, trim the list to just the relevant pair.
    embassiesTitle: 'Embassies',
    embassies: [
      { emoji:'🇩🇪', name:'German Embassy Tokyo',         tel:'+81357917700' },
      { emoji:'🇩🇪', name:'German Consulate Osaka',       tel:'+81664405070' },
      { emoji:'🇺🇸', name:'US Embassy Tokyo',             tel:'+81332245000' },
      { emoji:'🇺🇸', name:'US Consulate Osaka-Kobe',      tel:'+81663155900' }
    ],

    // Essential Japanese phrases. Default set covers reservation, thanks, help.
    phrasesTitle: 'Essential Japanese',
    phrases: [
      { ja:'予約しています',     romaji:'Yoyaku shiteimasu',     en:'I have a reservation' },
      { ja:'ご馳走様でした',     romaji:'Gochisousama deshita',  en:'Thank you for the meal (after eating)' },
      { ja:'いただきます',       romaji:'Itadakimasu',           en:'Thank you for the meal (before eating)' },
      { ja:'ありがとうございます', romaji:'Arigatou gozaimasu',  en:'Thank you (polite)' },
      { ja:'すみません',         romaji:'Sumimasen',             en:"Excuse me / I'm sorry" },
      { ja:'英語を話せますか',   romaji:'Eigo o hanasemasu ka',  en:'Do you speak English?' },
      { ja:'助けてください',     romaji:'Tasukete kudasai',      en:'Please help me' }
    ]
  };

// ─────────────────────────────────────────────────────────────────────────────
// RENDERING — do not modify below this line when porting.
// ─────────────────────────────────────────────────────────────────────────────

  var DATA = EMERGENCY;

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function gmUrl(q){return 'https://maps.google.com/?q='+encodeURIComponent(q||'');}
  function telUrl(t){return 'tel:'+String(t||'').replace(/[^+0-9]/g,'');}
  function hasItems(a){return Array.isArray(a)&&a.length>0;}

  // — Section builders. Each returns an HTML string or '' if data is empty.

  function servicesCard(services){
    if(!hasItems(services)) return '';
    var btns = services.map(function(s){
      return '<a class="em-eb-btn" href="'+esc(telUrl(s.number))+'">'
        +'<span class="l">'+esc(s.emoji||'')+' '+esc(s.label||'')+'</span>'
        +'<span class="v">'+esc(s.number||'')+'</span>'
        +'</a>';
    }).join('');
    return '<div class="em-card">'
      +'<h3>Direct Contacts</h3>'
      +'<p class="em-card-sub">One-tap calling · Available 24 hours</p>'
      +'<div class="em-eg">'+btns+'</div>'
      +'</div>';
  }

  function operatorCard(title,contacts){
    if(!hasItems(contacts)) return '';
    var rows = contacts.map(function(c,i){
      // First contact uses the dark "primary" button; others use the outlined "alt"
      var altClass = (c.primary===true || (c.primary!==false && i===0)) ? '' : ' alt';
      return '<div class="em-cr">'
        +'<div><div class="n">'+esc(c.emoji||'')+' '+esc(c.name||'')+'</div>'
        +'<div class="r">'+esc(c.role||'')+'</div></div>'
        +'<a class="em-cb'+altClass+'" href="'+esc(telUrl(c.tel))+'">Call</a>'
        +'</div>';
    }).join('');
    return '<div class="em-card"><h3>'+esc(title||'Operator')+'</h3>'+rows+'</div>';
  }

  function hospitalsCard(title,hospitals){
    if(!hasItems(hospitals)) return '';
    var rows = hospitals.map(function(h){
      return '<div class="em-cr">'
        +'<div><div class="n">'+esc(h.emoji||'🏥')+' '+esc(h.name||'')+'</div>'
        +'<div class="r">'+esc(h.note||'')+'</div></div>'
        +'<a class="em-cb alt" href="'+esc(gmUrl(h.mapsQuery||h.name))+'" target="_blank" rel="noopener">Map</a>'
        +'</div>';
    }).join('');
    return '<div class="em-card"><h3>'+esc(title||'Hospitals')+'</h3>'+rows+'</div>';
  }

  function embassiesCard(title,embassies){
    if(!hasItems(embassies)) return '';
    var rows = embassies.map(function(e){
      return '<div class="em-cr">'
        +'<div><div class="n">'+esc(e.emoji||'')+' '+esc(e.name||'')+'</div>'
        +'<div class="r">'+esc(e.tel||'')+'</div></div>'
        +'<a class="em-cb" href="'+esc(telUrl(e.tel))+'">Call</a>'
        +'</div>';
    }).join('');
    return '<div class="em-card"><h3>'+esc(title||'Embassies')+'</h3>'+rows+'</div>';
  }

  function phrasesCard(title,phrases){
    if(!hasItems(phrases)) return '';
    var rows = phrases.map(function(p){
      return '<div class="em-ph">'
        +'<div class="ja">'+esc(p.ja||'')+'</div>'
        +'<div class="ro">'+esc(p.romaji||'')+'</div>'
        +'<div class="en">'+esc(p.en||'')+'</div>'
        +'</div>';
    }).join('');
    return '<div class="em-card"><h3>'+esc(title||'Essential Phrases')+'</h3>'+rows+'</div>';
  }

  function renderEmergency(){
    var el = document.getElementById('emergency-content');
    if(!el) return;
    var d = DATA || {};
    el.innerHTML =
        servicesCard(d.services)
      + operatorCard(d.operatorTitle, d.operatorContacts)
      + hospitalsCard(d.hospitalsTitle, d.hospitals)
      + embassiesCard(d.embassiesTitle, d.embassies)
      + phrasesCard(d.phrasesTitle, d.phrases);
  }

  // Public API
  window.HCIEmergency = {
    render: renderEmergency,
    setData: function(data){ if(data && typeof data==='object'){ DATA = data; renderEmergency(); } },
    getData: function(){ return DATA; }
  };

  // Auto-init if container exists at load time
  function autoInit(){ if(document.getElementById('emergency-content')) renderEmergency(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',autoInit);
  else autoInit();
})();
/* ════ END EMERGENCY TAB ════ */

