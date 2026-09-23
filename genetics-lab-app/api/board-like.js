// POST /api/board-like
// 학생이 같은 반 친구의 질문에 "궁금해요"(하트)를 누르거나 취소합니다.
// body: { questionId, student: {school,grade,classNo,number,name}, like: true|false }

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

  const { questionId, student, like } = req.body || {};
  const s = student || {};
  if (!questionId || !s.school || !s.grade || !s.classNo || !s.number || !s.name) {
    res.status(400).json({ error: 'question_and_student_info_required' });
    return;
  }
  const grade = Number.parseInt(s.grade, 10) || 0;
  const classNo = Number.parseInt(s.classNo, 10) || 0;
  const number = Number.parseInt(s.number, 10) || 0;

  try {
    if (like === false) {
      const params = new URLSearchParams({
        question_id: `eq.${questionId}`,
        school: `eq.${s.school}`,
        grade: `eq.${grade}`,
        class_no: `eq.${classNo}`,
        student_number: `eq.${number}`,
      });
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/question_likes?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      if (!resp.ok) throw new Error(`unlike failed: ${resp.status}`);
    } else {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/question_likes?on_conflict=question_id,school,grade,class_no,student_number`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            question_id: questionId,
            school: String(s.school).slice(0, 80),
            grade,
            class_no: classNo,
            student_number: number,
            student_name: String(s.name).slice(0, 60),
          }),
        }
      );
      if (!resp.ok) throw new Error(`like failed: ${resp.status}`);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
};
