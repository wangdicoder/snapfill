import type { AutofillMappings } from './types';

/**
 * Self-contained form detector script (IIFE) for WebView injection.
 * Detects form fields, classifies them, and posts results via postMessage.
 */
export const formDetectorScript = `(function(){
'use strict';
if(window.__snapfillDetectorInit)return;
window.__snapfillDetectorInit=true;

var AC={
'given-name':'firstName','first-name':'firstName','family-name':'lastName','last-name':'lastName',
'honorific-prefix':'honorific','name':'firstName',
'cc-number':'ccNumber','cc-name':'ccName','cc-exp':'ccExpiry',
'cc-exp-month':'ccExpiryMonth','cc-exp-year':'ccExpiryYear','cc-csc':'ccCCV','cc-type':'ccType',
email:'email',tel:'phoneNumber','tel-national':'phoneNumber','tel-country-code':'phoneCountryCode',
'address-line1':'postalAddressLine1','address-line2':'postalAddressLine2',
'address-level2':'postalSuburb','address-level1':'postalState',
'postal-code':'postalPostCode',country:'postalCountry','country-name':'postalCountry',
'street-address':'postalAddressLine1'
};

var RX=[
{p:/card.?num|cc.?num|cc-?number|\\bpan\\b/i,f:'ccNumber'},
{p:/card.?name|name.?on.?card|cc.?name|cardholder/i,f:'ccName'},
{p:/cvv|cvc|ccv|security.?code|card.?code|card.?verif|cvd|csv/i,f:'ccCCV'},
{p:/exp.*month|cc.?month|card.?month/i,f:'ccExpiryMonth'},
{p:/exp.*year|cc.?year|card.?year/i,f:'ccExpiryYear'},
{p:/expir.*dat|exp.?dat|cc.?exp(?!.*(?:month|year))/i,f:'ccExpiry'},
{p:/card.?type|cc.?type|payment.?method/i,f:'ccType'},
{p:/first.?name|given.?name|\\bfname\\b|Name_First|Name\\.first/i,f:'firstName'},
{p:/last.?name|family.?name|surname|\\blname\\b|Name_Last|Name\\.last/i,f:'lastName'},
{p:/middle.?name|Name_Middle|Name\\.middle|\\bmname\\b|middle.?initial/i,f:'middleName'},
{p:/honorific|Name_Prefix|name.?prefix|salutation/i,f:'honorific'},
{p:/name.?suffix|Name_Suffix|\\bsuffix\\b/i,f:'nameSuffix'},
{p:/full.?name|your.?name|customer.?name|\\bname\\b/i,f:'fullName'},
{p:/e.?mail/i,f:'email'},
{p:/phone.?country|phone.?code|dial.?code|tel.?code/i,f:'phoneCountryCode'},
{p:/phone|mobile|\\btel\\b|telephone|Telecom.?Phone/i,f:'phoneNumber'},
{p:/street.?line.?2|address.?2|address.?line.?2|\\bapt\\b|\\bsuite\\b|\\bunit\\b|\\baddr2\\b/i,f:'postalAddressLine2'},
{p:/street.?line.?1|address.?1|address.?line.?1|street.?addr|\\baddr1\\b/i,f:'postalAddressLine1'},
{p:/street.?line|street.?addr|\\baddress\\b/i,f:'postalAddressLine1'},
{p:/street.?num/i,f:'postalStreetNumber'},
{p:/street.?name/i,f:'postalStreetName'},
{p:/street.?type/i,f:'postalStreetType'},
{p:/city|suburb|\\btown\\b|locality|Postal_City/i,f:'postalSuburb'},
{p:/\\bstate\\b|province|\\bregion\\b|StateProv/i,f:'postalState'},
{p:/\\bzip\\b|postal.?code|postcode|\\bpost.?code\\b|PostalCode/i,f:'postalPostCode'},
{p:/country.?code|country.?name|\\bcountry\\b/i,f:'postalCountry'}
];

var TM={email:'email',tel:'phoneNumber'};

function isBill(el){
var n=el.getAttribute('name')||'',id=el.id||'';
if(/bill/i.test(n)||/bill/i.test(id))return true;
var p=el.parentElement;
for(var i=0;i<5&&p;i++){
var c=p.className||'',pi=p.id||'',pn=p.getAttribute('name')||'';
if(/bill/i.test(c)||/bill/i.test(pi)||/bill/i.test(pn))return true;
if(p.tagName==='FIELDSET'){var lg=p.querySelector('legend');if(lg&&/bill/i.test(lg.textContent))return true;}
p=p.parentElement;}
return false;}

function bc(f,el){if(f&&f.startsWith('postal')&&isBill(el))return f.replace('postal','billing');return f;}

function labelOf(el){
if(el.id){try{var l=document.querySelector('label[for="'+CSS.escape(el.id)+'"]');if(l)return l.textContent||'';}catch(e){}}
var pl=el.closest('label');if(pl)return pl.textContent||'';
var lb=el.getAttribute('aria-labelledby');if(lb){var le=document.getElementById(lb);if(le)return le.textContent||'';}
var pv=el.previousElementSibling;
if(pv&&(pv.tagName==='LABEL'||pv.tagName==='SPAN'||pv.tagName==='TD'))return pv.textContent||'';
if(el.parentElement&&el.parentElement.tagName==='TD'){var pt=el.parentElement.previousElementSibling;if(pt&&pt.tagName==='TD')return pt.textContent||'';}
return '';}

function byAC(el){
if(el.type==='hidden'||el.type==='submit'||el.type==='button'||el.type==='radio'||el.type==='checkbox')return null;
if(el.disabled||el.readOnly)return null;
var ac=(el.getAttribute('autocomplete')||'').trim().toLowerCase();
if(!ac||ac==='off'||ac==='on')return null;
var tk=ac.split(/\\s+/),sec=null,ft=null;
for(var i=0;i<tk.length;i++){if(tk[i]==='shipping'||tk[i]==='billing')sec=tk[i];else if(AC[tk[i]])ft=tk[i];}
if(!ft)return null;
var m=AC[ft];
if(sec==='billing'&&m.startsWith('postal'))m=m.replace('postal','billing');
if(!sec)m=bc(m,el)||m;
return m;}

function byRX(el){
if(el.type==='hidden'||el.type==='submit'||el.type==='button'||el.type==='radio'||el.type==='checkbox')return null;
if(el.disabled||el.readOnly)return null;
var s=[el.getAttribute('name')||'',el.getAttribute('id')||'',el.getAttribute('placeholder')||'',el.getAttribute('aria-label')||''].join(' ');
if(s.trim()){for(var i=0;i<RX.length;i++)if(RX[i].p.test(s))return bc(RX[i].f,el)||RX[i].f;}
var t=(el.getAttribute('type')||'').toLowerCase();if(TM[t])return TM[t];
var lt=labelOf(el);
if(lt.trim()){for(var j=0;j<RX.length;j++)if(RX[j].p.test(lt))return bc(RX[j].f,el)||RX[j].f;}
return null;}

function isVis(el){if(!el)return false;var s=window.getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&el.offsetParent!==null;}

window.__snapfillFieldMap=new Map();

function scan(root){
var els=(root||document).querySelectorAll('input, select, textarea');
var df=new Set();
window.__snapfillFieldMap.clear();
els.forEach(function(el){var f=byAC(el);if(f){df.add(f);if(!window.__snapfillFieldMap.has(f)||!isVis(window.__snapfillFieldMap.get(f)))window.__snapfillFieldMap.set(f,el);}});
els.forEach(function(el){var f=byRX(el);if(f){df.add(f);if(!window.__snapfillFieldMap.has(f)||!isVis(window.__snapfillFieldMap.get(f)))window.__snapfillFieldMap.set(f,el);}});
return Array.from(df);}

var dt=null,lr='';
function report(){clearTimeout(dt);dt=setTimeout(function(){
var f=scan(document),k=f.sort().join(',');
if(k!==lr){lr=k;
var msg=JSON.stringify({type:'formDetected',fields:f});
if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage)window.ReactNativeWebView.postMessage(msg);
else if(window.parent!==window)window.parent.postMessage({snapfill:true,type:'formDetected',fields:f},'*');
}},500);}

var md=null;
new MutationObserver(function(){clearTimeout(md);md=setTimeout(report,300);}).observe(document.body,{childList:true,subtree:true});
report();
})();`;

