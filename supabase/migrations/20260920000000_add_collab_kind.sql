-- コラボ定点(kind='collab'): イベント等で運営が登録する定点。
-- 登録は公式定点と同じくservice_role(運営)のみ。spots_insert_user_kindポリシーは変更しない。

alter table public.spots drop constraint if exists spots_kind_check;
alter table public.spots
  add constraint spots_kind_check check (kind in ('official', 'user', 'collab'));

-- 「お題」必須はユーザー定点のみ（公式・コラボは不要）
alter table public.spots drop constraint if exists spots_user_requires_theme;
alter table public.spots
  add constraint spots_user_requires_theme check (
    kind in ('official', 'collab') or (theme is not null and length(trim(theme)) > 0)
  );

comment on table public.spots is '定点。kind=official(運営定義・5箇所固定) / user(UGC・お題付き) / collab(運営登録のイベント連携)';
