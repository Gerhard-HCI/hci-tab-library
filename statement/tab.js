/* =====================================================================
   HCI TAB LIBRARY · statement/tab.js   (self-contained module)

   Password-protected financial statement with two-tier reveal:
     guest code  -> charges + balance only
     staff code  -> same, plus cost / profit / margin
   Plus a Stripe pay button, idle auto-lock, and a #encrypt console that
   builds both encrypted blobs from one master sheet.

   Wrapped in an IIFE so it will NOT clash with $ / usd / etc. that your
   host HCI site already defines. It exposes a tiny API:
       HCIStatement.init()   -> call once from your host init()
       HCIStatement.lock()   -> call when leaving the Statement tab

   EDIT POINTS: ENC_GUEST, ENC_INTERNAL (regenerate in #encrypt) and
   TIMEOUT_SEC below. Never place cost/profit anywhere but ENC_INTERNAL.
   ===================================================================== */
(function(){
"use strict";

/* ---- EDIT: encrypted blobs (regenerate together in the #encrypt console)
        demo codes for the blanks below: GUEST  and  STAFF ---- */
const ENC_GUEST = "i307iBWSievDkCMZUtOPjZ430L1agWAFDLL+/b3DG5+GkICiRgClaP4BACDD3TXH9LtACIq845UH1P5wHz5qsriKQOMKzyK8QJhuPdk2mBJJN74ZuybcE9bh0FdkJask0luORvfJxGMw1i1JKGx+8fbt8AaCgcJ4wuKVkVjtjo++gSi94pzf4srIkCE/GJOzA/C7933Qc4NeC4/AV2fJ1j2ziuqMGWyYWbnHtmTFkgY5vVuth76f7rmeJdUCvAHLJOhyNcSSUl7uZWWxJ8sYilI2kPtlONUpJxP3mkAbrgvD3oF3DAp0e+Nssho7n7m1Cry3sD2rPMf6vjoR/70x4Mdz+Ux4UxfotEqNtBvvpr43ogaxzGMqDTrTC9VHTaHhmfSLwnI2pJ39AXyQd+vgXnIPxF0vWUy1DW+cjuAoKEUSPKrBLdbyDIjdgiXo3GTCvwNI1e1SFiQxBtxVAOZo56upLfL0pGIlMm8eOcVgOFPSMzINhTR5g9UUBQdTHF39bq5Z/GP3cRswH6/HJypsnktU6U5Tl8pxdl4elwLtfGF+xqz+M+3YsgUY1Z/MvfV9oc3muVHowopGpDJS5qbiRqSvSzZ+lwXNZUZ1p0SfgSiIfCdD3d+gsZ3P90nomOIYkxigEj8d35pD/OPgGphHIsYboaLTaHg6wiu6seu5weMgO7/X+9qLhp0WRs9ANhi6RCaTBE+kqNdI4/na0huxwKCly1Mz9L17lDf3cT/ZfFYyytsIWs1eDrkettCgjNusbIJzgHZvfr1r24jFt0BT0a4=";
const ENC_INTERNAL = "I4JQ4v9a+z3KZ+uG2FseUlvF0WpSBiViDsQSU4Gt3vkww1Kv86QBGn2MwkOmqu1KgPEohKtPspMDJDHnbhQcG+VaQnhcuoDJZcjSKPWt/Q6NRUTDHUN5wyp2SlaGczEhVI52uAE5jHlSf1UUzURbr3qwyzNkhemsa6uEdnrQG0hvOM+LvOTzU2rSp6eJDuvcU1im87rMeGbBZbifpHWSGNlvEfMBt7BYhwfCho0iV1sh1y8J+wfwsXDlBvWhVfbgXwhmMmBKRQalWXw79KTVal7ysBrYos6o34TI/6UHd1XNJrLDXmA7VxnaXf7os+Yk/jCklpe5jXhPF9r4IoeMlK3yQftnmDaOx9z0fDE4tiqxl52smxJWhcTfb/mSY7uXNTt8NfBSEl4wsmkN+nfRv4/Zpp2g6HrHvEnokBZKRWVGZHkcETbjg45573BYXI34a8NFpJrgBZwLNpDCI80ZJZ3TReUAu2pPr+HrFOhKTArERdiYKbtupWCiU8KLzxFvwF5cyYAV6eTbDIliNiztIzbhyIBLMeQDtyARxJ86KRJeEdNBjmJzxkof1SjnFdSQcz97FbRneLPTLOUSEYYUqtMJuRUTWF4eISx1vIpjb8vfKqhVC5hKl8KvqnAE4gGurtNVTS04vNSS74Ov8YQRSfX9TCNKtibh93c0jWtr+gXL4K4dC5cNzDDcILsZLTDNcBOhG+x5Chx6hESChFk0MqPq+pHL0CsEQrAGTz2ffZvh5369lGazcx0RieCVkM+XX4AFDQNROkkFWhQp/7onXP8Ub98pNwDV3onh8hkHGIgb3Gsbmbs3XAZ8Ao4hg4RALmQ0";

/* ---- EDIT: idle auto-lock in seconds (0 = never) ---- */
const TIMEOUT_SEC = 120;

/* ---- tiny private helpers (do not leak to the page) ---- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const usd = n => "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
function parseDate(iso){ const [y,m,d] = iso.split("-").map(Number); return new Date(y, m-1, d); }

/* ============================ CRYPTO ============================== *
 * AES-256-GCM with a PBKDF2(SHA-256) key. Blob = base64(salt|iv|ct).  */
const PBKDF2_ITERATIONS = 250000;
const SALT_LEN = 16, IV_LEN = 12;
const _enc = new TextEncoder(), _dec = new TextDecoder();

function cryptoReady(){ return !!(window.crypto && window.crypto.subtle); }

function b64encode(bytes){
  const b = new Uint8Array(bytes); let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function b64decode(str){
  const s = atob(str.trim()); const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
async function deriveKey(password, salt){
  const base = await crypto.subtle.importKey("raw", _enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name:"PBKDF2", salt, iterations:PBKDF2_ITERATIONS, hash:"SHA-256" },
    base, { name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]
  );
}
async function encryptText(password, plaintext){
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name:"AES-GCM", iv }, key, _enc.encode(plaintext)));
  const out = new Uint8Array(salt.length + iv.length + ct.length);
  out.set(salt, 0); out.set(iv, SALT_LEN); out.set(ct, SALT_LEN + IV_LEN);
  return b64encode(out);
}
async function decryptText(password, blob){
  const data = b64decode(blob);
  const salt = data.slice(0, SALT_LEN);
  const iv = data.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const ct = data.slice(SALT_LEN + IV_LEN);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, ct);
  return _dec.decode(pt);   // throws on wrong password (GCM auth fail)
}

