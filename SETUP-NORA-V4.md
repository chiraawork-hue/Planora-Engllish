# Planora Fluent — Nora Voice V4

Static HTML frontend for GitHub Pages plus Supabase Edge Function backend.

## Deploy
1. GitHub → Settings → Pages → Deploy from branch → main / root.
2. Supabase → Edge Functions → Create Function: `nora-chat`. Paste `supabase/functions/nora-chat/index.ts`.
3. Supabase → Edge Functions → Secrets: add `GEMINI_API_KEY` from Google AI Studio. Never commit it.
4. Set Edge Function JWT verification **ON** if invoking with a compatible Supabase anon JWT. For newer publishable keys, check Supabase gateway authentication support before switching. **For private personal use, additionally enforce user authentication and per-user rate limits before exposing this function publicly.** The included Origin check alone is not authentication.
5. Open the GitHub Pages URL in Chrome and enter the Supabase public client key under Connection settings. Do not paste a service role/secret key.
6. If mic doesn't start, check site permission for microphone, HTTPS, and browser speech recognition support.

**Security:** Demo starter, not production hardened. CORS does not stop non-browser clients. Before regular usage protect the AI endpoint with a verified signed-in user, quotas/rate limits and abuse controls. Google free-tier availability and model names can change.
