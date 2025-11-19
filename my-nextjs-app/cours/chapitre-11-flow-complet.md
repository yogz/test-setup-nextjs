# Chapitre 11 : Flow complet - De l'UI à la base de données

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Comprendre le parcours complet d'une requête dans l'application

---

## 📑 Table des matières

1. [Vue d'ensemble du flow](#111-vue-densemble-du-flow)
2. [Flow 1 : Compléter l'onboarding](#112-flow-1--compléter-lonboarding)
3. [Flow 2 : Mise à jour du profil](#113-flow-2--mise-à-jour-du-profil)
4. [Flow 3 : Authentification Magic Link](#114-flow-3--authentification-magic-link)
5. [Débogage et logs](#115-débogage-et-logs)
6. [Gestion d'erreurs à chaque niveau](#116-gestion-derreurs-à-chaque-niveau)
7. [Optimisations](#117-optimisations)
8. [Exercice pratique complet](#118-exercice-pratique-complet)
9. [Résumé](#résumé-du-chapitre-11)

---

## 11.1. Vue d'ensemble du flow

### Architecture en couches

```
┌─────────────────────────────────────────────────────────┐
│  1. UI LAYER (Composants React)                         │
│     - Formulaires, boutons, inputs                      │
│     - Gestion du state local                            │
│     - Validation côté client                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. API LAYER (API Routes)                              │
│     - Endpoints HTTP                                    │
│     - Validation serveur (Zod)                          │
│     - Authentification                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. DATA LAYER (Drizzle ORM)                            │
│     - Requêtes SQL                                      │
│     - Transactions                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. DATABASE (PostgreSQL)                               │
│     - Stockage des données                              │
│     - Contraintes (unique, foreign keys...)             │
└─────────────────────────────────────────────────────────┘
```

### Les 3 flows principaux de ton application

1. **Onboarding** : Collecter les infos utilisateur (3 étapes)
2. **Mise à jour profil** : Modifier les données utilisateur
3. **Authentification** : Magic Link, Email/Password, Google OAuth

---

## 11.2. Flow 1 : Compléter l'onboarding

### Vue d'ensemble

```
User remplit formulaire (3 étapes)
    ↓
Clic sur "Complete Setup"
    ↓
POST /api/update-profile
    ↓
Vérification session
    ↓
Validation Zod
    ↓
UPDATE users SET ... WHERE id = user_id
    ↓
Redirection vers /dashboard
```

### Étape par étape

#### 1. Page d'onboarding (Client Component)

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/(dashboard)/onboarding/page.tsx`

**State du formulaire (lignes 23-28) :**
```typescript
const [formData, setFormData] = useState({
  name: '',
  dateOfBirth: '',
  sex: '',
  phone: '',
});
```

**Chaque étape modifie le state :**
```typescript
// Étape 1 : Nom
<Input
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
/>

// Étape 2 : Date de naissance
<Input
  type="date"
  value={formData.dateOfBirth}
  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
/>

// Étape 3 : Sexe et téléphone
<Select
  value={formData.sex}
  onValueChange={(value) => setFormData({ ...formData, sex: value })}
>
  {/* Options */}
</Select>
```

#### 2. Soumission du formulaire (lignes 55-85)

**Fonction handleComplete :**
```typescript
const handleComplete = async () => {
  setIsSubmitting(true);  // ← 1. Désactive le bouton

  try {
    // 2. Envoie la requête HTTP POST
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
        hasCompletedOnboarding: true,  // ← Marque l'onboarding comme terminé
      }),
    });

    // 3. Vérifie la réponse
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    // 4. Redirection
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    alert('Failed to save your information. Please try again.');
  } finally {
    setIsSubmitting(false);  // ← Réactive le bouton
  }
};
```

#### 3. API Route (Serveur)

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/api/update-profile/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer la session (authentification)
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parser et valider les données avec Zod
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 3. Mettre à jour la BDD
    await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // 4. Répondre avec succès
    return NextResponse.json({ success: true });
  } catch (error) {
    // 5. Gestion des erreurs
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

#### 4. Validation Zod

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/lib/validations/auth.ts` (lignes 97-103)

```typescript
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  dateOfBirth: dateOfBirthSchema,
  sex: sexSchema,
  phone: phoneSchema,
  hasCompletedOnboarding: z.boolean().optional(),
});
```

**Exemple de validation :**
```typescript
// Données envoyées
{
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  sex: "male",
  phone: "+33612345678",
  hasCompletedOnboarding: true
}

// Zod vérifie :
// - name : string valide avec lettres/espaces/tirets
// - dateOfBirth : format YYYY-MM-DD, âge >= 13 ans
// - sex : valeur parmi ['male', 'female', 'non-binary', 'prefer-not-to-say']
// - phone : format international (+...)
// - hasCompletedOnboarding : boolean
```

#### 5. Requête Drizzle

```typescript
await db
  .update(users)
  .set({
    name: "Jean Dupont",
    dateOfBirth: "1990-01-01",
    sex: "male",
    phone: "+33612345678",
    hasCompletedOnboarding: true,
    updatedAt: new Date(),
  })
  .where(eq(users.id, session.user.id));
```

**SQL généré :**
```sql
UPDATE users
SET
  name = 'Jean Dupont',
  date_of_birth = '1990-01-01',
  sex = 'male',
  phone = '+33612345678',
  has_completed_onboarding = true,
  updated_at = NOW()
WHERE id = 'user-123';
```

#### 6. Redirection vers le dashboard

```typescript
window.location.href = '/dashboard';
```

**Ce qui se passe :**
1. Rechargement complet de la page
2. Nouvelle requête pour récupérer la session
3. `useEffect` vérifie `hasCompletedOnboarding`
4. Si `true`, affiche le dashboard (sinon redirection vers /onboarding)

---

## 11.3. Flow 2 : Mise à jour du profil

### Vue d'ensemble

```
User clique "Edit Profile"
    ↓
Formulaire pré-rempli avec données actuelles
    ↓
User modifie et clique "Save Changes"
    ↓
POST /api/update-profile
    ↓
UPDATE users SET ...
    ↓
Message de succès + rechargement
```

### Détails

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/(dashboard)/dashboard/page.tsx`

#### 1. Pré-remplissage du formulaire (lignes 46-52)

```typescript
useEffect(() => {
  // Initialize form with user data
  if (session?.user) {
    setName(session.user.name || '');
    setDateOfBirth((session.user as any).dateOfBirth || '');
    setSex((session.user as any).sex || '');
    setPhone((session.user as any).phone || '');
  }
}, [session]);
```

**Flow :**
1. `useSession()` récupère la session (côté client)
2. `useEffect` détecte le chargement de `session`
3. Les champs du formulaire sont remplis avec les valeurs actuelles

#### 2. Modification et sauvegarde (lignes 65-98)

```typescript
const handleSaveProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);
  setSaveMessage('');

  try {
    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        dateOfBirth,
        sex,
        phone,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    setSaveMessage('Profile updated successfully!');
    setIsEditing(false);

    // Refresh the session to get updated data
    window.location.reload();
  } catch (error: any) {
    setSaveMessage(error.message || 'Failed to update profile');
  } finally {
    setIsSaving(false);
  }
};
```

#### 3. API Route (même que l'onboarding)

**Le même endpoint `/api/update-profile` gère les deux cas :**
- Onboarding : `hasCompletedOnboarding: true`
- Modification profil : Juste les champs modifiés

---

## 11.4. Flow 3 : Authentification Magic Link

### Vue d'ensemble complète

```
1. User entre son email
    ↓
2. POST /api/auth/magic-link (Better-auth)
    ↓
3. Génération d'un token unique
    ↓
4. INSERT INTO verifications (email, token, expires_at)
    ↓
5. Envoi de l'email (console.log en dev)
    ↓
6. User clique sur le lien
    ↓
7. GET /api/auth/magic-link/verify?token=...
    ↓
8. Vérification du token
    ↓
9. Création/récupération de l'utilisateur
    ↓
10. INSERT INTO sessions (user_id, token, expires_at)
    ↓
11. Cookie httpOnly envoyé au navigateur
    ↓
12. Redirection vers /dashboard
```

### Détails

#### 1. Demande de Magic Link (Client)

**Fichier :** `app/page.tsx` (lignes 46-63)

```typescript
const handleMagicLinkSignIn = async (e: React.FormEvent) => {
  e.preventDefault();

  await authClient.signIn.magicLink(
    {
      email: magicLinkEmail,
      callbackURL: '/dashboard',
    },
    {
      onSuccess: () => {
        setMagicLinkSent(true);  // Affiche le message de succès
      },
      onError: (ctx) => {
        alert(ctx.error.message);
      },
    }
  );
};
```

#### 2. Better-auth traite la requête

**Fichier :** `lib/auth/auth.ts` (lignes 99-115)

```typescript
plugins: [
  magicLink({
    sendMagicLink: async ({ email, token, url }) => {
      // En développement : affiche dans la console
      console.log('\n🔗 Magic Link Sign-In');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 To: ${email}`);
      console.log(`🔗 URL: ${url}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // En production : envoyer un vrai email
      // await sendEmail(email, url);
    },
  }),
],
```

**Better-auth fait automatiquement :**
1. Génère un token UUID
2. Stocke dans `verifications` table
3. Appelle `sendMagicLink()` avec l'URL complète

#### 3. Vérification du Magic Link

**URL du lien :** `http://localhost:3000/api/auth/magic-link/verify?token=abc123...`

**Better-auth vérifie :**
```sql
SELECT * FROM verifications
WHERE value = 'abc123...'
  AND identifier = 'email@example.com'
  AND expires_at > NOW();
```

Si valide :
1. Trouve ou crée l'utilisateur
2. Crée une session
3. Envoie le cookie
4. Supprime le token de `verifications`

---

## 11.5. Débogage et logs

### Console.log stratégiques

**Dans le Client Component :**
```typescript
const handleSubmit = async () => {
  console.log('📤 Envoi des données :', formData);

  const response = await fetch('/api/update-profile', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  console.log('📥 Réponse serveur :', response.status);

  const data = await response.json();
  console.log('📦 Data reçue :', data);
};
```

**Dans l'API Route :**
```typescript
export async function POST(request: NextRequest) {
  console.log('🔵 API /update-profile appelée');

  const session = await auth.api.getSession({ headers: request.headers });
  console.log('👤 Session :', session?.user?.email || 'Non authentifié');

  const body = await request.json();
  console.log('📨 Body reçu :', body);

  try {
    const validatedData = updateProfileSchema.parse(body);
    console.log('✅ Validation réussie :', validatedData);

    await db.update(users).set(validatedData).where(eq(users.id, session.user.id));
    console.log('💾 BDD mise à jour');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur :', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Outils de développement

**1. Network Tab (Chrome DevTools) :**
- Onglet "Network"
- Voir toutes les requêtes HTTP
- Status codes, headers, body

**2. React DevTools :**
- Inspecter les components
- Voir les props et state
- Profiler les performances

**3. Drizzle Studio :**
```bash
npm run db:studio
```
→ Interface graphique pour voir la BDD en temps réel

---

## 11.6. Gestion d'erreurs à chaque niveau

### Niveau 1 : Client (Validation formulaire)

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
    newErrors.name = 'Le nom est requis';
  }

  if (formData.phone && !formData.phone.startsWith('+')) {
    newErrors.phone = 'Le téléphone doit être au format international';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;  // Arrête si validation échoue
  }

  // Envoyer au serveur
};
```

### Niveau 2 : API Route (Validation Zod)

```typescript
try {
  const validatedData = updateProfileSchema.parse(body);
} catch (error) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: error.issues,
      },
      { status: 400 }
    );
  }
}
```

### Niveau 3 : Base de données (Contraintes)

**Contrainte UNIQUE :**
```sql
CREATE TABLE users (
  email VARCHAR(255) UNIQUE NOT NULL
);
```

**Si tentative de créer un doublon :**
```typescript
try {
  await db.insert(users).values({ email: 'existing@example.com' });
} catch (error) {
  // PostgreSQL error code 23505 : unique violation
  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'Email already exists' },
      { status: 409 }
    );
  }
}
```

---

## 11.7. Optimisations

### 1. Éviter les rechargements inutiles

**Au lieu de :**
```typescript
window.location.reload();  // Recharge toute la page
```

**Préférer :**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.refresh();  // Rafraîchit juste les données serveur
```

### 2. Loading states

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await fetch('/api/...');
  } finally {
    setIsLoading(false);
  }
};

return (
  <Button disabled={isLoading}>
    {isLoading ? 'Chargement...' : 'Envoyer'}
  </Button>
);
```

### 3. Optimistic UI updates

```typescript
const [posts, setPosts] = useState([]);

const handleLike = async (postId) => {
  // 1. Mise à jour immédiate de l'UI (optimiste)
  setPosts(posts.map(p =>
    p.id === postId ? { ...p, likes: p.likes + 1 } : p
  ));

  // 2. Requête serveur
  try {
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  } catch (error) {
    // 3. Rollback si erreur
    setPosts(posts.map(p =>
      p.id === postId ? { ...p, likes: p.likes - 1 } : p
    ));
  }
};
```

---

## 11.8. Exercice pratique complet

### Objectif : Créer un système de "favoris"

**1. Créer la table (lib/db/schema.ts) :**
```typescript
export const favorites = pgTable('favorites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**2. Créer l'API Route (app/api/favorites/route.ts) :**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { favorites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/favorites - Liste des favoris
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userFavorites = await db.select()
    .from(favorites)
    .where(eq(favorites.userId, session.user.id));

  return NextResponse.json({ favorites: userFavorites });
}

// POST /api/favorites - Ajouter un favori
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemName } = await request.json();

  const newFavorite = await db.insert(favorites).values({
    userId: session.user.id,
    itemName,
  }).returning();

  return NextResponse.json({ favorite: newFavorite[0] }, { status: 201 });
}

// DELETE /api/favorites?id=...
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const favoriteId = searchParams.get('id');

  await db.delete(favorites).where(
    and(
      eq(favorites.id, favoriteId),
      eq(favorites.userId, session.user.id)  // Sécurité
    )
  );

  return NextResponse.json({ success: true });
}
```

**3. Composant React (components/FavoritesList.tsx) :**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FavoritesList() {
  const [favorites, setFavorites] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Charger les favoris au montage
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    const response = await fetch('/api/favorites');
    const data = await response.json();
    setFavorites(data.favorites);
    setIsLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemName: newItem }),
    });

    if (response.ok) {
      setNewItem('');
      fetchFavorites();  // Recharger la liste
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/favorites?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setFavorites(favorites.filter(f => f.id !== id));
    }
  };

  if (isLoading) return <p>Chargement...</p>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Ajouter un favori"
          required
        />
        <Button type="submit">Ajouter</Button>
      </form>

      <ul className="space-y-2">
        {favorites.map((fav) => (
          <li key={fav.id} className="flex justify-between items-center p-2 border rounded">
            <span>{fav.itemName}</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(fav.id)}
            >
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📝 Résumé du Chapitre 11

### Flow complet : De l'UI à la BDD

```
1. Client Component (UI)
   ↓ fetch()
2. API Route (Validation + Auth)
   ↓ Drizzle ORM
3. Database (PostgreSQL)
   ↓ Réponse
4. API Route (JSON)
   ↓ response.json()
5. Client Component (Mise à jour UI)
```

### Points clés

**1. Séparation des responsabilités**
- UI : Affichage et interactions
- API : Logique métier et validation
- BDD : Stockage des données

**2. Validation à deux niveaux**
- Client : UX (feedback immédiat)
- Serveur : Sécurité (source de vérité)

**3. Authentification systématique**
```typescript
const session = await auth.api.getSession({ headers: request.headers });
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

**4. Gestion d'erreurs**
- Try-catch dans les API Routes
- Codes HTTP appropriés (400, 401, 500...)
- Messages d'erreur clairs pour l'utilisateur

---

## ✅ Validation des acquis

- [ ] Je comprends le flow complet d'une requête
- [ ] Je sais tracer le parcours des données (UI → API → BDD)
- [ ] Je comprends l'importance de la validation serveur
- [ ] Je sais déboguer avec console.log aux bons endroits
- [ ] Je sais gérer les erreurs à chaque niveau
- [ ] Je comprends pourquoi séparer client et serveur

### Questions de validation

1. **Pourquoi valider côté serveur si on valide déjà côté client ?**
   → Le client peut être contourné, le serveur est la seule source de vérité

2. **Que se passe-t-il entre `fetch()` et la BDD ?**
   → API Route → Vérification session → Validation Zod → Requête Drizzle → PostgreSQL

3. **Pourquoi utiliser `setIsLoading(true)` avant un fetch ?**
   → Pour désactiver le bouton et afficher un état de chargement (UX)

4. **Où déboguer si une requête échoue ?**
   → Network tab (requête HTTP), console (logs client), terminal (logs serveur)

---

## 🎯 Prochaine étape

**[Chapitre 12 : Devenir autonome](./chapitre-12-devenir-autonome.md)**

Dans le dernier chapitre :
- Bonnes pratiques
- Ajouter de nouvelles fonctionnalités
- Où trouver de l'aide
- Ressources pour continuer à apprendre
- Projet final

---

**[← Chapitre précédent](./chapitre-10-composants-ui.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-12-devenir-autonome.md)**
