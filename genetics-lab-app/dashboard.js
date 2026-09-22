const ACTIVITY_LABEL = { karyotype: '핵형 분석', pedigree: '가계도 분석', coin: '동전 실험' };
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

let allQuestions = [];
const filters = { activity: 'all', school: 'all', grade: 'all', classNo: 'all' };

function fmtTime(iso){
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

async function fetchDashboard(passcode){
  const res = await fetch('/api/dashboard?passcode=' + encodeURIComponent(passcode));
  if(res.status === 401) throw new Error('invalid_passcode');
  if(!res.ok) throw new Error('server_error');
  const data = await res.json();
  return data.questions || [];
}

function renderStats(items){
  const total = items.length;
  const withChat = items.filter(q => (q.messages||[]).length > 1).length;
  const counts = { karyotype:0, pedigree:0, coin:0 };
  items.forEach(q => { if(counts[q.activity] !== undefined) counts[q.activity]++; });
  $('#stats').innerHTML = `
    <div class="stat"><div class="n">${total}</div><div class="l">선택된 범위 내 질문</div></div>
    <div class="stat"><div class="n">${withChat}</div><div class="l">AI와 대화까지 진행</div></div>
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
  const wrap = $('#select-filters');
  const schools = uniqueSorted(allQuestions.map(q=>q.school));
  // 학교 필터가 선택되어 있으면 그 학교 안에서만 학년/반 옵션을 보여줌
  const scoped = filters.school === 'all' ? allQuestions : allQuestions.filter(q=>q.school === filters.school);
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

function applyFilters(){
  return allQuestions.filter(q => {
    if(filters.activity !== 'all' && q.activity !== filters.activity) return false;
    if(filters.school !== 'all' && q.school !== filters.school) return false;
    if(filters.grade !== 'all' && q.grade !== Number(filters.grade)) return false;
    if(filters.classNo !== 'all' && q.class_no !== Number(filters.classNo)) return false;
    return true;
  });
}

function renderList(items){
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
    const who = q.school
      ? `${escapeHtml(q.school)} · ${q.grade}학년 ${q.class_no}반 ${q.student_number}번 ${escapeHtml(q.student_name||'')}`
      : '정보 없음';
    card.innerHTML = `
      <div class="meta">
        <span class="badge">${ACTIVITY_LABEL[q.activity] || q.activity}</span>
        <span>${who}</span>
        <span>${fmtTime(q.created_at)}</span>
      </div>
      <div class="qtext">${escapeHtml(q.question_text)}</div>
      ${msgCount > 1 ? `<button class="toggle">대화 ${msgCount}개 보기 ▾</button>` : '<span style="font-size:12px;color:var(--ink-soft);">아직 AI와 대화하지 않았어요</span>'}
      <div class="thread" hidden></div>
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
    list.appendChild(card);
  });
}

function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function renderAll(){
  renderActivityTabs();
  renderSelectFilters();
  const items = applyFilters();
  renderStats(items);
  renderList(items);
}

async function loadAndRender(passcode){
  allQuestions = await fetchDashboard(passcode);
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
