# Gas Comparator

## Variables d'environnement

Copiez le fichier `.env.example` en `.env` et renseignez :

```bash
VITE_SUPABASE_URL=...      # Project URL depuis Supabase
VITE_SUPABASE_ANON_KEY=... # anon public key
```

### Récupération des clés

1. Connectez-vous au [tableau de bord Supabase](https://app.supabase.com/).
2. Ouvrez **Project Settings → API**.
3. Copiez votre **Project URL** et la **anon public key**.

### Configuration sur Vercel

Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans **Vercel → Settings → Environment Variables**.
L'API OpenAI est appelée côté serveur ; définissez uniquement `OPENAI_API_KEY` dans l'environnement Vercel.