/**
 * Self-contained cart detector script (IIFE) for WebView injection.
 */
export const cartDetectorScript = `(function(){
'use strict';
if(window.__snapfillCartInit)return;
window.__snapfillCartInit=true;

function p2c(s){
if(typeof s==='number')return Math.round(s*100);
if(!s||typeof s!=='string')return 0;
var c=s.replace(/[^0-9.,\\-]/g,'').trim();if(!c)return 0;
var lc=c.lastIndexOf(','),lp=c.lastIndexOf('.');
var a;if(lc>lp)a=parseFloat(c.replace(/\\./g,'').replace(',','.'));else a=parseFloat(c.replace(/,/g,''));
return isNaN(a)?0:Math.round(a*100);}

function dCur(s,m){
if(m)return m.toUpperCase();if(!s||typeof s!=='string')return null;
if(/A\\$/.test(s))return'AUD';if(/NZ\\$/.test(s))return'NZD';if(/US\\$/.test(s))return'USD';
if(/CA\\$|C\\$/.test(s))return'CAD';if(/£/.test(s))return'GBP';if(/€/.test(s))return'EUR';if(/¥/.test(s))return'JPY';
var h=window.location.hostname;
if(/\\.co\\.uk$|\\.uk$/.test(h))return'GBP';if(/\\.com\\.au$|\\.au$/.test(h))return'AUD';
if(/\\.co\\.nz$|\\.nz$/.test(h))return'NZD';if(/\\.ca$/.test(h))return'CAD';
return null;}

function fromLD(){
var ss=document.querySelectorAll('script[type="application/ld+json"]'),ps=[],cur=null,tot=0;
ss.forEach(function(s){try{var d=JSON.parse(s.textContent),items=Array.isArray(d)?d:d['@graph']?d['@graph']:[d];
items.forEach(function(it){var t=it['@type'];
if(t==='Product'||t==='IndividualProduct'){var o=it.offers||it.offer||{};if(Array.isArray(o))o=o[0]||{};
var pr=o.price||it.price||0,pc=o.priceCurrency||it.priceCurrency||null;if(pc)cur=pc;
var img=it.image;var iu=typeof img==='string'?img:Array.isArray(img)?img[0]||null:img&&img.url||null;
ps.push({name:it.name||null,quantity:1,itemPrice:p2c(pr),lineTotal:p2c(pr),url:it.url||null,imageUrl:iu});}
if(t==='Order'||t==='Invoice'){tot=p2c((it.totalPaymentDue&&it.totalPaymentDue.value)||it.total||0);
cur=(it.totalPaymentDue&&it.totalPaymentDue.priceCurrency)||it.priceCurrency||cur;}});}catch(e){}});
if(!ps.length)return null;
if(!tot)tot=ps.reduce(function(s,p){return s+p.lineTotal;},0);
return{total:tot,currency:cur,products:ps,source:'json-ld'};}

function fromMD(){
var pe=document.querySelectorAll('[itemtype*="schema.org/Product"]');if(!pe.length)return null;
var ps=[],cur=null;
pe.forEach(function(el){var ne=el.querySelector('[itemprop="name"]'),pe2=el.querySelector('[itemprop="price"]'),
ce=el.querySelector('[itemprop="priceCurrency"]'),ie=el.querySelector('[itemprop="image"]'),ue=el.querySelector('[itemprop="url"]');
var pr=pe2?pe2.getAttribute('content')||pe2.textContent:'0';
var dc=ce?ce.getAttribute('content')||ce.textContent:null;if(dc)cur=dc;
ps.push({name:ne?ne.textContent.trim():null,quantity:1,itemPrice:p2c(pr),lineTotal:p2c(pr),
url:ue?ue.getAttribute('href')||ue.getAttribute('content'):null,
imageUrl:ie?ie.getAttribute('src')||ie.getAttribute('content'):null});});
if(!ps.length)return null;
var tot=ps.reduce(function(s,p){return s+p.lineTotal;},0);
return{total:tot,currency:cur,products:ps,source:'microdata'};}

function fromOG(){
var ot=document.querySelector('meta[property="og:type"]');
if(!ot||ot.getAttribute('content')!=='product')return null;
var ti=document.querySelector('meta[property="og:title"]'),
pr=document.querySelector('meta[property="product:price:amount"]'),
cu=document.querySelector('meta[property="product:price:currency"]'),
im=document.querySelector('meta[property="og:image"]'),
ur=document.querySelector('meta[property="og:url"]');
if(!pr)return null;
var p=p2c(pr.getAttribute('content')),c=cu?cu.getAttribute('content'):null;
return{total:p,currency:c,products:[{name:ti?ti.getAttribute('content'):null,quantity:1,itemPrice:p,lineTotal:p,
url:ur?ur.getAttribute('content'):null,imageUrl:im?im.getAttribute('content'):null}],source:'opengraph'};}

function fromDOM(){
var cs=['[class*="cart"]','[class*="basket"]','[class*="order-summary"]','[class*="checkout-summary"]',
'[id*="cart"]','[id*="basket"]','[id*="order-summary"]','[data-testid*="cart"]','[data-testid*="order"]'];
var cc=null;for(var i=0;i<cs.length;i++){cc=document.querySelector(cs[i]);if(cc)break;}
if(!cc)return null;
var rx=/(?:[$£€])\\s*[\\d,]+\\.?\\d{0,2}/g;
var li=cc.querySelectorAll('[class*="item"],[class*="product"],[class*="line"],li,tr');
var ps=[],seen=new Set();
li.forEach(function(it){
var ne=it.querySelector('[class*="name"],[class*="title"],[class*="description"],h2,h3,h4,a')||it.querySelector('td:first-child,span:first-child');
var nm=ne?ne.textContent.trim():null;
if(!nm||nm.length<2||nm.length>200||seen.has(nm))return;
var pm=it.textContent.match(rx);if(!pm||!pm.length)return;
var ip=p2c(pm[pm.length-1]);if(ip<=0)return;
var qe=it.querySelector('input[type="number"],[class*="qty"],[class*="quantity"]');
var q=qe?parseInt(qe.value||qe.textContent,10)||1:1;
var ie=it.querySelector('img');
seen.add(nm);
ps.push({name:nm.substring(0,200),quantity:q,itemPrice:ip,lineTotal:ip*q,url:null,imageUrl:ie?ie.src:null});});
if(!ps.length)return null;
var te=cc.querySelector('[class*="total"]:not([class*="sub"]),[class*="grand-total"],[class*="order-total"]');
var tot=0;if(te){var tp=te.textContent.match(rx);if(tp)tot=p2c(tp[tp.length-1]);}
if(!tot)tot=ps.reduce(function(s,p){return s+p.lineTotal;},0);
var at=cc.textContent,ap=at.match(rx),cur=ap?dCur(ap[0],null):null;
return{total:tot,currency:cur,products:ps,source:'dom'};}

function detect(){return fromLD()||fromMD()||fromOG()||fromDOM();}
window.__snapfillDetectCart=detect;

var dt=null,lr='';
function report(){clearTimeout(dt);dt=setTimeout(function(){
var c=detect();if(!c)return;
var k=JSON.stringify(c);if(k!==lr){lr=k;
var msg=JSON.stringify({type:'cartDetected',cart:{total:c.total,currency:c.currency,products:c.products}});
if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage)window.ReactNativeWebView.postMessage(msg);
else if(window.parent!==window)window.parent.postMessage({snapfill:true,type:'cartDetected',cart:{total:c.total,currency:c.currency,products:c.products}},'*');
}},500);}

var md=null;
new MutationObserver(function(){clearTimeout(md);md=setTimeout(report,500);}).observe(document.body,{childList:true,subtree:true,characterData:true});
report();
})();`;

