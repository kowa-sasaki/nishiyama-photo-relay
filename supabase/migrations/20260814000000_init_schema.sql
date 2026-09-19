-- 西山公園定点観測フォトリレー: 初期スキーマ + RLSポリシー + Storageバケット
--
-- テーブル構成: spots / posts / spot_follows / reports
-- 認証: Supabase匿名認証（signInAnonymously）。device_id / created_by_device は auth.uid() を用いる。
-- 注意: このファイルに接続情報・シークレットは一切含めない。

-- ---------------------------------------------------------------------------
-- 拡張
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- spots: 公式定点(kind='official', 運営が定義, 5箇所固定) / ユーザー定点(kind='user', UGC)
-- ---------------------------------------------------------------------------
create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme text,
  lat double precision not null,
  lng double precision not null,
  description text,
  kind text not null check (kind in ('official', 'user')),
  created_by_device uuid,
  created_at timestamptz not null default now(),
  is_hidden boolean not null default false,
  "order" integer,
  -- ユーザー定点は「お題」が必須（公式定点は不要）
  constraint spots_user_requires_theme check (
    kind = 'official' or (theme is not null and length(trim(theme)) > 0)
  )
);

comment on table public.spots is '定点。kind=official(運営定義・5箇所固定) / user(UGC・お題付き)';
comment on column public.spots.theme is 'ユーザー定点の「お題」（自由記述）。公式定点では未使用可';
comment on column public.spots.created_by_device is '作成者の匿名認証ユーザーauth.uid()。公式定点はNULL可（運営がservice_roleで投入）';
comment on column public.spots."order" is '公式定点の表示順（UGCでは未使用）';

create index if not exists spots_kind_idx on public.spots (kind);
create index if not exists spots_is_hidden_idx on public.spots (is_hidden);

-- ---------------------------------------------------------------------------
-- posts: 定点への投稿写真
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  image_path text not null,
  comment text,
  tags text[] not null default '{}',
  avg_color text,
  created_at timestamptz not null default now(),
  device_id uuid not null,
  is_hidden boolean not null default false
);

comment on table public.posts is 'スポットへの投稿写真';
comment on column public.posts.device_id is '投稿者の匿名認証ユーザーauth.uid()';
comment on column public.posts.avg_color is '投稿写真の平均色(例: #rrggbb)。投稿時にクライアント側で算出して保存する（サーバー側では計算しない）';

create index if not exists posts_spot_id_idx on public.posts (spot_id);
create index if not exists posts_is_hidden_idx on public.posts (is_hidden);
create index if not exists posts_created_at_idx on public.posts (created_at);

-- ---------------------------------------------------------------------------
-- spot_follows: 定点フォロー(Should項目)
-- ---------------------------------------------------------------------------
create table if not exists public.spot_follows (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  device_id uuid not null,
  created_at timestamptz not null default now(),
  unique (spot_id, device_id)
);

comment on table public.spot_follows is 'ユーザーによる定点フォロー';

create index if not exists spot_follows_device_id_idx on public.spot_follows (device_id);

-- ---------------------------------------------------------------------------
-- reports: スポット・投稿への通報
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('spot', 'post')),
  target_id uuid not null,
  reason text,
  device_id uuid,
  created_at timestamptz not null default now()
);

comment on table public.reports is '通報。target_type+target_idで対象を指す（外部キーではなくID参照）。運営がダッシュボードから内容を確認し、対象のis_hiddenを手動で切り替える。専用の管理画面は作らない';

create index if not exists reports_target_idx on public.reports (target_type, target_id);

-- ---------------------------------------------------------------------------
-- RLS 有効化
-- ---------------------------------------------------------------------------
alter table public.spots enable row level security;
alter table public.posts enable row level security;
alter table public.spot_follows enable row level security;
alter table public.reports enable row level security;

-- ---------------------------------------------------------------------------
-- spots ポリシー
-- ---------------------------------------------------------------------------
-- 公開読み取り: 非表示でないものは誰でも閲覧可
create policy "spots_select_public"
on public.spots for select
to anon, authenticated
using (is_hidden = false);

-- 作成者本人は自分の投稿分を(非表示でも)閲覧可
create policy "spots_select_own"
on public.spots for select
to authenticated
using (created_by_device = auth.uid());

