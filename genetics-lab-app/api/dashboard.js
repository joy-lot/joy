// GET /api/dashboard?passcode=...
// 교사 전용. 모든 학생의 탐구 질문 + AI 대화 스레드를 시간순으로 반환합니다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEACHER_PASSCODE = process.env.TEACHER_PASSCODE;

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
    const url =
      `${SUPABASE_URL}/rest/v1/questions` +
      `?select=id,school,grade,class_no,student_number,student_name,activity,question_text,created_at,messages(id,role,content,created_at)` +
      `&order=created_at.desc&messages.order=created_at.asc`;
    const resp = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Supabase GET failed: ${resp.status} ${text}`);
    }
    const questions = await resp.json();
    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
