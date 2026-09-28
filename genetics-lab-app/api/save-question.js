// POST /api/save-question
// 학생이 "질문 추가하기"를 누르는 즉시(AI와 대화를 시작하지 않아도) 질문을 저장해
// 질문 게시판과 교사 대시보드에 바로 보이게 한다. Gemini는 호출하지 않는다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  const { student, activity, question } = req.body || {};
  const s = student || {};
  if (!s.school || !s.grade || !s.classNo || !s.number || !s.name) {
    res.status(400).json({ error: 'student_info_required' });
    return;
  }
  if (!activity || !question || !String(question).trim()) {
    res.status(400).json({ error: 'activity_and_question_required' });
    return;
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        school: String(s.school).slice(0, 80),
        grade: Number.parseInt(s.grade, 10) || null,
        class_no: Number.parseInt(s.classNo, 10) || null,
        student_number: Number.parseInt(s.number, 10) || null,
        student_name: String(s.name).slice(0, 60),
        activity,
        question_text: String(question).trim().slice(0, 1000),
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Supabase insert failed: ${resp.status} ${text}`);
    }
    const [row] = await resp.json();
    res.status(200).json({ questionId: row.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
