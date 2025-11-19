# Chapitre 6 : Authentification avec Better-auth

> ⏱️ **Durée estimée :** 3-4 heures
> 🎯 **Objectif :** Comprendre l'authentification et les 3 méthodes utilisées dans ton application

---

## 📑 Table des matières

1. [Qu'est-ce que l'authentification ?](#61-quest-ce-que-lauthentification-)
2. [Better-auth : Vue d'ensemble](#62-better-auth--vue-densemble)
3. [Méthode 1 : Email + Mot de passe](#63-méthode-1--email--mot-de-passe)
4. [Méthode 2 : Magic Link](#64-méthode-2--magic-link)
5. [Méthode 3 : Google OAuth](#65-méthode-3--google-oauth)
6. [Sessions et cookies](#66-sessions-et-cookies)
7. [Protection de routes](#67-protection-de-routes)
8. [Déconnexion](#68-déconnexion)
9. [Exercices pratiques](#69-exercices-pratiques)
10. [Résumé](#résumé-du-chapitre-6)

---

## 6.1. Qu'est-ce que l'authentification ?

### Définition

**Authentification = Vérifier l'identité d'un utilisateur**

**Analogie avec le C :**
```c
// En C : système de login simple
struct User {
    char email[255];
    char password_hash[64];
};

int authenticate(char* email, char* password) {
    User* user = findUserByEmail(email);
    if (!user) return 0;  // Utilisateur inexistant

    char* hash = hashPassword(password);
    if (strcmp(user->password_hash, hash) == 0) {
        return 1;  // Authentifié
    }
    return 0;  // Mot de passe incorrect
}
```

### Les 3 étapes de l'authentification

```
┌──────────────────────────────────────────────────────────┐
│  1. IDENTIFICATION                                       │
│     Qui êtes-vous ?                                      │
│     → Email, nom d'utilisateur                           │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│  2. AUTHENTIFICATION                                     │
│     Prouvez-le !                                         │
│     → Mot de passe, lien magique, OAuth                  │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│  3. AUTORISATION                                         │
│     Que pouvez-vous faire ?                              │
│     → Accès au dashboard, rôles, permissions             │
└──────────────────────────────────────────────────────────┘
```

### Pourquoi l'authentification ?

1. **Sécurité** : Protéger les données utilisateur
2. **Personnalisation** : Afficher du contenu adapté
3. **Traçabilité** : Savoir qui fait quoi
4. **Autorisation** : Limiter l'accès selon les rôles

---

## 6.2. Better-auth : Vue d'ensemble

### Qu'est-ce que Better-auth ?

**Better-auth = Bibliothèque d'authentification moderne pour Next.js**

**Avantages :**
- ✅ Supporte plusieurs méthodes d'authentification
- ✅ Gestion automatique des sessions
- ✅ Sécurité intégrée (CSRF protection, cookies httpOnly...)
- ✅ Compatible avec Drizzle ORM
- ✅ TypeScript natif

### Configuration dans ton projet

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/lib/auth/auth.ts`

**Structure globale (lignes 13-118) :**

```typescript
export const auth = betterAuth({
  // 1. Configuration de la base de données
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  // 2. Champs utilisateur additionnels
  user: {
    additionalFields: {
      dateOfBirth: { type: 'string', required: false },
      sex: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      hasCompletedOnboarding: { type: 'boolean', defaultValue: false },
    },
  },

  // 3. Email + Mot de passe
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    autoSignIn: true,
  },

  // 4. Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  // 5. Configuration de session
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 jours
    updateAge: 60 * 60 * 24,       // 1 jour
  },

  // 6. Plugins
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        console.log('Magic link:', url);
      },
    }),
    nextCookies(),
  ],
});
```

### Tables de base de données créées

**1. Table `users` (utilisateurs)**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  date_of_birth VARCHAR(10),
  sex VARCHAR(20),
  phone VARCHAR(20),
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**2. Table `sessions` (sessions actives)**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE
);
```

**3. Table `accounts` (comptes liés - pour OAuth)**
```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,  -- 'google', 'github'...
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT
);
```

**4. Table `verifications` (pour magic links)**
```sql
CREATE TABLE verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,  -- Email
  value TEXT NOT NULL,       -- Token
  expires_at TIMESTAMP NOT NULL
);
```

---

## 6.3. Méthode 1 : Email + Mot de passe

### Configuration

**Fichier :** `lib/auth/auth.ts` (lignes 48-54)

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false,  // À activer en production
  minPasswordLength: 12,
  maxPasswordLength: 128,
  autoSignIn: true,
},
```

### Inscription (Sign Up)

**Fichier :** `app/(auth)/signup/page.tsx` (lignes 22-47)

```typescript
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  // Vérifier que les mots de passe correspondent
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  await authClient.signUp.email(
    {
      name,
      email,
      password,
    },
    {
      onSuccess: () => {
        // Redirect to dashboard after successful signup
        window.location.href = '/dashboard';
      },
      onError: (ctx) => {
        // Show error message if signup fails
        alert(ctx.error.message);
      },
    }
  );
};
```

**Ce qui se passe :**

1. Utilisateur remplit le formulaire
2. `authClient.signUp.email()` envoie une requête à `/api/auth/sign-up`
3. Better-auth :
   - Hash le mot de passe avec bcrypt
   - Crée l'utilisateur dans la table `users`
   - Crée une session dans la table `sessions`
   - Renvoie un cookie sécurisé
4. Redirection vers `/dashboard`

### Connexion (Sign In)

**Fichier :** `app/page.tsx` (lignes 18-37)

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  await authClient.signIn.email(
    {
      email,
      password,
    },
    {
      onSuccess: () => {
        window.location.href = '/dashboard';
      },
      onError: (ctx) => {
        alert(ctx.error.message);
      },
    }
  );
};
```

**Flow de connexion :**

```
1. Utilisateur entre email + mot de passe
   ↓
2. authClient.signIn.email() → POST /api/auth/sign-in
   ↓
3. Better-auth vérifie dans la BDD :
   - L'email existe ?
   - Le hash du mot de passe correspond ?
   ↓
4. Si OK :
   - Crée une nouvelle session
   - Envoie un cookie httpOnly sécurisé
   ↓
5. Redirection vers /dashboard
```

### Sécurité du mot de passe

**Better-auth hash automatiquement avec bcrypt :**

```typescript
// Ce que tu envoies
password: "MonMotDePasse123"

// Ce qui est stocké en BDD
password_hash: "$2b$10$XYZ...ABC" (60 caractères)
```

**Jamais de mot de passe en clair dans la base de données !**

---

## 6.4. Méthode 2 : Magic Link

### Qu'est-ce qu'un Magic Link ?

**Magic Link = Lien de connexion envoyé par email (pas de mot de passe)**

**Avantages :**
- ✅ Plus simple pour l'utilisateur (pas de mot de passe à retenir)
- ✅ Plus sécurisé (lien à usage unique)
- ✅ Pas de risque de mot de passe faible

### Configuration

**Fichier :** `lib/auth/auth.ts` (lignes 99-115)

```typescript
plugins: [
  magicLink({
    sendMagicLink: async ({ email, token, url }) => {
      // TODO: Implement email sending service (Resend, SendGrid...)
      console.log('Magic link for', email);
      console.log('Magic link URL:', url);

      // En développement, le lien est affiché dans la console
      console.log('\n🔗 Magic Link Sign-In');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📧 To: ${email}`);
      console.log(`🔗 URL: ${url}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    },
  }),
],
```

### Demander un Magic Link

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

### Flow complet du Magic Link

```
1. Utilisateur entre son email
   ↓
2. authClient.signIn.magicLink() → POST /api/auth/magic-link
   ↓
3. Better-auth :
   - Génère un token unique (UUID)
   - Stocke token + email dans table `verifications`
   - Appelle sendMagicLink() avec l'URL
   ↓
4. sendMagicLink() envoie un email (ou affiche dans la console)
   URL : http://localhost:3000/api/auth/magic-link/verify?token=ABC123
   ↓
5. Utilisateur clique sur le lien
   ↓
6. Better-auth vérifie :
   - Le token existe ?
   - Le token n'a pas expiré ?
   - L'email correspond ?
   ↓
7. Si OK :
   - Crée ou trouve l'utilisateur
   - Crée une session
   - Redirige vers /dashboard
```

### Message de succès

**Fichier :** `app/page.tsx` (lignes 78-106)

```typescript
{magicLinkSent ? (
  <div className="text-center space-y-3 sm:space-y-4">
    <div className="rounded-full bg-green-100 w-14 h-14 flex items-center justify-center mx-auto">
      <svg className="w-7 h-7 text-green-600">
        {/* Icône check */}
      </svg>
    </div>
    <h2 className="text-xl sm:text-2xl font-bold">Check your email</h2>
    <p className="text-sm sm:text-base text-gray-600">
      We've sent a magic link to:
    </p>
    <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
      {magicLinkEmail}
    </p>
    <p className="text-xs sm:text-sm text-gray-500">
      Click the link in the email to sign in to your account.
    </p>
  </div>
) : (
  {/* Formulaire */}
)}
```

---

## 6.5. Méthode 3 : Google OAuth

### Qu'est-ce qu'OAuth ?

**OAuth = Déléguer l'authentification à un service tiers (Google, GitHub...)**

**Avantages :**
- ✅ Pas besoin de gérer les mots de passe
- ✅ Connexion rapide (1 clic)
- ✅ Email vérifié automatiquement
- ✅ Récupération de l'avatar

### Configuration

**Fichier :** `lib/auth/auth.ts` (lignes 55-65)

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  },
},
```

**Variables d'environnement (`.env.local`) :**
```env
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xyz123..."
```

### Bouton de connexion Google

**Fichier :** `app/page.tsx` (lignes 39-44)

```typescript
const handleGoogleSignIn = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/dashboard',
  });
};
```

**Utilisation du bouton :**
```typescript
<GoogleButton onClick={handleGoogleSignIn}>
  Sign in with Google
