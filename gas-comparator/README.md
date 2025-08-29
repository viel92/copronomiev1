# Gas Comparator

Application front développée avec React, TypeScript et Vite. Elle permet aux copropriétés de comparer les coûts de gaz et d'analyser les factures.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```
Le serveur démarre sur [http://localhost:5173](http://localhost:5173).

## Lien avec l'API

Les appels aux fonctionnalités d'analyse sont effectués via les fonctions serverless situées dans le dossier `api/`. Lors du développement, elles sont accessibles via des requêtes vers `/api/*` et sont déployées sur Vercel avec le front.

## Lint et build

```bash
npm run lint   # vérifie le style du code
npm run build  # génère la version de production
```
