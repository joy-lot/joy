// POST /api/activity-log
// 학생이 각 활동(핵형 분석/가계도 분석/동전 실험)에서 채점·결과 확인 버튼을
// 누를 때마다 결과 한 건을 Supabase에 저장합니다. AI 호출은 없습니다.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACTIVITIES = ['karyotype', 'pedigree', 'coin'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'server_not_configured' });
    return;
  }

  const { student, activity, summary, detail, outcome } = req.body || {};
  const s = student || {};
  if (!s.school || !s.grade || !s.classNo || !s.number || !s.name) {
    res.status(400).json({ error: 'student_info_required' });
    return;
  }
  if (!ACTIVITIES.includes(activity) || !summary) {
    res.status(400).json({ error: 'activity_and_summary_required' });
    return;
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        school: String(s.school).slice(0, 80),
        grade: Number.parseInt(s.grade, 10) || null,
        class_no: Number.parseInt(s.classNo, 10) || null,
        student_number: Number.parseInt(s.number, 10) || null,
        student_name: String(s.name).slice(0, 60),
        activity,
        summary: String(summary).slice(0, 500),
        detail: detail || null,
        outcome: outcome === 'correct' || outcome === 'incorrect' ? outcome : null,
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
