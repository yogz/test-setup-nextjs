# 🎓 Cours Personnalisé : Maîtrise ton Application Next.js

> **Cours complet basé sur TON propre code pour devenir autonome**

---

## 📖 À propos de ce cours

Ce cours est conçu spécialement pour toi, en utilisant **ton propre projet** "Mon Super Projet" (anciennement Upgrade Coaching) comme support d'apprentissage.

**Ton niveau de départ :**
- ✅ Bases de HTML (structure, balises)
- ✅ Bases de JavaScript classique
- ✅ Développement en C (variables, pointeurs, structures)
- ✅ Concepts d'API (requêtes, réponses JSON)

**Ton objectif :**
- 🎯 Comprendre React, Next.js, Tailwind CSS
- 🎯 Maîtriser les concepts modernes du web
- 🎯 Être capable de faire évoluer ton application seul
- 🎯 Créer de nouvelles fonctionnalités en autonomie

---

## 📚 Progression du cours

### 🟢 Niveau Débutant (Chapitres 1-4)

**[Chapitre 1 : Vue d'ensemble et concepts de base](./chapitre-01-vue-ensemble.md)**
⏱️ Durée estimée : 1-2h
Comprendre comment fonctionne une application web moderne, les composants React, le routing Next.js, et la différence entre code client et serveur.

**[Chapitre 2 : React - Les fondamentaux via ton code](./chapitre-02-react-fondamentaux.md)**
⏱️ Durée estimée : 2-3h
JSX, composants, props, state, hooks (useState, useEffect) avec des exemples tirés de ton code.

**[Chapitre 3 : Next.js App Router - Navigation et pages](./chapitre-03-nextjs-app-router.md)**
⏱️ Durée estimée : 2-3h
Structure des dossiers, layouts, route groups, Server vs Client Components, navigation.

**[Chapitre 4 : Tailwind CSS - Styliser ton application](./chapitre-04-tailwind-css.md)**
⏱️ Durée estimée : 1-2h
Utility-first CSS, classes courantes, responsive design, système de thème personnalisé.

---

### 🟡 Niveau Intermédiaire (Chapitres 5-8)

**[Chapitre 5 : Formulaires et validation](./chapitre-05-formulaires-validation.md)**
⏱️ Durée estimée : 2-3h
React Hook Form, Zod, gestion des erreurs, analyse du formulaire d'onboarding.

**[Chapitre 6 : Authentification - Comment ça marche](./chapitre-06-authentification.md)**
⏱️ Durée estimée : 2-3h
Better-auth, les 3 méthodes d'auth (email/password, magic link, OAuth), sessions, protection des routes.

**[Chapitre 7 : Base de données avec Drizzle ORM](./chapitre-07-base-donnees-drizzle.md)**
⏱️ Durée estimée : 2-3h
Bases de données relationnelles, schéma, requêtes, migrations.

**[Chapitre 8 : API Routes - Backend de ton application](./chapitre-08-api-routes.md)**
⏱️ Durée estimée : 2-3h
Créer des API Routes, méthodes HTTP, Request/Response, appels depuis le frontend.

---

### 🔴 Niveau Avancé (Chapitres 9-12)

**[Chapitre 9 : TypeScript dans ton projet](./chapitre-09-typescript.md)**
⏱️ Durée estimée : 1-2h
Types de base, interfaces, inférence depuis Drizzle et Zod.

**[Chapitre 10 : Composants UI réutilisables](./chapitre-10-composants-ui.md)**
⏱️ Durée estimée : 2h
Philosophie DRY, Radix UI, variantes avec CVA, créer tes propres composants.

**[Chapitre 11 : Flow complet - De la page à la base de données](./chapitre-11-flow-complet.md)**
⏱️ Durée estimée : 2-3h
Tracer une requête complète de bout en bout, debugging.

**[Chapitre 12 : Étendre ton application - Devenir autonome](./chapitre-12-devenir-autonome.md)**
⏱️ Durée estimée : 3-5h
Ajouter des pages et fonctionnalités, bonnes pratiques, projet final complet.

---

## 📊 Architecture de ton application

```
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION: Mon Super Projet                              │
│  (Plateforme de coaching avec authentification)             │
└─────────────────────────────────────────────────────────────┘

FRONTEND (React + Next.js)
├── Pages publiques
│   ├── / (Connexion)
│   └── /signup (Inscription)
│
├── Pages protégées
│   ├── /dashboard (Tableau de bord)
│   └── /onboarding (Process d'intégration)
│
└── Composants UI réutilisables
    ├── Button, Card, Input, Select...
    └── Stylisés avec Tailwind CSS

BACKEND (Next.js API Routes)
├── /api/auth/[...all] (Authentification Better-auth)
└── /api/update-profile (Mise à jour profil)

BASE DE DONNÉES (PostgreSQL + Drizzle ORM)
├── users (Utilisateurs)
├── sessions (Sessions)
├── accounts (Comptes OAuth)
└── verifications (Vérifications email)
```

---

## 🎯 Checklist de compétences finales

À la fin de ce cours, tu seras capable de :

- [ ] Comprendre la structure complète de ton projet
- [ ] Créer et modifier des composants React
- [ ] Ajouter de nouvelles pages et routes
- [ ] Créer des formulaires avec validation Zod
- [ ] Créer des API Routes pour le backend
- [ ] Modifier le schéma de base de données
- [ ] Faire des requêtes SQL avec Drizzle ORM
- [ ] Styliser avec Tailwind CSS (responsive, dark mode)
- [ ] Gérer l'authentification (sessions, cookies)
- [ ] Débugger ton application efficacement
- [ ] Déployer en production sur Vercel
- [ ] Créer une fonctionnalité complète de A à Z

---

## 🛠️ Technologies utilisées dans ton projet

| Technologie | Version | Rôle |
|-------------|---------|------|
| **Next.js** | 16.0.2 | Framework React full-stack |
| **React** | 19.2.0 | Bibliothèque UI |
| **TypeScript** | 5.x | Langage avec types statiques |
| **Tailwind CSS** | 4.x | Framework CSS utility-first |
| **Better-auth** | 1.3.34 | Système d'authentification |
| **Drizzle ORM** | 0.44.7 | ORM pour PostgreSQL |
| **Zod** | 4.1.12 | Validation de schémas |
| **React Hook Form** | 7.66.0 | Gestion des formulaires |
| **Radix UI** | - | Composants UI accessibles |
| **PostgreSQL** | - | Base de données |

---

## 📝 Comment utiliser ce cours

### Recommandations :

1. **Suis l'ordre des chapitres** - Ils sont progressifs
2. **Fais TOUS les exercices** - La pratique est essentielle
3. **Expérimente avec ton code** - N'aie pas peur de casser quelque chose
4. **Utilise Git** - Tous les changements sont versionnés
5. **Lance `npm run dev`** - Teste chaque modification en temps réel
6. **Prends des notes** - Ajoute tes propres commentaires dans le code

### Outils à avoir ouverts :

- ✅ **VS Code** - Pour éditer le code et lire les fichiers .md
- ✅ **Terminal** - Pour lancer `npm run dev`
- ✅ **Navigateur** - Pour voir les changements (http://localhost:3000)
- ✅ **DevTools** - Pour inspecter (F12 dans le navigateur)

---

## 🚀 Pour commencer

1. **Clone ou ouvre le projet** :
   ```bash
   cd /home/user/test-setup-nextjs/my-nextjs-app
   ```

2. **Lance le serveur de développement** :
   ```bash
   npm run dev
   ```

3. **Ouvre le premier chapitre** :
   Commence par [Chapitre 1 : Vue d'ensemble et concepts de base](./chapitre-01-vue-ensemble.md)

4. **Suis le cours à ton rythme** - Pas de pression !

---

## 💡 Conseils pédagogiques

### Analogies avec le C (pour t'aider)

- **Composant React** = Fonction qui retourne une structure HTML
- **Props** = Paramètres de fonction
- **State** = Variable qui, quand elle change, rafraîchit l'interface
- **useEffect** = Code qui s'exécute après le rendu (comme un callback)
- **TypeScript** = C mais pour le web (types stricts)
- **API Route** = Endpoint qui répond à des requêtes HTTP
- **ORM (Drizzle)** = Abstraction pour ne pas écrire du SQL brut

---

## 📞 Besoin d'aide ?

Si tu bloques sur un concept :
1. Relis le chapitre lentement
2. Teste le code dans ton projet
3. Regarde les fichiers référencés
4. Pose des questions spécifiques

---

## 🎓 Bonne formation !

Prêt à devenir autonome sur ton application ? C'est parti ! 🚀

**Commence par :** [Chapitre 1 : Vue d'ensemble et concepts de base](./chapitre-01-vue-ensemble.md)