</GoogleButton>
```

### Flow OAuth complet

```
1. Utilisateur clique sur "Sign in with Google"
   ↓
2. authClient.signIn.social({ provider: 'google' })
   ↓
3. Redirection vers Google :
   https://accounts.google.com/o/oauth2/auth?
     client_id=...&
     redirect_uri=http://localhost:3000/api/auth/callback/google&
     scope=email profile
   ↓
4. Utilisateur se connecte sur Google et autorise l'application
   ↓
5. Google redirige vers :
   http://localhost:3000/api/auth/callback/google?code=ABC123
   ↓
6. Better-auth :
   - Échange le code contre un access_token
   - Récupère les infos utilisateur (email, nom, photo)
   - Crée ou trouve l'utilisateur dans la BDD
   - Crée un compte lié dans table `accounts`
   - Crée une session
   ↓
7. Redirection vers /dashboard
```

### Table `accounts` pour OAuth

**Quand un utilisateur se connecte avec Google, Better-auth crée :**

```sql
INSERT INTO users (id, email, name, image)
VALUES ('user-123', 'jean@gmail.com', 'Jean Dupont', 'https://...');

INSERT INTO accounts (id, user_id, provider_id, account_id, access_token)
VALUES (
  'account-123',
  'user-123',
  'google',
  '1234567890',  -- ID Google de l'utilisateur
  'ya29.a0...'   -- Access token Google
);

