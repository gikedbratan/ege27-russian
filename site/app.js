/* Экраны: главная, список заданий, задание (теория, практика, вопросы), заглушки разделов */
const app=$('#app');let stopTimer=()=>{};
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
const gaps=t=>md(t).replace(/\((\d)\)/g,'<span class="gap" data-g="$1">$1</span>');
const shuffle=a=>{a=a.slice();for(let i=a.length;i>1;){const j=Math.random()*i--|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const GAPN=[15,17,18,19,20];
const real=n=>[...(DATA[n]?.real||[]),...BANK.items.filter(x=>x.n===n).map(x=>({...x,src:BSRC(x.id)}))];
const ready=n=>!!DATA[n]||BANK.items.some(x=>x.n===n);

/* сборка задания из слов ФИПИ (пул в DATA[n].pool) */
function genItem(n){const D=DATA[n];for(;;){const k=4+(Math.random()*2|0),ws=shuffle(D.pool).slice(0,k),tg=Math.random()<.5?'нн':'н';
 const a=ws.map((w,i)=>w[1]===tg?i+1:0).filter(Boolean);if(!a.length||a.length===k)continue;
 return{id:'g',gen:1,src:'Сборка тренажёра из слов заданий ФИПИ (демоверсия 2027, открытый вариант 2026)',q:tg==='нн'?'Укажите цифру(-ы), на месте которой(-ых) пишется НН.':'Укажите цифру(-ы), на месте которой(-ых) пишется одна буква Н.',
  t:ws.map((w,i)=>w[0].replace('?',i+1)).join(', '),a:[a.join('')],g:ws.map(w=>w[1]),why:ws.map(w=>w[2])}}}

/* тело задачи: предложение с пропусками, строки-варианты или таблица соответствия */
function body(it,n){if(it.t)return`<p class="qtext">${gaps(it.t)}</p>`;
 if(it.L){const [h1,h2]=n===8?['Грамматические ошибки','Предложения']:['Предложения','Средства выразительности'];return`<div class="tbl"><ol class="lst"><li class="eyebrow">${h1}</li>${it.L.map(([k,t])=>`<li><b class="k">${k})</b><span>${md(t).replace(/\n/g,'<br>')}</span></li>`).join('')}</ol><ol class="lst"><li class="eyebrow">${h2}</li>${it.R.map(([k,t])=>`<li data-r="${k}"><b class="k">${k})</b><span>${md(t)}</span></li>`).join('')}</ol></div>`}
 return(it.b||[]).map(l=>{const m=l.match(/^(\d)\)\s*(.*)$/);return m?`<div class="rowv" data-r="${m[1]}"><b class="k">${m[1]})</b><span>${md(m[2])}</span></div>`:`<p class="qtext">${GAPN.includes(n)?gaps(l):md(l).replace(/\((\d+)\)/g,'<sup class="sn">$1</sup>')}</p>`}).join('')}
const textPanel=id=>{const P=BANK.texts[id]||[];return`<details class="txt" open><summary>Текст к заданиям</summary><div>${P.map(p=>`<p>${md(p)}</p>`).join('')}</div></details>`};

