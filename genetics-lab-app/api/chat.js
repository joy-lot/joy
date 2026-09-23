// POST /api/chat
// 학생의 탐구 질문(또는 후속 메시지)을 받아 Gemini와 대화를 이어가고,
// 전체 대화를 Supabase에 저장합니다. GEMINI_API_KEY는 이 서버 함수 안에서만
// 사용되며 클라이언트로 절대 전달되지 않습니다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const MAX_MESSAGES_PER_QUESTION = 12; // 대화 폭주로 인한 API 비용 급증을 막기 위한 안전장치

// 무료 키 하나의 일일 한도에 걸리지 않도록, 쉼표로 구분한 여러 키를 등록해두면
// 요청마다 돌아가며 사용하고, 한도(429)에 걸린 키는 건너뛰고 다음 키로 재시도합니다.
function getGeminiKeys() {
  const multi = process.env.GEMINI_API_KEYS;
  if (multi && multi.trim()) {
    const keys = multi.split(',').map((k) => k.trim()).filter(Boolean);
    if (keys.length) return keys;
  }
  const single = process.env.GEMINI_API_KEY;
  return single ? [single] : [];
}

// 요청이 몰릴 때 항상 같은 키만 쓰지 않도록, 서버 인스턴스가 살아있는 동안
// 시작 지점을 하나씩 돌립니다.
let rotationIndex = 0;

const ACTIVITY_CONTEXT = {
  karyotype: '학생은 방금 "핵형 분석" 활동을 했습니다. 무작위로 생성된 검사자의 염색체 조각을 크기와 모양에 따라 1~22번 및 성염색체 자리에 배치하고, 터너·클라인펠터·다운 증후군 등 염색체 수 이상을 진단해 보는 활동입니다.',
  pedigree: '학생은 방금 "가계도 분석" 활동을 했습니다. 매번 무작위로 생성되는 3대 가계도를 보고 형질의 우열 관계(우성/열성)를 추리하고, 구성원 각각의 유전자형을 완성해 보는 활동입니다(상염색체 유전만 다룸).',
  coin: '학생은 방금 "동전 던지기 유전 실험" 활동을 했습니다. 동전으로 생식세포의 대립유전자를 흉내 내어 자손을 여러 번 만들어 보고, 관찰된 표현형 비율이 이론적인 3:1 분리비에 가까워지는지 확인하는 활동입니다.',
};

