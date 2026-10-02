/* Ядро: хранилище, тема, диалоги, колоды без повторов, проверка ответа по правилам ФИПИ */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='rus27';
const S=(()=>{let s={};try{s=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){}return Object.assign({v:1,ts:0,theme:'dark',done:{},deck:{}},s)})();
let saveT;function save(){S.ts=Date.now();clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},150)}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
addEventListener('pagehide',()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}});

/* тема: тёмная по умолчанию, не зависит от системы */
function setTheme(t){S.theme=t;document.documentElement.dataset.theme=t;const m=$('meta[name=theme-color]');m&&(m.content=t==='light'?'#F5F5F8':'#0E0F13');save()}
setTheme(S.theme==='light'?'light':'dark');

/* свои диалоги вместо alert/confirm (песочница артефакта их запрещает) */
function uiBox(html,btns){return new Promise(res=>{const d=document.createElement('div');d.className='dlg';d.innerHTML=`<div role="dialog" aria-modal="true">${html}<div class="row" style="justify-content:flex-end">${btns.map((b,i)=>`<button class="btn ${b[1]||''}" data-i="${i}">${b[0]}</button>`).join('')}</div></div>`;
 const close=v=>{d.remove();removeEventListener('keydown',k);res(v)},k=e=>{if(e.key==='Escape')close(null)};
 d.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b)close(btns[+b.dataset.i][2]);else if(e.target===d)close(null)});addEventListener('keydown',k);document.body.append(d);$('button.pri',d)?.focus()})}
const uiNote=(html,ok='Понятно')=>uiBox(html,[[ok,'pri',true]]);
const uiAsk=(html,yes='Да',no='Отмена')=>uiBox(html,[[no,'ghost',false],[yes,'pri',true]]).then(v=>v===true);
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2200)}

/* колода: случайный порядок, без повторов до конца круга */
function deck(key,ids){const seen=S.deck[key]||[];let left=ids.filter(i=>!seen.includes(i)),round=false;
 if(!left.length){left=ids.slice();S.deck[key]=[];round=true}
 const id=left[Math.random()*left.length|0];(S.deck[key]=S.deck[key]||[]).push(id);save();return{id,round,pos:ids.length-left.length+1,total:ids.length}}

/* проверка как на бланке: регистр, пробелы, знаки препинания не важны, ё = е */
const norm=s=>String(s).toLowerCase().replace(/ё/g,'е').replace(/[^0-9a-zа-я]/g,'');
/* mode: seq точное совпадение, set порядок цифр не важен, pos позиционная (8, 22): 2/1/0 */
function check(input,answers,mode,max=1){const u=norm(input);if(!u)return{score:0,max,empty:true};
 let best=0;for(const a0 of [].concat(answers)){const a=norm(a0);let sc=0;
  if(mode==='set')sc=[...u].sort().join('')===[...a].sort().join('')?max:0;
  else if(mode==='pos'){if(u.length<=a.length){let d=a.length-u.length;for(let i=0;i<u.length;i++)if(u[i]!==a[i])d++;sc=d===0?2:d<=2?1:0}}
  else sc=u===a?max:0;best=Math.max(best,sc)}
 return{score:best,max}}

/* учёт решённого по номеру */
function mark(n,ok){const d=S.done[n]=S.done[n]||{ok:0,all:0};d.all++;if(ok)d.ok++;save()}

/* копия прогресса: текстом, работает и в окне Claude, и на сайте */
function backup(){const code=btoa(unescape(encodeURIComponent(JSON.stringify(S))));const d=document.createElement('div');d.className='dlg';
 d.innerHTML=`<div role="dialog" aria-modal="true"><h3>Копия прогресса</h3><p class="muted">Скопируйте код и сохраните. На другом устройстве вставьте сюда свой код и нажмите «Загрузить».</p><textarea class="inp" id="bk" spellcheck="false">${code}</textarea><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-a="x">Закрыть</button><button class="btn" data-a="in">Загрузить</button><button class="btn pri" data-a="cp">Скопировать</button></div></div>`;
 const ta=$('#bk',d);d.addEventListener('click',async e=>{const a=e.target.dataset.a;if(e.target===d||a==='x')d.remove();
  if(a==='cp'){try{await navigator.clipboard.writeText(ta.value);toast('Скопировано')}catch(_){ta.select();toast('Код выделен, скопируйте вручную')}}
  if(a==='in'){let o;try{o=JSON.parse(decodeURIComponent(escape(atob(ta.value.trim()))));if(!o||typeof o.done!=='object')throw 0}catch(_){toast('Код не распознан');return}
   d.remove();if(await uiAsk('<h3>Заменить прогресс?</h3><p class="muted">Текущий прогресс на этом устройстве будет заменён загруженным.</p>','Заменить')){Object.assign(S,o);save();setTheme(S.theme);toast('Прогресс загружен');route()}}});
 document.body.append(d)}
