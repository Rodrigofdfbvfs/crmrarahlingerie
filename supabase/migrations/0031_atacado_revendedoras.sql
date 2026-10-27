-- 0031 — CRM comercial para atacado de moda íntima
-- Pedidos são a fonte financeira; consultas continuam sendo apenas videochamadas.

begin;

alter table public.crm_clinica_dados
  add column if not exists cidade text,
  add column if not exists interesses_atacado text[] not null default '{}';

alter table public.crm_clinica_dados drop constraint if exists crm_interesses_atacado_validos;
alter table public.crm_clinica_dados add constraint crm_interesses_atacado_validos check (
  interesses_atacado <@ array['Lingerie', 'Biquíni', 'Linha Noite']::text[]
);

create table if not exists public.pedidos_revendedora (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_clinica_dados(id) on delete cascade,
  data_pedido date not null default current_date,
  valor numeric(12,2) not null check (valor >= 0),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pedidos_revendedora_lead_data_idx
  on public.pedidos_revendedora (lead_id, data_pedido desc);
create index if not exists pedidos_revendedora_data_idx
  on public.pedidos_revendedora (data_pedido desc);

alter table public.pedidos_revendedora enable row level security;
drop policy if exists "pedidos_revendedora_all" on public.pedidos_revendedora;
create policy "pedidos_revendedora_all" on public.pedidos_revendedora
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.pedidos_revendedora to authenticated, service_role;
revoke all on public.pedidos_revendedora from anon;

create table if not exists public.configuracoes_atacado (
  id boolean primary key default true check (id),
  dias_followup_novo_contato integer not null default 3 check (dias_followup_novo_contato between 1 and 90),
  meses_alerta_recompra integer not null default 3 check (meses_alerta_recompra between 1 and 24),
  duracao_videochamada integer not null default 40 check (duracao_videochamada between 10 and 240),
  updated_at timestamptz not null default now()
);
insert into public.configuracoes_atacado (id) values (true) on conflict (id) do nothing;
alter table public.configuracoes_atacado enable row level security;
drop policy if exists "configuracoes_atacado_all" on public.configuracoes_atacado;
create policy "configuracoes_atacado_all" on public.configuracoes_atacado
  for all to authenticated using (true) with check (true);
grant select, insert, update on public.configuracoes_atacado to authenticated, service_role;
revoke all on public.configuracoes_atacado from anon;

create or replace function public.sincronizar_totais_pedidos()
returns trigger language plpgsql security invoker set search_path = public as $$
declare v_lead uuid := coalesce(new.lead_id, old.lead_id);
begin
  update public.crm_clinica_dados d
     set valor_pago_acumulado = coalesce((
       select sum(p.valor) from public.pedidos_revendedora p where p.lead_id = v_lead
     ), 0)
   where d.id = v_lead;
  return coalesce(new, old);
end;
$$;

drop trigger if exists pedidos_revendedora_sincroniza_total on public.pedidos_revendedora;
create trigger pedidos_revendedora_sincroniza_total
after insert or update or delete on public.pedidos_revendedora
for each row execute function public.sincronizar_totais_pedidos();

-- As colunas novas entram no fim para preservar o contrato da view.
create or replace view public.crm_clinica with (security_invoker = true) as
  select
    id, nome_lead, whatsapp_lead, procedimentos_interesse,
    nullif(array_to_string(procedimentos_interesse, ', '), '') as procedimento_interesse,
    data_nascimento, anotacoes, resumo_conversa, inicio_atendimento,
    ultima_mensagem, status, follow_up_1, follow_up_2, follow_up_3,
    data_agendamento, data_marcacao_agendamento, id_agendamento,
    id_conta_chatwoot, id_conversa_chatwoot, id_lead_chatwoot,
    inbox_id_chatwoot, valor_pago_acumulado, created_at, agente_pausado,
    assumido_por, assumido_em,
    case when ultima_mensagem is null then null::integer
      else floor(extract(epoch from now() - ultima_mensagem) / 60)::integer end as minutos_ultima_mensagem,
    (select max(c.data_consulta) from public.consultas c
      where c.lead_id = d.id and c.status = 'realizada') as ultima_consulta,
    nao_perturbe, nao_perturbe_em, nao_perturbe_motivo,
    cidade, interesses_atacado,
    (select max(p.data_pedido) from public.pedidos_revendedora p where p.lead_id = d.id) as ultima_compra,
    (select p.valor from public.pedidos_revendedora p where p.lead_id = d.id
      order by p.data_pedido desc, p.created_at desc limit 1) as valor_ultimo_pedido,
    (select count(*)::integer from public.pedidos_revendedora p where p.lead_id = d.id) as total_pedidos
  from public.crm_clinica_dados d;

grant select, insert, update, delete on public.crm_clinica to authenticated, service_role;
revoke all on public.crm_clinica from anon;

commit;
