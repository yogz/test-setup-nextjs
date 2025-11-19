# Chapitre 7 : Base de données avec Drizzle ORM

> ⏱️ **Durée estimée :** 3-4 heures
> 🎯 **Objectif :** Comprendre comment interagir avec la base de données PostgreSQL via Drizzle ORM

---

## 📑 Table des matières

1. [Qu'est-ce qu'un ORM ?](#71-quest-ce-quun-orm-)
2. [Drizzle ORM : Introduction](#72-drizzle-orm--introduction)
3. [Schémas de tables](#73-schémas-de-tables)
4. [Types et validation avec Zod](#74-types-et-validation-avec-zod)
5. [Requêtes de base (CRUD)](#75-requêtes-de-base-crud)
6. [Requêtes avancées](#76-requêtes-avancées)
7. [Migrations](#77-migrations)
8. [Exercices pratiques](#78-exercices-pratiques)
9. [Résumé](#résumé-du-chapitre-7)

---

## 7.1. Qu'est-ce qu'un ORM ?

### Définition

**ORM = Object-Relational Mapping**
**= Pont entre ton code TypeScript et la base de données SQL**

**Analogie avec le C :**
```c
// En C : SQL brut avec des chaînes de caractères
char* query = "SELECT * FROM users WHERE email = 'test@example.com'";
result = executeQuery(connection, query);

// Avec un ORM (Drizzle) : Code TypeScript typé
const users = await db.select().from(users).where(eq(users.email, 'test@example.com'));
```

### Pourquoi utiliser un ORM ?

**Sans ORM (SQL brut) :**
```typescript
const result = await client.query(
  "SELECT * FROM users WHERE id = $1",
  [userId]
);
const user = result.rows[0];  // Type: any (pas de typage)
```

**Avec Drizzle ORM :**
```typescript
const user = await db.select()
  .from(users)
  .where(eq(users.id, userId));
// Type: User (typé automatiquement !)
```

**Avantages :**
- ✅ Typage TypeScript complet
- ✅ Autocomplétion dans l'éditeur
- ✅ Prévention des erreurs SQL
- ✅ Migrations automatiques
- ✅ Protection contre les injections SQL

---

## 7.2. Drizzle ORM : Introduction

### Configuration de la connexion

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/lib/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Récupère l'URL de connexion depuis les variables d'environnement
const connectionString = process.env.DATABASE_URL!;

// Crée le client PostgreSQL
const client = postgres(connectionString, {
  max: 10,              // Max 10 connexions simultanées
  idle_timeout: 20,     // Ferme les connexions inactives après 20s
  connect_timeout: 10,  // Timeout de connexion : 10s
});

// Crée l'instance Drizzle avec le schéma
export const db = drizzle(client, { schema });
```

**Variable d'environnement (`.env.local`) :**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

### Structure d'une requête Drizzle

```typescript
const result = await db
  .select()              // Que veux-tu faire ? (SELECT, INSERT, UPDATE, DELETE)
  .from(users)           // Sur quelle table ?
  .where(eq(users.id, 1)); // Avec quelle condition ?
```

**Équivalent SQL :**
```sql
SELECT * FROM users WHERE id = 1;
```

---

## 7.3. Schémas de tables

### Définir une table

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/lib/db/schema.ts`

**Table `users` (lignes 5-17) :**

```typescript
import { pgTable, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  sex: varchar('sex', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  hasCompletedOnboarding: boolean('has_completed_onboarding').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Décortication :**

1. **Clé primaire avec UUID auto-généré :**
   ```typescript
   id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
   ```
   → Génère automatiquement un UUID à chaque insertion

2. **Email unique et obligatoire :**
   ```typescript
   email: varchar('email', { length: 255 }).notNull().unique()
   ```
   - `varchar(255)` : Chaîne de max 255 caractères
   - `.notNull()` : Ne peut pas être NULL
   - `.unique()` : Deux utilisateurs ne peuvent pas avoir le même email

3. **Valeur par défaut :**
   ```typescript
   emailVerified: boolean('email_verified').default(false).notNull()
   ```
   → Si non spécifié à l'insertion, vaut `false`

4. **Champs optionnels :**
   ```typescript
   name: varchar('name', { length: 255 })
   ```
   → Pas de `.notNull()` = peut être NULL

5. **Timestamps automatiques :**
   ```typescript
   createdAt: timestamp('created_at').defaultNow().notNull()
   ```
   → Génère automatiquement la date actuelle

### Types de colonnes disponibles

| Type Drizzle | Type SQL | Exemple |
|--------------|----------|---------|
| `text('name')` | TEXT | Texte illimité |
| `varchar('email', { length: 255 })` | VARCHAR(255) | Texte limité |
| `boolean('verified')` | BOOLEAN | true/false |
| `integer('age')` | INTEGER | Nombre entier |
| `timestamp('created_at')` | TIMESTAMP | Date et heure |
| `json('data')` | JSON | Objet JSON |

### Table `sessions` avec relation

**Lignes 19-30 :**

```typescript
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});
```

**Clé étrangère (Foreign Key) :**
```typescript
userId: text('user_id')
  .notNull()
  .references(() => users.id, { onDelete: 'cascade' })
```

**Signification :**
- `userId` doit exister dans `users.id`
- `onDelete: 'cascade'` : Si l'utilisateur est supprimé, ses sessions le sont aussi

**Équivalent SQL :**
```sql
CREATE TABLE sessions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 7.4. Types et validation avec Zod

### Générer des schémas Zod depuis Drizzle

**Fichier :** `lib/db/schema.ts` (lignes 64-72)

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Génère automatiquement le schéma Zod depuis la table Drizzle
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email address').max(255),
  name: z.string().max(255).optional(),
  dateOfBirth: z.string().includes('-').optional(), // YYYY-MM-DD format
  sex: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  phone: z.string().startsWith('+').optional(), // International format
});

export const selectUserSchema = createSelectSchema(users);
```

**Avantages :**
- ✅ Schéma Zod généré automatiquement depuis la table
- ✅ Validation des données avant insertion
- ✅ Types TypeScript cohérents

### Types TypeScript générés

**Lignes 99-106 :**

```typescript
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

**Utilisation :**
```typescript
// Type pour lire un utilisateur depuis la BDD
const user: User = await db.select().from(users).where(...);

// Type pour créer un utilisateur
const newUser: InsertUser = {
  email: 'test@example.com',
  name: 'Jean Dupont',
};
```

---

## 7.5. Requêtes de base (CRUD)

### CREATE - Insérer des données

**Insérer un utilisateur :**

```typescript
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const newUser = await db.insert(users).values({
  email: 'jean@example.com',
  name: 'Jean Dupont',
  dateOfBirth: '1990-01-01',
  sex: 'male',
}).returning();

console.log(newUser[0].id);  // UUID généré
```

**Équivalent SQL :**
```sql
INSERT INTO users (id, email, name, date_of_birth, sex, created_at, updated_at)
VALUES (uuid_generate_v4(), 'jean@example.com', 'Jean Dupont', '1990-01-01', 'male', NOW(), NOW())
RETURNING *;
```

**`.returning()` :**
→ Retourne les lignes insérées (avec l'ID généré)

### READ - Lire des données

**Lire tous les utilisateurs :**
```typescript
const allUsers = await db.select().from(users);
```

**Lire un utilisateur par email :**
```typescript
import { eq } from 'drizzle-orm';

const user = await db.select()
  .from(users)
  .where(eq(users.email, 'jean@example.com'));

// Résultat : array (peut être vide)
if (user.length > 0) {
  console.log(user[0].name);
}
```

**Lire plusieurs champs spécifiques :**
```typescript
const usersInfo = await db.select({
  id: users.id,
  email: users.email,
  name: users.name,
}).from(users);

// Résultat : [{ id: '...', email: '...', name: '...' }, ...]
```

### UPDATE - Mettre à jour des données

**Exemple dans ton code :** `app/api/update-profile/route.ts` (lignes 23-29)

```typescript
import { eq } from 'drizzle-orm';

await db
  .update(users)
  .set({
    name: 'Nouveau nom',
    phone: '+33612345678',
    updatedAt: new Date(),
  })
  .where(eq(users.id, session.user.id));
```

**Équivalent SQL :**
```sql
UPDATE users
SET name = 'Nouveau nom', phone = '+33612345678', updated_at = NOW()
WHERE id = 'user-123';
```

**Mettre à jour et récupérer le résultat :**
```typescript
const updated = await db
  .update(users)
  .set({ hasCompletedOnboarding: true })
  .where(eq(users.id, userId))
  .returning();

console.log(updated[0]);  // Utilisateur mis à jour
```

### DELETE - Supprimer des données

**Supprimer un utilisateur :**
```typescript
import { eq } from 'drizzle-orm';

await db.delete(users).where(eq(users.id, userId));
```

**Équivalent SQL :**
```sql
DELETE FROM users WHERE id = 'user-123';
```

**Supprimer plusieurs lignes :**
```typescript
import { lt } from 'drizzle-orm';

// Supprimer toutes les sessions expirées
await db.delete(sessions)
  .where(lt(sessions.expiresAt, new Date()));
```

---

## 7.6. Requêtes avancées

### Opérateurs de comparaison

**Fichier à importer :**
```typescript
import { eq, ne, gt, gte, lt, lte, like, and, or, not } from 'drizzle-orm';
```

| Opérateur | Signification | Exemple |
|-----------|---------------|---------|
| `eq(a, b)` | Égal (=) | `eq(users.id, '123')` |
| `ne(a, b)` | Différent (≠) | `ne(users.status, 'deleted')` |
| `gt(a, b)` | Supérieur (>) | `gt(users.age, 18)` |
| `gte(a, b)` | Supérieur ou égal (≥) | `gte(users.age, 18)` |
| `lt(a, b)` | Inférieur (<) | `lt(sessions.expiresAt, new Date())` |
| `lte(a, b)` | Inférieur ou égal (≤) | `lte(users.loginCount, 5)` |
| `like(a, pattern)` | Recherche partielle | `like(users.email, '%@gmail.com')` |

### Combiner plusieurs conditions

**AND - Toutes les conditions doivent être vraies :**
```typescript
import { and, eq } from 'drizzle-orm';

const user = await db.select().from(users).where(
  and(
    eq(users.email, 'jean@example.com'),
    eq(users.emailVerified, true)
  )
);
```

**Équivalent SQL :**
```sql
SELECT * FROM users
WHERE email = 'jean@example.com' AND email_verified = true;
```

**OR - Au moins une condition doit être vraie :**
```typescript
import { or, eq } from 'drizzle-orm';

const users = await db.select().from(users).where(
  or(
    eq(users.sex, 'male'),
    eq(users.sex, 'non-binary')
  )
);
```

### Tri (ORDER BY)

```typescript
import { desc, asc } from 'drizzle-orm';

// Tri par date de création (plus récent en premier)
const users = await db.select()
  .from(users)
  .orderBy(desc(users.createdAt));

// Tri par nom (A-Z)
const usersSorted = await db.select()
  .from(users)
  .orderBy(asc(users.name));
```

### Limite et pagination

```typescript
// Récupérer les 10 premiers utilisateurs
const users = await db.select()
  .from(users)
  .limit(10);

// Pagination : page 2 (skip 10, prendre 10)
const page2 = await db.select()
  .from(users)
  .limit(10)
  .offset(10);
```

### Jointures

**Exemple : Récupérer les utilisateurs avec leurs sessions :**

```typescript
const usersWithSessions = await db.select({
  user: users,
  session: sessions,
})
  .from(users)
  .leftJoin(sessions, eq(users.id, sessions.userId));
```

**Équivalent SQL :**
```sql
SELECT users.*, sessions.*
FROM users
LEFT JOIN sessions ON users.id = sessions.user_id;
```

### Compter (COUNT)

```typescript
import { count } from 'drizzle-orm';

const result = await db.select({ count: count() })
  .from(users);

console.log('Nombre d\'utilisateurs :', result[0].count);
```

---

## 7.7. Migrations

### Qu'est-ce qu'une migration ?

**Migration = Modification de la structure de la base de données**

**Exemples :**
- Ajouter une nouvelle table
- Ajouter une colonne à une table existante
- Modifier le type d'une colonne
- Supprimer une colonne

### Générer une migration

**1. Modifier le schéma :**

```typescript
// lib/db/schema.ts
export const users = pgTable('users', {
  // ... champs existants
  bio: text('bio'),  // ← Nouveau champ ajouté
});
```

**2. Générer la migration :**
```bash
npm run db:generate
```

**Crée un fichier :** `drizzle/0001_add_bio_to_users.sql`

```sql
ALTER TABLE users ADD COLUMN bio TEXT;
```

**3. Appliquer la migration :**
```bash
npm run db:migrate
```

### Scripts package.json

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Commandes :**
- `db:generate` : Génère les fichiers de migration
- `db:migrate` : Applique les migrations à la BDD
- `db:push` : Synchronise le schéma sans créer de migration (dev uniquement)
- `db:studio` : Interface graphique pour visualiser la BDD

---

## 7.8. Exercices pratiques

### Exercice 1 : Créer une table "posts"

**Objectif :** Ajouter une table pour des articles de blog

```typescript
// lib/db/schema.ts
export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  published: boolean('published').default(false).notNull(),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Exercice 2 : Insérer et lire des posts

```typescript
// Créer un post
const newPost = await db.insert(posts).values({
  title: 'Mon premier article',
  content: 'Contenu de l\'article...',
  authorId: userId,
  published: true,
}).returning();

// Lire tous les posts publiés
const publishedPosts = await db.select()
  .from(posts)
  .where(eq(posts.published, true))
  .orderBy(desc(posts.createdAt));

// Lire les posts d'un auteur
const userPosts = await db.select()
  .from(posts)
  .where(eq(posts.authorId, userId));
```

### Exercice 3 : Mettre à jour et supprimer

```typescript
// Publier un post (draft → published)
await db.update(posts)
  .set({ published: true, updatedAt: new Date() })
  .where(eq(posts.id, postId));

// Supprimer un post
await db.delete(posts)
  .where(eq(posts.id, postId));

// Supprimer tous les posts non publiés de plus de 30 jours
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

await db.delete(posts).where(
  and(
    eq(posts.published, false),
    lt(posts.createdAt, thirtyDaysAgo)
  )
);
```

### Exercice 4 : Jointure posts + auteurs

```typescript
// Récupérer les posts avec les infos de l'auteur
const postsWithAuthors = await db.select({
  post: posts,
  author: {
    id: users.id,
    name: users.name,
    email: users.email,
  },
})
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.published, true));

// Résultat :
// [
//   {
//     post: { id: '...', title: '...', content: '...' },
//     author: { id: '...', name: 'Jean', email: 'jean@...' }
//   },
//   ...
// ]
```

---

## 📝 Résumé du Chapitre 7

### Drizzle ORM en bref

**ORM = Object-Relational Mapping**
- Pont entre TypeScript et SQL
- Typage complet
- Protection contre les injections SQL

### Définir une table

```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### CRUD - Les 4 opérations de base

**CREATE :**
```typescript
await db.insert(users).values({ email: '...', name: '...' }).returning();
```

**READ :**
```typescript
await db.select().from(users).where(eq(users.id, userId));
```

**UPDATE :**
```typescript
await db.update(users).set({ name: 'Nouveau nom' }).where(eq(users.id, userId));
```

**DELETE :**
```typescript
await db.delete(users).where(eq(users.id, userId));
```

### Opérateurs utiles

```typescript
import { eq, ne, gt, lt, like, and, or, desc, asc } from 'drizzle-orm';

// Égalité
eq(users.email, 'test@example.com')

// Comparaison
gt(users.age, 18)

// Recherche partielle
like(users.email, '%@gmail.com')

// Combiner
and(eq(users.sex, 'male'), gt(users.age, 18))

// Tri
orderBy(desc(users.createdAt))
```

---

## ✅ Validation des acquis

- [ ] Je comprends ce qu'est un ORM
- [ ] Je sais définir un schéma de table avec Drizzle
- [ ] Je sais insérer des données (INSERT)
- [ ] Je sais lire des données (SELECT avec WHERE)
- [ ] Je sais mettre à jour des données (UPDATE)
- [ ] Je sais supprimer des données (DELETE)
- [ ] Je sais utiliser les opérateurs (eq, gt, like, and, or)
- [ ] Je comprends les relations (Foreign Keys)

### Questions de validation

1. **Quelle est la différence entre `text()` et `varchar(255)` ?**
   → `text()` est illimité, `varchar(255)` est limité à 255 caractères

2. **Que fait `.returning()` après un INSERT ?**
   → Retourne les lignes insérées (avec les valeurs générées comme l'ID)

3. **Comment empêcher les valeurs NULL dans une colonne ?**
   → Utiliser `.notNull()`

4. **Que fait `onDelete: 'cascade'` dans une Foreign Key ?**
   → Supprime automatiquement les lignes liées quand la ligne parente est supprimée

---

## 🎯 Prochaine étape

**[Chapitre 8 : API Routes](./chapitre-08-api-routes.md)**

Dans le prochain chapitre :
- Créer des endpoints API
- Méthodes HTTP (GET, POST, PUT, DELETE)
- Validation des données côté serveur
- Gestion des erreurs
- Authentification dans les API Routes

---

**[← Chapitre précédent](./chapitre-06-authentification.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-08-api-routes.md)**