function buildSystemPrompt(activity) {
  const context = ACTIVITY_CONTEXT[activity] || '학생은 방금 중학교 과학 "유전과 진화" 단원의 탐구 활동을 했습니다.';
  return [
    '너는 유전학의 아버지라 불리는 그레고어 멘델이야. 완두콩 교배 실험으로 유전의 기본 원리를 처음 밝혀낸 인물이고,',
    '지금은 그 이후 사람들이 밝혀낸 염색체와 DNA 이야기까지 흥미롭게 알고 있는 모습으로 학생과 대화해.',
    '가끔 자신의 완두콩 실험 이야기를 짧게 곁들이며, 학생을 "젊은 탐구자"처럼 다정한 호칭으로 불러줘.',
    context,
    '오늘 수업은 중학교 3학년 학생들이 이미 배운 내용(염색체·유전자·DNA의 관계, 체세포분열과 생식세포분열)을',
    '복습하면서 한 차시 동안 살짝만 더 깊이 파고드는 탐구 질문 수업이야. 학생 수준이 아주 높지 않다는 것을 항상 염두에 둬.',
    '염색체 비분리가 일어나는 자세한 분자적 기전, 반성유전의 교차 계산, 다인자 유전의 통계적 설명처럼',
    '고등학교 수준으로 깊어지는 내용은 자세히 다루지 마. 학생이 그 방향으로 질문을 이어가면',
    '"그 부분은 고등학교에 올라가면 더 자세히 배우게 될 거야" 정도로 자연스럽게 선을 긋고, 지금 배운 수준에서 대화를 이끌어줘.',
    '절대 정답을 곧바로 알려주지 마. 학생이 이미 알고 있는 것에서 출발해 되묻는 질문과 힌트를 통해',
    '스스로 답을 찾아가도록 소크라테스식으로 대화를 이끌어줘.',
    '한 번에 한 가지만 묻거나 짚어주고, 답변은 3~5문장 이내로 짧고 중학생 눈높이에 맞게 한국어로 작성해.',
    '이모지나 과도한 감탄사는 쓰지 마.',
  ].join(' ');
}

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${options.method || 'GET'} ${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function callGeminiWithKey(apiKey, systemPrompt, history) {
  const contents = history.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Gemini API ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
  return text || '(지금은 답을 만들지 못했어요. 다시 한 번 말해줄래요?)';
}

async function callGemini(systemPrompt, history) {
  const keys = getGeminiKeys();
  if (!keys.length) throw new Error('GEMINI_API_KEY(S)가 설정되어 있지 않습니다.');

  const startIndex = rotationIndex % keys.length;
  rotationIndex = (rotationIndex + 1) % keys.length;

  let lastErr;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(startIndex + attempt) % keys.length];
    try {
      return await callGeminiWithKey(key, systemPrompt, history);
    } catch (err) {
      lastErr = err;
      // 이 키가 한도(429)에 걸린 경우에만 다음 키로 넘어가고, 그 외 오류는 바로 던짐
      if (err.status !== 429) throw err;
    }
  }
  throw lastErr;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !getGeminiKeys().length) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  const body = req.body || {};
  const { questionId, activity, student, question, message } = body;

  try {
    let qId = questionId;
    let historyForModel;

    if (!qId) {
      if (!question || !activity) {
        res.status(400).json({ error: 'question_and_activity_required' });
        return;
      }
      const s = student || {};
      if (!s.school || !s.grade || !s.classNo || !s.number || !s.name) {
        res.status(400).json({ error: 'student_info_required' });
        return;
      }
      const [row] = await supabaseRequest('questions', {
        method: 'POST',
        body: JSON.stringify({
          school: String(s.school).slice(0, 80),
          grade: Number.parseInt(s.grade, 10) || null,
          class_no: Number.parseInt(s.classNo, 10) || null,
          student_number: Number.parseInt(s.number, 10) || null,
          student_name: String(s.name).slice(0, 60),
          activity,
          question_text: String(question).slice(0, 1000),
        }),
      });
      qId = row.id;
      await supabaseRequest('messages', {
        method: 'POST',
        body: JSON.stringify({ question_id: qId, role: 'user', content: question }),
      });
      historyForModel = [{ role: 'user', content: question }];
    } else {
      if (!message) {
        res.status(400).json({ error: 'message_required' });
        return;
      }
      await supabaseRequest('messages', {
        method: 'POST',
        body: JSON.stringify({ question_id: qId, role: 'user', content: message }),
      });
      const existing = await supabaseRequest(
        `messages?question_id=eq.${qId}&select=role,content&order=created_at.asc`
      );
      if (existing.length >= MAX_MESSAGES_PER_QUESTION) {
        const closing = '오늘 대화는 여기까지만 나눌 수 있어요. 지금까지 나눈 이야기를 바탕으로 스스로 정리해 볼까요?';
        await supabaseRequest('messages', {
          method: 'POST',
          body: JSON.stringify({ question_id: qId, role: 'model', content: closing }),
        });
        res.status(200).json({ questionId: qId, reply: closing, limitReached: true });
        return;
      }
      historyForModel = existing;
    }

    const activityForPrompt = activity || (await supabaseRequest(`questions?id=eq.${qId}&select=activity`))[0]?.activity;
    const reply = await callGemini(buildSystemPrompt(activityForPrompt), historyForModel);

    await supabaseRequest('messages', {
      method: 'POST',
      body: JSON.stringify({ question_id: qId, role: 'model', content: reply }),
    });

    res.status(200).json({ questionId: qId, reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
