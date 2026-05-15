# Supabase Setup — Luca

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Anota: **Project URL**, **anon key**, **service_role key**
3. Pega esos valores en `.env.local`

## 2. Ejecutar migraciones (en orden)

Ve a **SQL Editor** en el dashboard de Supabase y ejecuta cada archivo en orden:

```
supabase/migrations/001_users.sql
supabase/migrations/002_categories.sql
supabase/migrations/003_transactions.sql
supabase/migrations/004_budgets.sql
supabase/migrations/005_goals.sql
supabase/migrations/006_conversations_messages.sql
supabase/migrations/007_reminders.sql
supabase/migrations/008_realtime.sql
```

## 3. Verificar

Después de correr las migraciones deberías ver en **Table Editor**:
- `users` — vacía (se llena cuando alguien se registra)
- `categories` — 11 filas (las categorías colombianas del seed)
- `transactions`, `budgets`, `goals`, `conversations`, `messages`, `reminders` — vacías

## 4. Configurar Auth

En **Authentication → Settings**:
- **Site URL**: `http://localhost:3000` (dev) / tu dominio en producción
- **Redirect URLs**: agrega `http://localhost:3000/api/auth/callback`

En **Authentication → Email Templates** (opcional):
- Personaliza el magic link en español

## 5. Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