-- 匿名認証済みユーザーはユーザー定点(kind='user')のみ作成可。
-- 公式定点(kind='official')はservice_role(運営)がRLSをバイパスして投入する想定。
create policy "spots_insert_user_kind"
on public.spots for insert
to authenticated
with check (
  kind = 'user'
  and created_by_device = auth.uid()
);

-- UPDATE/DELETEは一般ユーザーには許可しない。
-- is_hiddenの切り替えは運営がSupabaseダッシュボード(service_role)から直接行う。

-- ---------------------------------------------------------------------------
-- posts ポリシー
-- ---------------------------------------------------------------------------
create policy "posts_select_public"
on public.posts for select
to anon, authenticated
using (is_hidden = false);

create policy "posts_select_own"
on public.posts for select
to authenticated
using (device_id = auth.uid());

create policy "posts_insert_own"
on public.posts for insert
to authenticated
with check (device_id = auth.uid());

-- 投稿者本人は自分の投稿を削除できる（取り消し用途）
create policy "posts_delete_own"
on public.posts for delete
to authenticated
using (device_id = auth.uid());

-- UPDATE(コメント編集等)は許可しない。is_hiddenの切り替えは運営がダッシュボードから行う。

-- ---------------------------------------------------------------------------
-- spot_follows ポリシー（本人のみ自分の行を読み書き）
-- ---------------------------------------------------------------------------
create policy "spot_follows_select_own"
on public.spot_follows for select
to authenticated
using (device_id = auth.uid());

create policy "spot_follows_insert_own"
on public.spot_follows for insert
to authenticated
with check (device_id = auth.uid());

create policy "spot_follows_delete_own"
on public.spot_follows for delete
to authenticated
using (device_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports ポリシー（匿名通報INSERTのみ許可、SELECTは一般ユーザーに公開しない）
-- ---------------------------------------------------------------------------
create policy "reports_insert_any"
on public.reports for insert
to anon, authenticated
with check (true);

-- SELECT/UPDATE/DELETEポリシーは作成しない
-- （= 一般ロールからは不可。運営はSupabaseダッシュボードでservice_role権限から確認する）

-- ---------------------------------------------------------------------------
-- 権限付与（Supabaseのデフォルト権限設定に加え、明示しておく）
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert on public.spots to anon, authenticated;
grant select, insert, delete on public.posts to anon, authenticated;
grant select, insert, delete on public.spot_follows to anon, authenticated;
grant insert on public.reports to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 便利関数: ユーザー定点を「お題+1枚目の写真」とセットで作成する
-- （spots単体で投稿ゼロのまま存在できてしまう状態を作らないための補助RPC。
--   SECURITY INVOKERのため上記RLSポリシーがそのまま適用される。
--   利用は任意 — クライアントはこのRPCを呼ぶか、spots→postsの順に別々にinsertしてもよいが、
--   RPCを使うと「スポットは作成できたが1枚目の投稿は失敗した」という不整合を避けられる）
-- ---------------------------------------------------------------------------
create or replace function public.create_user_spot(
  p_name text,
  p_theme text,
  p_lat double precision,
  p_lng double precision,
  p_description text,
  p_image_path text,
  p_comment text default null,
  p_tags text[] default '{}',
  p_avg_color text default null
)
returns public.posts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_spot_id uuid;
  v_post public.posts;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.spots (name, theme, lat, lng, description, kind, created_by_device)
  values (p_name, p_theme, p_lat, p_lng, p_description, 'user', auth.uid())
  returning id into v_spot_id;

  insert into public.posts (spot_id, image_path, comment, tags, avg_color, device_id)
  values (v_spot_id, p_image_path, p_comment, coalesce(p_tags, '{}'), p_avg_color, auth.uid())
  returning * into v_post;

  return v_post;
end;
$$;

grant execute on function public.create_user_spot(
  text, text, double precision, double precision, text, text, text, text[], text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: 投稿画像用バケット
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- 公開読み取り
create policy "storage_posts_select_public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'posts');

-- 匿名認証済みユーザーによるアップロードを許可
create policy "storage_posts_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'posts');
