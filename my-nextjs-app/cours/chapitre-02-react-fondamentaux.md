# Chapitre 2 : React - Les fondamentaux

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Maîtriser les concepts de base de React à travers ton propre code

---

## 📑 Table des matières

1. [JSX : HTML dans JavaScript](#21-jsx--html-dans-javascript)
2. [Props : Passer des données aux composants](#22-props--passer-des-données-aux-composants)
3. [State : Gérer les données qui changent](#23-state--gérer-les-données-qui-changent)
4. [Events : Réagir aux actions utilisateur](#24-events--réagir-aux-actions-utilisateur)
5. [useEffect : Exécuter du code après le rendu](#25-useeffect--exécuter-du-code-après-le-rendu)
6. [Hooks personnalisés : useSession](#26-hooks-personnalisés--usesession)
7. [Exercices pratiques](#27-exercices-pratiques)
8. [Résumé](#résumé-du-chapitre-2)

---

## 2.1. JSX : HTML dans JavaScript

### Qu'est-ce que JSX ?

**JSX = JavaScript XML**
C'est une syntaxe qui permet d'écrire du HTML directement dans ton code JavaScript/TypeScript.

### Exemple basique

```typescript
// Sans JSX (React classique)
React.createElement('button', { className: 'btn' }, 'Cliquer')

// Avec JSX (beaucoup plus lisible)
<button className="btn">Cliquer</button>
```

**Analogie avec le C :**
```c
// En C, tu définis des structures
struct Button {
    char* text;
    char* class;
};

// En JSX, tu "écris" directement la structure
<button className="btn">Cliquer</button>
```

### Exemple réel dans ton code : `app/page.tsx` (lignes 66-76)

```typescript
<main className="flex min-h-screen flex-col items-center justify-center p-4">
  <div className="z-10 w-full max-w-md">
    <Card className="p-6 sm:p-8">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
          Mon Super Projet
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          Sign in to enter to your account
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
</main>
```

**Points clés :**
- `className` au lieu de `class` (car `class` est un mot réservé en JavaScript)
- Les balises auto-fermantes doivent avoir `/` : `<Input />` pas `<Input>`
- Tu peux imbriquer les composants comme du HTML

### Insérer des variables dans JSX

**Utilise les accolades `{}` :**

```typescript
// Variables JavaScript
const titre = "Mon Super Projet"
const estConnecté = true

// Dans JSX
<h1>{titre}</h1>
<p>Statut : {estConnecté ? "Connecté" : "Déconnecté"}</p>
```

**Exemple dans ton code : `app/page.tsx` (ligne 91)**

```typescript
<p className="text-sm sm:text-base font-semibold text-gray-900 break-all">
  {magicLinkEmail}  {/* Variable affichée */}
</p>
```

### Expressions JavaScript dans JSX

Tu peux mettre **n'importe quelle expression JavaScript** entre `{}` :

```typescript
<div>
  {/* Calculs */}
  <p>Total : {price * quantity}</p>

  {/* Appels de fonction */}
  <p>{getName()}</p>

  {/* Conditions ternaires */}
  <p>{isLoading ? "Chargement..." : "Terminé"}</p>

  {/* Mapping de tableaux */}
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</div>
```

### Rendu conditionnel dans ton code

**Exemple : `app/page.tsx` (lignes 78-107)**

```typescript
{magicLinkSent ? (
  /* SI le lien magique a été envoyé */
  <div className="text-center space-y-3 sm:space-y-4">
    <h2>Check your email</h2>
    <p>We've sent a magic link to: {magicLinkEmail}</p>
  </div>
) : (
  /* SINON affiche le formulaire */
  <>
    <GoogleButton>Sign in with Google</GoogleButton>
    {/* ... */}
  </>
)}
```

**Comment ça marche :**
- `condition ? siVrai : siFaux` → Opérateur ternaire
- Si `magicLinkSent` est `true`, affiche le message de succès
- Sinon, affiche le formulaire de connexion

---

## 2.2. Props : Passer des données aux composants

### Qu'est-ce que les props ?

**Props = Propriétés passées à un composant (comme des paramètres de fonction)**

**Analogie avec le C :**
```c
// Fonction C avec paramètres
void afficher_bouton(char* texte, int taille) {
    printf("<button size='%d'>%s</button>", taille, texte);
}

afficher_bouton("Cliquer", 10);
```

```typescript
// Composant React avec props
function Button({ text, size }) {
    return <button className={`size-${size}`}>{text}</button>
}

<Button text="Cliquer" size={10} />
```

### Exemple dans ton code : `components/ui/button.tsx`

**Définition du composant (lignes 39-58) :**

```typescript
function Button({
  className,    // Prop : classes CSS additionnelles
  variant,      // Prop : type de bouton (default, ghost, outline...)
  size,         // Prop : taille (sm, lg, default...)
  asChild = false,  // Prop avec valeur par défaut
  ...props      // Tous les autres props (onClick, type, etc.)
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}  // Passe tous les props restants au <button>
    />
  )
}
```

**Utilisation :**

```typescript
// Dans app/page.tsx (ligne 139)
<Button type="submit" className="w-full" size="lg">
  Sign in with Magic Link
</Button>

// Ce qui est passé au composant :
// - type="submit"
// - className="w-full"
// - size="lg"
// - children="Sign in with Magic Link"
```

### Types de props

**1. Props simples (chaînes de caractères) :**
```typescript
<Button variant="ghost" />
```

**2. Props avec expressions JavaScript (entre `{}`) :**
```typescript
<Button size={tailleBouton} />
<Button onClick={() => console.log('Cliqué')} />
<Button disabled={isLoading} />
```

**3. Props booléens (raccourci) :**
```typescript
// Ces deux lignes sont identiques
<Input required={true} />
<Input required />
```

**4. Children (contenu entre les balises) :**
```typescript
<Button>
  <svg>...</svg>
  Sign in
</Button>
```

### Props dans ton code : `app/(dashboard)/onboarding/page.tsx`

**Lignes 130-137 :**
```typescript
<Input
  id="name"
  value={formData.name}           // Prop : valeur contrôlée
  onChange={(e) => setFormData({  // Prop : fonction événement
    ...formData,
    name: e.target.value
  })}
  required                        // Prop booléen
/>
```

**Explication :**
- `value` = Contenu du champ (lié au state)
- `onChange` = Fonction appelée quand l'utilisateur tape
- `required` = Champ obligatoire

---

## 2.3. State : Gérer les données qui changent

### Qu'est-ce que le state ?

**State = Mémoire du composant**

Quand le state change, React **re-rend** (ré-affiche) automatiquement le composant.

**Analogie avec le C :**
```c
// En C : variable globale ou locale
int compteur = 0;

void incrementer() {
    compteur++;
    // Il faut manuellement rafraîchir l'affichage
    afficher_ui();
}
```

```typescript
// En React : state
const [compteur, setCompteur] = useState(0);

function incrementer() {
    setCompteur(compteur + 1);
    // React rafraîchit AUTOMATIQUEMENT l'UI
}
```

### useState : Le hook de base

**Syntaxe :**
```typescript
const [variable, setVariable] = useState(valeurInitiale);
```

- `variable` = Valeur actuelle du state
- `setVariable` = Fonction pour modifier le state
- `valeurInitiale` = Valeur au premier rendu

**Exemple simple :**
```typescript
const [count, setCount] = useState(0);

// Lire la valeur
console.log(count);  // 0

// Modifier la valeur
setCount(5);         // count devient 5
setCount(count + 1); // count devient 6
```

### Exemples réels dans ton code : `app/page.tsx` (lignes 12-16)

```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [magicLinkEmail, setMagicLinkEmail] = useState('');
const [magicLinkSent, setMagicLinkSent] = useState(false);
const [showMagicLink, setShowMagicLink] = useState(false);
```

**Détail de chaque state :**

| State | Type | Usage |
|-------|------|-------|
| `email` | string | Stocke l'email de connexion |
| `password` | string | Stocke le mot de passe |
| `magicLinkEmail` | string | Email pour le lien magique |
| `magicLinkSent` | boolean | A-t-on envoyé le lien magique ? |
| `showMagicLink` | boolean | Affiche le formulaire magic link ou password ? |

### State avec objets : `app/(dashboard)/onboarding/page.tsx` (lignes 22-28)

```typescript
const [formData, setFormData] = useState({
  name: '',
  dateOfBirth: '',
  sex: '',
  phone: '',
});
```

**Modifier un objet dans le state :**

```typescript
// ❌ MAUVAIS : Mutation directe
formData.name = "Jean";
setFormData(formData);  // Ne fonctionne pas !

// ✅ BON : Créer un nouvel objet
setFormData({
  ...formData,        // Copie toutes les propriétés existantes
  name: "Jean"        // Écrase juste 'name'
});
```

**Exemple concret dans ton code (ligne 132-136) :**

```typescript
onChange={(e) => setFormData({
  ...formData,              // Garde dateOfBirth, sex, phone
  name: e.target.value      // Change juste name
})}
```

### Pourquoi ne pas modifier directement ?

**En React, le state est IMMUTABLE (immuable) :**

```typescript
// ❌ Ne fonctionne pas
const [user, setUser] = useState({ name: "Paul" });
user.name = "Jean";  // React ne détecte PAS ce changement

// ✅ Fonctionne
setUser({ ...user, name: "Jean" });  // Nouveau objet créé
```

**Raison technique :** React compare les références. Si tu modifies directement, c'est le même objet en mémoire, donc React ne re-rend pas.

---

## 2.4. Events : Réagir aux actions utilisateur

### Événements courants

| Événement | Quand ? | Exemple |
|-----------|---------|---------|
| `onClick` | Clic sur un élément | Bouton, lien |
| `onChange` | Modification d'input | Champ texte, select |
| `onSubmit` | Soumission de formulaire | Form |
| `onKeyDown` | Appui sur une touche | Raccourcis clavier |
| `onFocus` | Focus sur un élément | Input |
| `onBlur` | Perte de focus | Validation |

### onClick : Exemple dans ton code

**`app/page.tsx` (lignes 96-105) :**

```typescript
<Button
  variant="link"
  onClick={() => {
    setMagicLinkSent(false);
    setMagicLinkEmail('');
  }}
>
  ← Back
</Button>
```

**Ce qui se passe :**
1. Utilisateur clique sur le bouton
2. La fonction fléchée `() => { ... }` s'exécute
3. `setMagicLinkSent(false)` change le state
4. React re-rend le composant
5. L'interface se met à jour

### onChange : Liaison bidirectionnelle (two-way binding)

**`app/page.tsx` (lignes 130-137) :**

```typescript
<Input
  id="magic-link-email"
  type="email"
  value={magicLinkEmail}                          // ← Valeur liée au state
  onChange={(e) => setMagicLinkEmail(e.target.value)}  // ← Met à jour le state
  required
/>
```

**Flow :**
1. Utilisateur tape "t"
2. `onChange` se déclenche avec `e` (event)
3. `e.target.value` contient "t"
4. `setMagicLinkEmail("t")` met à jour le state
5. React re-rend avec `value={magicLinkEmail}` qui vaut maintenant "t"
6. L'input affiche "t"

**Schéma :**
```
User tape → onChange → setMagicLinkEmail() → state update → re-render → value affichée
```

### onSubmit : Soumettre un formulaire

**`app/page.tsx` (lignes 127-145) :**

```typescript
<form onSubmit={handleMagicLinkSignIn} className="space-y-3">
  <Input
    type="email"
    value={magicLinkEmail}
    onChange={(e) => setMagicLinkEmail(e.target.value)}
    required
  />
  <Button type="submit">
    Sign in with Magic Link
  </Button>
</form>
```

**Fonction handleMagicLinkSignIn (lignes 46-63) :**

```typescript
const handleMagicLinkSignIn = async (e: React.FormEvent) => {
  e.preventDefault();  // ← Empêche le rechargement de la page

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
        alert(ctx.error.message);  // Affiche l'erreur
      },
    }
  );
};
```

**Points importants :**
- `e.preventDefault()` : **CRUCIAL** pour empêcher le comportement par défaut (rechargement de page)
- `async/await` : Attendre la réponse de l'API
- `onSuccess/onError` : Callbacks pour gérer le résultat

---

## 2.5. useEffect : Exécuter du code après le rendu

### Qu'est-ce que useEffect ?

**useEffect** permet d'exécuter du code **après** que le composant ait été affiché (rendu).

**Analogie avec le C :**
```c
// En C : tu appelles manuellement des fonctions dans l'ordre
void main() {
    initialiser_ui();
    charger_donnees();  // ← Après initialisation
}
```

```typescript
// En React : useEffect s'exécute APRÈS le premier affichage
useEffect(() => {
    charger_donnees();  // ← Après que le composant soit affiché
}, []);
```

### Syntaxe de useEffect

```typescript
useEffect(() => {
  // Code à exécuter après le rendu

  return () => {
    // Cleanup (nettoyage) - optionnel
  }
}, [dependencies]);  // Tableau de dépendances
```

### Les 3 cas d'usage principaux

**1. Exécuter une seule fois au montage (dependencies = `[]`) :**

```typescript
useEffect(() => {
  console.log("Composant monté !");
  // Charger des données, s'abonner à un événement...
}, []);  // ← Tableau vide = exécute UNE SEULE FOIS
```

**2. Exécuter à chaque changement d'une variable :**

```typescript
useEffect(() => {
  console.log("Email a changé :", email);
}, [email]);  // ← S'exécute quand 'email' change
```

**3. Exécuter à chaque rendu (éviter !) :**

```typescript
useEffect(() => {
  console.log("Composant re-rendu");
});  // ← Pas de tableau = à chaque rendu (déconseillé)
```

### Exemple réel dans ton code : `app/(dashboard)/onboarding/page.tsx` (lignes 31-41)

```typescript
// Prefill form with existing user data
useEffect(() => {
  if (session?.user) {
    setFormData({
      name: session.user.name || '',
      dateOfBirth: (session.user as any).dateOfBirth || '',
      sex: (session.user as any).sex || '',
      phone: (session.user as any).phone || '',
    });
  }
}, [session]);  // ← S'exécute quand 'session' change
```

**Ce qui se passe :**
1. Le composant s'affiche la première fois
2. `session` est `undefined` (pas encore chargée)
3. Quand la session arrive du serveur, `session` change
4. `useEffect` se déclenche
5. Le formulaire est pré-rempli avec les données utilisateur

### Cleanup : Nettoyer les effets

**Exemple avec un timer :**

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    console.log("Tick");
  }, 1000);

  // ← Cleanup : exécuté quand le composant est démonté
  return () => {
    clearInterval(timer);  // Arrête le timer
  };
}, []);
```

**Pourquoi c'est important ?**
Sans cleanup, le timer continuerait même si le composant n'existe plus → **fuite mémoire**.

---

## 2.6. Hooks personnalisés : useSession

### Qu'est-ce qu'un hook personnalisé ?

**Hook personnalisé = Fonction qui utilise d'autres hooks**

Dans ton code : `useSession` (vient de `@/lib/auth/client`)

### Utilisation dans ton code : `app/(dashboard)/onboarding/page.tsx` (ligne 21)

```typescript
const { data: session, isPending } = useSession();
```

**Ce que ça retourne :**
- `session` : Objet avec les infos utilisateur (ou `null` si non connecté)
- `isPending` : `true` si la session est en cours de chargement

**Structure de `session` :**
```typescript
{
  user: {
    id: "123",
    email: "user@example.com",
    name: "Jean Dupont",
    dateOfBirth: "1990-01-01",
    // ...
  },
  session: {
    token: "...",
    expiresAt: "2025-01-20T...",
  }
}
```

### Utiliser les données de session

**Vérifier si l'utilisateur est connecté :**

```typescript
const { data: session, isPending } = useSession();

if (isPending) {
  return <p>Chargement...</p>
}

if (!session) {
  return <p>Vous devez être connecté</p>
}

return <p>Bonjour {session.user.name} !</p>
```

**Exemple dans `app/(dashboard)/dashboard/page.tsx` :**

```typescript
const { data: session } = useSession();

// Affiche les infos utilisateur
<h1>Welcome, {session?.user?.name || 'User'}!</h1>
<p>Email: {session?.user?.email}</p>
```

---

## 2.7. Exercices pratiques

### Exercice 1 : Compteur simple

**Objectif :** Créer un compteur avec boutons +/-.

**Fichier :** Crée `app/test-compteur/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CompteurPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Compteur : {count}</h1>
      <div className="space-x-2">
        <Button onClick={() => setCount(count - 1)}>-</Button>
        <Button onClick={() => setCount(count + 1)}>+</Button>
        <Button variant="outline" onClick={() => setCount(0)}>Reset</Button>
      </div>
    </div>
  );
}
```

**Teste :**
1. Lance `npm run dev`
2. Va sur `http://localhost:3000/test-compteur`
3. Clique sur les boutons

### Exercice 2 : Formulaire simple

**Objectif :** Créer un formulaire qui affiche ce que tu tapes.

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FormulaireTest() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');

  return (
    <div className="p-8 max-w-md">
      <div className="space-y-4">
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>
        <p className="text-lg">
          Bonjour {prenom} {nom} !
        </p>
      </div>
    </div>
  );
}
```

### Exercice 3 : Toggle (afficher/masquer)

**Objectif :** Bouton qui affiche/masque un texte.

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TogglePage() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Masquer' : 'Afficher'}
      </Button>

      {isVisible && (
        <p className="mt-4 p-4 bg-blue-100 rounded">
          Ce texte peut être masqué !
        </p>
      )}
    </div>
  );
}
```

**Astuce :** `{isVisible && <Component />}` affiche le composant uniquement si `isVisible` est `true`.

---

## 📝 Résumé du Chapitre 2

### Concepts clés :

1. **JSX** : HTML dans JavaScript
   ```typescript
   <div className="container">{variable}</div>
   ```

2. **Props** : Paramètres de composants
   ```typescript
   <Button variant="ghost" size="lg" onClick={handleClick}>
     Cliquer
   </Button>
   ```

3. **State (useState)** : Mémoire du composant
   ```typescript
   const [email, setEmail] = useState('');
   setEmail('new@email.com');
   ```

4. **Events** : Réagir aux actions
   ```typescript
   onClick={() => console.log('Cliqué')}
   onChange={(e) => setValue(e.target.value)}
   onSubmit={handleSubmit}
   ```

5. **useEffect** : Code après le rendu
   ```typescript
   useEffect(() => {
     // Code à exécuter
   }, [dependencies]);
   ```

6. **Hooks personnalisés** : Réutiliser de la logique
   ```typescript
   const { data: session, isPending } = useSession();
   ```

### Schéma mental : Flow React

```
1. Rendu initial
   ↓
2. useEffect s'exécute
   ↓
3. Utilisateur interagit (click, input...)
   ↓
4. Event handler appelé
   ↓
5. setState() modifie le state
   ↓
6. React re-rend le composant
   ↓
7. useEffect se ré-exécute (si dependencies ont changé)
   ↓
Retour à l'étape 3
```

---

## ✅ Validation des acquis

- [ ] Je comprends ce qu'est le JSX
- [ ] Je sais passer des props à un composant
- [ ] Je sais utiliser `useState` pour gérer le state
- [ ] Je sais lier un input au state avec `value` et `onChange`
- [ ] Je sais utiliser `onClick`, `onSubmit`
- [ ] Je comprends quand utiliser `useEffect`
- [ ] Je sais lire les données de `useSession`

### Questions de validation :

1. **Quelle est la différence entre `class` et `className` ?**
   → `className` car `class` est un mot réservé en JavaScript

2. **Comment modifier un state objet sans mutation ?**
   → Avec le spread operator : `setObj({ ...obj, key: newValue })`

3. **Pourquoi `e.preventDefault()` dans un `onSubmit` ?**
   → Pour empêcher le rechargement de la page

4. **Que fait `useEffect(() => { ... }, [])` ?**
   → Exécute le code une seule fois au montage

---

## 🎯 Prochaine étape

**[Chapitre 3 : Next.js App Router](./chapitre-03-nextjs-app-router.md)**

Dans le prochain chapitre :
- Layouts et structure de pages
- Navigation avec Link
- Route groups en détail
- Server vs Client Components
- Dynamic routes
- Middleware et protection de routes

---

**[← Chapitre précédent](./chapitre-01-vue-ensemble.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-03-nextjs-app-router.md)**
