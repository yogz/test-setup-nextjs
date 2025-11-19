# Chapitre 3 : Next.js App Router

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Maîtriser le système de routing de Next.js et comprendre la différence entre Server et Client Components

---

## 📑 Table des matières

1. [Le système de routing basé sur les fichiers](#31-le-système-de-routing-basé-sur-les-fichiers)
2. [Layouts : Partager du code entre pages](#32-layouts--partager-du-code-entre-pages)
3. [Route Groups : Organiser sans impacter les URLs](#33-route-groups--organiser-sans-impacter-les-urls)
4. [Navigation avec Link](#34-navigation-avec-link)
5. [Server Components vs Client Components](#35-server-components-vs-client-components)
6. [Redirections et protection de routes](#36-redirections-et-protection-de-routes)
7. [Exercices pratiques](#37-exercices-pratiques)
8. [Résumé](#résumé-du-chapitre-3)

---

## 3.1. Le système de routing basé sur les fichiers

### Concept fondamental

Dans Next.js, **la structure de tes dossiers = tes URLs**.

**Analogie avec le C :**
```c
// En C : tu déclares explicitement les routes
router.get("/dashboard", handleDashboard);
router.get("/signup", handleSignup);

// En Next.js : la structure des dossiers CRÉE les routes
app/dashboard/page.tsx    → /dashboard
app/signup/page.tsx       → /signup
```

### Structure de ton projet

```
app/
├── page.tsx                              → /
├── layout.tsx                            → Layout racine (toutes les pages)
├── (auth)/
│   └── signup/
│       └── page.tsx                      → /signup
└── (dashboard)/
    ├── dashboard/
    │   └── page.tsx                      → /dashboard
    └── onboarding/
        └── page.tsx                      → /onboarding
```

### Fichiers spéciaux dans Next.js

| Fichier | Rôle | Exemple |
|---------|------|---------|
| `page.tsx` | Page accessible via URL | `/app/dashboard/page.tsx` → `/dashboard` |
| `layout.tsx` | Enveloppe partagée entre pages | Navigation, footer... |
| `loading.tsx` | UI de chargement automatique | Skeleton, spinner... |
| `error.tsx` | Gestion d'erreurs | Page d'erreur personnalisée |
| `not-found.tsx` | Page 404 | Quand la route n'existe pas |

### Exemple : Page de connexion (`/`)

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';

export default function Home() {
  const [email, setEmail] = useState('');
  // ...

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {/* Formulaire de connexion */}
    </main>
  );
}
```

**Points clés :**
- `export default function Home()` → Composant par défaut exporté
- Le nom de la fonction (`Home`) n'a pas d'importance pour Next.js
- C'est le nom du fichier (`page.tsx`) qui compte

### Exemple : Page d'inscription (`/signup`)

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/(auth)/signup/page.tsx`

```typescript
export default function SignupPage() {
  // ...
  return (
    <main>
      {/* Formulaire d'inscription */}
    </main>
  );
}
```

**Pourquoi `(auth)` entre parenthèses ?**
→ Les parenthèses indiquent un **route group** (groupe de routes)
→ `(auth)` n'apparaît PAS dans l'URL finale
→ Permet d'organiser le code sans polluer les URLs

---

## 3.2. Layouts : Partager du code entre pages

### Qu'est-ce qu'un layout ?

**Layout = Enveloppe commune à plusieurs pages**

**Analogie avec le C :**
```c
// En C : fonction wrapper
void renderPage(void (*page)()) {
    renderHeader();    // Commun à toutes les pages
    page();            // Contenu spécifique
    renderFooter();    // Commun à toutes les pages
}

// En Next.js : Layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Header />      {/* Commun */}
        {children}      {/* Page spécifique */}
        <Footer />      {/* Commun */}
      </body>
    </html>
  );
}
```

### Layout racine de ton projet

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: "Upgrade Coaching",
  description: "Professional coaching platform to upgrade your life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

**Décortication :**

1. **Imports de polices Google Fonts :**
   ```typescript
   const geistSans = Geist({
     variable: "--font-geist-sans",
     subsets: ["latin"],
   });
   ```
   → Télécharge et optimise automatiquement la police
   → Crée une variable CSS `--font-geist-sans`

2. **Metadata (SEO) :**
   ```typescript
   export const metadata: Metadata = {
     title: "Upgrade Coaching",
     description: "...",
   };
   ```
   → Définit le `<title>` et `<meta description>`
   → Important pour le référencement (SEO)

3. **Structure HTML :**
   ```typescript
   <html lang="en">
     <body>{children}</body>
   </html>
   ```
   → `{children}` est remplacé par le contenu de chaque page
   → Exemple : `/page.tsx` sera injecté ici

### Hierarchy des layouts

Next.js permet d'avoir plusieurs layouts imbriqués :

```
app/
├── layout.tsx                    ← Layout RACINE (toutes les pages)
└── (dashboard)/
    ├── layout.tsx                ← Layout DASHBOARD (uniquement /dashboard et /onboarding)
    ├── dashboard/page.tsx
    └── onboarding/page.tsx
```

**Si tu avais un layout dashboard :**
```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <nav>
        {/* Menu de navigation du dashboard */}
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

**Résultat pour `/dashboard` :**
```
RootLayout
  └── DashboardLayout
      └── Page (dashboard/page.tsx)
```

---

## 3.3. Route Groups : Organiser sans impacter les URLs

### Pourquoi des route groups ?

**Problème sans route groups :**
```
app/
├── page.tsx           → /
├── signup/page.tsx    → /signup
├── dashboard/page.tsx → /dashboard
```
→ Tout est au même niveau, difficile à organiser

**Solution avec route groups :**
```
app/
├── page.tsx                    → /
├── (auth)/
│   └── signup/page.tsx         → /signup (PAS /auth/signup)
└── (dashboard)/
    ├── dashboard/page.tsx      → /dashboard
    └── onboarding/page.tsx     → /onboarding
```

### Règle des parenthèses

**Tout dossier entre parenthèses `(nom)` est IGNORÉ dans l'URL finale.**

### Utilisation dans ton projet

**1. Groupe `(auth)` - Pages publiques**

```
app/(auth)/
└── signup/page.tsx  → /signup
```

**2. Groupe `(dashboard)` - Pages protégées**

```
app/(dashboard)/
├── dashboard/page.tsx    → /dashboard
└── onboarding/page.tsx   → /onboarding
```

### Avantages

1. **Organisation claire :** Code groupé par fonctionnalité
2. **Layouts séparés :** Chaque groupe peut avoir son propre layout
3. **URLs propres :** Pas de `/auth/signup` mais juste `/signup`

### Créer un nouveau groupe de routes

**Exemple : Ajouter un groupe `(admin)` :**

```bash
mkdir -p app/(admin)/users
touch app/(admin)/users/page.tsx
```

**Résultat :**
```
app/(admin)/users/page.tsx  → /users
```

---

## 3.4. Navigation avec Link

### Le composant Link de Next.js

**Ne PAS utiliser `<a>` pour la navigation interne !**

```typescript
// ❌ MAUVAIS : Recharge toute la page
<a href="/dashboard">Dashboard</a>

// ✅ BON : Navigation sans rechargement (SPA)
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>
```

### Exemple dans ton code : `app/page.tsx`

**Ligne 161-163 :**
```typescript
<a href="/signup" className="text-blue-600 hover:underline font-semibold">
  Sign up
</a>
```

**Pourquoi `<a>` ici ?**
→ C'est une page de connexion, un rechargement est acceptable
→ Mais on pourrait utiliser `<Link>` pour une meilleure UX

### Navigation programmatique avec useRouter

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/(dashboard)/dashboard/page.tsx` (ligne 5)

```typescript
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isPending && !session) {
      router.push('/');  // ← Navigation programmatique
      return;
    }
  }, [session, isPending, router]);
}
```

**Méthodes du router :**

| Méthode | Action | Exemple |
|---------|--------|---------|
| `router.push('/path')` | Navigue vers une page (avec historique) | Bouton "Voir détails" |
| `router.replace('/path')` | Remplace la page actuelle (sans historique) | Après connexion |
| `router.back()` | Retour arrière | Bouton "Retour" |
| `router.refresh()` | Recharge les données serveur | Après modification |

### Préchargement automatique (Prefetching)

**Next.js précharge automatiquement les pages :**

```typescript
<Link href="/dashboard">Dashboard</Link>
```

→ Quand ce lien est visible à l'écran, Next.js précharge `/dashboard`
→ Le clic est INSTANTANÉ (pas d'attente)

---

## 3.5. Server Components vs Client Components

### Le concept le plus important de Next.js

**Par défaut, TOUT est Server Component.**

```
┌─────────────────────────────────────────────────────────┐
│  SERVER COMPONENT (défaut)                              │
│  - S'exécute sur le serveur                             │
│  - Rendu en HTML envoyé au client                       │
│  - Peut accéder à la base de données                    │
│  - Ne peut PAS utiliser useState, onClick, etc.         │
│  - Code JAMAIS envoyé au navigateur                     │
└─────────────────────────────────────────────────────────┘
              ↓ Ajoute 'use client' ↓
┌─────────────────────────────────────────────────────────┐
│  CLIENT COMPONENT ('use client')                        │
│  - S'exécute dans le navigateur                         │
│  - Peut utiliser useState, useEffect, onClick...        │
│  - Ne peut PAS accéder directement à la BDD             │
│  - Code envoyé au navigateur (visible par tous)         │
└─────────────────────────────────────────────────────────┘
```

### Exemple Server Component (hypothétique)

```typescript
// app/users/page.tsx
// ⚠️ PAS de 'use client' = SERVER COMPONENT

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export default async function UsersPage() {
  // ✅ Accès direct à la BDD (uniquement côté serveur)
  const allUsers = await db.select().from(users);

  return (
    <div>
      <h1>Utilisateurs</h1>
      <ul>
        {allUsers.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Ce code :**
- S'exécute sur le SERVEUR
- Accède à la base de données
- Génère du HTML
- Envoie le HTML au client
- Le client affiche juste le résultat

### Exemple Client Component : `app/page.tsx`

```typescript
'use client';  // ← Directive obligatoire

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');  // ✅ Possible avec 'use client'

  return (
    <input
      value={email}
      onChange={(e) => setEmail(e.target.value)}  // ✅ Événements possibles
    />
  );
}
```

### Règle de décision

**Utilise Server Component si :**
- Tu n'as PAS besoin d'interactivité (pas de clics, pas d'inputs)
- Tu veux accéder à la base de données
- Tu veux réduire le JavaScript envoyé au client

**Utilise Client Component ('use client') si :**
- Tu as besoin de `useState`, `useEffect`
- Tu gères des événements (`onClick`, `onChange`)
- Tu utilises des hooks React
- Tu dois accéder au `window`, `document`, etc.

### Composition : Mélanger Server et Client

**Tu peux imbriquer Server Components dans Client Components :**

```typescript
// app/page.tsx (Client Component)
'use client';

import { ServerStats } from './ServerStats';  // Server Component

export default function Dashboard() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <ServerStats />  {/* ← Server Component imbriqué */}
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

---

## 3.6. Redirections et protection de routes

### Protection côté client : `app/(dashboard)/dashboard/page.tsx`

**Lignes 33-44 :**
```typescript
useEffect(() => {
  // Redirect to home if not authenticated
  if (!isPending && !session) {
    router.push('/');
    return;
  }

  // Check if user needs to complete onboarding
  if (session?.user && !(session.user as any).hasCompletedOnboarding) {
    router.push('/onboarding');
    return;
  }
}, [session, isPending, router]);
```

**Flow :**
1. Le composant charge
2. `useSession()` récupère la session
3. Si pas de session → Redirection vers `/`
4. Si session mais onboarding incomplet → Redirection vers `/onboarding`
5. Sinon → Affiche le dashboard

### UI de chargement pendant la vérification

**Lignes 113-121 :**
```typescript
if (isPending) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Loading...</p>
      </div>
    </main>
  );
}
```

### Protection côté serveur (meilleure approche)

**Créer un middleware :** `middleware.ts` (à la racine)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Protéger les routes /dashboard et /onboarding
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/onboarding')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
```

**Avantages :**
- Protection AVANT que la page soit chargée
- Pas de flash de contenu non autorisé
- Plus sécurisé

---

## 3.7. Exercices pratiques

### Exercice 1 : Créer une page "About"

**Objectif :** Créer une page accessible sur `/about`

**Étapes :**

1. **Crée le fichier :**
   ```bash
   mkdir -p /home/user/test-setup-nextjs/my-nextjs-app/app/about
   touch /home/user/test-setup-nextjs/my-nextjs-app/app/about/page.tsx
   ```

2. **Contenu du fichier :**
   ```typescript
   export default function AboutPage() {
     return (
       <main className="flex min-h-screen flex-col items-center justify-center p-8">
         <div className="max-w-2xl">
           <h1 className="text-4xl font-bold mb-4">À propos</h1>
           <p className="text-lg text-gray-600">
             Ceci est une page d'exemple créée avec Next.js App Router.
           </p>
         </div>
       </main>
     );
   }
   ```

3. **Teste :**
   - Lance `npm run dev`
   - Va sur `http://localhost:3000/about`

### Exercice 2 : Ajouter un lien de navigation

**Objectif :** Ajouter un lien "About" sur la page d'accueil

**Fichier à modifier :** `app/page.tsx`

**Ajoute après le lien "Sign up" (ligne 164) :**

```typescript
import Link from 'next/link';

// Dans le JSX, après le lien "Sign up" :
<p className="mt-4 text-center text-sm text-gray-600">
  <Link href="/about" className="text-blue-600 hover:underline">
    En savoir plus
  </Link>
</p>
```

### Exercice 3 : Créer un groupe de routes `(public)`

**Objectif :** Organiser les pages publiques (about, contact, etc.)

**Étapes :**

1. **Crée la structure :**
   ```bash
   mkdir -p /home/user/test-setup-nextjs/my-nextjs-app/app/(public)/contact
   ```

2. **Déplace la page about :**
   ```bash
   mv /home/user/test-setup-nextjs/my-nextjs-app/app/about/page.tsx \
      /home/user/test-setup-nextjs/my-nextjs-app/app/(public)/about/
   ```

3. **L'URL reste `/about`** (les parenthèses sont ignorées)

### Exercice 4 : Page avec état (Client Component)

**Objectif :** Créer une page interactive avec compteur

**Fichier :** `app/test/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Compteur : {count}</h1>
        <div className="space-x-2">
          <Button onClick={() => setCount(count - 1)}>-</Button>
          <Button onClick={() => setCount(count + 1)}>+</Button>
        </div>
      </div>
    </main>
  );
}
```

---

## 📝 Résumé du Chapitre 3

### Concepts clés

1. **Routing basé sur les fichiers**
   ```
   app/page.tsx           → /
   app/about/page.tsx     → /about
   app/(auth)/signup/page.tsx → /signup
   ```

2. **Layouts**
   ```typescript
   export default function RootLayout({ children }) {
     return <html><body>{children}</body></html>
   }
   ```

3. **Route Groups `(nom)`**
   - Organisent le code
   - N'impactent PAS les URLs
   - Permettent des layouts séparés

4. **Navigation**
   ```typescript
   import Link from 'next/link';
   <Link href="/dashboard">Dashboard</Link>

   // Ou programmatique
   import { useRouter } from 'next/navigation';
   router.push('/dashboard');
   ```

5. **Server vs Client Components**
   ```typescript
   // Server Component (défaut)
   export default async function Page() {
     const data = await db.query();
     return <div>{data}</div>
   }

   // Client Component
   'use client';
   export default function Page() {
     const [state, setState] = useState();
     return <button onClick={...}>Click</button>
   }
   ```

### Schéma mental : Structure d'une app Next.js

```
app/
├── layout.tsx          ← Layout racine (toutes les pages)
├── page.tsx            ← Page d'accueil (/)
│
├── (auth)/             ← Route group (ignoré dans l'URL)
│   ├── layout.tsx      ← Layout pour les pages auth
│   └── signup/
│       └── page.tsx    ← /signup
│
└── (dashboard)/
    ├── layout.tsx      ← Layout pour le dashboard
    ├── dashboard/
    │   └── page.tsx    ← /dashboard
    └── onboarding/
        └── page.tsx    ← /onboarding
```

---

## ✅ Validation des acquis

- [ ] Je comprends comment la structure de dossiers crée les routes
- [ ] Je sais ce qu'est un layout et comment il fonctionne
- [ ] Je comprends les route groups `(nom)` et leur utilité
- [ ] Je sais utiliser `<Link>` pour la navigation
- [ ] Je connais la différence entre Server et Client Components
- [ ] Je sais quand utiliser `'use client'`
- [ ] Je sais protéger une route avec redirection

### Questions de validation

1. **Quel fichier correspond à l'URL `/dashboard` ?**
   → `app/(dashboard)/dashboard/page.tsx` ou `app/dashboard/page.tsx`

2. **Pourquoi utiliser `<Link>` au lieu de `<a>` ?**
   → Pour éviter le rechargement de page (navigation SPA)

3. **Que fait la directive `'use client'` ?**
   → Indique que le composant doit s'exécuter côté client (avec interactivité)

4. **Peut-on accéder à la base de données dans un Client Component ?**
   → Non, uniquement dans les Server Components ou API Routes

---

## 🎯 Prochaine étape

**[Chapitre 4 : Tailwind CSS](./chapitre-04-tailwind-css.md)**

Dans le prochain chapitre :
- Les classes utilitaires de Tailwind
- Le système de design (couleurs, espacements, typographie)
- Le responsive design
- Le dark mode
- Personnaliser le thème

---

**[← Chapitre précédent](./chapitre-02-react-fondamentaux.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-04-tailwind-css.md)**
