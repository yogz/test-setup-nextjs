# Chapitre 8 : API Routes

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Créer des endpoints API backend avec Next.js

---

## 📑 Table des matières

1. [Qu'est-ce qu'une API Route ?](#81-quest-ce-quune-api-route-)
2. [Créer une API Route](#82-créer-une-api-route)
3. [Méthodes HTTP](#83-méthodes-http)
4. [Récupérer les données de la requête](#84-récupérer-les-données-de-la-requête)
5. [Validation avec Zod](#85-validation-avec-zod)
6. [Authentification et sécurité](#86-authentification-et-sécurité)
7. [Gestion des erreurs](#87-gestion-des-erreurs)
8. [Appeler une API depuis le frontend](#88-appeler-une-api-depuis-le-frontend)
9. [Exercices pratiques](#89-exercices-pratiques)
10. [Résumé](#résumé-du-chapitre-8)

---

## 8.1. Qu'est-ce qu'une API Route ?

### Définition

**API Route = Endpoint backend accessible via HTTP**

**Analogie avec le C :**
```c
// En C : fonction qui traite une requête
void handleRequest(Request* req, Response* res) {
    if (strcmp(req->method, "GET") == 0) {
        res->body = getUserData();
        res->status = 200;
    }
}

// En Next.js : API Route
export async function GET(request: NextRequest) {
    const data = await getUserData();
    return NextResponse.json(data, { status: 200 });
}
```

### Client vs Serveur

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT (Navigateur)                                    │
│  - Page React ('use client')                            │
│  - Fait des requêtes HTTP                               │
│  - Ne peut PAS accéder à la BDD directement             │
└─────────────────────────────────────────────────────────┘
              ↓ fetch('/api/update-profile')
┌─────────────────────────────────────────────────────────┐
│  SERVEUR (API Route)                                    │
│  - Code Node.js (pas de 'use client')                   │
│  - Peut accéder à la BDD                                │
│  - Peut utiliser des secrets (API keys...)              │
│  - Renvoie du JSON au client                            │
└─────────────────────────────────────────────────────────┘
```

### Structure des API Routes

**Dans Next.js, les API Routes sont dans `/app/api/` :**

```
app/api/
├── auth/
│   └── [...all]/
│       └── route.ts          → /api/auth/* (Better-auth)
└── update-profile/
    └── route.ts              → /api/update-profile
```

---

## 8.2. Créer une API Route

### Fichier minimal

**Créer :** `app/api/hello/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello World!' });
}
```

**Accès :** `http://localhost:3000/api/hello`

**Réponse :**
```json
{
  "message": "Hello World!"
}
```

### Structure d'une API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users
export async function GET(request: NextRequest) {
  // Logique de lecture
  return NextResponse.json({ users: [...] });
}

// POST /api/users
export async function POST(request: NextRequest) {
  // Logique de création
  return NextResponse.json({ success: true }, { status: 201 });
}

// PUT /api/users
export async function PUT(request: NextRequest) {
  // Logique de mise à jour
  return NextResponse.json({ success: true });
}

// DELETE /api/users
export async function DELETE(request: NextRequest) {
  // Logique de suppression
  return NextResponse.json({ success: true }, { status: 204 });
}
```

---

## 8.3. Méthodes HTTP

### Les 4 méthodes principales (CRUD)

| Méthode | Action | Exemple d'usage |
|---------|--------|-----------------|
| `GET` | Lire | Récupérer des utilisateurs |
| `POST` | Créer | Créer un utilisateur |
| `PUT/PATCH` | Modifier | Mettre à jour un profil |
| `DELETE` | Supprimer | Supprimer un compte |

### GET - Lire des données

**Exemple : Récupérer tous les utilisateurs**

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET() {
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
  }).from(users);

  return NextResponse.json({ users: allUsers });
}
```

### POST - Créer des données

**Exemple dans ton code :** `app/api/update-profile/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  // 1. Récupérer le body JSON
  const body = await request.json();

  // 2. Mettre à jour en BDD
  await db
    .update(users)
    .set({
      name: body.name,
      phone: body.phone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // 3. Répondre avec succès
  return NextResponse.json({ success: true });
}
```

### PUT/PATCH - Modifier

```typescript
// PUT : Remplace complètement la ressource
export async function PUT(request: NextRequest) {
  const body = await request.json();

  await db.update(users)
    .set({
      name: body.name,
      email: body.email,
      phone: body.phone,
      // Tous les champs requis
    })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}

// PATCH : Modifie partiellement
export async function PATCH(request: NextRequest) {
  const body = await request.json();

  await db.update(users)
    .set(body)  // Uniquement les champs fournis
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
```

### DELETE - Supprimer

```typescript
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ success: true }, { status: 204 });
}
```

---

## 8.4. Récupérer les données de la requête

### Body (corps de la requête)

**Pour POST, PUT, PATCH :**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log(body.name);
  console.log(body.email);

  return NextResponse.json({ received: body });
}
```

**Envoi depuis le frontend :**
```typescript
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jean',
    email: 'jean@example.com',
  }),
});
```

### Query Parameters (URL)

**URL :** `/api/users?role=admin&active=true`

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const role = searchParams.get('role');    // 'admin'
  const active = searchParams.get('active'); // 'true'

  const users = await db.select()
    .from(users)
    .where(
      and(
        eq(users.role, role),
        eq(users.active, active === 'true')
      )
    );

  return NextResponse.json({ users });
}
```

### Headers (en-têtes)

```typescript
export async function GET(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  const contentType = request.headers.get('Content-Type');

  console.log('Auth:', authorization);

  return NextResponse.json({ success: true });
}
```

### Cookies

```typescript
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session');

  console.log('Session:', sessionToken?.value);

  return NextResponse.json({ success: true });
}
```

---

## 8.5. Validation avec Zod

### Pourquoi valider côté serveur ?

**Le client peut être contourné !**

```
User malveillant → Modifie le code JS → Envoie des données invalides
                                      ↓
                            API Route DOIT valider
```

### Exemple complet dans ton code

**Fichier :** `app/api/update-profile/route.ts` (lignes 9-52)

```typescript
import { updateProfileSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parser et valider le body avec Zod
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 3. Mettre à jour en BDD (données validées)
    await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    // 4. Gestion des erreurs de validation
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
```

**Points clés :**
1. `.parse()` lance une exception si invalide
2. `.safeParse()` retourne `{ success: false, error }` si invalide
3. Toujours valider AVANT d'accéder à la BDD

---

## 8.6. Authentification et sécurité

### Vérifier la session

**Exemple dans ton code :**

```typescript
import { auth } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  // Récupérer la session depuis les headers (cookie)
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Utiliser session.user.id pour les requêtes
  const userId = session.user.id;
  const userEmail = session.user.email;

  // ...
}
```

### Protéger une route API

**Pattern classique :**

```typescript
export async function POST(request: NextRequest) {
  // 1. Vérifier l'authentification
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Vérifier les permissions (optionnel)
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Traiter la requête
  // ...
}
```

### Codes de statut HTTP

| Code | Signification | Usage |
|------|---------------|-------|
| `200` | OK | Succès (GET, PUT, PATCH) |
| `201` | Created | Ressource créée (POST) |
| `204` | No Content | Succès sans contenu (DELETE) |
| `400` | Bad Request | Données invalides |
| `401` | Unauthorized | Non authentifié |
| `403` | Forbidden | Pas les permissions |
| `404` | Not Found | Ressource inexistante |
| `500` | Internal Server Error | Erreur serveur |

---

## 8.7. Gestion des erreurs

### Try-Catch global

```typescript
export async function POST(request: NextRequest) {
  try {
    // Code qui peut échouer
    const body = await request.json();
    const result = await db.insert(users).values(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Erreurs spécifiques

```typescript
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);

    // ...
  } catch (error) {
    // Erreur de validation Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    // Erreur BDD (duplicata, contrainte...)
    if (error.code === '23505') {  // PostgreSQL : unique violation
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Erreur inconnue
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## 8.8. Appeler une API depuis le frontend

### Avec fetch()

**POST - Envoyer des données :**

```typescript
// app/(dashboard)/onboarding/page.tsx (lignes 59-71)
const response = await fetch('/api/update-profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formData.name,
    dateOfBirth: formData.dateOfBirth,
    sex: formData.sex,
    phone: formData.phone,
  }),
});

if (!response.ok) {
  throw new Error('Failed to update profile');
}

const data = await response.json();
console.log(data);  // { success: true }
```

### GET - Récupérer des données

```typescript
const response = await fetch('/api/users');
const data = await response.json();

console.log(data.users);  // [{ id: '...', name: '...' }, ...]
```

### Gérer les erreurs

```typescript
try {
  const response = await fetch('/api/update-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erreur API:', error);
    alert(error.error || 'Une erreur est survenue');
    return;
  }

  const data = await response.json();
  console.log('Succès:', data);
} catch (error) {
  console.error('Erreur réseau:', error);
  alert('Impossible de contacter le serveur');
}
```

---

## 8.9. Exercices pratiques

### Exercice 1 : API simple GET

**Objectif :** Créer une API qui retourne l'heure actuelle

```typescript
// app/api/time/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();

  return NextResponse.json({
    time: now.toISOString(),
    timestamp: now.getTime(),
  });
}
```

**Test :** `http://localhost:3000/api/time`

### Exercice 2 : API avec query params

**Objectif :** Calculer la somme de deux nombres

```typescript
// app/api/add/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const a = Number(searchParams.get('a') || 0);
  const b = Number(searchParams.get('b') || 0);

  return NextResponse.json({
    a,
    b,
    sum: a + b,
  });
}
```

**Test :** `http://localhost:3000/api/add?a=5&b=10`

### Exercice 3 : API protégée

**Objectif :** Récupérer le profil de l'utilisateur connecté

```typescript
// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  });
}
```

### Exercice 4 : API CRUD complète

**Objectif :** Créer une API pour gérer des tâches (todos)

```typescript
// 1. Créer le schéma (lib/db/schema.ts)
export const todos = pgTable('todos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  completed: boolean('completed').default(false).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. API Route (app/api/todos/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/todos - Liste les todos de l'utilisateur
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userTodos = await db.select()
    .from(todos)
    .where(eq(todos.userId, session.user.id));

  return NextResponse.json({ todos: userTodos });
}

// POST /api/todos - Créer une todo
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const newTodo = await db.insert(todos).values({
    title: body.title,
    userId: session.user.id,
  }).returning();

  return NextResponse.json({ todo: newTodo[0] }, { status: 201 });
}

// PATCH /api/todos - Marquer comme complétée
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  await db.update(todos)
    .set({ completed: body.completed })
    .where(
      and(
        eq(todos.id, body.id),
        eq(todos.userId, session.user.id)  // Sécurité : uniquement ses todos
      )
    );

  return NextResponse.json({ success: true });
}

// DELETE /api/todos
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const todoId = searchParams.get('id');

  await db.delete(todos).where(
    and(
      eq(todos.id, todoId),
      eq(todos.userId, session.user.id)
    )
  );

  return NextResponse.json({ success: true }, { status: 204 });
}
```

---

## 📝 Résumé du Chapitre 8

### Structure d'une API Route

```typescript
// app/api/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: '...' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ success: true }, { status: 201 });
}
```

### Méthodes HTTP

- `GET` → Lire
- `POST` → Créer
- `PUT/PATCH` → Modifier
- `DELETE` → Supprimer

### Pattern de sécurité

```typescript
export async function POST(request: NextRequest) {
  // 1. Authentification
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Validation
  const body = await request.json();
  const validatedData = schema.parse(body);

  // 3. Autorisation (optionnel)
  if (resource.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 4. Traitement
  await db.update(table).set(validatedData).where(...);

  return NextResponse.json({ success: true });
}
```

---

## ✅ Validation des acquis

- [ ] Je sais créer une API Route
- [ ] Je comprends les méthodes HTTP (GET, POST, PUT, DELETE)
- [ ] Je sais récupérer le body, les query params, les headers
- [ ] Je sais valider les données avec Zod côté serveur
- [ ] Je sais protéger une API Route avec la session
- [ ] Je sais gérer les erreurs avec try-catch
- [ ] Je sais appeler une API depuis le frontend

### Questions de validation

1. **Où créer une API Route pour l'URL `/api/users` ?**
   → `app/api/users/route.ts`

2. **Comment récupérer le body JSON d'une requête POST ?**
   → `const body = await request.json()`

3. **Pourquoi valider côté serveur si on valide déjà côté client ?**
   → Le client peut être contourné, le serveur est la source de vérité

4. **Quel code HTTP renvoyer pour "Unauthorized" ?**
   → 401

---

## 🎯 Prochaine étape

**[Chapitre 9 : TypeScript - Les bases](./chapitre-09-typescript.md)**

Dans le prochain chapitre :
- Types de base TypeScript
- Interfaces et types personnalisés
- Génériques
- Inférence de types depuis Drizzle et Zod
- Typage des composants React

---

**[← Chapitre précédent](./chapitre-07-base-donnees-drizzle.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-09-typescript.md)**
