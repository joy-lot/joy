// GET /api/board?school=...&grade=...&classNo=...
// 학생용 "질문 게시판". 같은 학교·학년·반 학생들이 남긴 탐구 질문 텍스트만 모아서 보여준다.
// 개인정보 보호를 위해 AI와의 대화 내용(messages)은 포함하지 않고, 같은 반 범위로만 조회를 제한한다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  const { school, grade, classNo } = req.query || {};
  if (!school || !grade || !classNo) {
    res.status(400).json({ error: 'school_grade_class_required' });
    return;
  }

  try {
    const params = new URLSearchParams({
      select: 'id,activity,question_text,student_number,student_name,created_at,' +
        'question_likes(school,grade,class_no,student_number,student_name),' +
        'question_comments(id,student_number,student_name,comment_text,created_at)',
      school: `eq.${school}`,
      grade: `eq.${Number.parseInt(grade, 10) || 0}`,
      class_no: `eq.${Number.parseInt(classNo, 10) || 0}`,
      order: 'created_at.desc',
      'question_comments.order': 'created_at.asc',
      limit: '150',
    });
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/questions?${params.toString()}`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Supabase GET questions failed: ${resp.status} ${text}`);
    }
    const questions = await resp.json();
    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
