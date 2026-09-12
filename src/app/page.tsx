import { AlertTriangle, ClipboardList, FileWarning, Users } from "lucide-react";

const SUMMARY_CARDS = [
  { label: "담당 학생 수", value: "-", icon: Users },
  { label: "이번 주 상담 기록", value: "-", icon: ClipboardList },
  { label: "수동 확인 필요 (OCR)", value: "-", icon: FileWarning },
  { label: "고위험 알림", value: "-", icon: AlertTriangle },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">대시보드</h1>
      <p className="mt-1 text-sm text-slate-500">
        학생 상담 준비 현황을 한눈에 확인하세요.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Icon className="h-5 w-5 text-blue-600" />
            <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
            <div className="mt-1 text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-medium text-slate-900">시작하기</h2>
        <p className="mt-2 text-sm text-slate-500">
          왼쪽 메뉴의 &ldquo;상담 멘트 생성&rdquo;에서 학생 정보를 입력하면 AI가 학생용/학부모용
          상담 멘트 초안을 작성해 드립니다. 시험지·상담일지 분석 기능은 순차적으로
          연동됩니다.
        </p>
      </div>
    </div>
  );
}
