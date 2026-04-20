# Supabase Auth for SubReel

## Что уже подключено

- сайт логинится через Supabase Auth
- сайт хранит браузерную сессию через `@supabase/ssr`
- лаунчер открывает браузер и забирает JWT через `http://localhost:25555/callback`
- есть `dashboard`, `feedback` и `moderation` flow
- идеи и баг-репорты идут в Supabase

## Что нужно сделать в Supabase

### 1. Создать проект

В [Supabase Dashboard](https://supabase.com/dashboard) создай новый проект.

### 2. Включить Auth

В `Authentication -> Providers`:

- оставь `Email`
- настрой подтверждение почты так, как тебе нужно

### 3. Применить SQL

В `SQL Editor` по очереди выполни:

- `supabase/001_auth_and_moderation.sql`
- `supabase/002_feedback_workflow.sql`

Это создаст:

- `user_profiles`
- `feature_ideas`
- `bug_reports`
- `idea_votes`
- staff helper-функции и RLS policy

### 4. Сделать первого администратора

После регистрации своего аккаунта выполни в `SQL Editor`:

```sql
update public.user_profiles
set role = 'admin'
where email = 'your-email@example.com';
```

## Что нужно сделать в Vercel и локально

Пропиши одинаковые переменные:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Локально:

- скопируй `.env.example` в `.env.local`
- вставь реальные значения из `Supabase -> Project Settings -> API`

В Vercel:

- `Project -> Settings -> Environment Variables`
- добавь те же 3 переменные
- после этого сделай redeploy

## Основные страницы

- `/login`
- `/register`
- `/dashboard`
- `/dashboard/feedback`
- `/dashboard/moderation`
- `/launcher/connect`

## Основные API routes

### Auth / launcher

- `GET /api/auth/session`
- `POST /api/auth/resolve-identifier`
- `POST /api/auth/register-check`
- `POST /api/launcher/link/start`
- `POST /api/launcher/link/complete`
- `GET /api/launcher/session`

### Community / moderation

- `GET|POST /api/community/ideas`
- `POST /api/community/ideas/:ideaId/vote`
- `GET|POST /api/community/bugs`
- `POST /api/moderation/ideas/:ideaId`
- `POST /api/moderation/bugs/:bugId`

## Flow для лаунчера

1. Лаунчер поднимает localhost callback на `http://localhost:25555/callback`
2. Лаунчер вызывает `/api/launcher/link/start`
3. Сайт отдаёт `verificationUrl`
4. Браузер открывает `/launcher/connect?redirect=http://localhost:25555/callback`
5. Если пользователь уже залогинен, вход происходит автоматически
6. Сайт редиректит на localhost с `?token=JWT`
7. Лаунчер валидирует токен через `/api/launcher/session`

## Что уже готово для будущего

Этой схемы уже хватает, чтобы дальше без смены auth-архитектуры строить:

- friends system
- real-time chat
- bug reporting
- ideas voting
- moderation dashboard
- staff roles

## Полезные официальные ссылки

- [Supabase Next.js server-side auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [signUp](https://supabase.com/docs/reference/javascript/auth-signup)
- [getUser](https://supabase.com/docs/reference/javascript/auth-getuser)
