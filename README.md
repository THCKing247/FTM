# Football Team Management App (React + Supabase)

This repo is a lightweight football team management app (teams, roster, schedule) built with **Create React App** and **Supabase**.

## 1) Configure Supabase

1. Create / open your Supabase project.
2. Run the SQL scripts in `supabase/sql/` **in numeric order**.
3. In the Supabase dashboard, create users (Auth) or let coaches sign up from the app.

## 2) Local dev

```bash
npm install
npm start
```

Create `client/.env` from `client/.env.example` and add your anon key.

## Notes on keys

- Use only the **anon** key in the browser.
- Never embed the `service_role` key in frontend code.

