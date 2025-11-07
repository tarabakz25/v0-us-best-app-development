-- Note: This script should only be run after you have at least one authenticated user
-- Run this manually after signing up your first user

-- Insert sample ads (replace the user_id with your actual user UUID after signup)
insert into public.ads (id, user_id, title, description, brand, media_url, shop_url)
values 
  (
    '11111111-1111-1111-1111-111111111111',
    (select id from auth.users limit 1),
    '新しいワイヤレスイヤホン',
    '最新のノイズキャンセリング技術搭載。音楽をもっと自由に。',
    'TechSound',
    '/placeholder.svg?height=800&width=600',
    'https://example.com/shop/earbuds'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    (select id from auth.users limit 1),
    'エコフレンドリーな水筒',
    '地球に優しい、あなたに優しい',
    'GreenLife',
    '/placeholder.svg?height=800&width=600',
    'https://example.com/shop/bottle'
  )
on conflict (id) do nothing;

-- Insert sample remix
insert into public.remixes (user_id, ad_id, title, description, media_url)
values 
  (
    (select id from auth.users limit 1),
    '11111111-1111-1111-1111-111111111111',
    'ユーザーのリミックス動画',
    '実際に使ってみた感想をシェア',
    '/placeholder.svg?height=800&width=600'
  )
on conflict do nothing;

-- Insert sample survey
insert into public.surveys (user_id, title, description, brand, media_url, questions)
values 
  (
    (select id from auth.users limit 1),
    'アンケート: 次の機能は？',
    '新機能について教えてください',
    'AppDev Co.',
    '/placeholder.svg?height=800&width=600',
    '[
      {
        "question": "どの機能が一番欲しいですか？",
        "options": ["ダークモード", "オフライン機能", "友達招待", "カスタマイズ"]
      },
      {
        "question": "アプリの使いやすさは？",
        "options": ["とても良い", "良い", "普通", "改善が必要"]
      }
    ]'::jsonb
  )
on conflict do nothing;