INSERT INTO sessions (id, user_id, token, expires_at)
VALUES ('session-123', 'user-123', 'token-abc', '2025-01-26');
```

---

## 6.6. Sessions et cookies

### Qu'est-ce qu'une session ?

**Session = Preuve que tu es authentifié**

**Analogie :**
```
Session = Badge d'accès à un bâtiment
- Tu le reçois après t'être identifié à l'entrée
- Tu le gardes tant que tu es dans le bâtiment
- Il expire après X heures
- Tu le rends en sortant (logout)
```

### Configuration de session

**Fichier :** `lib/auth/auth.ts` (lignes 77-80)

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,  // 7 jours (en secondes)
  updateAge: 60 * 60 * 24,       // 1 jour
},
```

**Signification :**
- `expiresIn: 7 jours` → La session expire après 7 jours d'inactivité
- `updateAge: 1 jour` → Si l'utilisateur revient après 1 jour, la session est prolongée

### Cookies sécurisés

**Better-auth stocke la session dans un cookie httpOnly :**

```typescript
// lib/auth/auth.ts (lignes 88-96)
advanced: {
  useSecureCookies: process.env.NODE_ENV === 'production',
  defaultCookieAttributes: {
    httpOnly: true,      // ← Inaccessible en JavaScript (sécurité XSS)
    secure: true,        // ← Uniquement en HTTPS (production)
    sameSite: 'lax',     // ← Protection CSRF
    path: '/',
  },
},
```

