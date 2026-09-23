// POST /api/dashboard-delete
// 교사 전용. 탐구 질문(대화 포함) 또는 활동 기록 한 건을 삭제합니다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEACHER_PASSCODE = process.env.TEACHER_PASSCODE;
const TABLE_BY_TYPE = { question: 'questions', activity: 'activity_logs', comment: 'question_comments' };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TEACHER_PASSCODE) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  const { passcode, type, id } = req.body || {};
  if (!passcode || passcode !== TEACHER_PASSCODE) {
    res.status(401).json({ error: 'invalid_passcode' });
    return;
  }
  const table = TABLE_BY_TYPE[type];
  if (!table || !id) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  try {
    // questions를 지우면 messages는 외래키의 on delete cascade로 함께 삭제됩니다.
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Supabase DELETE failed: ${resp.status} ${text}`);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
