(function(){
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
})();