**Pourquoi httpOnly ?**
→ Empêche les attaques XSS (scripts malveillants ne peuvent pas lire le cookie)

### Récupérer la session côté client

**Hook `useSession()` :**

**Fichier :** `app/(dashboard)/dashboard/page.tsx` (ligne 22)

```typescript
const { data: session, isPending } = useSession();
```

**Retourne :**
```typescript
{
  data: {
    user: {
      id: "user-123",
      email: "jean@example.com",
      name: "Jean Dupont",
      dateOfBirth: "1990-01-01",
      // ...
    },
    session: {
      token: "session-token-abc",
      expiresAt: "2025-01-26T12:00:00Z",
    }
  },
  isPending: false  // true pendant le chargement
}
```

### Récupérer la session côté serveur

**API Route :**

```typescript
// app/api/update-profile/route.ts (ligne 12)
const session = await auth.api.getSession({ headers: request.headers });

if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Utiliser session.user.id pour les requêtes BDD
await db.update(users)
  .set({ name: 'Nouveau nom' })
  .where(eq(users.id, session.user.id));
```

---

## 6.7. Protection de routes

### Redirection si non authentifié

**Fichier :** `app/(dashboard)/dashboard/page.tsx` (lignes 33-38)

```typescript
useEffect(() => {
  // Redirect to home if not authenticated
  if (!isPending && !session) {
    router.push('/');
    return;
  }
}, [session, isPending, router]);
```

### Vérifier l'onboarding

**Lignes 40-44 :**
```typescript
useEffect(() => {
  // Check if user needs to complete onboarding
  if (session?.user && !(session.user as any).hasCompletedOnboarding) {
    router.push('/onboarding');
    return;
  }
}, [session, router]);
```

### UI de chargement

**Lignes 113-121 :**
```typescript
if (isPending) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-lg">Loading...</p>
    </main>
  );
}

if (!session) {
  return null;  // Ne rien afficher si pas de session
}
```

### Protection côté serveur (recommandé)

**Créer un middleware (futur chapitre) :**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('better-auth.session');

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
```

---

## 6.8. Déconnexion

### Fonction de déconnexion

**Fichier :** `app/(dashboard)/dashboard/page.tsx` (lignes 55-63)

```typescript
const handleSignOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        router.push('/');
      },
    },
  });
};
```

### Bouton de déconnexion

**Lignes 137-142 :**
```typescript
<Button
  onClick={handleSignOut}
  className="w-full sm:w-auto"
>
  Sign Out
</Button>
```

### Ce qui se passe lors de la déconnexion

```
1. Utilisateur clique sur "Sign Out"
   ↓
2. authClient.signOut() → POST /api/auth/sign-out
   ↓
3. Better-auth :
   - Supprime la session de la table `sessions`
   - Supprime le cookie dans le navigateur
   ↓
4. Redirection vers /
```

---

## 6.9. Exercices pratiques

### Exercice 1 : Ajouter un indicateur de session

**Objectif :** Afficher l'email de l'utilisateur connecté dans le header

```typescript
'use client';

import { useSession } from '@/lib/auth/client';

