const ACTIVITY_LABEL = { karyotype: '핵형 분석', pedigree: '가계도 분석', coin: '동전 실험' };
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

let allQuestions = [];
let allActivityLogs = [];
let viewMode = 'questions'; // 'questions' | 'activities' | 'floating'
const filters = { activity: 'all', school: 'all', grade: 'all', classNo: 'all' };
let floatingTimer = null;

function stopFloatingRefresh(){ if(floatingTimer){ clearInterval(floatingTimer); floatingTimer = null; } }
function startFloatingRefresh(){
  stopFloatingRefresh();
  floatingTimer = setInterval(() => {
    const pc = sessionStorage.getItem('qlab:teacherPasscode');
    if(pc) loadAndRender(pc).catch(()=>{});
  }, 15000);
}

function fmtTime(iso){
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function whoLabel(r){
  return r.school
    ? `${escapeHtml(r.school)} · ${r.grade}학년 ${r.class_no}반 ${r.student_number}번 ${escapeHtml(r.student_name||'')}`
    : '정보 없음';
}

async function fetchDashboard(passcode){
  const res = await fetch('/api/dashboard?passcode=' + encodeURIComponent(passcode));
  if(res.status === 401) throw new Error('invalid_passcode');
  if(!res.ok) throw new Error('server_error');
  return res.json();
}

function currentDataset(){
  return viewMode === 'activities' ? allActivityLogs : allQuestions;
}

function renderViewTabs(){
  const el = $('#view-tabs');
  const tabs = [['questions','🤔 탐구 질문'], ['activities','📊 활동 기록'], ['floating','🎈 떠다니는 질문']];
  el.innerHTML = '';
  tabs.forEach(([key,label])=>{
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = key === viewMode ? 'active' : '';
    btn.addEventListener('click', ()=>{
      viewMode = key;
      filters.activity = 'all'; filters.school = 'all'; filters.grade = 'all'; filters.classNo = 'all';
      if(key === 'floating') startFloatingRefresh(); else stopFloatingRefresh();
      renderAll();
    });
    el.appendChild(btn);
  });
}

function renderStats(items){
  const total = items.length;
  const counts = { karyotype:0, pedigree:0, coin:0 };
  items.forEach(q => { if(counts[q.activity] !== undefined) counts[q.activity]++; });
  const firstStat = viewMode === 'activities'
    ? `<div class="stat"><div class="n">${total}</div><div class="l">선택된 범위 내 활동 기록</div></div>`
    : `<div class="stat"><div class="n">${total}</div><div class="l">선택된 범위 내 질문</div></div>
       <div class="stat"><div class="n">${items.filter(q => (q.messages||[]).length > 1).length}</div><div class="l">AI와 대화까지 진행</div></div>
       <div class="stat"><div class="n">${items.reduce((sum,q)=>sum+(q.question_likes||[]).length,0)}</div><div class="l">받은 하트 수</div></div>
       <div class="stat"><div class="n">${items.reduce((sum,q)=>sum+(q.question_comments||[]).length,0)}</div><div class="l">달린 댓글 수</div></div>`;
  $('#stats').innerHTML = firstStat + `
    <div class="stat"><div class="n">${counts.karyotype}</div><div class="l">핵형 분석</div></div>
    <div class="stat"><div class="n">${counts.pedigree}</div><div class="l">가계도 분석</div></div>
    <div class="stat"><div class="n">${counts.coin}</div><div class="l">동전 실험</div></div>
  `;
}

function uniqueSorted(values){
  return Array.from(new Set(values.filter(v => v !== null && v !== undefined && v !== ''))).sort((a,b)=>
    typeof a === 'number' ? a-b : String(a).localeCompare(String(b), 'ko')
  );
}

function renderSelectFilters(){
  const dataset = currentDataset();
  const wrap = $('#select-filters');
  const schools = uniqueSorted(dataset.map(q=>q.school));
  // 학교 필터가 선택되어 있으면 그 학교 안에서만 학년/반 옵션을 보여줌
  const scoped = filters.school === 'all' ? dataset : dataset.filter(q=>q.school === filters.school);
  const grades = uniqueSorted(scoped.map(q=>q.grade));
  const scopedByGrade = filters.grade === 'all' ? scoped : scoped.filter(q=>q.grade === Number(filters.grade));
  const classes = uniqueSorted(scopedByGrade.map(q=>q.class_no));

  function buildSelect(id, label, options, current, formatOpt){
    const sel = document.createElement('select');
    sel.id = id;
    sel.innerHTML = `<option value="all">${label} 전체</option>` +
      options.map(o => `<option value="${o}" ${String(o)===String(current)?'selected':''}>${formatOpt(o)}</option>`).join('');
    return sel;
  }

  wrap.innerHTML = '';
  const schoolSel = buildSelect('f-school', '학교', schools, filters.school, s=>s);
  const gradeSel = buildSelect('f-grade', '학년', grades, filters.grade, g=>`${g}학년`);
  const classSel = buildSelect('f-class', '반', classes, filters.classNo, c=>`${c}반`);

  schoolSel.addEventListener('change', ()=>{ filters.school = schoolSel.value; filters.grade='all'; filters.classNo='all'; renderAll(); });
  gradeSel.addEventListener('change', ()=>{ filters.grade = gradeSel.value; filters.classNo='all'; renderAll(); });
  classSel.addEventListener('change', ()=>{ filters.classNo = classSel.value; renderAll(); });

  wrap.appendChild(schoolSel);
  wrap.appendChild(gradeSel);
  wrap.appendChild(classSel);
}

function renderActivityTabs(){
  const tabs = [['all','전체'], ['karyotype','핵형 분석'], ['pedigree','가계도 분석'], ['coin','동전 실험']];
  const el = $('#activity-tabs');
  el.innerHTML = '';
  tabs.forEach(([key,label])=>{
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = key === filters.activity ? 'active' : '';
    btn.addEventListener('click', ()=>{ filters.activity = key; renderAll(); });
    el.appendChild(btn);
  });
}

function applyFilters(dataset){
  return dataset.filter(q => {
    if(filters.activity !== 'all' && q.activity !== filters.activity) return false;
    if(filters.school !== 'all' && q.school !== filters.school) return false;
    if(filters.grade !== 'all' && q.grade !== Number(filters.grade)) return false;
    if(filters.classNo !== 'all' && q.class_no !== Number(filters.classNo)) return false;
    return true;
  });
}

function renderQuestionList(items){
  const list = $('#list');
  if(!items.length){
    list.innerHTML = '<div class="empty">조건에 맞는 탐구 질문이 없습니다.</div>';
    return;
  }
  list.innerHTML = '';
  items.forEach(q=>{
    const card = document.createElement('div');
    card.className = 'qcard';
    const msgCount = (q.messages||[]).length;
    const likes = q.question_likes || [];
    const comments = q.question_comments || [];
    card.innerHTML = `
      <div class="meta">
        <span class="badge">${ACTIVITY_LABEL[q.activity] || q.activity}</span>
        <span>${whoLabel(q)}</span>
        <span>${fmtTime(q.created_at)}</span>
        <button class="del-btn" title="삭제">🗑</button>
      </div>
      <div class="qtext">${escapeHtml(q.question_text)}</div>
      <div class="board-meta">
        <span class="mini-badge">❤️ ${likes.length}</span>
        ${likes.length ? `<span class="likers">${likes.map(l=>`${escapeHtml(l.student_name||'')}(${l.student_number ?? ''})`).join(', ')}</span>` : ''}
      </div>
      ${msgCount > 1 ? `<button class="toggle">대화 ${msgCount}개 보기 ▾</button>` : '<span style="font-size:12px;color:var(--ink-soft);">아직 AI와 대화하지 않았어요</span>'}
      <div class="thread" hidden></div>
      ${comments.length ? `<button class="toggle comment-toggle">댓글 ${comments.length}개 보기 ▾</button>` : '<span style="font-size:12px;color:var(--ink-soft);">아직 댓글이 없어요</span>'}
      <div class="comment-thread" hidden></div>
    `;
    if(msgCount > 1){
      const toggle = $('.toggle', card);
      const thread = $('.thread', card);
      toggle.addEventListener('click', ()=>{
        if(!thread.hidden){ thread.hidden = true; toggle.textContent = `대화 ${msgCount}개 보기 ▾`; return; }
        thread.innerHTML = '';
        (q.messages||[]).forEach(m=>{
          const b = document.createElement('div');
          b.className = 'bubble ' + (m.role === 'model' ? 'model' : 'user');
          b.textContent = m.content;
          thread.appendChild(b);
        });
        thread.hidden = false;
        toggle.textContent = '대화 접기 ▴';
      });
    }
    if(comments.length){
      const cToggle = $('.comment-toggle', card);
      const cThread = $('.comment-thread', card);
      cToggle.addEventListener('click', ()=>{
        if(!cThread.hidden){ cThread.hidden = true; cToggle.textContent = `댓글 ${q.question_comments.length}개 보기 ▾`; return; }
        cThread.innerHTML = '';
        q.question_comments.forEach(c=>{
          const item = document.createElement('div');
          item.className = 'comment-item';
          item.innerHTML = `
            <b>${c.student_number ?? ''}번 ${escapeHtml(c.student_name||'')}</b>
            <span>${escapeHtml(c.comment_text)}</span>
            <button class="comment-del" title="삭제">🗑</button>
          `;
          $('.comment-del', item).addEventListener('click', ()=>{
            if(!confirm('이 댓글을 삭제할까요?')) return;
            deleteRecord('comment', c.id, ()=>{
              q.question_comments = q.question_comments.filter(x=>x.id!==c.id);
              renderAll();
            });
          });
          cThread.appendChild(item);
        });
        cThread.hidden = false;
        cToggle.textContent = '댓글 접기 ▴';
      });
    }
    $('.del-btn', card).addEventListener('click', ()=>{
      if(!confirm('이 탐구 질문과 AI 대화를 삭제할까요?')) return;
      deleteRecord('question', q.id, ()=>{
        allQuestions = allQuestions.filter(x=>x.id!==q.id);
        renderAll();
      });
    });
    list.appendChild(card);
  });
}

function renderActivityLogList(items){
  const list = $('#list');
  if(!items.length){
    list.innerHTML = '<div class="empty">조건에 맞는 활동 기록이 없습니다.</div>';
    return;
  }
  list.innerHTML = '';
  items.forEach(r=>{
    const card = document.createElement('div');
    card.className = 'qcard' + (r.outcome === 'incorrect' ? ' outcome-incorrect' : r.outcome === 'correct' ? ' outcome-correct' : '');
    card.innerHTML = `
      <div class="meta">
        <span class="badge">${ACTIVITY_LABEL[r.activity] || r.activity}</span>
        ${r.outcome === 'incorrect' ? '<span class="badge badge-bad">오답</span>' : r.outcome === 'correct' ? '<span class="badge badge-ok">정답</span>' : ''}
        <span>${whoLabel(r)}</span>
        <span>${fmtTime(r.created_at)}</span>
        <button class="del-btn" title="삭제">🗑</button>
      </div>
      <div class="qtext">${escapeHtml(r.summary)}</div>
    `;
    $('.del-btn', card).addEventListener('click', ()=>{
      if(!confirm('이 활동 기록을 삭제할까요?')) return;
      deleteRecord('activity', r.id, ()=>{
        allActivityLogs = allActivityLogs.filter(x=>x.id!==r.id);
        renderAll();
      });
    });
    list.appendChild(card);
  });
}

function renderFloatingBoard(items){
  const list = $('#list');
  if(!items.length){
    list.innerHTML = '<div class="empty">떠다니게 할 질문이 없습니다.</div>';
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'floating-wrap';
  items.forEach(q=>{
    const duration = 16 + Math.random()*14;
    const b = document.createElement('div');
    b.className = 'bubble-float activity-' + q.activity;
    b.style.left = (Math.random()*82).toFixed(1) + '%';
    b.style.animationDuration = duration.toFixed(1) + 's';
    b.style.animationDelay = (-Math.random()*duration).toFixed(1) + 's';
    b.style.setProperty('--drift', Math.round(Math.random()*100-50) + 'px');
    const likeCount = (q.question_likes||[]).length;
    b.title = whoLabel(q);
    b.innerHTML = `<span class="bf-activity">${ACTIVITY_LABEL[q.activity] || q.activity}${likeCount ? ` · ❤️${likeCount}` : ''}</span>${escapeHtml(q.question_text)}`;
    b.addEventListener('click', ()=> b.classList.toggle('paused'));
    wrap.appendChild(b);
  });
  list.innerHTML = '';
  list.appendChild(wrap);
}

async function deleteRecord(type, id, onSuccess){
  const passcode = sessionStorage.getItem('qlab:teacherPasscode');
  try{
    const res = await fetch('/api/dashboard-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode, type, id }),
    });
    if(!res.ok) throw new Error('delete_failed');
    onSuccess();
  }catch(e){
    alert('삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function renderAll(){
  renderViewTabs();
  renderActivityTabs();
  renderSelectFilters();
  const items = applyFilters(currentDataset());
  renderStats(items);
  if(viewMode === 'questions') renderQuestionList(items);
  else if(viewMode === 'floating') renderFloatingBoard(items);
  else renderActivityLogList(items);
}

async function loadAndRender(passcode){
  const data = await fetchDashboard(passcode);
  allQuestions = data.questions || [];
  allActivityLogs = data.activityLogs || [];
  renderAll();
}

document.addEventListener('DOMContentLoaded', ()=>{
  const gate = $('#gate');
  const dash = $('#dash');
  const passInput = $('#passcode');
  const err = $('#gate-err');

  async function tryEnter(passcode){
    err.hidden = true;
    try{
      await loadAndRender(passcode);
      sessionStorage.setItem('qlab:teacherPasscode', passcode);
      gate.hidden = true;
      dash.hidden = false;
    }catch(e){
      err.hidden = false;
    }
  }

  $('#enter').addEventListener('click', ()=> tryEnter(passInput.value));
  passInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') tryEnter(passInput.value); });

  $('#refresh').addEventListener('click', ()=>{
    const pc = sessionStorage.getItem('qlab:teacherPasscode');
    if(pc) loadAndRender(pc).catch(()=>{});
  });

  const remembered = sessionStorage.getItem('qlab:teacherPasscode');
  if(remembered) tryEnter(remembered);
});
