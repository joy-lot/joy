/* =========================================================================
   유전 탐구 노트 — shared utils + router
   ========================================================================= */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[randInt(0, arr.length-1)]; }
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=randInt(0,i); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function svgEl(tag, attrs={}, children=[]){
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const k in attrs) el.setAttribute(k, attrs[k]);
  children.forEach(c => el.appendChild(c));
  return el;
}
// seeded PRNG (mulberry32) from a string seed — deterministic banding per chromosome id
function seedFromString(str){
  let h = 1779033703 ^ str.length;
  for(let i=0;i<str.length;i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/* ---- reusable "질문 남기기" reflection box (+ AI 탐구 대화) ------------ */
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function qlabUid(){ return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function getStudentInfo(){
  try{
    const raw = JSON.parse(localStorage.getItem('qlab:studentInfo') || 'null');
    if(raw && raw.school && raw.grade && raw.classNo && raw.number && raw.name) return raw;
  }catch(e){}
  return null;
}
function setStudentInfo(info){
  try{ localStorage.setItem('qlab:studentInfo', JSON.stringify(info)); }catch(e){}
}
async function postChat(payload){
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if(!res.ok) throw new Error('chat_request_failed');
  return res.json();
}

// 활동 채점/결과 확인 시점마다 교사 대시보드용 기록 한 건을 남긴다. (실패해도 학생 화면엔 영향 없음)
function logActivityResult(activity, summary, detail, outcome){
  const student = getStudentInfo();
  if(!student) return;
  fetch('/api/activity-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student, activity, summary, detail, outcome: outcome || null }),
  }).catch(()=>{});
}

function mountQuestionBox(container, storageKey, starters, promptLabel){
  const key = 'qlab:' + storageKey;
  let saved = [];
  try{ saved = JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){ saved = []; }
  // 이전 버전(단순 문자열 배열) 데이터를 새 형식으로 변환
  saved = saved.map(q => typeof q === 'string'
    ? { id: qlabUid(), text: q, serverId: null, messages: [] }
    : q);
  const openPanels = new Set();

  const box = document.createElement('div');
  box.className = 'question-box';
  box.innerHTML = `
    <h4>🤔 탐구 질문 남기기</h4>
    <p class="hint">${promptLabel || '오늘 활동에서 관찰한 것을 바탕으로, 궁금한 점을 스스로 질문으로 만들어 적어 보세요.'}</p>
    <div class="starters"></div>
    <textarea placeholder="예) 만약 ~라면 어떻게 될까?"></textarea>
    <div style="display:flex;justify-content:flex-end;margin-top:8px;">
      <button class="btn primary add-q">질문 추가하기</button>
    </div>
    <div class="qlist"></div>
  `;
  const startersEl = $('.starters', box);
  (starters||[]).forEach(s=>{
    const chip = document.createElement('button');
    chip.className = 'starter-chip';
    chip.type = 'button';
    chip.textContent = s;
    chip.addEventListener('click', ()=>{
      const ta = $('textarea', box);
      ta.value = ta.value ? ta.value + ' ' + s : s;
      ta.focus();
    });
    startersEl.appendChild(chip);
  });

  const listEl = $('.qlist', box);
  function persist(){ localStorage.setItem(key, JSON.stringify(saved)); }

  function renderChatPanel(q, panelEl){
    panelEl.innerHTML = '';
    const thread = document.createElement('div');
    thread.className = 'chat-thread';
    q.messages.forEach(m=>{
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble ' + (m.role === 'model' ? 'model' : 'user');
      bubble.textContent = m.content;
      thread.appendChild(bubble);
    });
    panelEl.appendChild(thread);

    const inputRow = document.createElement('div');
    inputRow.className = 'chat-input-row';
    inputRow.innerHTML = `
      <input type="text" placeholder="AI에게 이어서 이야기해 보세요" />
      <button class="btn primary send">보내기</button>
    `;
    panelEl.appendChild(inputRow);

    const errEl = document.createElement('p');
    errEl.className = 'chat-error';
    errEl.hidden = true;
    panelEl.appendChild(errEl);

    const input = $('input', inputRow);
    const sendBtn = $('.send', inputRow);

    async function send(){
      const text = input.value.trim();
      if(!text) return;
      errEl.hidden = true;
      input.value = '';
      input.disabled = true;
      sendBtn.disabled = true;
      sendBtn.textContent = '생각 중…';
      q.messages.push({ role:'user', content:text });
      persist();
      renderChatPanel(q, panelEl);
      try{
        const data = await postChat({ questionId: q.serverId, message: text });
        q.messages.push({ role:'model', content:data.reply });
        persist();
        renderChatPanel(q, panelEl);
      }catch(e){
        errEl.textContent = 'AI 응답을 가져오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.';
        errEl.hidden = false;
        sendBtn.disabled = false;
        input.disabled = false;
        sendBtn.textContent = '보내기';
      }
    }
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', e=>{ if(e.key === 'Enter') send(); });
    thread.scrollTop = thread.scrollHeight;
  }

  function render(){
    listEl.innerHTML = '';
    saved.forEach((q, idx)=>{
      const item = document.createElement('div');
      item.className = 'qitem';
      item.innerHTML = `
        <div class="qitem-row">
          <span class="qitem-text">${escapeHtml(q.text)}</span>
          <div class="qitem-actions">
            <button type="button" class="chat-toggle">🤖 ${q.messages.length ? 'AI와 대화 계속하기' : 'AI와 대화하기'}</button>
            <button type="button" class="del">삭제</button>
          </div>
        </div>
        <div class="qitem-chat" hidden></div>
      `;
      $('.del', item).addEventListener('click', ()=>{ saved.splice(idx,1); persist(); render(); });

      const panelEl = $('.qitem-chat', item);
      const toggleBtn = $('.chat-toggle', item);
      if(openPanels.has(q.id)) panelEl.hidden = false;

      toggleBtn.addEventListener('click', async ()=>{
        if(!panelEl.hidden){
          panelEl.hidden = true;
          openPanels.delete(q.id);
          return;
        }
        panelEl.hidden = false;
        openPanels.add(q.id);
        if(q.messages.length){
          renderChatPanel(q, panelEl);
          return;
        }
        panelEl.innerHTML = '<p class="chat-loading">AI가 답을 생각하고 있어요…</p>';
        toggleBtn.disabled = true;
        try{
          const data = await postChat({
            activity: storageKey,
            student: getStudentInfo(),
            question: q.text,
          });
          q.serverId = data.questionId;
          q.messages = [{ role:'user', content:q.text }, { role:'model', content:data.reply }];
          persist();
          renderChatPanel(q, panelEl);
        }catch(e){
          panelEl.innerHTML = '<p class="chat-error">AI 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.</p>';
        }
        toggleBtn.disabled = false;
      });

      listEl.appendChild(item);
    });
  }

  $('.add-q', box).addEventListener('click', ()=>{
    const ta = $('textarea', box);
    const v = ta.value.trim();
    if(!v) return;
    saved.push({ id: qlabUid(), text:v, serverId:null, messages:[] });
    persist();
    ta.value = '';
    render();
  });
  render();
  container.appendChild(box);
}

/* =========================================================================
   활동 1 — 핵형 분석 (Karyotype)
   ========================================================================= */
const CHROM_INFO = (() => {
  const lenMb = {1:248,2:242,3:198,4:190,5:182,6:170,7:159,8:145,9:138,10:134,
    11:135,12:133,13:114,14:107,15:102,16:90,17:83,18:80,19:59,20:64,21:47,22:51,
    X:156, Y:57};
  const group = {1:'A',2:'A',3:'A',4:'B',5:'B',6:'C',7:'C',8:'C',9:'C',10:'C',
    11:'C',12:'C',X:'C',13:'D',14:'D',15:'D',16:'E',17:'E',18:'E',19:'F',20:'F',
    21:'G',22:'G',Y:'G'};
  const pRatio = {1:.49,2:.38,3:.47,4:.27,5:.28,6:.32,7:.34,8:.32,9:.33,10:.33,
    11:.38,12:.26,13:.15,14:.15,15:.15,16:.38,17:.32,18:.28,19:.45,20:.38,
    21:.18,22:.18,X:.39,Y:.24};
  const mbVals = Object.values(lenMb);
  const minMb = Math.min(...mbVals), maxMb = Math.max(...mbVals);
  const minPx = 46, maxPx = 168;
  const info = {};
  Object.keys(lenMb).forEach(id=>{
    const t = (lenMb[id]-minMb)/(maxMb-minMb);
    info[id] = { id, lenMb: lenMb[id], group: group[id], pRatio: pRatio[id],
      lenPx: Math.round(minPx + t*(maxPx-minPx)) };
  });
  return info;
})();
const AUTOSOME_IDS = Array.from({length:22}, (_,i)=>String(i+1));
const GROUP_ORDER = [
  {g:'A', ids:['1','2','3']},
  {g:'B', ids:['4','5']},
  {g:'C', ids:['6','7','8','9','10','11','12','X']},
  {g:'D', ids:['13','14','15']},
  {g:'E', ids:['16','17','18']},
  {g:'F', ids:['19','20']},
  {g:'G', ids:['21','22','Y']},
];

const SYNDROME_INFO = {
  normal:      { title:'정상 핵형', note:'염색체 수가 46개(상염색체 44 + 성염색체 2)로 정상입니다.' },
  turner:      { title:'터너 증후군 (45,X)', note:'성염색체가 X 1개뿐이며 총 45개입니다. 여성에게서 나타나며, 난소 발달 이상 등이 특징입니다.' },
  klinefelter: { title:'클라인펠터 증후군 (47,XXY)', note:'성염색체가 X, X, Y로 1개 많아 총 47개입니다. 남성에게서 나타납니다.' },
  down:        { title:'다운 증후군 (47, +21)', note:'21번 염색체가 3개(삼염색체성)여서 총 47개입니다. 대표적인 상염색체 비분리 사례입니다.' },
  criduchat:   { title:'묘성 증후군 (5p 결실)', note:'5번 염색체 하나의 일부가 짧게 결실된 구조 이상입니다. 염색체 수(46개)는 정상이지만 모양이 다릅니다.' },
};

function buildKaryotypeScenario(){
  const kind = pick(['normal','normal','turner','klinefelter','down','criduchat']);
  const pieces = [];
  let uid = 0;
  const addPiece = (trueType, opts={}) => {
    pieces.push({ uid: 'p'+(uid++), trueType, short: !!opts.short, placedIn: null });
  };
  const criTarget = kind === 'criduchat' ? '5' : null;
  AUTOSOME_IDS.forEach(id=>{
    if(kind === 'down' && id === '21'){ addPiece(id); addPiece(id); addPiece(id); return; }
    if(id === criTarget){ addPiece(id); addPiece(id, {short:true}); return; }
    addPiece(id); addPiece(id);
  });
  let sexKaryo;
  if(kind === 'turner'){ addPiece('X'); sexKaryo = 'X'; }
  else if(kind === 'klinefelter'){ addPiece('X'); addPiece('X'); addPiece('Y'); sexKaryo = 'XXY'; }
  else {
    const sex = pick(['XX','XY']);
    if(sex==='XX'){ addPiece('X'); addPiece('X'); } else { addPiece('X'); addPiece('Y'); }
    sexKaryo = sex;
  }
  const total = pieces.length;
  let syndromeKey = 'normal';
  if(kind==='turner') syndromeKey='turner';
  else if(kind==='klinefelter') syndromeKey='klinefelter';
  else if(kind==='down') syndromeKey='down';
  else if(kind==='criduchat') syndromeKey='criduchat';
  const notation = kind==='turner' ? '45,X'
    : kind==='klinefelter' ? '47,XXY'
    : kind==='down' ? `47,${sexKaryo},+21`
    : kind==='criduchat' ? `46,${sexKaryo},5p-`
    : `46,${sexKaryo}`;
  return { kind, pieces, total, sexKaryo, syndromeKey, notation };
}

function expectedForSlot(scenario, slotId){
  return scenario.pieces.filter(p => p.trueType === slotId).map(p => p.trueType);
}

function chromosomeSVG(chromId, opts={}){
  const info = CHROM_INFO[chromId];
  const w = 26, h = info.lenPx;
  const midY = h * info.pRatio;
  const rng = seedFromString('band-'+chromId);
  const bands = [];
  let y = 4;
  while(y < h-4){
    const bh = 4 + rng()*9;
    const dark = rng() > 0.52;
    bands.push({y, h: Math.min(bh, h-4-y), dark});
    y += bh;
  }
  const svg = svgEl('svg', {viewBox:`0 0 ${w} ${h}`, width:w, height:h, class:'chrom-svg'});
  const clipId = 'clip-'+chromId+'-'+Math.random().toString(36).slice(2,8);
  const clip = svgEl('clipPath', {id: clipId});
  clip.appendChild(svgEl('rect', {x:2,y:2,width:w-4,height:h-4,rx:(w-4)/2}));
  svg.appendChild(clip);
  const g = svgEl('g', {'clip-path':`url(#${clipId})`});
  g.appendChild(svgEl('rect', {x:2,y:2,width:w-4,height:h-4,rx:(w-4)/2, fill:'var(--chrom-base)'}));
  bands.forEach(b=>{
    g.appendChild(svgEl('rect', {x:2, y:b.y, width:w-4, height:b.h,
      fill: b.dark ? 'var(--chrom-dark)' : 'var(--chrom-light)'}));
  });
  svg.appendChild(g);
  svg.appendChild(svgEl('rect', {x:2,y:2,width:w-4,height:h-4,rx:(w-4)/2, fill:'none',
    stroke:'var(--chrom-outline)', 'stroke-width':1.4}));
  const waist = w*0.34;
  svg.appendChild(svgEl('path', {
    d:`M ${waist} ${midY-1} Q ${w/2} ${midY+5} ${w-waist} ${midY-1}
       M ${waist} ${midY+1} Q ${w/2} ${midY+7} ${w-waist} ${midY+1}`,
    stroke:'var(--chrom-outline)', 'stroke-width':1, fill:'none', opacity:.55}));
  return svg;
}

function buildKaryotypeActivity(root){
  root.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">활동 1 · 핵형 분석</div>
      <h1>흩어진 염색체를 배치해 핵형을 완성하세요</h1>
      <p>버튼을 누를 때마다 검사자가 무작위로 바뀝니다. 크기와 모양(중심절 위치, 띠 무늬)을 비교해 1~22번과 성염색체 자리에 옮겨 보세요.</p>
    </div>
    <div class="panel" style="margin-bottom:18px;">
      <div class="toolbar">
        <button class="btn primary" id="ky-new">🔄 새로운 검사자</button>
        <button class="btn" id="ky-grade">✅ 채점하기</button>
        <span id="ky-score" class="pill good" style="display:none;"></span>
        <span id="ky-remaining" class="mono" style="font-size:12px;color:var(--ink-soft);margin-left:auto;"></span>
      </div>
      <div class="ky-tray" id="ky-tray"></div>
    </div>
    <div class="panel" id="ky-board"></div>
    <div id="ky-diagnosis"></div>
    <div id="ky-qbox"></div>
  `;
  // scoped colors for the chromosome svgs (token-aware)
  const style = document.createElement('style');
  style.textContent = `
    .ky-tray{ display:flex; flex-wrap:wrap; gap:10px; padding:16px; background:var(--surface-2);
      border:1px dashed var(--line); border-radius:10px; min-height:120px; align-items:flex-end; }
    .ky-piece{ cursor:grab; touch-action:none; display:flex; flex-direction:column; align-items:center;
      padding:3px; border-radius:6px; user-select:none; }
    .ky-piece.short .chrom-svg{ opacity:.98; }
    .ky-piece.dragging{ opacity:.85; cursor:grabbing; }
    .ky-board-grid{ display:flex; flex-direction:column; gap:14px; }
    .ky-row{ display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap; }
    .ky-row-label{ font-family:"IBM Plex Mono",monospace; font-size:11px; color:var(--ink-soft);
      width:16px; padding-top:8px; flex:none; }
    .ky-slot{ display:flex; flex-direction:column; align-items:center; gap:6px; }
    .ky-slot .lbl{ font-family:"IBM Plex Mono",monospace; font-size:11.5px; font-weight:600; color:var(--ink-soft); }
    .ky-slot .sex-tag{
      font-size:9.5px; font-weight:600; color:var(--accent); background:var(--accent-soft);
      padding:1px 6px; border-radius:999px; margin-top:2px; white-space:nowrap;
    }
    .ky-drop{ min-width:64px; min-height:112px; border:1.5px dashed var(--line); border-radius:8px;
      display:flex; align-items:flex-end; justify-content:center; gap:3px; padding:5px; background:var(--surface); }
    .ky-drop.ok{ border-color:var(--good); background:var(--good-soft); }
    .ky-drop.bad{ border-color:var(--alert); background:var(--alert-soft); }
    #ky-diagnosis .panel{ margin-top:16px; }
  `;
  root.appendChild(style);

  const trayEl = $('#ky-tray', root);
  const boardEl = $('#ky-board', root);
  const scoreEl = $('#ky-score', root);
  const remainingEl = $('#ky-remaining', root);
  const diagEl = $('#ky-diagnosis', root);

  let scenario = null;

  function buildBoard(){
    const grid = document.createElement('div');
    grid.className = 'ky-board-grid';
    GROUP_ORDER.forEach(row=>{
      const rowEl = document.createElement('div');
      rowEl.className = 'ky-row';
      const rowLabel = document.createElement('div');
      rowLabel.className = 'ky-row-label';
      rowLabel.textContent = row.g;
      rowEl.appendChild(rowLabel);
      row.ids.forEach(id=>{
        const slotWrap = document.createElement('div');
        slotWrap.className = 'ky-slot';
        const drop = document.createElement('div');
        drop.className = 'ky-drop';
        drop.dataset.slot = id;
        slotWrap.appendChild(drop);
        const lbl = document.createElement('div');
        lbl.className = 'lbl';
        lbl.textContent = id;
        slotWrap.appendChild(lbl);
        if(id === 'X' || id === 'Y'){
          const tag = document.createElement('div');
          tag.className = 'sex-tag';
          tag.textContent = '성염색체';
          slotWrap.appendChild(tag);
        }
        rowEl.appendChild(slotWrap);
      });
      grid.appendChild(rowEl);
    });
    boardEl.innerHTML = '';
    boardEl.appendChild(grid);
  }

  function makePieceEl(piece){
    const el = document.createElement('div');
    el.className = 'ky-piece' + (piece.short ? ' short' : '');
    el.dataset.uid = piece.uid;
    el.dataset.trueType = piece.trueType;
    const svg = chromosomeSVG(piece.trueType);
    if(piece.short){
      svg.setAttribute('height', Math.round(CHROM_INFO[piece.trueType].lenPx*0.58));
      svg.setAttribute('viewBox', `0 0 26 ${Math.round(CHROM_INFO[piece.trueType].lenPx*0.58)}`);
    }
    el.appendChild(svg);
    attachDrag(el);
    return el;
  }

  function resetLayout(){
    trayEl.innerHTML = '';
    $$('.ky-drop', boardEl).forEach(d => { d.innerHTML=''; d.classList.remove('ok','bad'); });
    const shuffled = shuffle(scenario.pieces);
    shuffled.forEach(p => trayEl.appendChild(makePieceEl(p)));
    updateRemaining();
    diagEl.innerHTML = '';
    scoreEl.style.display = 'none';
  }

  function updateRemaining(){
    const n = $$('.ky-piece', trayEl).length;
    remainingEl.textContent = n>0 ? `보관함에 배치 안 된 조각 ${n}개` : '모든 조각을 배치했습니다';
  }

  function attachDrag(el){
    let offsetX=0, offsetY=0;

    function onMove(e){
      el.style.left = (e.clientX - offsetX) + 'px';
      el.style.top = (e.clientY - offsetY) + 'px';
    }
    function onUp(e){
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      el.classList.remove('dragging');
      el.style.position = '';
      el.style.zIndex = '';
      el.style.width = '';
      el.style.left = '';
      el.style.top = '';
      el.style.visibility = 'hidden';
      const target = document.elementFromPoint(e.clientX, e.clientY);
      el.style.visibility = '';
      const dropZone = target && target.closest ? target.closest('.ky-drop') : null;
      if(dropZone){ dropZone.appendChild(el); dropZone.classList.remove('ok','bad'); }
      else { trayEl.appendChild(el); }
      updateRemaining();
    }
    el.addEventListener('pointerdown', (e)=>{
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      el.classList.add('dragging');
      el.style.position = 'fixed';
      el.style.zIndex = 1000;
      el.style.width = rect.width+'px';
      el.style.left = rect.left+'px';
      el.style.top = rect.top+'px';
      document.body.appendChild(el);
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
  }

  function grade(){
    let correctSlots = 0;
    const allSlots = GROUP_ORDER.flatMap(r=>r.ids);
    allSlots.forEach(id=>{
      const drop = $(`.ky-drop[data-slot="${id}"]`, boardEl);
      const placed = $$('.ky-piece', drop).map(p=>p.dataset.trueType).sort();
      const expected = expectedForSlot(scenario, id).sort();
      const isMatch = placed.length===expected.length && placed.every((v,i)=>v===expected[i]);
      drop.classList.remove('ok','bad');
      drop.classList.add(isMatch ? 'ok' : 'bad');
      if(isMatch) correctSlots++;
    });
    scoreEl.style.display = 'inline-flex';
    scoreEl.className = 'pill ' + (correctSlots===allSlots.length ? 'good' : 'alert');
    scoreEl.textContent = `${correctSlots} / ${allSlots.length} 자리 일치`;
    renderDiagnosis(correctSlots===allSlots.length);

    const info = SYNDROME_INFO[scenario.syndromeKey];
    logActivityResult('karyotype',
      `핵형 분석: ${correctSlots}/${allSlots.length} 자리 일치 · 검사자 ${scenario.notation}(${info.title})`,
      { correctSlots, totalSlots: allSlots.length, notation: scenario.notation, syndromeKey: scenario.syndromeKey },
      correctSlots === allSlots.length ? 'correct' : 'incorrect'
    );
  }

  function renderDiagnosis(perfect){
    const info = SYNDROME_INFO[scenario.syndromeKey];
    diagEl.innerHTML = `
      <div class="panel">
        <h3 style="font-size:17px;margin-bottom:8px;">${perfect ? '🎉 다 맞았습니다! ' : ''}핵형 진단 결과</h3>
        <p style="margin:0 0 10px;color:var(--ink-soft);font-size:13.5px;">
          이번 검사자는 염색체 <b class="mono">${scenario.total}개</b> (성염색체 구성:
          <span class="mono">${scenario.sexKaryo}</span>) — 표기법
          <span class="pill accent mono" style="background:var(--accent-soft);color:var(--accent);">${scenario.notation}</span>
        </p>
        <p style="margin:0;font-weight:600;">${info.title}</p>
        <p style="margin:4px 0 0;color:var(--ink-soft);font-size:13.5px;">${info.note}</p>
      </div>
    `;
  }

  $('#ky-new', root).addEventListener('click', ()=>{
    scenario = buildKaryotypeScenario();
    resetLayout();
  });
  $('#ky-grade', root).addEventListener('click', grade);

  buildBoard();
  scenario = buildKaryotypeScenario();
  resetLayout();

  mountQuestionBox($('#ky-qbox', root), 'karyotype', [
    '염색체 수가 다르면 왜 특징이 달라질까?',
    '왜 염색체 이상은 대부분 성염색체나 작은 염색체에서 발견될까?',
    '염색체 수가 아니라 모양이 달라지는 경우도 있을까?'
  ], '이번 검사자의 염색체 수와 진단 결과를 보고, 궁금한 점을 질문으로 만들어 보세요.');
}

/* =========================================================================
   활동 2 — 가계도 분석 (Pedigree)
   ========================================================================= */
function randomAllele(){ return Math.random() < 0.5 ? 'A' : 'a'; }
function combineGenotype(a,b){ return [a,b].sort().join(''); }
const ROMAN = {1:'I', 2:'II', 3:'III'};

function buildPedigreeTopology(){
  const nodes = [];
  const sexA = pick(['M','F']);
  const g1a = { id:'g1-1', sex:sexA, gen:1, parents:null, spouseId:'g1-2' };
  const g1b = { id:'g1-2', sex: sexA==='M'?'F':'M', gen:1, parents:null, spouseId:'g1-1' };
  nodes.push(g1a, g1b);

  const kidCount2 = randInt(2,3);
  const gen2Kids = [];
  for(let i=0;i<kidCount2;i++){
    const node = { id:`g2-${i}`, sex: pick(['M','F']), gen:2, parents:[g1a.id,g1b.id], spouseId:null };
    gen2Kids.push(node);
    nodes.push(node);
  }
  const reproCount = randInt(1, Math.min(2, gen2Kids.length));
  const reproducing = new Set(shuffle(gen2Kids).slice(0, reproCount).map(k=>k.id));

  const gen2Order = [];
  const gen3Order = [];
  gen2Kids.forEach(kid=>{
    gen2Order.push(kid.id);
    if(reproducing.has(kid.id)){
      const spouse = { id:`${kid.id}-sp`, sex: kid.sex==='M'?'F':'M', gen:2, parents:null, spouseId:kid.id };
      kid.spouseId = spouse.id;
      nodes.push(spouse);
      gen2Order.push(spouse.id);
      const kidCount3 = randInt(1,3);
      for(let j=0;j<kidCount3;j++){
        const gnode = { id:`g3-${kid.id}-${j}`, sex: pick(['M','F']), gen:3, parents:[kid.id, spouse.id], spouseId:null };
        nodes.push(gnode);
        gen3Order.push(gnode.id);
      }
    }
  });

  return { nodes, layout: { 1:[g1a.id,g1b.id], 2:gen2Order, 3:gen3Order } };
}

function assignPedigreeGenotypes(nodes, mode){
  const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
  nodes.filter(n=>!n.parents).forEach(n=>{ n.genotype = combineGenotype(randomAllele(), randomAllele()); });
  nodes.filter(n=>n.parents).forEach(n=>{
    const p1 = byId[n.parents[0]], p2 = byId[n.parents[1]];
    n.genotype = combineGenotype(pick(p1.genotype.split('')), pick(p2.genotype.split('')));
  });
  nodes.forEach(n=>{
    n.affected = mode==='dominant' ? n.genotype.includes('A') : n.genotype === 'aa';
  });
}

function findPedigreeEvidence(nodes, mode){
  const byId = Object.fromEntries(nodes.map(n=>[n.id,n]));
  const couples = [];
  nodes.filter(n=>n.spouseId && n.id < n.spouseId).forEach(n=>{
    couples.push([n.id, n.spouseId]);
  });
  for(const [aId,bId] of couples){
    const children = nodes.filter(n=>n.parents && n.parents.includes(aId) && n.parents.includes(bId));
    if(children.length===0) continue;
    const a = byId[aId], b = byId[bId];
    if(mode==='recessive' && !a.affected && !b.affected){
      const child = children.find(c=>c.affected);
      if(child) return { parentIds:[aId,bId], childId: child.id };
    }
    if(mode==='dominant' && a.affected && b.affected){
      const child = children.find(c=>!c.affected);
      if(child) return { parentIds:[aId,bId], childId: child.id };
    }
  }
  return null;
}

function buildPedigreeTree(){
  for(let attempt=0; attempt<400; attempt++){
    const topo = buildPedigreeTopology();
    const mode = pick(['dominant','recessive']);
    assignPedigreeGenotypes(topo.nodes, mode);
    const evidence = findPedigreeEvidence(topo.nodes, mode);
    if(evidence) return { mode, nodes: topo.nodes, layout: topo.layout, evidence };
  }
  // fallback: force the diagnostic couple so the puzzle is always solvable
  const topo = buildPedigreeTopology();
  const mode = pick(['dominant','recessive']);
  const byId = Object.fromEntries(topo.nodes.map(n=>[n.id,n]));
  byId['g1-1'].genotype = 'Aa'; byId['g1-2'].genotype = 'Aa';
  topo.nodes.filter(n=>n.parents).forEach(n=>{
    const p1 = byId[n.parents[0]], p2 = byId[n.parents[1]];
    n.genotype = combineGenotype(pick(p1.genotype.split('')), pick(p2.genotype.split('')));
  });
  const firstChild = topo.nodes.find(n=>n.parents && n.parents.includes('g1-1'));
  firstChild.genotype = 'aa';
  topo.nodes.forEach(n=>{ n.affected = mode==='dominant' ? n.genotype.includes('A') : n.genotype === 'aa'; });
  const evidence = findPedigreeEvidence(topo.nodes, mode) || { parentIds:['g1-1','g1-2'], childId: firstChild.id };
  return { mode, nodes: topo.nodes, layout: topo.layout, evidence };
}

function pedigreeLabel(tree, id){
  for(const gen of [1,2,3]){
    const idx = tree.layout[gen].indexOf(id);
    if(idx !== -1) return `${ROMAN[gen]}-${idx+1}`;
  }
  return id;
}
function parentsOf(nodes, node){ return node.parents ? node.parents.map(id=>nodes.find(n=>n.id===id)) : []; }
function childrenOf(nodes, node){ return nodes.filter(n=>n.parents && n.parents.includes(node.id)); }

function classifyGenotype(nodes, node){
  if(node.genotype === 'aa') return { status:'exact', value:'aa' };
  const relatives = [...parentsOf(nodes,node), ...childrenOf(nodes,node)];
  if(relatives.some(r=>r.genotype==='aa')) return { status:'exact', value:'Aa' };
  return { status:'ambiguous', value:null };
}

function renderPedigreeSVG(tree){
  const SLOT = 96, SYM = 34, HALF = SYM/2;
  const yFor = {1:56, 2:220, 3:384};
  const rowWidths = [1,2,3].map(g => tree.layout[g].length * SLOT);
  const width = Math.max(...rowWidths) + 100;
  const height = yFor[3] + 70;
  const pos = {};
  [1,2,3].forEach(gen=>{
    const order = tree.layout[gen];
    const rowW = order.length*SLOT;
    const startX = (width-rowW)/2 + SLOT/2;
    order.forEach((id,idx)=> pos[id] = { x: startX+idx*SLOT, y: yFor[gen] });
  });
  const byId = Object.fromEntries(tree.nodes.map(n=>[n.id,n]));

  const svg = svgEl('svg', {viewBox:`0 0 ${width} ${height}`, width:'100%', height:height, class:'pedigree-svg'});
  const linesLayer = svgEl('g');
  const symbolsLayer = svgEl('g');
  svg.appendChild(linesLayer);
  svg.appendChild(symbolsLayer);

  const drawnCouples = new Set();
  tree.nodes.filter(n=>n.spouseId).forEach(n=>{
    const key = [n.id, n.spouseId].sort().join('|');
    if(drawnCouples.has(key)) return;
    drawnCouples.add(key);
    const a = pos[n.id], b = pos[n.spouseId];
    const [x1,x2] = a.x < b.x ? [a.x,b.x] : [b.x,a.x];
    linesLayer.appendChild(svgEl('line', {x1:x1+HALF,y1:a.y,x2:x2-HALF,y2:a.y, stroke:'var(--ink)', 'stroke-width':1.6}));
  });

  const familyGroups = {};
  tree.nodes.filter(n=>n.parents).forEach(n=>{
    const key = n.parents.slice().sort().join('|');
    (familyGroups[key] = familyGroups[key]||[]).push(n);
  });
  Object.entries(familyGroups).forEach(([key, children])=>{
    const [p1id,p2id] = key.split('|');
    const p1 = pos[p1id], p2 = pos[p2id];
    const midX = (p1.x+p2.x)/2, midY = p1.y;
    const busY = midY + (yFor[children[0].gen] - midY) * 0.55;
    linesLayer.appendChild(svgEl('line', {x1:midX,y1:midY+HALF,x2:midX,y2:busY, stroke:'var(--ink)', 'stroke-width':1.6}));
    const xs = children.map(c=>pos[c.id].x);
    linesLayer.appendChild(svgEl('line', {x1:Math.min(...xs),y1:busY,x2:Math.max(...xs),y2:busY, stroke:'var(--ink)', 'stroke-width':1.6}));
    children.forEach(c=>{
      const cp = pos[c.id];
      linesLayer.appendChild(svgEl('line', {x1:cp.x,y1:busY,x2:cp.x,y2:cp.y-HALF, stroke:'var(--ink)', 'stroke-width':1.6}));
    });
  });

  tree.nodes.forEach(n=>{
    const p = pos[n.id];
    const g = svgEl('g', {class:'ped-node', 'data-id': n.id});
    const fill = n.affected ? 'var(--ink)' : 'var(--surface)';
    if(n.sex === 'M'){
      g.appendChild(svgEl('rect', {x:p.x-HALF, y:p.y-HALF, width:SYM, height:SYM, fill, stroke:'var(--ink)', 'stroke-width':1.8}));
    } else {
      g.appendChild(svgEl('circle', {cx:p.x, cy:p.y, r:HALF, fill, stroke:'var(--ink)', 'stroke-width':1.8}));
    }
    const label = svgEl('text', {x:p.x, y:p.y+HALF+15, 'text-anchor':'middle', class:'ped-label'});
    label.textContent = pedigreeLabel(tree, n.id);
    g.appendChild(label);
    symbolsLayer.appendChild(g);
  });

  return svg;
}

function buildPedigreeActivity(root){
  root.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">활동 2 · 가계도 분석</div>
      <h1>이 가계도의 유전 방식을 추리해 보세요</h1>
      <p>버튼을 누를 때마다 완전히 새로운 가계도가 만들어집니다. 이 활동은 중학교 교육과정에 맞추어 <b>상염색체 유전</b>만 다룹니다. (검게 채워진 도형 = 형질이 나타난 사람)</p>
    </div>

    <div class="panel" style="margin-bottom:18px;">
      <div class="toolbar">
        <button class="btn primary" id="pd-new">🔄 새 가계도 생성</button>
        <span style="margin-left:auto;display:flex;gap:14px;font-size:12px;color:var(--ink-soft);align-items:center;">
          <span style="display:flex;align-items:center;gap:5px;"><svg width="16" height="16"><rect x="1" y="1" width="14" height="14" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/></svg>남자(정상)</span>
          <span style="display:flex;align-items:center;gap:5px;"><svg width="16" height="16"><rect x="1" y="1" width="14" height="14" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.6"/></svg>남자(형질)</span>
          <span style="display:flex;align-items:center;gap:5px;"><svg width="16" height="16"><circle cx="8" cy="8" r="7" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/></svg>여자(정상)</span>
          <span style="display:flex;align-items:center;gap:5px;"><svg width="16" height="16"><circle cx="8" cy="8" r="7" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.6"/></svg>여자(형질)</span>
        </span>
      </div>
      <div id="pd-svg-wrap" style="overflow-x:auto;"></div>
    </div>

    <div class="panel" style="margin-bottom:18px;">
      <h3 style="font-size:17px;margin-bottom:10px;">유형 1 · 우열 관계 추리</h3>
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 12px;">이 형질은 우성 유전일까요, 열성 유전일까요? 근거가 되는 가족을 가계도에서 찾아보세요.</p>
      <div style="display:flex;gap:16px;margin-bottom:12px;">
        <label style="display:flex;gap:6px;align-items:center;font-size:14px;"><input type="radio" name="pd-mode" value="dominant"> 우성 유전</label>
        <label style="display:flex;gap:6px;align-items:center;font-size:14px;"><input type="radio" name="pd-mode" value="recessive"> 열성 유전</label>
      </div>
      <button class="btn" id="pd-check1">답 확인하기</button>
      <div id="pd-result1" style="margin-top:12px;"></div>
    </div>

    <div class="panel" style="margin-bottom:18px;">
      <h3 style="font-size:17px;margin-bottom:6px;">유형 2 · 구성원 유전자형 완성</h3>
      <p style="color:var(--ink-soft);font-size:13.5px;margin:0 0 14px;">가계도만으로 확정할 수 없는 경우도 있다는 점에 유의하며, 각 구성원의 유전자형을 골라 보세요.</p>
      <div id="pd-genotype-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;"></div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px;">
        <button class="btn" id="pd-check2">유전자형 채점하기</button>
        <span id="pd-score2" class="pill good" style="display:none;"></span>
      </div>
    </div>

    <div id="pd-qbox"></div>
  `;
  const style = document.createElement('style');
  style.textContent = `
    .ped-label{ font-family:"IBM Plex Mono",monospace; font-size:11px; fill:var(--ink-soft); }
    .ped-node.evidence rect, .ped-node.evidence circle{ stroke:var(--accent); stroke-width:3.2px; }
    .geno-row{ border:1px solid var(--line); border-radius:8px; padding:9px 11px; display:flex; flex-direction:column; gap:6px; background:var(--surface-2); }
    .geno-row.correct{ border-color:var(--good); background:var(--good-soft); }
    .geno-row.incorrect{ border-color:var(--alert); background:var(--alert-soft); }
    .geno-row .who{ font-size:12.5px; font-weight:600; display:flex; justify-content:space-between; }
    .geno-row select{ font-family:"IBM Plex Mono",monospace; font-size:12.5px; padding:5px 6px; border-radius:6px; border:1px solid var(--line); background:var(--surface); color:var(--ink); }
  `;
  root.appendChild(style);

  let tree = null;

  function renderAll(){
    tree = buildPedigreeTree();
    const wrap = $('#pd-svg-wrap', root);
    wrap.innerHTML = '';
    wrap.appendChild(renderPedigreeSVG(tree));
    $$('input[name="pd-mode"]', root).forEach(r=>r.checked=false);
    $('#pd-result1', root).innerHTML = '';
    $('#pd-score2', root).style.display = 'none';
    renderGenotypeGrid();
  }

  function renderGenotypeGrid(){
    const grid = $('#pd-genotype-grid', root);
    grid.innerHTML = '';
    [1,2,3].forEach(gen=>{
      tree.layout[gen].forEach(id=>{
        const n = tree.nodes.find(x=>x.id===id);
        const row = document.createElement('div');
        row.className = 'geno-row';
        row.dataset.id = id;
        row.innerHTML = `
          <div class="who"><span>${pedigreeLabel(tree,id)} · ${n.sex==='M'?'남':'여'}${n.affected?' · 형질':''}</span></div>
          <select>
            <option value="">유전자형 선택</option>
            <option value="AA">동형 우성 (AA)</option>
            <option value="Aa">이형 (Aa)</option>
            <option value="aa">동형 열성 (aa)</option>
            <option value="ambiguous">AA 또는 Aa (확정 불가)</option>
          </select>
        `;
        grid.appendChild(row);
      });
    });
  }

  $('#pd-new', root).addEventListener('click', renderAll);

  $('#pd-check1', root).addEventListener('click', ()=>{
    const chosen = $('input[name="pd-mode"]:checked', root);
    const resEl = $('#pd-result1', root);
    if(!chosen){ resEl.innerHTML = `<span class="pill alert">우성 또는 열성을 먼저 선택하세요</span>`; return; }
    const correct = chosen.value === tree.mode;
    const aLabel = pedigreeLabel(tree, tree.evidence.parentIds[0]);
    const bLabel = pedigreeLabel(tree, tree.evidence.parentIds[1]);
    const cLabel = pedigreeLabel(tree, tree.evidence.childId);
    const explain = tree.mode==='recessive'
      ? `${aLabel}(정상) × ${bLabel}(정상) 부부에게서 ${cLabel}에게 형질이 나타났습니다. 정상인 부모 사이에서 형질이 있는 자녀가 태어났으므로 <b>열성 유전</b>입니다.`
      : `${aLabel}(형질 있음) × ${bLabel}(형질 있음) 부부에게서 ${cLabel}은(는) 형질이 나타나지 않았습니다. 형질이 있는 부모 사이에서 정상인 자녀가 태어났으므로 <b>우성 유전</b>입니다.`;
    resEl.innerHTML = `<div class="pill ${correct?'good':'alert'}" style="margin-bottom:8px;">${correct?'정답입니다':'다시 생각해 보세요'}</div>
      <p style="margin:0;font-size:13.5px;color:var(--ink-soft);">${explain}</p>`;
    [tree.evidence.parentIds[0], tree.evidence.parentIds[1], tree.evidence.childId].forEach(id=>{
      const g = $(`.ped-node[data-id="${id}"]`, root);
      if(g) g.classList.add('evidence');
    });

    const modeLabel = { dominant:'우성 유전', recessive:'열성 유전' };
    logActivityResult('pedigree',
      `가계도 우열 추리: ${modeLabel[chosen.value]} 선택 (정답 ${modeLabel[tree.mode]}) · ${correct ? '정답' : '오답'}`,
      { part:'type1', chosen: chosen.value, correctMode: tree.mode, correct },
      correct ? 'correct' : 'incorrect'
    );
  });

  $('#pd-check2', root).addEventListener('click', ()=>{
    let correct = 0, total = 0;
    $$('.geno-row', root).forEach(row=>{
      const node = tree.nodes.find(n=>n.id===row.dataset.id);
      const expected = classifyGenotype(tree.nodes, node);
      const val = $('select', row).value;
      total++;
      const isCorrect = expected.status==='exact' ? val===expected.value : val==='ambiguous';
      row.classList.remove('correct','incorrect');
      row.classList.add(isCorrect ? 'correct' : 'incorrect');
      if(isCorrect) correct++;
    });
    const scoreEl = $('#pd-score2', root);
    scoreEl.style.display = 'inline-flex';
    scoreEl.className = 'pill ' + (correct===total ? 'good' : 'alert');
    scoreEl.textContent = `${correct} / ${total} 명 정확`;

    logActivityResult('pedigree',
      `가계도 유전자형 완성: ${correct}/${total}명 정확 (${tree.mode==='dominant'?'우성':'열성'} 유전)`,
      { part:'type2', correct, total, mode: tree.mode },
      correct === total ? 'correct' : 'incorrect'
    );
  });

  renderAll();

  mountQuestionBox($('#pd-qbox', root), 'pedigree', [
    '왜 어떤 사람의 유전자형은 가계도만으로 확정할 수 없을까?',
    '만약 이 형질이 성염색체에 있다면 가계도가 어떻게 달라질까?',
    '3대에 걸쳐 형질이 한 번도 안 나타나면 무엇을 알 수 있을까?'
  ], '가계도를 분석하며 들었던 궁금증을 질문으로 만들어 보세요.');
}

/* =========================================================================
   활동 3 — 동전 던지기 유전 실험 (Coin Flip)
   ========================================================================= */
function gcd(a,b){ return b===0 ? a : gcd(b, a%b); }
function alleleFrom(genotype){
  if(genotype === 'AA') return 'A';
  if(genotype === 'aa') return 'a';
  return Math.random() < 0.5 ? 'A' : 'a';
}
function theoreticalRatioLabel(genoA, genoB){
  const combos = [];
  genoA.split('').forEach(a=> genoB.split('').forEach(b=> combos.push(combineGenotype(a,b))));
  const dom = combos.filter(g=>g.includes('A')).length;
  const rec = combos.length - dom;
  if(rec===0) return '분리 없음 · 모두 우성 표현형';
  if(dom===0) return '분리 없음 · 모두 열성 표현형';
  const g = gcd(dom,rec);
  return `${dom/g} : ${rec/g}`;
}
function observedRatioLabel(dom, rec){
  if(dom===0 && rec===0) return '아직 데이터 없음';
  if(rec===0) return `${dom} : 0`;
  if(dom===0) return `0 : ${rec}`;
  return `${dom} : ${rec}  (약 ${(dom/rec).toFixed(2)} : 1)`;
}

function buildCoinActivity(root){
  root.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">활동 3 · 동전 던지기 유전 실험</div>
      <h1>동전으로 생식세포를 흉내 내어 3:1 분리비를 확인하세요</h1>
      <p>이형(Aa) 어버이는 동전을 던져 앞면(A)·뒷면(a) 중 하나를 자손에게 물려줍니다. 여러 번 반복하며 실제 분리비가 이론값에 가까워지는지 관찰해 보세요.</p>
    </div>

    <div class="panel" style="margin-bottom:18px;">
      <div class="toolbar" style="gap:18px;">
        <label style="font-size:13px;display:flex;gap:8px;align-items:center;">어버이 1
          <select id="cn-pa" class="mono"><option value="AA">AA</option><option value="Aa" selected>Aa</option><option value="aa">aa</option></select>
        </label>
        <label style="font-size:13px;display:flex;gap:8px;align-items:center;">어버이 2
          <select id="cn-pb" class="mono"><option value="AA">AA</option><option value="Aa" selected>Aa</option><option value="aa">aa</option></select>
        </label>
        <span class="pill accent mono" id="cn-theory" style="background:var(--accent-soft);color:var(--accent);"></span>
        <button class="btn ghost" id="cn-reset" style="margin-left:auto;">초기화</button>
      </div>

      <div style="display:flex;gap:28px;align-items:center;flex-wrap:wrap;padding:14px 4px;">
        <div style="display:flex;gap:14px;align-items:center;">
          <div class="cn-coin" id="cn-coin-a">?</div>
          <span style="font-size:20px;color:var(--ink-soft);">+</span>
          <div class="cn-coin" id="cn-coin-b">?</div>
          <span style="font-size:20px;color:var(--ink-soft);">=</span>
          <div id="cn-child-result" class="cn-child-card">자손 없음</div>
        </div>
        <div style="display:flex;gap:8px;margin-left:auto;">
          <button class="btn primary" id="cn-flip1">🪙 1회 던지기</button>
          <button class="btn" id="cn-flip10">10회 던지기</button>
          <button class="btn" id="cn-flip50">50회 던지기</button>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="font-size:17px;">누적 결과</h3>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn primary" id="cn-submit">📤 선생님께 결과 보내기</button>
          <span class="pill good" id="cn-submit-ok" style="display:none;">전송 완료</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:16px;">
        <div class="cn-stat"><span class="lbl">총 시행 횟수</span><span class="val mono" id="cn-total">0</span></div>
        <div class="cn-stat"><span class="lbl">유전자형 AA : Aa : aa</span><span class="val mono" id="cn-geno">0 : 0 : 0</span></div>
        <div class="cn-stat"><span class="lbl">관찰된 표현형 비 (우성:열성)</span><span class="val mono" id="cn-ratio">아직 데이터 없음</span></div>
      </div>
      <div id="cn-bars"></div>
    </div>

    <div class="panel" style="margin-bottom:18px;">
      <h3 style="font-size:17px;margin-bottom:6px;">가계도로 보기</h3>
      <p style="color:var(--ink-soft);font-size:13px;margin:0 0 10px;">칠해진 도형 = 열성 표현형. 최근 30명까지 표시합니다.</p>
      <div id="cn-pedigree-wrap" style="overflow-x:auto;"></div>
    </div>

    <div id="cn-qbox"></div>
  `;
  const style = document.createElement('style');
  style.textContent = `
    .cn-coin{ width:56px; height:56px; border-radius:50%; background:var(--surface-2); border:2px solid var(--line);
      display:flex; align-items:center; justify-content:center; font-family:"IBM Plex Mono",monospace; font-weight:700;
      font-size:20px; transition:transform .35s ease; }
    .cn-coin.flip{ transform:rotateY(360deg) scale(1.08); }
    .cn-child-card{ font-family:"IBM Plex Mono",monospace; font-size:14px; border:1px solid var(--line); border-radius:10px;
      padding:10px 16px; background:var(--surface-2); min-width:150px; }
    .cn-stat{ background:var(--surface-2); border:1px solid var(--line); border-radius:10px; padding:11px 13px; display:flex; flex-direction:column; gap:4px; }
    .cn-stat .lbl{ font-size:11.5px; color:var(--ink-soft); }
    .cn-stat .val{ font-size:17px; font-weight:600; }
    .cn-bar-row{ display:flex; align-items:center; gap:10px; margin-bottom:8px; }
    .cn-bar-row .name{ width:70px; font-size:12.5px; color:var(--ink-soft); flex:none; }
    .cn-bar-track{ flex:1; height:16px; background:var(--surface-2); border-radius:5px; overflow:hidden; }
    .cn-bar-fill{ height:100%; border-radius:5px; }
    .cn-bar-row .count{ width:44px; text-align:right; font-family:"IBM Plex Mono",monospace; font-size:12.5px; flex:none; }
  `;
  root.appendChild(style);

  const paSel = $('#cn-pa', root), pbSel = $('#cn-pb', root);
  let tally = { AA:0, Aa:0, aa:0, dom:0, rec:0, history: [] };

  function updateTheory(){
    $('#cn-theory', root).textContent = `이론적 표현형 비 = ${theoreticalRatioLabel(paSel.value, pbSel.value)}`;
  }

  function flipOnce(){
    const a1 = alleleFrom(paSel.value), a2 = alleleFrom(pbSel.value);
    const genotype = combineGenotype(a1,a2);
    const phenotype = genotype.includes('A') ? 'dom' : 'rec';
    tally[genotype]++;
    tally[phenotype]++;
    const item = { genotype, phenotype, sex: pick(['M','F']) };
    tally.history.push(item);
    return { a1, a2, item };
  }

  function renderResult(a1, a2, item){
    const coinA = $('#cn-coin-a', root), coinB = $('#cn-coin-b', root);
    coinA.textContent = a1; coinB.textContent = a2;
    coinA.classList.remove('flip'); coinB.classList.remove('flip');
    void coinA.offsetWidth;
    coinA.classList.add('flip'); coinB.classList.add('flip');
    $('#cn-child-result', root).innerHTML =
      `자손 <span class="mono">${item.genotype}</span> · <span class="pill ${item.phenotype==='dom'?'dominant':'recessive'}">${item.phenotype==='dom'?'우성 표현형':'열성 표현형'}</span>`;
  }

  function renderStats(){
    const total = tally.history.length;
    $('#cn-total', root).textContent = total;
    $('#cn-geno', root).textContent = `${tally.AA} : ${tally.Aa} : ${tally.aa}`;
    $('#cn-ratio', root).textContent = observedRatioLabel(tally.dom, tally.rec);

    const bars = $('#cn-bars', root);
    const max = Math.max(tally.dom, tally.rec, 1);
    bars.innerHTML = '';
    [['우성', tally.dom, 'var(--dominant)'], ['열성', tally.rec, 'var(--recessive)']].forEach(([name,count,color])=>{
      const row = document.createElement('div');
      row.className = 'cn-bar-row';
      row.innerHTML = `<span class="name">${name} 표현형</span>
        <div class="cn-bar-track"><div class="cn-bar-fill" style="width:${(count/max*100)}%;background:${color};"></div></div>
        <span class="count mono">${count}</span>`;
      bars.appendChild(row);
    });
  }

  function renderPedigree(){
    const wrap = $('#cn-pedigree-wrap', root);
    const recent = tally.history.slice(-30);
    const SLOT = 64, HALF = 16;
    const width = Math.max(recent.length,1)*SLOT + 80;
    const parentY = 46, childY = 150, busY = 100;
    const svg = svgEl('svg', {viewBox:`0 0 ${width} 190`, width:'100%', height:190});
    const pAx = width/2 - 40, pBx = width/2 + 40;
    svg.appendChild(svgEl('line',{x1:pAx+HALF,y1:parentY,x2:pBx-HALF,y2:parentY,stroke:'var(--ink)','stroke-width':1.6}));
    svg.appendChild(svgEl('circle',{cx:pAx,cy:parentY,r:HALF,fill:'var(--surface)',stroke:'var(--ink)','stroke-width':1.8}));
    svg.appendChild(svgEl('rect',{x:pBx-HALF,y:parentY-HALF,width:HALF*2,height:HALF*2,fill:'var(--surface)',stroke:'var(--ink)','stroke-width':1.8}));
    if(recent.length){
      const midX = (pAx+pBx)/2;
      svg.appendChild(svgEl('line',{x1:midX,y1:parentY+HALF,x2:midX,y2:busY,stroke:'var(--ink)','stroke-width':1.6}));
      const startX = (width - recent.length*SLOT)/2 + SLOT/2;
      const xs = recent.map((_,i)=>startX+i*SLOT);
      svg.appendChild(svgEl('line',{x1:Math.min(...xs),y1:busY,x2:Math.max(...xs),y2:busY,stroke:'var(--ink)','stroke-width':1.6}));
      recent.forEach((item,i)=>{
        const x = xs[i];
        svg.appendChild(svgEl('line',{x1:x,y1:busY,x2:x,y2:childY-HALF,stroke:'var(--ink)','stroke-width':1.6}));
        const fill = item.phenotype==='rec' ? 'var(--ink)' : 'var(--surface)';
        if(item.sex==='M'){
          svg.appendChild(svgEl('rect',{x:x-HALF,y:childY-HALF,width:HALF*2,height:HALF*2,fill,stroke:'var(--ink)','stroke-width':1.6}));
        } else {
          svg.appendChild(svgEl('circle',{cx:x,cy:childY,r:HALF,fill,stroke:'var(--ink)','stroke-width':1.6}));
        }
      });
    }
    wrap.innerHTML = '';
    wrap.appendChild(svg);
  }

  function doFlips(n){
    let last = null;
    for(let i=0;i<n;i++) last = flipOnce();
    renderResult(last.a1, last.a2, last.item);
    renderStats();
    renderPedigree();
  }

  function reset(){
    tally = { AA:0, Aa:0, aa:0, dom:0, rec:0, history: [] };
    $('#cn-coin-a', root).textContent = '?';
    $('#cn-coin-b', root).textContent = '?';
    $('#cn-child-result', root).textContent = '자손 없음';
    updateTheory();
    renderStats();
    renderPedigree();
  }

  paSel.addEventListener('change', reset);
  pbSel.addEventListener('change', reset);
  $('#cn-reset', root).addEventListener('click', reset);
  $('#cn-flip1', root).addEventListener('click', ()=>doFlips(1));
  $('#cn-flip10', root).addEventListener('click', ()=>doFlips(10));
  $('#cn-flip50', root).addEventListener('click', ()=>doFlips(50));

  $('#cn-submit', root).addEventListener('click', ()=>{
    const total = tally.history.length;
    if(!total) return;
    logActivityResult('coin',
      `동전 실험: ${paSel.value}×${pbSel.value} 교배, 총 ${total}회 시행, 우성:열성 = ${tally.dom}:${tally.rec} (이론값 ${theoreticalRatioLabel(paSel.value,pbSel.value)})`,
      { parentA: paSel.value, parentB: pbSel.value, total, dom: tally.dom, rec: tally.rec,
        genotypes: { AA: tally.AA, Aa: tally.Aa, aa: tally.aa } }
    );
    const ok = $('#cn-submit-ok', root);
    ok.style.display = 'inline-flex';
    setTimeout(()=>{ ok.style.display = 'none'; }, 2500);
  });

  reset();

  mountQuestionBox($('#cn-qbox', root), 'coin', [
    '시행 횟수가 늘어나면 왜 이론값에 더 가까워질까?',
    'AA × aa처럼 다른 조합을 던지면 분리비는 어떻게 달라질까?',
    '동전 던지기와 실제 생식세포 형성은 어떤 점이 비슷하고 다를까?'
  ], '동전 실험 결과와 이론값을 비교하며 궁금한 점을 질문으로 만들어 보세요.');
}

/* ---- router ------------------------------------------------------------ */
function initRouter(){
  const tabs = $$('.tab[data-view]');
  const views = {
    home: $('#view-home'),
    karyotype: $('#view-karyotype'),
    pedigree: $('#view-pedigree'),
    coin: $('#view-coin'),
  };
  function go(name){
    tabs.forEach(t => t.classList.toggle('active', t.dataset.view === name));
    Object.entries(views).forEach(([k,v]) => v.classList.toggle('active', k===name));
    window.scrollTo({top:0});
  }
  tabs.forEach(t => t.addEventListener('click', ()=>go(t.dataset.view)));
  $$('[data-goto]').forEach(btn => btn.addEventListener('click', ()=>go(btn.dataset.goto)));
  return { go };
}

function renderStudentSummary(){
  const el = $('#student-summary');
  if(!el) return;
  const info = getStudentInfo();
  el.textContent = info
    ? `${info.school} ${info.grade}학년 ${info.classNo}반 ${info.number}번 ${info.name}`
    : '입력된 정보 없음';
}

function initInfoGate(){
  const gate = $('#info-gate');
  const fields = {
    school: $('#ig-school'), grade: $('#ig-grade'),
    classNo: $('#ig-class'), number: $('#ig-number'), name: $('#ig-name'),
  };
  const errorEl = $('#ig-error');

  function openGate(prefill){
    if(prefill){
      fields.school.value = prefill.school || '';
      fields.grade.value = prefill.grade || '';
      fields.classNo.value = prefill.classNo || '';
      fields.number.value = prefill.number || '';
      fields.name.value = prefill.name || '';
    }
    errorEl.hidden = true;
    gate.hidden = false;
  }

  $('#ig-submit').addEventListener('click', ()=>{
    const info = {
      school: fields.school.value.trim(),
      grade: fields.grade.value.trim(),
      classNo: fields.classNo.value.trim(),
      number: fields.number.value.trim(),
      name: fields.name.value.trim(),
    };
    if(!info.school || !info.grade || !info.classNo || !info.number || !info.name){
      errorEl.hidden = false;
      return;
    }
    setStudentInfo(info);
    renderStudentSummary();
    gate.hidden = true;
  });

  $('#edit-info').addEventListener('click', ()=> openGate(getStudentInfo()));

  const existing = getStudentInfo();
  renderStudentSummary();
  if(!existing) openGate(null);
  else gate.hidden = true;
}

document.addEventListener('DOMContentLoaded', ()=>{
  initRouter();
  initInfoGate();
  buildKaryotypeActivity($('#view-karyotype'));
  buildPedigreeActivity($('#view-pedigree'));
  buildCoinActivity($('#view-coin'));
});
