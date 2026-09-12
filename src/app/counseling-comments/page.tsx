import { CounselingCommentForm } from "@/components/counseling/counseling-comment-form";

export default function CounselingCommentsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">상담 멘트 생성</h1>
      <p className="mt-1 text-sm text-slate-500">
        학생의 학업성적, 교우관계, 진로 정보를 입력하면 학생용/학부모용 상담 멘트 초안을
        생성합니다.
      </p>

      <div className="mt-6">
        <CounselingCommentForm />
      </div>
    </div>
  );
}