export default function Header() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <p>Chargement...</p>;
  }

  return (
    <header className="border-b p-4">
      {session ? (
        <div className="flex items-center justify-between">
          <p>Connecté en tant que : {session.user.email}</p>
          <button onClick={() => {/* handleSignOut */}}>
            Déconnexion
          </button>
        </div>
      ) : (
        <a href="/">Se connecter</a>
      )}
    </header>
  );
}
```

### Exercice 2 : Page protégée simple

**Objectif :** Créer une page accessible uniquement si connecté

```typescript
'use client';

import { useSession } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <p>Vérification de la session...</p>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Page protégée</h1>
      <p>Seuls les utilisateurs connectés peuvent voir cette page.</p>
      <p>Bonjour {session.user.name || session.user.email} !</p>
    </div>
  );
}
```

### Exercice 3 : Formulaire de changement de nom

**Objectif :** Permettre à l'utilisateur de changer son nom

```typescript
'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function UpdateName() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || '');

  const handleUpdate = async () => {
    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      alert('Nom mis à jour !');
      window.location.reload();  // Recharge pour récupérer la session
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Votre nom"
      />
      <Button onClick={handleUpdate}>Mettre à jour</Button>
    </div>
  );
}
```

---

## 📝 Résumé du Chapitre 6

### Les 3 méthodes d'authentification

**1. Email + Mot de passe**
```typescript
authClient.signIn.email({ email, password })
```
- ✅ Classique et familier
- ❌ Gestion de mots de passe oubliés

**2. Magic Link**
```typescript
authClient.signIn.magicLink({ email })
```
- ✅ Pas de mot de passe à retenir
- ✅ Plus sécurisé
- ❌ Nécessite un service d'email

**3. Google OAuth**
```typescript
authClient.signIn.social({ provider: 'google' })
```
- ✅ Connexion ultra-rapide
- ✅ Email vérifié automatiquement
- ❌ Dépendance à Google

### Flow d'authentification

```
1. Utilisateur entre ses identifiants
   ↓
2. authClient.signIn.*() → POST /api/auth/...
   ↓
3. Better-auth vérifie les identifiants
   ↓
4. Création de session + cookie httpOnly
   ↓
5. Redirection vers page protégée
```

### Session

- **Stockée dans :** Cookie httpOnly sécurisé
- **Durée :** 7 jours (configurable)
- **Récupération :** `useSession()` (client) ou `auth.api.getSession()` (serveur)

### Sécurité

- ✅ Mots de passe hashés (bcrypt)
- ✅ Cookies httpOnly (protection XSS)
- ✅ CSRF protection
- ✅ Secure cookies en production (HTTPS)

---

## ✅ Validation des acquis

- [ ] Je comprends les 3 méthodes d'authentification
- [ ] Je sais utiliser `authClient.signIn.*()` et `authClient.signUp.*()
- [ ] Je comprends le concept de session
- [ ] Je sais récupérer la session avec `useSession()`
- [ ] Je sais protéger une route côté client
- [ ] Je sais déconnecter un utilisateur

### Questions de validation

1. **Quelle est la différence entre authentification et autorisation ?**
   → Authentification = vérifier l'identité, Autorisation = vérifier les permissions

2. **Pourquoi les cookies sont-ils httpOnly ?**
   → Pour empêcher JavaScript d'y accéder (protection XSS)

3. **Que se passe-t-il lors d'un sign-in avec Google ?**
   → Redirection vers Google → Autorisation → Callback → Création de session

4. **Comment protéger une page côté client ?**
   → `useEffect` avec vérification de `session` et redirection si `null`

---

## 🎯 Prochaine étape

**[Chapitre 7 : Base de données avec Drizzle ORM](./chapitre-07-base-donnees-drizzle.md)**

Dans le prochain chapitre :
- Introduction à Drizzle ORM
- Définir des schémas de tables
- Requêtes de base (SELECT, INSERT, UPDATE, DELETE)
- Relations entre tables
- Migrations

---

**[← Chapitre précédent](./chapitre-05-formulaires-validation.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-07-base-donnees-drizzle.md)**