/* карточка задачи с проверкой; opt.timer включает подсказки по времени */
function taskCard(box,n,it,opt={}){const [,,,max,mode,lim]=T[n];let done=false,hl=0,t0=Date.now(),iv;
 box.innerHTML=`<div class="${it.tx?'wtext':''}">${it.tx?textPanel(it.tx):''}<div class="card task"><div class="row" style="justify-content:space-between"><div class="tags">${opt.tags||''}</div>${opt.timer?'<span class="timer" id="tm">0:00</span>':''}</div>
 <p><b>${md(it.q).replace(/<\/?b>/g,'')}</b></p>${body(it,n)}
 <div class="ans"><input class="inp" id="ans${opt.k||''}" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${it.L?'Цифры под буквами А Б В Г Д, например 34529':/^\d+$/.test(it.a[0])?'Ответ, например 14':'Ответ: слово'}" aria-label="Ответ"><button class="btn pri" data-a="chk">Проверить</button></div>
 <div class="hints" style="display:flex;flex-direction:column;gap:8px"></div><div class="res"></div>
 <div class="row">${opt.timer?'<button class="btn ghost" data-a="hint">Подсказка</button>':''}${opt.next?'<button class="btn" data-a="next">Следующее</button>':''}</div><p class="src">Источник: ${esc(it.src)}</p></div></div>`;
 const inp=$('input',box),H=$('.hints',box),A=it.a[0];
 const h2=()=>it.why?`Пропуск 1: ${it.t.match(/\S*\(1\)\S*/)[0].replace('(1)',`(${it.g[0]})`)}. ${it.why[0]}.`:it.L?`А) соответствует ${A[0]}.`:/^\d+$/.test(A)?(GAPN.includes(n)?`Цифра ${A[0]} входит в ответ.`:`Вариант ${A[0]} верный.`):`Ответ начинается на «${A[0].toUpperCase()}».`;
 const hint=()=>{if(hl>=2||done)return;hl++;H.insertAdjacentHTML('beforeend',`<div class="hint">${esc(hl===1?(DATA[n]?.hint||DATA[n]?.algo?.[0]||TIP[n]||'Перечитайте задание и вспомните правило.'):h2())}</div>`)};
 if(opt.timer){iv=setInterval(()=>{const s=(Date.now()-t0)/1000|0,el=$('#tm',box);if(!el)return clearInterval(iv);el.textContent=`${s/60|0}:${String(s%60).padStart(2,'0')}`;if(!done&&(s>=lim*.6&&hl<1||s>=lim&&hl<2))hint()},1000);stopTimer=()=>clearInterval(iv)}
 const chk=()=>{if(done)return;const r=check(inp.value,it.a,mode,max);if(r.empty){inp.focus();toast('Введите ответ');return}
  done=true;clearInterval(iv);inp.readOnly=true;$('[data-a=chk]',box).disabled=true;if(!it.demo)mark(n,r.score===max);
  const u=norm(inp.value),sel=new Set(u),need=new Set(A);
  $$('.gap',box).forEach(g=>{const d=g.dataset.g;g.classList.add(sel.has(d)===need.has(d)?'g-ok':'g-bad');if(it.g)g.textContent=it.g[d-1]});
  if(mode==='set'&&!it.L)$$('.rowv',box).forEach(r=>{const d=r.dataset.r;if(need.has(d))r.classList.add('ok');else if(sel.has(d))r.classList.add('bad')});
  const cls=r.score===max?'ok':r.score?'part':'bad',ttl=r.score===max?'Верно':r.score?`Частично: ${r.score} из ${max}`:'Неверно';
  const why=it.why?`<ol class="steps">${it.why.map((w,i)=>`<li>${esc(it.t.match(new RegExp('\\S*\\('+(i+1)+'\\)\\S*'))[0].replace(/[,.:;]$/,'').replace(`(${i+1})`,it.g[i].toUpperCase()))}: ${esc(w)}</li>`).join('')}</ol>`:'';
  const tb=it.L?`<div class="lt">${[...'АБВГД'].map((k,i)=>`<span class="${u[i]===A[i]?'ok':'bad'}">${k}<b>${A[i]}</b></span>`).join('')}</div>`:'';
  $('.res',box).innerHTML=`<div class="fb ${cls}"><b class="t">${ttl}</b><span>Ответ: <b class="mono">${esc(it.a.join(' или '))}</b></span>${tb}${why}</div>`;
  opt.onDone&&opt.onDone(r)};
 box.onclick=e=>{const a=e.target.dataset.a;if(a==='chk')chk();if(a==='hint')hint();if(a==='next')opt.next()};
 inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();chk()}}}

