# copronomiev1

## Configuration des variables d'environnement

L'application utilise Supabase. Vous devez fournir l'URL du projet et la clé publique "anon".

### Obtenir les clés Supabase

1. Créez un projet sur [Supabase](https://supabase.com/).
2. Dans le tableau de bord Supabase, ouvrez **Project Settings → API**.
3. Relevez votre **Project URL** et votre **anon public key**.

### Configuration locale

Copiez le fichier `.env.example` en `.env` puis renseignez les valeurs :

```bash
VITE_SUPABASE_URL=...              # Project URL
VITE_SUPABASE_ANON_KEY=...         # anon public key
```

### Configuration sur Vercel

Dans les paramètres de votre projet Vercel, ajoutez les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
Les appels à OpenAI sont effectués côté serveur ; définissez uniquement `OPENAI_API_KEY` dans l'environnement Vercel.

