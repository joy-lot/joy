// POST /api/board-comment
// 학생이 친구의 질문에 심화 질문·추가 의견을 댓글로 남깁니다.
// body: { questionId, student: {school,grade,classNo,number,name}, commentText }

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

  const { questionId, student, commentText } = req.body || {};
  const s = student || {};
  if (
    !questionId ||
    !commentText || !String(commentText).trim() ||
    !s.school || !s.grade || !s.classNo || !s.number || !s.name
  ) {
    res.status(400).json({ error: 'question_and_comment_and_student_info_required' });
    return;
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/question_comments`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        question_id: questionId,
        school: String(s.school).slice(0, 80),
        grade: Number.parseInt(s.grade, 10) || null,
        class_no: Number.parseInt(s.classNo, 10) || null,
        student_number: Number.parseInt(s.number, 10) || null,
        student_name: String(s.name).slice(0, 60),
        comment_text: String(commentText).trim().slice(0, 300),
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Supabase insert failed: ${resp.status} ${text}`);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