/* главная */
function home(){const D=DATA[15],it={...D.real[0],demo:1};
 app.innerHTML=`<div class="bento">
 <section class="card hero s7"><div style="display:flex;flex-direction:column;gap:12px"><span class="eyebrow">ЕГЭ 2027 · русский язык</span><h1>Решайте задания в формате ЕГЭ и проверяйте ответ как на бланке</h1><p class="muted">Задачи только из материалов ФИПИ. Теория с ловушками из реальных ошибок, подсказки, если долго думаете.</p></div>
  <div class="facts"><div class="fact"><b>27</b><span>заданий</span></div><div class="fact"><b>3:30</b><span>часа на экзамен</span></div><div class="fact"><b>50</b><span>первичных баллов</span></div></div>
  <div class="row"><a class="btn pri" href="#t15">Начать с №15</a><a class="btn" href="#tasks">Все задания</a></div></section>
 <section class="s5" id="live"></section>
 <section class="s12"><div class="bento blkgrid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${BLOCKS.map(([k,name,ns])=>`<div class="card blk"><div class="row" style="justify-content:space-between"><h3>${name}</h3><span class="tag">${ns.length>1?ns[0]+'-'+ns.at(-1):ns[0]}</span></div><div class="nums">${ns.map(n=>`<a class="n${ready(n)?' ready':''}${S.done[n]?.ok?' done':''}" href="#t${n}" title="${esc(T[n][1])}">${n}</a>`).join('')}</div></div>`).join('')}</div></section>
 <section class="card s7"><span class="eyebrow">Алгоритм №15</span><h2 style="margin:8px 0 14px">Н или НН за пять шагов</h2>${acc('Разбор слова по шагам',`<ol class="steps">${D.algo.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`,1)}${acc('Ловушка: НЕ- не приставка-признак',D.traps[0][1])}${acc('Ловушка: совершенный вид без приставки',D.traps[2][1])}</section>
 <section class="card s5" style="align-self:start;display:flex;flex-direction:column;gap:12px"><span class="eyebrow">Как проверяют часть 1</span>
  <ul class="steps" style="margin:0;padding-left:20px"><li>За №8 и №22 до 2 баллов, 1 балл при ошибке в одной-двух позициях.</li><li>В №2-4, 9-21, 23, 24 и 26 порядок цифр не важен.</li><li>Лишняя цифра делает ответ неверным.</li><li>Сочинение: не меньше 150 слов, иначе 0 по всем критериям.</li></ul>
  <p class="src">По спецификации и демоверсии ФИПИ 2027 (проект).</p></section></div>`;
 taskCard($('#live'),15,it,{tags:'<span class="tag">№15</span><span class="tag">демоверсия 2027</span>',k:'L'})}
const acc=(h,b,open)=>`<div class="acc${open?' open':''}"><button aria-expanded="${!!open}">${esc(h)}</button><div><div>${b}</div></div></div>`;
document.addEventListener('click',e=>{const b=e.target.closest('.acc>button');if(b){const a=b.parentNode;a.classList.toggle('open');b.setAttribute('aria-expanded',a.classList.contains('open'))}});

/* список заданий */
function tasks(){app.innerHTML=`<div class="page" style="max-width:1120px"><h1>Задания ЕГЭ 2027</h1>${BLOCKS.map(([k,name,ns])=>`<h2 style="margin-top:8px">${name}</h2><div class="list">${ns.map(n=>`<a class="li" href="#t${n}"><span class="n${ready(n)?' ready':''}">${n}</span><span>${esc(T[n][1])}<br><span class="muted" style="font-size:13px">${ready(n)?(S.done[n]?`решено ${S.done[n].ok} из ${S.done[n].all}`:'готово'):'скоро'}</span></span></a>`).join('')}</div>`).join('')}</div>`}

/* задание */
let tab={};
function task(n){const [,title,,max,mode]=T[n],D=DATA[n],R=ready(n);tab[n]=tab[n]||(D?'th':'pr');
 app.innerHTML=`<div class="page"><div class="phead"><span class="pnum">Задание ${n}</span><h1>${esc(title)}</h1><div class="tags"><span class="tag">${max} ${max===1?'балл':max<5?'балла':'баллов'}</span><span class="tag">${MODE[mode]}</span></div>${D?.stat?`<p class="muted" style="font-size:14px">${esc(D.stat)}</p>`:''}</div>
 ${R?`<div class="seg" role="tablist">${[['th','Теория'],['pr','Практика'],['qz','Вопросы']].map(([k,l])=>`<button role="tab" data-tab="${k}" class="${tab[n]===k?'on':''}">${l}</button>`).join('')}</div><div id="tb"></div>`
 :`<div class="card"><h3>Готовим материалы</h3><p class="muted" style="margin-top:6px">Теория, практика по задачам ФИПИ и вопросы появятся в следующих обновлениях.</p><div class="row" style="margin-top:14px"><a class="btn pri" href="#t15">Перейти к №15</a></div></div>`}</div>`;
 if(!R)return;const show=()=>{stopTimer();$$('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab[n]));({th:theory,pr:practice,qz:quiz})[tab[n]](n,$('#tb'))};
 $('.seg').onclick=e=>{const k=e.target.dataset.tab;if(k){tab[n]=k;show()}};show()}
const later=(box,w)=>box.innerHTML=`<div class="card"><h3>${w} готовим</h3><p class="muted" style="margin-top:6px">Пока решайте реальные задачи ФИПИ во вкладке «Практика».</p></div>`;
function theory(n,box){const D=DATA[n];if(!D)return later(box,'Теорию');box.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px">${D.theory.map(([h,b])=>`<div class="card rule"><h3>${esc(h)}</h3>${b}</div>`).join('')}<h2 style="margin-top:8px">Ловушки</h2><div>${D.traps.map(([h,b],i)=>acc(h,b,!i)).join('')}</div><div class="row"><button class="btn pri" data-go="pr">К практике</button></div></div>`;
 box.onclick=e=>{if(e.target.dataset.go){tab[n]='pr';task(n)}}}
let kind={};
function practice(n,box){const D=DATA[n],RL=real(n);kind[n]=kind[n]||'real';
 box.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px"><div class="seg">${[['real',`Реальные ФИПИ · ${RL.length}`],...(D?.pool?[['gen','Сборка из слов ФИПИ']]:[])].map(([k,l])=>`<button data-k="${k}" class="${kind[n]===k?'on':''}">${l}</button>`).join('')}</div><div id="tc"></div></div>`;
 const next=()=>{stopTimer();let it,tags=`<span class="tag">№${n}</span>`;
  if(kind[n]==='real'){const d=deck('r'+n,RL.map(x=>x.id));it=RL.find(x=>x.id===d.id);tags+=`<span class="tag">задача ${d.pos} из ${d.total}</span>`;if(d.round)toast('Круг пройден, начинаем заново')}
  else{it=genItem(n);tags+='<span class="tag">сборка</span>'}
  taskCard($('#tc',box),n,it,{timer:1,next,tags});$('#tc input',box).focus({preventScroll:true})};
 $('.seg',box).onclick=e=>{const k=e.target.dataset.k;if(k){kind[n]=k;$$('[data-k]',box).forEach(b=>b.classList.toggle('on',b.dataset.k===k));next()}};next()}
function quiz(n,box){if(!DATA[n]?.quiz)return later(box,'Вопросы');const Q=DATA[n].quiz;let ok=0,cnt=0;
 const one=()=>{const d=deck('q'+n,Q.map((_,i)=>i)),q=Q[d.id];if(d.round)toast('Все вопросы пройдены, новый круг');
  box.innerHTML=`<div class="card task"><div class="row" style="justify-content:space-between"><span class="tag">вопрос ${d.pos} из ${d.total}</span><span class="timer">${ok} из ${cnt} верно</span></div><div class="bar"><i style="width:${d.pos/d.total*100}%"></i></div>
  <p class="qtext" id="qq">${gaps(q.q).replace(/\(\?\)/g,'<span class="gap">?</span>')}</p><div class="opts">${q.o.map((o,i)=>`<button class="opt" data-o="${i}"><span class="k">${'АБВГ'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div><div class="res"></div></div>`;
  box.onclick=e=>{const b=e.target.closest('[data-o]'),nx=e.target.dataset.a;if(nx==='nq')return one();if(!b||b.disabled)return;const i=+b.dataset.o,r=i===q.a;cnt++;if(r)ok++;
   $$('[data-o]',box).forEach((x,j)=>{x.disabled=true;if(j===q.a)x.classList.add('ok');else if(j===i)x.classList.add('bad')});
   let h=$('#qq',box).innerHTML;q.trap.forEach(w=>{h=h.replace(new RegExp('('+w.replace(/[-?()]/g,'\\$&')+')','i'),'<mark>$1</mark>')});$('#qq',box).innerHTML=h;
   $('.res',box).innerHTML=`<div class="fb ${r?'ok':'bad'}"><b class="t">${r?'Верно':'Неверно'}</b><span>${esc(q.why)}</span></div><div class="row" style="margin-top:12px"><button class="btn pri" data-a="nq">Следующий вопрос</button></div>`}};one()}

function soon(h,p){app.innerHTML=`<div class="page"><h1>${h}</h1><div class="card"><p class="muted">${p}</p><div class="row" style="margin-top:14px"><a class="btn pri" href="#t15">Решать №15</a></div></div></div>`}
function route(){stopTimer();const h=location.hash.slice(1)||'home',m=h.match(/^t(\d+)$/);
 $$('.nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+(m?'tasks':h)));
 if(m&&T[+m[1]])task(+m[1]);else if(h==='tasks')tasks();
 else if(h==='var')soon('Варианты','Демоверсия 2027 и случайные полные варианты с таймером, автопроверкой части 1 и переводом в тестовые баллы. Следующий этап.');
 else if(h==='essay')soon('Сочинение','Счётчик слов по правилам ФИПИ, самооценка по критериям К1-К10 и проверка текста или фото через Claude. В работе.');
 else if(h==='class')soon('Класс','Вход по коду класса, рейтинг, спринт дня и модерируемый чат. Появится после публикации сайта.');
 else home();scrollTo(0,0)}
addEventListener('hashchange',route);
$('#theme').onclick=()=>setTheme(S.theme==='light'?'dark':'light');$('#bkp').onclick=backup;route();
