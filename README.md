# Copronomie

Copronomie est un comparateur de consommation et de prix du gaz destiné aux copropriétés. Le dépôt regroupe l'interface web et les fonctions API nécessaires à l'analyse des factures.

## Architecture

```
[Frontend React/Vite] -> [API serverless Vercel] -> [Services externes]
```

- **gas-comparator/** : application front.
- **gas-comparator/api/** : fonctions serverless Node exécutées par Vercel.

## Commandes de développement

Toutes les commandes suivantes se lancent depuis le dossier `gas-comparator/` :

```bash
npm install        # installe les dépendances
npm run dev        # lance l'application en mode développement
npm run lint       # vérifie le code
npm run build      # génère la version de production
```

## Déploiement

L'application est conçue pour être déployée sur [Vercel](https://vercel.com). Un push sur la branche principale déclenche un déploiement automatique. Pour déployer manuellement :

```bash
vercel --prod
```

## Roadmap

- Intégrer l'authentification des utilisateurs
- Couvrir l'API par des tests
- Import automatique de nouvelles factures
- Amélioration des graphiques comparatifs

