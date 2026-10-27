-- 0033 — recorte de período para todos os indicadores do atacado.
begin;

create or replace function public.dashboard_atacado_resumo_periodo(p_inicio date,p_fim date)
returns table (faturamento_mes numeric,pedidos_mes bigint,revendedoras bigint,novos_contatos bigint,recompra_pendente bigint,ticket_medio numeric)
language sql stable security invoker set search_path=public as $$
  with cfg as (select meses_alerta_recompra from public.configuracoes_atacado where id=true),
  periodo as (select coalesce(sum(valor),0) faturamento,count(*) pedidos,count(distinct lead_id) clientes from public.pedidos_revendedora where data_pedido between p_inicio and p_fim),
  ultimas as (select lead_id,max(data_pedido) ultima from public.pedidos_revendedora where data_pedido<=p_fim group by lead_id)
  select periodo.faturamento,periodo.pedidos,periodo.clientes,
    (select count(*) from public.crm_clinica_dados d where d.inicio_atendimento::date between p_inicio and p_fim and not exists(select 1 from public.pedidos_revendedora p where p.lead_id=d.id)),
    (select count(*) from ultimas u,cfg where u.ultima<=p_fim-make_interval(months=>cfg.meses_alerta_recompra)),
    case when periodo.pedidos=0 then 0 else round(periodo.faturamento/periodo.pedidos,2) end from periodo;
$$;

create or replace function public.dashboard_atacado_serie_periodo(p_inicio date,p_fim date)
returns table (periodo date,faturamento numeric,pedidos bigint)
language sql stable security invoker set search_path=public as $$
  with passo as (select case when p_fim-p_inicio<=62 then '1 day'::interval else '1 month'::interval end intervalo),
  pontos as (select generate_series(case when p_fim-p_inicio<=62 then p_inicio else date_trunc('month',p_inicio)::date end,p_fim,(select intervalo from passo))::date periodo)
  select x.periodo,coalesce(sum(p.valor),0),count(p.id) from pontos x left join public.pedidos_revendedora p on p.data_pedido>=x.periodo and p.data_pedido<x.periodo+(select intervalo from passo) group by x.periodo order by x.periodo;
$$;

create or replace function public.dashboard_atacado_interesses_periodo(p_inicio date,p_fim date)
returns table (interesse text,quantidade bigint)
language sql stable security invoker set search_path=public as $$
  select i.interesse,count(*) from public.crm_clinica_dados d cross join lateral unnest(d.interesses_atacado)i(interesse) where d.inicio_atendimento::date between p_inicio and p_fim group by i.interesse order by count(*) desc;
$$;

create or replace function public.dashboard_atacado_funil_periodo(p_inicio date,p_fim date)
returns table (status text,quantidade bigint)
language sql stable security invoker set search_path=public as $$
  select d.status,count(*) from public.crm_clinica_dados d where d.inicio_atendimento::date between p_inicio and p_fim group by d.status order by count(*) desc;
$$;

create or replace function public.dashboard_atacado_cidades_periodo(p_inicio date,p_fim date,p_limite integer default 8)
returns table (cidade text,faturamento numeric,revendedoras bigint)
language sql stable security invoker set search_path=public as $$
  select coalesce(nullif(trim(d.cidade),''),'Não informada'),sum(p.valor),count(distinct d.id) from public.pedidos_revendedora p join public.crm_clinica_dados d on d.id=p.lead_id where p.data_pedido between p_inicio and p_fim group by 1 order by sum(p.valor) desc limit greatest(1,least(p_limite,30));
$$;

revoke all on function public.dashboard_atacado_resumo_periodo(date,date) from public,anon;
revoke all on function public.dashboard_atacado_serie_periodo(date,date) from public,anon;
revoke all on function public.dashboard_atacado_interesses_periodo(date,date) from public,anon;
revoke all on function public.dashboard_atacado_funil_periodo(date,date) from public,anon;
revoke all on function public.dashboard_atacado_cidades_periodo(date,date,integer) from public,anon;
grant execute on function public.dashboard_atacado_resumo_periodo(date,date) to authenticated,service_role;
grant execute on function public.dashboard_atacado_serie_periodo(date,date) to authenticated,service_role;
grant execute on function public.dashboard_atacado_interesses_periodo(date,date) to authenticated,service_role;
grant execute on function public.dashboard_atacado_funil_periodo(date,date) to authenticated,service_role;
grant execute on function public.dashboard_atacado_cidades_periodo(date,date,integer) to authenticated,service_role;
commit;
