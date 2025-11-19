# Chapitre 12 : Devenir autonome

> ⏱️ **Durée estimée :** 3-4 heures (+ projet final)
> 🎯 **Objectif :** Acquérir les compétences et ressources pour continuer seul

---

## 📑 Table des matières

1. [Bonnes pratiques](#121-bonnes-pratiques)
2. [Méthodologie pour ajouter une fonctionnalité](#122-méthodologie-pour-ajouter-une-fonctionnalité)
3. [Débogage et résolution de problèmes](#123-débogage-et-résolution-de-problèmes)
4. [Ressources pour continuer](#124-ressources-pour-continuer)
5. [Écosystème Next.js](#125-écosystème-nextjs)
6. [Projet final](#126-projet-final)
7. [Aller plus loin](#127-aller-plus-loin)
8. [Conclusion](#128-conclusion)

---

## 12.1. Bonnes pratiques

### Organisation du code

**1. Structure de fichiers cohérente**

```
app/
├── (auth)/              ← Pages publiques
│   ├── login/
│   └── signup/
├── (dashboard)/         ← Pages protégées
│   ├── dashboard/
│   └── settings/
└── api/                 ← API Routes

components/
├── ui/                  ← Composants réutilisables
├── forms/               ← Composants de formulaires
└── layout/              ← Header, Footer, Nav...

lib/
├── auth/                ← Authentification
├── db/                  ← Base de données
├── validations/         ← Schémas Zod
└── utils.ts             ← Fonctions utilitaires
```

**2. Nommage des fichiers et variables**

```typescript
// ✅ BON : Noms descriptifs
const userEmail = "test@example.com";
const handleFormSubmit = async () => { ... };
const isUserAuthenticated = true;

// ❌ MAUVAIS : Noms trop courts ou vagues
const e = "test@example.com";
const fn = async () => { ... };
const flag = true;
```

**3. Commenter le code complexe**

```typescript
// ❌ MAUVAIS : Commenter l'évident
const userId = session.user.id;  // Get user ID

// ✅ BON : Expliquer le "pourquoi"
// Convertit le format français (0612345678) en format international (+33612345678)
// pour respecter les contraintes de la BDD
if (phone.startsWith('0')) {
  phone = '+33' + phone.substring(1);
}
```

### Sécurité

**1. Toujours valider côté serveur**

```typescript
// ❌ MAUVAIS : Validation uniquement côté client
// Client Component
const handleSubmit = async () => {
  if (email.includes('@')) {
    await fetch('/api/users', { body: JSON.stringify({ email }) });
  }
};

// ✅ BON : Validation côté serveur
// API Route
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = userSchema.parse(body);  // Zod validation
  await db.insert(users).values(validatedData);
}
```

**2. Ne jamais exposer de secrets côté client**

```typescript
// ❌ MAUVAIS : API key côté client
'use client';
const API_KEY = "sk-1234567890";  // Visible dans le code source !

// ✅ BON : API key côté serveur uniquement
// API Route
const API_KEY = process.env.SECRET_API_KEY;  // Variable d'environnement
```

**3. Protéger les routes**

```typescript
// Client Component
useEffect(() => {
  if (!session) {
    router.push('/login');
  }
}, [session]);

// OU Middleware (meilleur)
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### Performance

**1. Éviter les re-renders inutiles**

```typescript
// ❌ MAUVAIS : Nouvelle fonction à chaque render
<Button onClick={() => handleClick(id)}>Cliquer</Button>

// ✅ BON : useCallback pour mémoriser
import { useCallback } from 'react';

const handleClick = useCallback((id: string) => {
  // ...
}, []);

<Button onClick={() => handleClick(id)}>Cliquer</Button>
```

**2. Charger les données au bon moment**

```typescript
// Server Component : Charger les données côté serveur
export default async function UsersPage() {
  const users = await db.select().from(users);  // Serveur
  return <UsersList users={users} />;
}

// Client Component : Charger les données après interaction
'use client';
export function UserProfile() {
  const [data, setData] = useState(null);

  const loadData = async () => {
    const response = await fetch('/api/profile');
    setData(await response.json());
  };

  return <button onClick={loadData}>Charger profil</button>;
}
```

---

## 12.2. Méthodologie pour ajouter une fonctionnalité

### Exemple : Ajouter un système de "posts" avec likes

**Étape 1 : Définir les besoins**

```
Fonctionnalité : Créer et liker des posts

User stories :
- Un utilisateur peut créer un post (titre + contenu)
- Un utilisateur peut voir tous les posts
- Un utilisateur peut liker/unliker un post
- Un post affiche le nombre de likes

Données nécessaires :
- Table posts : id, userId, title, content, createdAt
- Table likes : id, userId, postId, createdAt
```

**Étape 2 : Créer le schéma de BDD**

```typescript
// lib/db/schema.ts
export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const likes = pgTable('likes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Étape 3 : Créer la validation Zod**

```typescript
// lib/validations/posts.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255),
  content: z.string().min(10, 'Le contenu doit faire au moins 10 caractères'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
```

**Étape 4 : Créer les API Routes**

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { posts, likes } from '@/lib/db/schema';
import { createPostSchema } from '@/lib/validations/posts';
import { eq, sql } from 'drizzle-orm';

// GET /api/posts - Liste tous les posts avec nombre de likes
export async function GET() {
  const postsWithLikes = await db.select({
    id: posts.id,
    title: posts.title,
    content: posts.content,
    userId: posts.userId,
    createdAt: posts.createdAt,
    likesCount: sql<number>`count(${likes.id})::int`,
  })
    .from(posts)
    .leftJoin(likes, eq(posts.id, likes.postId))
    .groupBy(posts.id);

  return NextResponse.json({ posts: postsWithLikes });
}

// POST /api/posts - Créer un post
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validatedData = createPostSchema.parse(body);

  const newPost = await db.insert(posts).values({
    ...validatedData,
    userId: session.user.id,
  }).returning();

  return NextResponse.json({ post: newPost[0] }, { status: 201 });
}

// app/api/posts/[id]/like/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const postId = params.id;

  // Vérifier si déjà liké
  const existingLike = await db.select()
    .from(likes)
    .where(
      and(
        eq(likes.userId, session.user.id),
        eq(likes.postId, postId)
      )
    );

  if (existingLike.length > 0) {
    // Unlike
    await db.delete(likes).where(eq(likes.id, existingLike[0].id));
    return NextResponse.json({ action: 'unliked' });
  } else {
    // Like
    await db.insert(likes).values({
      userId: session.user.id,
      postId,
    });
    return NextResponse.json({ action: 'liked' });
  }
}
```

**Étape 5 : Créer les composants UI**

```typescript
// components/PostsList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  title: string;
  content: string;
  likesCount: number;
}

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const response = await fetch('/api/posts');
    const data = await response.json();
    setPosts(data.posts);
  };

  const handleLike = async (postId: string) => {
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    fetchPosts();  // Recharger pour avoir le nouveau count
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="border p-4 rounded-lg">
          <h3 className="text-xl font-bold">{post.title}</h3>
          <p className="text-gray-600 mt-2">{post.content}</p>
          <div className="mt-4 flex items-center gap-2">
            <Button onClick={() => handleLike(post.id)}>
              ❤️ {post.likesCount}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Étape 6 : Créer la page**

```typescript
// app/(dashboard)/posts/page.tsx
import { PostsList } from '@/components/PostsList';

export default function PostsPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Posts</h1>
      <PostsList />
    </main>
  );
}
```

**Étape 7 : Tester**

1. Créer un post
2. Vérifier dans Drizzle Studio (`npm run db:studio`)
3. Tester le like/unlike
4. Vérifier le count

---

## 12.3. Débogage et résolution de problèmes

### Erreurs courantes et solutions

**1. "Module not found"**

```bash
Error: Cannot find module '@/components/ui/button'
```

**Solutions :**
- Vérifier le chemin (sensible à la casse)
- Vérifier que le fichier existe
- Relancer le serveur (`npm run dev`)

**2. "Hydration mismatch"**

```
Warning: Text content did not match. Server: "..." Client: "..."
```

**Cause :** HTML rendu côté serveur ≠ HTML côté client

**Solutions :**
- Ne pas utiliser `Date.now()` ou `Math.random()` directement dans le JSX
- Utiliser `useEffect` pour le code client-only
- Vérifier les conditions qui diffèrent serveur/client

```typescript
// ❌ MAUVAIS
<div>{new Date().toString()}</div>

// ✅ BON
const [currentDate, setCurrentDate] = useState('');

useEffect(() => {
  setCurrentDate(new Date().toString());
}, []);

<div>{currentDate}</div>
```

**3. "Cannot read property of undefined"**

```typescript
// Erreur : session.user.name
TypeError: Cannot read property 'name' of undefined
```

**Solution :** Optional chaining

```typescript
// ❌ MAUVAIS
<p>{session.user.name}</p>

// ✅ BON
<p>{session?.user?.name || 'Anonymous'}</p>
```

**4. Erreur de validation Zod**

```
ZodError: Invalid email address
```

**Solution :** Vérifier le schéma et les données

```typescript
console.log('Données envoyées :', body);
console.log('Schéma Zod :', updateProfileSchema);

try {
  const validatedData = updateProfileSchema.parse(body);
} catch (error) {
  console.error('Erreur de validation :', error.issues);
}
```

### Outils de débogage

**1. Console du navigateur (F12)**
- Onglet Console : Voir les logs et erreurs
- Onglet Network : Inspecter les requêtes HTTP
- Onglet Application : Voir les cookies, localStorage

**2. Terminal (serveur Node.js)**
```bash
npm run dev

# Logs serveur :
console.log('📧 Email :', email);
console.error('❌ Erreur :', error);
```

**3. React DevTools**
- Extension Chrome/Firefox
- Inspecter les composants
- Voir props et state en temps réel

**4. Drizzle Studio**
```bash
npm run db:studio
# Ouvre http://localhost:4983
```
→ Interface pour visualiser et modifier la BDD

---

## 12.4. Ressources pour continuer

### Documentation officielle

**1. Next.js**
- Site : https://nextjs.org/docs
- Sections clés :
  - Getting Started
  - Routing (App Router)
  - Data Fetching
  - Server Components vs Client Components
  - API Routes

**2. React**
- Site : https://react.dev
- Sections importantes :
  - Learn React (tutoriel interactif)
  - Hooks (useState, useEffect, useRef...)
  - Thinking in React

**3. TypeScript**
- Site : https://www.typescriptlang.org/docs
- TypeScript Handbook
- Cheat Sheets

**4. Tailwind CSS**
- Site : https://tailwindcss.com/docs
- Chercher une classe : Ctrl+K
- Playground pour tester

**5. Drizzle ORM**
- Site : https://orm.drizzle.team
- Documentation PostgreSQL
- Exemples de requêtes

### Communautés et aide

**1. Stack Overflow**
- Tag `next.js`, `react`, `typescript`
- Chercher avant de poser une question
- Fournir un exemple minimal reproductible

**2. Discord**
- Next.js Discord : https://discord.gg/nextjs
- Reactiflux : https://discord.gg/reactiflux

**3. GitHub**
- Issues des projets (Next.js, Drizzle, Radix UI...)
- Discussions et exemples

**4. Reddit**
- r/nextjs
- r/reactjs
- r/typescript

### Tutoriels et cours

**1. Next.js Learn**
- https://nextjs.org/learn
- Tutoriel officiel complet

**2. YouTube**
- Chaînes recommandées :
  - **Fireship** (synthèses rapides)
  - **Theo - t3.gg** (Next.js avancé)
  - **Web Dev Simplified** (concepts React)

**3. Blogs techniques**
- https://vercel.com/blog (équipe Next.js)
- https://kentcdodds.com (React expert)

---

## 12.5. Écosystème Next.js

### Bibliothèques utiles

**1. Gestion de formulaires**
- **React Hook Form** : Formulaires performants
- **Zod** : Validation (déjà dans ton projet)

**2. UI Components**
- **Radix UI** : Primitives headless (déjà utilisé)
- **shadcn/ui** : Composants basés sur Radix + Tailwind
- **Headless UI** : Alternative à Radix

**3. État global**
- **Zustand** : Simple et léger
- **Jotai** : Atoms (comme Recoil)
- **Redux Toolkit** : Pour grandes apps

**4. Data fetching**
- **TanStack Query (React Query)** : Cache et refetch intelligent
- **SWR** : Créé par Vercel

**5. Animations**
- **Framer Motion** : Animations React
- **GSAP** : Animations complexes

**6. Testing**
- **Vitest** : Tests unitaires rapides
- **Playwright** : Tests E2E

### Outils de développement

**1. ESLint**
```bash
npm run lint
```
→ Détecter les erreurs de code

**2. Prettier**
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}
```

**3. Husky + Lint-staged**
→ Lancer les linters avant chaque commit

---

## 12.6. Projet final

### Objectif : Créer une mini-app complète

**Thème : Gestionnaire de tâches (Todo App amélioré)**

### Fonctionnalités à implémenter

**1. CRUD de tâches**
- Créer une tâche (titre, description, date limite)
- Lire toutes les tâches
- Modifier une tâche
- Supprimer une tâche
- Marquer comme complétée

**2. Catégories**
- Créer des catégories (Travail, Personnel, Urgent...)
- Assigner une catégorie à une tâche
- Filtrer par catégorie

**3. Authentification**
- Login / Signup
- Tâches privées par utilisateur

**4. UI/UX**
- Liste de tâches avec drag & drop (bonus)
- Filtres (Toutes, Actives, Complétées)
- Recherche de tâches
- Dark mode (bonus)

### Étapes suggérées

**1. Créer les schémas de BDD**

```typescript
// lib/db/schema.ts
export const todos = pgTable('todos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: boolean('completed').default(false).notNull(),
  categoryId: text('category_id').references(() => categories.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**2. Créer les API Routes**

- `GET /api/todos` : Liste des tâches
- `POST /api/todos` : Créer une tâche
- `PATCH /api/todos/[id]` : Modifier une tâche
- `DELETE /api/todos/[id]` : Supprimer une tâche
- `GET /api/categories` : Liste des catégories
- `POST /api/categories` : Créer une catégorie

**3. Créer les composants**

- `TodoList` : Liste scrollable
- `TodoItem` : Une tâche avec checkbox
- `TodoForm` : Formulaire d'ajout/modification
- `CategoryBadge` : Badge de catégorie
- `FilterBar` : Filtres (Toutes, Actives, Complétées)

**4. Créer les pages**

- `/todos` : Page principale avec liste
- `/todos/new` : Créer une nouvelle tâche (modal ou page)
- `/categories` : Gérer les catégories

### Critères de réussite

- [ ] Authentification fonctionnelle
- [ ] CRUD complet sur les tâches
- [ ] Filtrage par statut et catégorie
- [ ] Validation Zod côté serveur
- [ ] UI responsive (mobile + desktop)
- [ ] Code propre et commenté
- [ ] Pas d'erreurs dans la console

### Extensions possibles

- **Drag & drop** : Réorganiser les tâches
- **Dates et rappels** : Notifications pour les tâches dues
- **Partage** : Partager une tâche avec un autre utilisateur
- **Statistiques** : Graphiques de productivité
- **Export** : Exporter les tâches en CSV/PDF

---

## 12.7. Aller plus loin

### Déploiement

**1. Vercel (recommandé pour Next.js)**

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Déployer
vercel

# 3. Suivre les instructions
```

**Variables d'environnement :**
- Ajouter dans Vercel Dashboard
- DATABASE_URL, BETTER_AUTH_URL, etc.

**2. Alternatives**
- **Netlify** : Similaire à Vercel
- **Railway** : BDD incluse
- **Fly.io** : Containers

### Optimisations avancées

**1. Caching**
```typescript
// app/posts/page.tsx
export const revalidate = 60;  // Revalider toutes les 60s

export default async function PostsPage() {
  const posts = await db.select().from(posts);  // Mise en cache
  return <PostsList posts={posts} />;
}
```

**2. ISR (Incremental Static Regeneration)**
```typescript
export const revalidate = 3600;  // 1 heure

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  return <ProductDetails product={product} />;
}
```

**3. Image optimization**
```typescript
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Photo"
  width={500}
  height={300}
  priority  // Charger en priorité
/>
```

### Sécurité avancée

**1. CSRF Protection**
→ Better-auth le gère automatiquement

**2. Rate Limiting**
```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),  // 10 requêtes / 10s
});

// app/api/posts/route.ts
export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Traiter la requête
}
```

**3. Content Security Policy (CSP)**
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

---

## 12.8. Conclusion

### Ce que tu as appris

**Fondations**
- ✅ React (composants, hooks, state)
- ✅ Next.js (App Router, Server/Client Components)
- ✅ TypeScript (types, interfaces, génériques)
- ✅ Tailwind CSS (utility-first CSS)

**Backend**
- ✅ API Routes (REST endpoints)
- ✅ Drizzle ORM (requêtes SQL type-safe)
- ✅ Better-auth (authentification multi-méthodes)
- ✅ Validation Zod (sécurité des données)

**UI/UX**
- ✅ Composants réutilisables (Radix UI, CVA)
- ✅ Formulaires complexes (multi-étapes)
- ✅ Responsive design (mobile-first)

**Architecture**
- ✅ Séparation client/serveur
- ✅ Flow complet UI → API → BDD
- ✅ Gestion d'erreurs à tous les niveaux

### Prochaines étapes recommandées

**1. Approfondir les sujets**
- Server Actions (alternative aux API Routes)
- React Server Components avancés
- Streaming et Suspense
- Parallel Routes et Intercepting Routes

**2. Explorer l'écosystème**
- TanStack Query pour le data fetching
- Zustand pour l'état global
- Framer Motion pour les animations

**3. Apprendre les tests**
- Vitest pour les tests unitaires
- Playwright pour les tests E2E
- Testing Library pour les composants React

**4. Contribuer à l'open source**
- Signaler des bugs
- Proposer des améliorations
- Créer tes propres packages

### Message final

**Tu as maintenant toutes les bases pour :**
- Créer des applications web complètes
- Comprendre le code d'autres projets Next.js
- Trouver des solutions aux problèmes
- Continuer à apprendre en autonomie

**N'oublie pas :**
- **Personne ne sait tout** : même les développeurs expérimentés cherchent dans la doc
- **La pratique est essentielle** : code tous les jours, même 30 minutes
- **Les erreurs sont normales** : c'est en déboguant qu'on apprend le plus
- **La communauté est là** : n'hésite pas à poser des questions

**Bon courage pour la suite ! 🚀**

---

## 📚 Ressources finales

### Checklist complète

- [ ] J'ai terminé les 12 chapitres
- [ ] J'ai fait tous les exercices pratiques
- [ ] J'ai créé le projet final (Todo App)
- [ ] J'ai déployé au moins une app sur Vercel
- [ ] Je sais où trouver de l'aide quand je bloque
- [ ] Je connais les bonnes pratiques de sécurité
- [ ] Je sais déboguer efficacement

### Liens importants

**Documentation**
- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [Better-auth](https://www.better-auth.com)
- [Zod](https://zod.dev)

**Outils**
- [Vercel](https://vercel.com) (déploiement)
- [GitHub](https://github.com) (code source)
- [Stack Overflow](https://stackoverflow.com) (questions/réponses)

**Communautés**
- [Next.js Discord](https://discord.gg/nextjs)
- [Reactiflux Discord](https://discord.gg/reactiflux)

---

**[← Chapitre précédent](./chapitre-11-flow-complet.md)** | **[Retour au sommaire](./README.md)**

---

**Félicitations pour avoir terminé ce cours ! 🎉**