/**
 * Self-contained value capture script (IIFE) for WebView injection.
 */
export const valueCaptureScript = `(function(){
'use strict';
if(window.__snapfillValueInit)return;
window.__snapfillValueInit=true;

var ST=['password'];
var SP=/ssn|social.?security|tax.?id/i;
function isSens(el){if(!el)return false;var t=(el.getAttribute('type')||'').toLowerCase();if(ST.indexOf(t)>=0)return true;
var s=[el.getAttribute('name')||'',el.getAttribute('id')||'',el.getAttribute('autocomplete')||''].join(' ');return SP.test(s);}

var dt=null,attached=new Set();
function capture(){clearTimeout(dt);dt=setTimeout(function(){
if(!window.__snapfillFieldMap)return;
var m={},h=false;
window.__snapfillFieldMap.forEach(function(el,f){if(isSens(el))return;
var v='';if(el instanceof HTMLSelectElement){var s=el.options[el.selectedIndex];v=s?s.value||s.textContent.trim():'';}
else if(el instanceof HTMLInputElement&&(el.type==='checkbox'||el.type==='radio'))v=el.checked?'true':'false';
else v=el.value||'';
if(v){m[f]=v;h=true;}});
if(h){
var msg=JSON.stringify({type:'valuesCaptured',mappings:m});
if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage)window.ReactNativeWebView.postMessage(msg);
else if(window.parent!==window)window.parent.postMessage({snapfill:true,type:'valuesCaptured',mappings:m},'*');
}},1000);}

function attach(){if(!window.__snapfillFieldMap)return;
window.__snapfillFieldMap.forEach(function(el){
if(attached.has(el)||isSens(el))return;
el.addEventListener('input',capture);el.addEventListener('change',capture);attached.add(el);});}

window.__snapfillAttachCapture=attach;
window.__snapfillCaptureNow=capture;
setTimeout(attach,600);
})();`;

