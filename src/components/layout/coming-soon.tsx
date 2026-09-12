import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
        <Construction className="h-6 w-6" />
        <p className="text-sm">이 화면은 다음 마일스톤에서 연동될 예정입니다.</p>
      </div>
    </div>
  );
}
