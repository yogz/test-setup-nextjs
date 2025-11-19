# Chapitre 1 : Vue d'ensemble et concepts de base

> ⏱️ **Durée estimée :** 1-2 heures
> 🎯 **Objectif :** Comprendre les fondations d'une application web moderne

---

## 📑 Table des matières

1. [Web Classique vs Web Moderne](#11-web-classique-vs-web-moderne)
2. [Le concept de composants React](#12-le-concept-de-composants-react)
3. [Le routing dans Next.js](#13-le-routing-dans-nextjs)
4. [Client vs Serveur](#14-client-vs-serveur)
5. [Exercice pratique](#15-exercice-pratique)
6. [Résumé](#résumé-du-chapitre-1)
7. [Validation des acquis](#validation-des-acquis)

---

## 1.1. Web Classique vs Web Moderne

### 🕰️ Le web que tu connais (HTML + JS classique)

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Ma page</title>
</head>
<body>
    <h1>Bonjour</h1>
    <button onclick="handleClick()">Cliquer</button>

    <script>
        function handleClick() {
            alert("Cliqué !");
        }
    </script>
</body>
</html>
```

**Comment ça marche :**
1. Le serveur envoie le fichier HTML complet
2. Le navigateur affiche la page
3. Chaque clic sur un lien = nouvelle page chargée depuis le serveur
4. JavaScript manipule le DOM (`document.getElementById`, etc.)

### 🚀 Le web moderne (React + Next.js) - Ton application

Au lieu d'envoyer du HTML statique, ton application :

1. **Envoie du JavaScript** qui génère le HTML dynamiquement
2. **Ne recharge jamais la page** (Single Page Application - SPA)
3. **Les composants sont des fonctions** qui retournent du HTML
4. **Le serveur et le client collaborent** pour optimiser la performance

**Analogie avec le C :**
```c
// En C : fonction qui retourne une valeur
int add(int a, int b) {
    return a + b;
}

// En React : fonction qui retourne du HTML
function Button() {
    return <button>Cliquer</button>
}
```

---

## 1.2. Le concept de composants React

### Qu'est-ce qu'un composant ?

**Un composant = une fonction qui retourne du HTML (JSX)**

### Exemple simple (conceptuel)

```javascript
// Composant simple (comme une fonction en C)
function Button(props) {
    return <button className="mon-style">{props.text}</button>
}

// Utilisation
<Button text="Cliquer ici" />

// ↓ Devient dans le navigateur ↓
<button class="mon-style">Cliquer ici</button>
```

**Analogie avec le C :**

```c
// En C : fonction qui retourne une structure
typedef struct {
    char* html;
} Component;

Component Button(char* text) {
    Component result;
    sprintf(result.html, "<button>%s</button>", text);
    return result;
}
```

En React, c'est pareil mais pour générer du HTML !

### Composant réel de TON projet : Button

**Fichier :** `components/ui/button.tsx`

**Version simplifiée pour comprendre :**

```typescript
// Définition du composant
function Button({ children, variant, size, onClick }) {
  return (
    <button
      className={/* styles basés sur variant et size */}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

**Ce qu'il faut retenir :**
- `children` = Le contenu entre `<Button>` et `</Button>`
- `variant` = Type de bouton (default, ghost, outline...)
- `size` = Taille (sm, lg, default...)
- `onClick` = Fonction appelée au clic

### Utilisation dans ton code : `app/page.tsx`

**Ligne 5 : Import du composant**
```typescript
import { Button } from '@/components/ui/button';
```
→ On "charge" le composant pour pouvoir l'utiliser
→ `@/` = raccourci pour le dossier racine du projet

**Ligne 139 : Utilisation concrète**
```typescript
<Button type="submit" className="w-full" size="lg">
    <svg>...</svg>
    Sign in with Magic Link
</Button>
```

**Décomposition :**

| Partie | Explication | Analogie C |
|--------|-------------|------------|
| `<Button>` | Appel du composant | `Button()` |
| `type="submit"` | Attribut HTML classique | Passe au `<button>` final |
| `size="lg"` | Prop personnalisé | Paramètre : `Button(SIZE_LARGE)` |
| `className="w-full"` | Classes CSS Tailwind | Style appliqué |
| `Sign in...` | Contenu (children) | Ce qui sera affiché |

**Ce qui est généré dans le navigateur :**
```html
<button
    type="submit"
    class="h-10 rounded-md px-6 bg-primary text-primary-foreground hover:bg-primary/90 w-full"
>
    <svg>...</svg>
    Sign in with Magic Link
</button>
```

### Variantes dans ton code

**Button variant="link" (ligne 96-105 de `app/page.tsx`):**
```typescript
<Button
    variant="link"
    onClick={() => { setMagicLinkSent(false); }}
>
    ← Back
</Button>
```
→ Rendu : bouton qui ressemble à un lien (texte souligné au survol)

**Button variant="ghost" (ligne 149-156):**
```typescript
<Button
    type="button"
    variant="ghost"
    onClick={() => setShowMagicLink(true)}
>
    Or sign in with password →
</Button>
```
→ Rendu : bouton transparent qui se colore au survol

---

## 1.3. Le routing dans Next.js

### Le système de fichiers = les routes

Dans Next.js, la **structure des dossiers** détermine les URLs.

**Dans ton projet :**

```
app/
├── page.tsx                    → http://localhost:3000/
├── (auth)/
│   └── signup/
│       └── page.tsx            → http://localhost:3000/signup
└── (dashboard)/
    ├── dashboard/
    │   └── page.tsx            → http://localhost:3000/dashboard
    └── onboarding/
        └── page.tsx            → http://localhost:3000/onboarding
```

### Règles importantes :

1. **Tout fichier nommé `page.tsx`** devient une page accessible
2. **Les dossiers entre parenthèses `(auth)`** ne comptent PAS dans l'URL
   → Ils servent juste à organiser le code (groupes de routes)
3. **Le dossier `app/`** est la racine de l'application

**Analogie avec le C :**
```c
// En C, l'organisation est dans les headers
#include "auth/signup.h"

// En Next.js, l'organisation EST l'URL
app/(auth)/signup/page.tsx → /signup
```

### Exemples concrets :

| Fichier | URL | Page affichée |
|---------|-----|---------------|
| `app/page.tsx` | `/` | Page de connexion (accueil) |
| `app/(auth)/signup/page.tsx` | `/signup` | Page d'inscription |
| `app/(dashboard)/dashboard/page.tsx` | `/dashboard` | Tableau de bord utilisateur |
| `app/(dashboard)/onboarding/page.tsx` | `/onboarding` | Processus d'intégration |

### Pourquoi les groupes de routes `(auth)` et `(dashboard)` ?

**Organisation logique :**
- `(auth)` = Pages publiques (connexion, inscription)
- `(dashboard)` = Pages protégées (nécessitent d'être connecté)

**Avantages :**
- Code mieux organisé
- Permet d'avoir des layouts différents par groupe
- Ne pollue pas les URLs

---

## 1.4. Client vs Serveur

C'est **LE concept le plus important** de Next.js.

### Les deux environnements

```
┌─────────────────────────────────────────────────────────┐
│  SERVEUR (Node.js)                                      │
│  - S'exécute sur ta machine/Vercel                      │
│  - A accès à la base de données                         │
│  - Peut lire des fichiers, variables d'environnement    │
│  - Le code ne va JAMAIS au navigateur de l'utilisateur  │
└─────────────────────────────────────────────────────────┘
                        ↓
              Envoie du HTML/JavaScript
                        ↓
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Navigateur)                                    │
│  - S'exécute dans le navigateur de l'utilisateur        │
│  - PEUT voir le code source (Ctrl+U)                    │
│  - Gère les interactions (clics, formulaires...)        │
│  - Appelle des API pour parler au serveur               │
└─────────────────────────────────────────────────────────┘
```

### Comment savoir si c'est Server ou Client ?

**Regarde la première ligne du fichier !**

**Exemple Client : `app/page.tsx` (ligne 1)**
```typescript
'use client';
```
→ Ce code s'exécute dans le **navigateur**
→ Peut utiliser `useState`, `onClick`, événements...

**Exemple Server : `app/api/update-profile/route.ts` (lignes 1-30)**
```typescript
// Pas de 'use client' = SERVER par défaut
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Accède à la base de données (IMPOSSIBLE côté client)
  await db.update(users).set({ ... }).where(eq(users.id, session.user.id));
}
```

→ Pas de `'use client'` = code **serveur** par défaut
→ A accès à la base de données (`db.update(users)`)
→ Ne peut PAS utiliser `useState`, `onClick`, etc.

### Pourquoi cette distinction ?

**Sécurité et performance :**

| Server Component | Client Component |
|------------------|------------------|
| ✅ Peut accéder à la BDD | ❌ Ne DOIT JAMAIS accéder directement à la BDD |
| ✅ Peut utiliser des secrets (API keys) | ❌ Tout le monde peut voir le code |
| ❌ Ne peut pas gérer les clics utilisateur | ✅ Gère les interactions (clics, input...) |
| Exécuté 1 fois (sur le serveur) | Exécuté sur chaque appareil utilisateur |

### Exemple concret dans ton app :

**Flow de connexion :**

1. **`app/page.tsx` (CLIENT)** :
   - Affiche le formulaire de connexion
   - Écoute les clics sur "Sign In"
   - Récupère email/password
   - Appelle `authClient.signIn.email()`

2. **`app/api/auth/[...all]/route.ts` (SERVER)** :
   - Reçoit la requête HTTP
   - Vérifie les identifiants dans la BDD
   - Crée une session
   - Renvoie un cookie sécurisé

3. **Retour au client** :
   - Stocke le cookie
   - Redirige vers `/dashboard`

**Règle d'or :**
> Tout ce qui touche à la base de données, aux secrets, à la logique métier sensible = SERVEUR
> Tout ce qui est interactif (formulaires, clics, animations) = CLIENT

---

## 1.5. Exercice pratique

### 🎯 Objectif : Modifier le titre et le sous-titre

**Ce qu'on va faire :**
1. Changer "Mon Super Projet" en un titre de ton choix
2. Changer le sous-titre en français

### Étape 1 : Ouvre le fichier

**Fichier :** `app/page.tsx`
**Lignes à modifier :** 70-75

### Étape 2 : Repère le code

```typescript
<CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
  Mon Super Projet
</CardTitle>
<CardDescription className="text-center text-sm sm:text-base">
  Sign in to enter to your account
</CardDescription>
```

### Étape 3 : Modifie

**Exemple :**
```typescript
<CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
  Ma Plateforme de Coaching
</CardTitle>
<CardDescription className="text-center text-sm sm:text-base">
  Connecte-toi à ton compte
</CardDescription>
```

### Étape 4 : Teste

```bash
# 1. Va dans le dossier
cd /home/user/test-setup-nextjs/my-nextjs-app

# 2. Lance le serveur
npm run dev

# 3. Ouvre ton navigateur
# http://localhost:3000
```

**Résultat attendu :**
Tu devrais voir ton nouveau titre et sous-titre s'afficher immédiatement grâce au **Hot Reload** (rechargement à chaud).

### Challenge supplémentaire 🚀

**Modifier aussi le texte du bouton principal (ligne 143) :**
```typescript
// AVANT
Sign in with Magic Link

// APRÈS
Me connecter par lien magique
```

---

## 📝 Résumé du Chapitre 1

### Ce que tu as appris :

1. **Composants** = Fonctions qui retournent du HTML (JSX)
   ```typescript
   <Button size="lg">Cliquer</Button>
   ```

2. **Routing** = Structure de dossiers = URLs
   ```
   app/page.tsx → /
   app/(auth)/signup/page.tsx → /signup
   ```

3. **Client vs Serveur** :
   - `'use client'` → Code navigateur (interactions)
   - Pas de directive → Code serveur (base de données)

4. **Props** = Paramètres passés aux composants
   ```typescript
   <Button variant="ghost" size="lg" onClick={handleClick} />
   ```

### Concepts clés à retenir :

```
┌──────────────────────────────────────────────────────────┐
│  COMPOSANT = FONCTION                                    │
│                                                          │
│  function Button(props) {                               │
│    return <button>{props.children}</button>             │
│  }                                                       │
│                                                          │
│  // Utilisation                                         │
│  <Button>Cliquer</Button>                               │
└──────────────────────────────────────────────────────────┘
```

### Schéma mental : Comment ça s'emboîte

```
Page (app/page.tsx)
  └── Composant Card
       ├── Composant CardHeader
       │    ├── Composant CardTitle
       │    └── Composant CardDescription
       └── Composant CardContent
            └── Composants Button (x3)
```

Chaque composant est une brique réutilisable !

---

## ✅ Validation des acquis

Avant de passer au Chapitre 2, assure-toi de comprendre :

- [ ] Un composant est une fonction qui retourne du JSX
- [ ] Les fichiers `page.tsx` deviennent des routes accessibles
- [ ] `'use client'` = code qui tourne dans le navigateur
- [ ] Les props sont comme des paramètres de fonction
- [ ] La structure de dossiers détermine les URLs
- [ ] Le serveur et le client ont des rôles différents

### Questions de validation :

1. **Quel fichier correspond à l'URL `/dashboard` ?**
   → `app/(dashboard)/dashboard/page.tsx`

2. **Peut-on accéder à la base de données dans un Client Component ?**
   → Non, seulement dans les Server Components ou API Routes

3. **À quoi sert le prop `variant` du Button ?**
   → Changer le style du bouton (default, ghost, outline, link...)

4. **Que signifie `@/` dans les imports ?**
   → Raccourci vers le dossier racine du projet

---

## 🎯 Prochaine étape

**[Chapitre 2 : React - Les fondamentaux](./chapitre-02-react-fondamentaux.md)**

Dans le prochain chapitre, on va explorer :
- JSX en profondeur
- Le state avec `useState`
- Les événements (`onClick`, `onChange`)
- Les hooks (`useEffect`, `useSession`)
- Comment les données circulent dans ton app

---

**[← Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-02-react-fondamentaux.md)**