/**
 * Combined injectable script containing all detectors + value capture.
 * Inject this single string into a WebView for full autofill support.
 */
export const snapfillScript = [formDetectorScript, cartDetectorScript, valueCaptureScript].join(
  '\n',
);

/**
 * Fill script template with a `__SNAPFILL_MAPPINGS__` placeholder.
 * Native libraries (Android/iOS) can use this directly by replacing the placeholder
 * with a JSON-encoded mappings object, avoiding the need to reimplement fill logic.
 */
export const fillScriptTemplate = `(function(){
'use strict';
var mappings=__SNAPFILL_MAPPINGS__;
if(!window.__snapfillFieldMap){console.warn('[snapfill] No field map found. Inject snapfillScript first.');return;}
var nIS=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');nIS=nIS&&nIS.set;
var nTS=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');nTS=nTS&&nTS.set;
var nSS=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'selectedIndex');nSS=nSS&&nSS.set;
function de(el,evts){evts.forEach(function(n){el.dispatchEvent(new Event(n,{bubbles:true,cancelable:true}));});}
function fillIn(el,v){el.focus();de(el,['focus','focusin']);
if(el instanceof HTMLInputElement&&nIS)nIS.call(el,v);else if(el instanceof HTMLTextAreaElement&&nTS)nTS.call(el,v);else el.value=v;
de(el,['input','change']);setTimeout(function(){el.blur();de(el,['blur','focusout']);},50);}
function fillSel(el,v){var o=el.options,mi=-1;
for(var i=0;i<o.length;i++)if(o[i].value.toLowerCase()===v.toLowerCase()){mi=i;break;}
if(mi===-1)for(var j=0;j<o.length;j++)if((o[j].textContent||'').trim().toLowerCase()===v.toLowerCase()){mi=j;break;}
if(mi===-1)for(var k=0;k<o.length;k++)if((o[k].textContent||'').trim().toLowerCase().indexOf(v.toLowerCase())>=0){mi=k;break;}
if(mi>=0){el.focus();de(el,['focus','focusin']);if(nSS)nSS.call(el,mi);else el.selectedIndex=mi;de(el,['input','change']);
setTimeout(function(){el.blur();de(el,['blur','focusout']);},50);}}
function fillCB(el,v){var c=v==='true'||v==='1'||v==='yes'||v==='on';if(el.checked!==c){el.focus();el.checked=c;de(el,['click','input','change']);}}
function fill(el,v){if(!el||!v)return;if(el instanceof HTMLSelectElement)fillSel(el,v);
else if(el instanceof HTMLInputElement&&(el.type==='checkbox'||el.type==='radio'))fillCB(el,v);else fillIn(el,v);}
if(window.__snapfillFieldMap.has('fullName')&&!mappings.fullName){
var parts=[mappings.firstName,mappings.middleName,mappings.lastName].filter(Boolean);
if(parts.length)mappings.fullName=parts.join(' ');}
var filled=0,failed=[];
Object.keys(mappings).forEach(function(f){var el=window.__snapfillFieldMap.get(f);
if(el){fill(el,mappings[f]);filled++;}else{failed.push(f);}});
var result={filled:filled,total:Object.keys(mappings).length,failed:failed};
var msg=JSON.stringify({type:'formFillComplete',result:result});
if(window.ReactNativeWebView&&window.ReactNativeWebView.postMessage)window.ReactNativeWebView.postMessage(msg);
else if(window.parent!==window)window.parent.postMessage({snapfill:true,type:'formFillComplete',result:result},'*');
})();`;

/**
 * Build a fill script string for WebView injection.
 * The returned string, when evaluated, fills form fields using the detected field map.
 */
export function buildFillScript(mappings: AutofillMappings): string {
  return fillScriptTemplate.replace('__SNAPFILL_MAPPINGS__', JSON.stringify(mappings));
}
