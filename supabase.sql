create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Bloqueia acesso direto de fora: só o servidor (chave secreta) consegue ler/gravar.
alter table recipes enable row level security;
