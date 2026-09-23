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

-- 활동(핵형 분석/가계도 분석/동전 실험) 자체의 결과 기록.
-- "탐구 질문 남기기"와는 별개로, 채점 버튼을 누르는 시점마다 한 건씩 쌓입니다.
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  school text,
  grade smallint,
  class_no smallint,
  student_number smallint,
  student_name text,
  activity text not null check (activity in ('karyotype','pedigree','coin')),
  summary text not null,
  detail jsonb,
  outcome text check (outcome in ('correct','incorrect')),
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx on activity_logs(created_at desc);
create index if not exists activity_logs_school_idx on activity_logs(school);
create index if not exists activity_logs_grade_class_idx on activity_logs(grade, class_no);

-- 이미 activity_logs 테이블을 만들어 두었는데 outcome 컬럼이 없다면 아래 한 줄만 실행하세요.
-- alter table activity_logs add column if not exists outcome text check (outcome in ('correct','incorrect'));

-- 이미 스키마를 한 번 실행해서 questions/messages 테이블만 있다면,
-- 위 activity_logs 관련 구문(create table ~ create index 3줄)만 다시 실행해도 됩니다.

-- 이미 이 스키마를 한 번 실행해서 questions/messages/activity_logs 테이블만 있다면,
-- 아래 question_likes/question_comments 관련 구문(테이블+인덱스+RLS 4줄)만 다시 실행해도 됩니다.

-- 질문 게시판 · 같은 반 친구의 질문에 남기는 "궁금해요"(하트).
-- 같은 학생이 같은 질문에 중복으로 누르지 못하도록 unique 제약을 둔다(하트 취소 시 행 삭제).
create table if not exists question_likes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  school text,
  grade smallint,
  class_no smallint,
  student_number smallint,
  student_name text,
  created_at timestamptz not null default now(),
  unique (question_id, school, grade, class_no, student_number)
);
create index if not exists question_likes_question_id_idx on question_likes(question_id);

-- 질문 게시판 · 친구의 질문에 남기는 심화 질문/추가 의견 댓글.
create table if not exists question_comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  school text,
  grade smallint,
  class_no smallint,
  student_number smallint,
  student_name text,
  comment_text text not null,
  created_at timestamptz not null default now()
);
create index if not exists question_comments_question_id_idx on question_comments(question_id);
create index if not exists question_comments_created_at_idx on question_comments(created_at desc);

-- 이 테이블들은 서버(Vercel 서버리스 함수)의 SERVICE ROLE 키를 통해서만 접근합니다.
-- 클라이언트(학생 브라우저)는 이 데이터베이스에 직접 연결하지 않으므로,
-- 별도의 공개 정책(anon policy) 없이 RLS를 켜 둔 채로 완전히 잠가 둡니다.
alter table questions enable row level security;
alter table messages enable row level security;
alter table activity_logs enable row level security;
alter table question_likes enable row level security;
alter table question_comments enable row level security;
