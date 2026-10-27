-- 0032 — métricas agregadas do dashboard do atacado.
begin;

create or replace function public.dashboard_atacado_resumo()
returns table (faturamento_mes numeric, pedidos_mes bigint, revendedoras bigint, novos_contatos bigint, recompra_pendente bigint, ticket_medio numeric)
language sql stable security invoker set search_path = public as $$
  with cfg as (select meses_alerta_recompra from public.configuracoes_atacado where id = true),
  compras as (select lead_id, max(data_pedido) ultima from public.pedidos_revendedora group by lead_id),
  mes as (select coalesce(sum(valor),0) faturamento, count(*) pedidos from public.pedidos_revendedora where data_pedido >= date_trunc('month',current_date)::date and data_pedido < (date_trunc('month',current_date)+interval '1 month')::date)
  select mes.faturamento, mes.pedidos, (select count(*) from compras),
    (select count(*) from public.crm_clinica_dados d where not exists (select 1 from public.pedidos_revendedora p where p.lead_id=d.id)),
    (select count(*) from compras c,cfg where c.ultima <= current_date-make_interval(months=>cfg.meses_alerta_recompra)),
    case when mes.pedidos=0 then 0 else round(mes.faturamento/mes.pedidos,2) end from mes;
$$;

create or replace function public.dashboard_atacado_meses(p_meses integer default 6)
returns table (mes date, faturamento numeric, pedidos bigint)
language sql stable security invoker set search_path = public as $$
  with meses as (select generate_series(date_trunc('month',current_date)-make_interval(months=>greatest(1,least(p_meses,24))-1),date_trunc('month',current_date),interval '1 month')::date mes)
  select m.mes,coalesce(sum(p.valor),0),count(p.id) from meses m left join public.pedidos_revendedora p on p.data_pedido>=m.mes and p.data_pedido<m.mes+interval '1 month' group by m.mes order by m.mes;
$$;

create or replace function public.dashboard_atacado_interesses()
returns table (interesse text, quantidade bigint)
language sql stable security invoker set search_path = public as $$
  select i.interesse,count(*) from public.crm_clinica_dados d cross join lateral unnest(d.interesses_atacado) i(interesse) group by i.interesse order by count(*) desc;
$$;

create or replace function public.dashboard_atacado_funil()
returns table (status text, quantidade bigint)
language sql stable security invoker set search_path = public as $$
  select d.status,count(*) from public.crm_clinica_dados d group by d.status order by count(*) desc;
$$;

create or replace function public.dashboard_atacado_cidades(p_limite integer default 8)
returns table (cidade text, faturamento numeric, revendedoras bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(nullif(trim(d.cidade),''),'Não informada'),sum(p.valor),count(distinct d.id) from public.pedidos_revendedora p join public.crm_clinica_dados d on d.id=p.lead_id group by 1 order by sum(p.valor) desc limit greatest(1,least(p_limite,30));
$$;

revoke all on function public.dashboard_atacado_resumo() from public,anon;
revoke all on function public.dashboard_atacado_meses(integer) from public,anon;
revoke all on function public.dashboard_atacado_interesses() from public,anon;
revoke all on function public.dashboard_atacado_funil() from public,anon;
revoke all on function public.dashboard_atacado_cidades(integer) from public,anon;
grant execute on function public.dashboard_atacado_resumo() to authenticated,service_role;
grant execute on function public.dashboard_atacado_meses(integer) to authenticated,service_role;
grant execute on function public.dashboard_atacado_interesses() to authenticated,service_role;
grant execute on function public.dashboard_atacado_funil() to authenticated,service_role;
grant execute on function public.dashboard_atacado_cidades(integer) to authenticated,service_role;
commit;
