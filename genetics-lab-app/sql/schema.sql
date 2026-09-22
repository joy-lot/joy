-- 질문 있는 유전 노트 · 학생 탐구 질문 + AI 대화 로그
-- Supabase SQL Editor에서 그대로 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  school text,
  grade smallint,
  class_no smallint,
  student_number smallint,
  student_name text,
  activity text not null check (activity in ('karyotype','pedigree','coin')),
  question_text text not null,
  created_at timestamptz not null default now()
);

-- 기존에 이 스키마를 이미 실행한 적이 있다면(즉 questions 테이블에
-- school/grade/class_no/student_number 컬럼이 없다면) 아래 구문을 대신 실행하세요.
-- alter table questions add column if not exists school text;
-- alter table questions add column if not exists grade smallint;
-- alter table questions add column if not exists class_no smallint;
-- alter table questions add column if not exists student_number smallint;

create index if not exists questions_school_idx on questions(school);
create index if not exists questions_grade_class_idx on questions(grade, class_no);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  role text not null check (role in ('user','model')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_question_id_idx on messages(question_id);
create index if not exists questions_created_at_idx on questions(created_at desc);

-- 이 두 테이블은 서버(Vercel 서버리스 함수)의 SERVICE ROLE 키를 통해서만 접근합니다.
-- 클라이언트(학생 브라우저)는 이 데이터베이스에 직접 연결하지 않으므로,
-- 별도의 공개 정책(anon policy) 없이 RLS를 켜 둔 채로 완전히 잠가 둡니다.
alter table questions enable row level security;
alter table messages enable row level security;