function payUrl(st){
  if (!st.payLink) return null;
  let u = st.payLink.trim();
  if (!/^https?:\/\//i.test(u)) return null;          // only real links
  if (st.payRef && !/client_reference_id=/.test(u)){
    u += (u.indexOf("?") >= 0 ? "&" : "?") + "client_reference_id=" + encodeURIComponent(st.payRef);
  }
  return u;
}

/* ============================ STATEMENT =========================== */
function computeTotals(st){
  let total = 0, cost = 0;
  const secs = (st.sections || []).map(sec => {
    const items = sec.items || [];
    const sub = items.reduce((a,i) => a + (Number(i.amount)||0), 0);
    const csub = items.reduce((a,i) => a + (Number(i.cost)||0), 0);
    total += sub; cost += csub;
    return { ...sec, _sub: sub, _cost: csub };
  });
  total += Number(st.arrangementFee)||0;
  const paid = (st.payments || []).reduce((a,p) => a + (Number(p.amount)||0), 0);
  const profit = total - cost;
  return { secs, total, cost, profit, margin: total>0 ? profit/total : 0, paid, outstanding: total - paid };
}

function renderStatement(st, internal){
  const t = computeTotals(st);
  const { secs, total, paid, outstanding } = t;
  const balZero = outstanding <= 0;

  let html = "";
  if (internal){
    html += '<div class="stmt-internal-banner">Internal view · cost &amp; margin visible — do not show to guests</div>';
  }
  html += '<div class="card">';
  html += '<div class="stmt-head">' +
    '<div class="stmt-as">Statement · as of ' +
      parseDate(st.asOf).toLocaleDateString("en-US",{day:"numeric",month:"long",year:"numeric"}) + '</div>' +
    '<div class="stmt-balance' + (balZero?" zero":"") + '">' + usd(outstanding) + '</div>' +
    '<div class="stmt-blabel">' + (balZero ? "Balance settled — thank you" : "Remaining outstanding balance") + '</div>' +
  '</div>';

  // --- Pay area: live for guest w/ link, greyed for internal or no link ---
  const pu = payUrl(st);
  if (!balZero){
    if (internal){
      html += '<div class="stmt-pay-cta">' +
        '<div class="paybtn disabled">' + (pu ? 'Guest payment link active' : 'No payment link set yet') + '</div>' +
        '<div class="paybtn-sub">' + (pu ? 'The guest sees a live Pay button here.' : 'Add a payLink in the console so the guest can pay.') + '</div>' +
      '</div>';
    } else if (pu){
      html += '<div class="stmt-pay-cta">' +
        '<a class="paybtn" href="' + pu + '" target="_blank" rel="noopener">Pay outstanding balance · ' + usd(outstanding) + '</a>' +
        '<div class="paybtn-sub">Secure checkout via Stripe · opens in a new tab</div>' +
      '</div>';
    } else {
      html += '<div class="stmt-pay-cta">' +
        '<div class="paybtn disabled">Payment link not yet available</div>' +
        '<div class="paybtn-sub">A secure payment link will appear here once the invoice is issued.</div>' +
      '</div>';
    }
  }

  secs.forEach(sec => {
    html += '<div class="stmt-sec">';
    html += '<div class="stmt-sec-h"><span class="n">' + sec.name + '</span>' +
            '<span class="v">' + usd(sec._sub) + '</span></div>';
    if (sec.note) html += '<div class="stmt-sec-note">' + sec.note + '</div>';
    (sec.items||[]).forEach(it => {
      const incl = (Number(it.amount)||0) === 0;
      const prof = (Number(it.amount)||0) - (Number(it.cost)||0);
      const profStr = (prof < 0 ? "-" + usd(Math.abs(prof)) : usd(prof));
      const intLine = (internal && it.cost != null)
        ? '<div class="li-int">cost ' + usd(it.cost) + ' · profit ' + profStr + '</div>'
        : "";
      html += '<div class="stmt-li"><div><div class="li-l">' + it.label + '</div>' +
        (it.note ? '<div class="li-n">' + it.note + '</div>' : "") + intLine + '</div>' +
        '<div class="li-v' + (incl?" incl":"") + '">' + (incl ? "included" : usd(it.amount)) + '</div></div>';
    });
    html += '</div>';
  });

  if ((Number(st.arrangementFee)||0) !== 0){
    html += '<div class="stmt-sec"><div class="stmt-sec-h"><span class="n">Arrangement fee</span>' +
            '<span class="v">' + usd(st.arrangementFee) + '</span></div></div>';
  }

  html += '<div class="stmt-total"><span class="n">Total services &amp; charges</span>' +
          '<span class="v">' + usd(total) + '</span></div>';

  if (internal){
    html += '<div class="stmt-pl">' +
      '<div class="pl-row"><span>Revenue</span><span>' + usd(total) + '</span></div>' +
      '<div class="pl-row"><span>Cost</span><span>' + usd(t.cost) + '</span></div>' +
      '<div class="pl-row profit"><span>Profit</span><span>' + usd(t.profit) + '</span></div>' +
      '<div class="pl-row"><span>Margin</span><span>' + (t.margin*100).toFixed(1) + '%</span></div>' +
    '</div>';
  }

  html += '<div class="stmt-pay"><div class="stmt-sec-h" style="border-top:0;padding-top:14px">' +
          '<span class="n">Payments received</span><span class="v">' + usd(paid) + '</span></div>';
  if (!(st.payments && st.payments.length)){
    html += '<div class="empty">No payments recorded yet.</div>';
  } else {
    st.payments.forEach(p => {
      html += '<div class="stmt-li"><div class="li-l">' + (p.label||"Payment") +
        (p.date ? ' · ' + p.date : "") + '</div><div class="li-v">' + usd(p.amount) + '</div></div>';
    });
  }
  html += '</div>';

  if (st.fxNote) html += '<div class="stmt-fx">' + st.fxNote + '</div>';
  html += '</div>';
  html += '<button class="stmt-lockbtn" id="stmt-relock">🔒 Lock &amp; log out</button>';

  $("#stmt-view").innerHTML = html;
  $("#stmt-lock").style.display = "none";
  $("#stmt-relock").addEventListener("click", () => lockStatement());
  stmtUnlocked = true;
  armStmtTimer();
}

let stmtUnlocked = false, stmtTimer = null;
function clearStmtTimer(){ if (stmtTimer){ clearTimeout(stmtTimer); stmtTimer = null; } }
function armStmtTimer(){
  clearStmtTimer();
  const secs = TIMEOUT_SEC;
  if (secs > 0) stmtTimer = setTimeout(() => lockStatement(true), secs * 1000);
}

function lockStatement(auto){
  clearStmtTimer();
  stmtUnlocked = false;
  $("#stmt-view").innerHTML = "";
  $("#stmt-lock").style.display = "";
  $("#stmt-pw").value = "";
  $("#stmt-err").textContent = (auto === true) ? "Session locked for security — re-enter your code." : "";
}

async function unlockStatement(){
  const pw = $("#stmt-pw").value.trim();
  const err = $("#stmt-err");
  err.textContent = "";
  if (!pw){ err.textContent = "Please enter your access code."; return; }
  if (!cryptoReady()){
    err.textContent = "Secure view needs an https connection — open the published link, not a local file.";
    return;
  }
  const btn = $("#stmt-unlock"); const label = btn.textContent; btn.textContent = "…";
  try{
    try{ renderStatement(JSON.parse(await decryptText(pw, ENC_GUEST)), false); return; }
    catch(_g){}
    try{ renderStatement(JSON.parse(await decryptText(pw, ENC_INTERNAL)), true); return; }
    catch(_i){}
    err.textContent = "That code didn’t work. Please check and try again.";
  }finally{
    btn.textContent = label;
  }
}

/* ===================== ENCRYPT CONSOLE (#encrypt) ================= */
const TEMPLATE = {
  tripTitle: "Trip name", guest: "Guest name(s)",
  asOf: new Date().toISOString().slice(0,10), currency: "USD",
  fxNote: "USD figures converted from JPY at the prevailing exchange rate.",
  arrangementFee: 0,
  payLink: "",   // Stripe link (buy.stripe.com/... or invoice.stripe.com/...)
  payRef: "",    // optional reconciliation tag -> client_reference_id
  // "cost" per item is INTERNAL only -> auto-removed from the guest blob.
  sections: [
    { name:"Restaurant", note:"", items:[ { label:"", amount:0, cost:0, note:"" } ] },
    { name:"Activity", items:[ { label:"", amount:0, cost:0 } ] },
    { name:"Out-of-pocket expenses", items:[ { label:"", amount:0, cost:0 } ] },
    { name:"Cancellation fees", items:[ { label:"", amount:0, cost:0 } ] }
  ],
  payments: []
};

// Remove internal-only fields so the guest blob never carries cost.
function stripInternal(master){
  const g = JSON.parse(JSON.stringify(master));
  (g.sections || []).forEach(s => (s.items || []).forEach(it => { delete it.cost; }));
  return g;
}

function setupConsole(){
  const open = () => $("#console").classList.add("show");
  if (location.hash === "#encrypt") open();
  window.addEventListener("hashchange", () => {
    if (location.hash === "#encrypt") open();
  });
  $("#con-close").addEventListener("click", () => {
    $("#console").classList.remove("show");
    if (location.hash === "#encrypt") history.replaceState(null,"",location.pathname);
  });

  const msg = (m, ok) => { const e=$("#con-msg"); e.textContent=m; e.style.color = ok? "#9DBE8C":"#D69A9A"; };

  $("#con-template").addEventListener("click", () => {
    $("#con-json").value = JSON.stringify(TEMPLATE, null, 2);
    msg("Blank template loaded — cost = internal only.", true);
  });

  $("#con-load").addEventListener("click", async () => {
    const pw = $("#con-pw-internal").value.trim();
    if (!pw){ msg("Enter the internal code to load the master sheet."); return; }
    if (!cryptoReady()){ msg("Open via https to use encryption."); return; }
    try{
      const j = await decryptText(pw, ENC_INTERNAL);
      $("#con-json").value = JSON.stringify(JSON.parse(j), null, 2);
      msg("Loaded master statement — edit, then re-encrypt.", true);
    }catch(e){ msg("Wrong internal code, or nothing saved yet. Use ‘Blank template’."); }
  });

  $("#con-encrypt").addEventListener("click", async () => {
    const gpw = $("#con-pw-guest").value.trim();
    const ipw = $("#con-pw-internal").value.trim();
    if (!gpw || !ipw){ msg("Enter BOTH the guest and internal codes."); return; }
    if (gpw === ipw){ msg("Use two different codes for guest and internal."); return; }
    if (!cryptoReady()){ msg("Open via https to use encryption."); return; }
    let master;
    try{ master = JSON.parse($("#con-json").value); }
    catch(e){ msg("That isn’t valid JSON — check for a stray comma or quote."); return; }
    try{
      const gBlob = await encryptText(gpw, JSON.stringify(stripInternal(master)));
      const iBlob = await encryptText(ipw, JSON.stringify(master));
      $("#con-out-guest").value = gBlob;
      $("#con-out-internal").value = iBlob;
      msg("Done. Paste 3a into ENC_GUEST and 3b into ENC_INTERNAL, then commit.", true);
    }catch(e){ msg("Encryption failed: " + e.message); }
  });

  const copyBox = async (id) => {
    const v = $(id).value;
    if (!v){ msg("Nothing to copy yet — encrypt first."); return; }
    try{ await navigator.clipboard.writeText(v); msg("Copied to clipboard.", true); }
    catch(e){ $(id).select(); msg("Select-all done — copy manually."); }
  };
  $("#con-pay-add").addEventListener("click", () => {
    let master;
    try{ master = JSON.parse($("#con-json").value); }
    catch(e){ msg("Load the master sheet first (Load current, or Blank template)."); return; }
    const amt = parseFloat($("#con-pay-amt").value);
    if (!amt || amt <= 0){ msg("Enter a payment amount in USD."); return; }
    if (!Array.isArray(master.payments)) master.payments = [];
    master.payments.push({
      date: $("#con-pay-date").value || new Date().toISOString().slice(0,10),
      amount: amt,
      label: $("#con-pay-label").value.trim() || "Payment"
    });
    $("#con-json").value = JSON.stringify(master, null, 2);
    $("#con-pay-amt").value = ""; $("#con-pay-label").value = "";
    msg("Payment added. Now tap ‘Encrypt & generate both blobs’.", true);
  });

  $("#con-copy-guest").addEventListener("click", () => copyBox("#con-out-guest"));
  $("#con-copy-internal").addEventListener("click", () => copyBox("#con-out-internal"));
}

/* ---- public API ---- */
function init(){
  $("#stmt-unlock").addEventListener("click", unlockStatement);
  $("#stmt-pw").addEventListener("keydown", e => { if (e.key === "Enter") unlockStatement(); });
  setupConsole();
  ["click","touchstart","keydown","scroll"].forEach(ev =>
    document.addEventListener(ev, () => { if (stmtUnlocked) armStmtTimer(); }, { passive:true }));
}
window.HCIStatement = { init: init, lock: function(){ lockStatement(); } };
})();

