-- AI 학생상담 도우미 - Supabase 스키마
-- PRD.md 8장(데이터 모델 개요) 기준. pgvector 확장을 사용한다.
-- 주의: vector(768) 차원은 예시값이다. 실제 사용하는 Ollama 임베딩 모델의 출력 차원에 맞춰
-- document_chunks.embedding과 match_document_chunks 함수의 vector(N)을 수정하세요.

create extension if not exists vector;

-- ── 교사 계정 ──────────────────────────────────────────────
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'teacher',
  grade_scope int[] not null default '{}',
  class_scope text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ── 학생 ──────────────────────────────────────────────────
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade int not null,
  class_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists student_academic_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  subject text not null,
  score numeric not null,
  semester text not null,
  created_at timestamptz not null default now()
);

create table if not exists student_relationship_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  category text not null check (category in ('친밀', '갈등', '소외', '일반')),
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists career_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  desired_path text not null,
  aptitude_result text,
  created_at timestamptz not null default now()
);

-- ── 시험지 분석 ────────────────────────────────────────────
create table if not exists exam_uploads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  image_url text not null,
  subject text not null,
  ocr_raw_text text,
  ocr_confidence numeric,
  created_at timestamptz not null default now()
);

create table if not exists exam_analyses (
  id uuid primary key default gen_random_uuid(),
  exam_upload_id uuid not null references exam_uploads (id) on delete cascade,
  unit text not null,
  achievement_level text not null check (achievement_level in ('상', '중', '하')),
  weakness_summary text,
  generated_comment text,
  created_at timestamptz not null default now()
);

-- ── 상담일지 분석 ──────────────────────────────────────────
create table if not exists counseling_log_uploads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  image_url text not null,
  ocr_raw_text text,
  created_at timestamptz not null default now()
);

create table if not exists counseling_log_analyses (
  id uuid primary key default gen_random_uuid(),
  log_upload_id uuid not null references counseling_log_uploads (id) on delete cascade,
  concern_category text not null check (
    concern_category in ('학업', '교우관계', '가족', '진로', '정서', '기타')
  ),
  risk_level text not null check (risk_level in ('경', '중', '고')),
  generated_comment text,
  created_at timestamptz not null default now()
);

-- ── 상담 멘트 기록 ─────────────────────────────────────────
create table if not exists counseling_comments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  type text not null check (type in ('student', 'parent')),
  content text not null,
  source_refs text[] not null default '{}',
  edited_by uuid references teachers (id),
  created_at timestamptz not null default now()
);

-- ── RAG 참고 문서 ──────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (
    category in ('성취기준', '상담매뉴얼', '평가루브릭', '위기대응지침')
  ),
  file_url text not null,
  version int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 문서 재색인 시 기존 청크를 교체하기 위한 RPC (ingest-document 유스케이스에서 사용하지 않고,
-- 애플리케이션 계층에서 delete-then-insert로 처리해도 무방함. 여기서는 검색 RPC만 정의한다.)
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_count int default 3
)
returns table (
  document_id uuid,
  document_title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    dc.document_id,
    d.title as document_title,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- ── Row Level Security ────────────────────────────────────
alter table students enable row level security;
alter table student_academic_records enable row level security;
alter table student_relationship_notes enable row level security;
alter table career_records enable row level security;
alter table exam_uploads enable row level security;
alter table exam_analyses enable row level security;
alter table counseling_log_uploads enable row level security;
alter table counseling_log_analyses enable row level security;
alter table counseling_comments enable row level security;

-- 교사는 자신의 grade_scope/class_scope에 속한 학생만 조회할 수 있다.
create policy "teachers_view_scoped_students"
  on students for select
  using (
    exists (
      select 1 from teachers t
      where t.auth_user_id = auth.uid()
        and students.grade = any (t.grade_scope)
        and students.class_name = any (t.class_scope)
    )
  );

-- documents/document_chunks는 모든 인증된 교사가 조회 가능(참고자료는 학교 공용).
alter table documents enable row level security;
alter table document_chunks enable row level security;

create policy "authenticated_teachers_read_documents"
  on documents for select
  using (auth.role() = 'authenticated');

create policy "authenticated_teachers_read_document_chunks"
  on document_chunks for select
  using (auth.role() = 'authenticated');
