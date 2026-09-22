// GET /api/dashboard?passcode=...
// 교사 전용. 모든 학생의 탐구 질문 + AI 대화 스레드, 그리고 활동 결과 기록을 반환합니다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEACHER_PASSCODE = process.env.TEACHER_PASSCODE;

async function supabaseGet(path) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Supabase GET ${path} failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TEACHER_PASSCODE) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  const passcode = req.query.passcode;
  if (!passcode || passcode !== TEACHER_PASSCODE) {
    res.status(401).json({ error: 'invalid_passcode' });
    return;
  }

  try {
    const [questions, activityLogs] = await Promise.all([
      supabaseGet(
        'questions' +
        '?select=id,school,grade,class_no,student_number,student_name,activity,question_text,created_at,messages(id,role,content,created_at)' +
        '&order=created_at.desc&messages.order=created_at.asc'
      ),
      supabaseGet(
        'activity_logs' +
        '?select=id,school,grade,class_no,student_number,student_name,activity,summary,detail,created_at' +
        '&order=created_at.desc'
      ),
    ]);
    res.status(200).json({ questions, activityLogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
