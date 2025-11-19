# Chapitre 9 : TypeScript - Les bases

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Maîtriser les fondamentaux de TypeScript utilisés dans ton projet

---

## 📑 Table des matières

1. [Qu'est-ce que TypeScript ?](#91-quest-ce-que-typescript-)
2. [Types de base](#92-types-de-base)
3. [Interfaces et Types personnalisés](#93-interfaces-et-types-personnalisés)
4. [Inférence de types](#94-inférence-de-types)
5. [Types depuis Drizzle et Zod](#95-types-depuis-drizzle-et-zod)
6. [Typage des composants React](#96-typage-des-composants-react)
7. [Generics (génériques)](#97-generics-génériques)
8. [Exercices pratiques](#98-exercices-pratiques)
9. [Résumé](#résumé-du-chapitre-9)

---

## 9.1. Qu'est-ce que TypeScript ?

### Définition

**TypeScript = JavaScript + Types**

**Analogie avec le C :**
```c
// En C : typage obligatoire
int age = 25;
char* name = "Jean";

// En JavaScript : pas de types
var age = 25;
var name = "Jean";

// En TypeScript : types optionnels mais recommandés
let age: number = 25;
let name: string = "Jean";
```

### Pourquoi TypeScript ?

**JavaScript classique :**
```javascript
function add(a, b) {
  return a + b;
}

add(5, 10);     // 15 ✅
add("5", "10"); // "510" ❌ (concaténation au lieu d'addition)
```

**Avec TypeScript :**
```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(5, 10);     // 15 ✅
add("5", "10"); // ❌ Erreur de compilation !
```

**Avantages :**
- ✅ Détecte les erreurs AVANT l'exécution
- ✅ Autocomplétion intelligente
- ✅ Refactoring sécurisé
- ✅ Documentation intégrée

---

## 9.2. Types de base

### Types primitifs

```typescript
// Chaînes de caractères
let name: string = "Jean";
let email: string = 'jean@example.com';

// Nombres (entiers et décimaux)
let age: number = 25;
let price: number = 19.99;

// Booléens
let isActive: boolean = true;
let hasCompleted: boolean = false;

// Null et undefined
let data: null = null;
let value: undefined = undefined;
```

### Arrays (tableaux)

```typescript
// Tableau de chaînes
let fruits: string[] = ["pomme", "banane", "orange"];

// Tableau de nombres
let numbers: number[] = [1, 2, 3, 4, 5];

// Syntaxe alternative (générique)
let users: Array<string> = ["Jean", "Marie", "Paul"];
```

### Objects (objets)

```typescript
// Objet simple
let user: {
  id: string;
  email: string;
  name: string;
} = {
  id: "123",
  email: "jean@example.com",
  name: "Jean Dupont",
};

// Propriété optionnelle avec ?
let profile: {
  name: string;
  bio?: string;  // ← Optionnel
} = {
  name: "Jean",
  // bio peut être omis
};
```

### Union types (|)

**Plusieurs types possibles :**

```typescript
// Peut être string OU number
let id: string | number;

id = "abc123";  // ✅
id = 12345;     // ✅
id = true;      // ❌ Erreur

// Exemple réel dans ton code
type Sex = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

let userSex: Sex = 'male';  // ✅
userSex = 'alien';          // ❌ Erreur
```

### Literal types

```typescript
// Valeur exacte
let status: 'pending' | 'active' | 'inactive';

status = 'active';   // ✅
status = 'deleted';  // ❌ Erreur
```

### Any (à éviter)

```typescript
let data: any;  // Accepte n'importe quoi (désactive le typage)

data = "texte";
data = 123;
data = { foo: "bar" };
// Aucune erreur, mais perd l'intérêt de TypeScript
```

---

## 9.3. Interfaces et Types personnalisés

### Interface

**Définir la structure d'un objet :**

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: string;  // Optionnel
  hasCompletedOnboarding: boolean;
}

const user: User = {
  id: "123",
  email: "jean@example.com",
  name: "Jean Dupont",
  hasCompletedOnboarding: false,
};
```

### Type alias

**Similaire à interface, mais plus flexible :**

```typescript
type User = {
  id: string;
  email: string;
  name: string;
};

// Peut aussi typer des primitifs, unions...
type ID = string | number;
type Status = 'active' | 'inactive';
```

### Interface vs Type

**Différences principales :**

| Interface | Type |
|-----------|------|
| Peut être étendue | Peut utiliser unions, intersections |
| Bonne pour les objets | Bonne pour tout |

```typescript
// Interface : extension
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

// Type : intersection
type Animal = {
  name: string;
};

type Dog = Animal & {
  breed: string;
};
```

### Exemple dans ton code : lib/validations/auth.ts

**Lignes 135-140 :**

```typescript
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
```

---

## 9.4. Inférence de types

### TypeScript devine le type

```typescript
// TypeScript infère automatiquement le type
let name = "Jean";  // Type inféré : string
let age = 25;       // Type inféré : number

// Équivalent à :
let name: string = "Jean";
let age: number = 25;
```

### Inférence avec const

```typescript
// let : type général
let status = "active";  // Type : string

// const : type littéral
const status = "active";  // Type : "active" (valeur exacte)
```

### Inférence dans les fonctions

```typescript
function add(a: number, b: number) {
  return a + b;  // Type de retour inféré : number
}

// Équivalent explicite :
function add(a: number, b: number): number {
  return a + b;
}
```

---

## 9.5. Types depuis Drizzle et Zod

### Types depuis Drizzle (BDD)

**Fichier :** `lib/db/schema.ts` (lignes 99-106)

```typescript
import { createSelectSchema } from 'drizzle-zod';

export const selectUserSchema = createSelectSchema(users);
export const selectSessionSchema = createSelectSchema(sessions);

// Générer les types TypeScript depuis les schémas
export type User = z.infer<typeof selectUserSchema>;
export type Session = z.infer<typeof selectSessionSchema>;
```

**Utilisation :**
```typescript
import { User } from '@/lib/db/schema';

const user: User = {
  id: "123",
  email: "jean@example.com",
  name: "Jean Dupont",
  emailVerified: false,
  image: null,
  dateOfBirth: "1990-01-01",
  sex: "male",
  phone: "+33612345678",
  hasCompletedOnboarding: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

**Avantage :**
→ Un seul endroit (le schéma Drizzle) définit la structure
→ Les types TypeScript sont générés automatiquement

### Types depuis Zod (validation)

**Fichier :** `lib/validations/auth.ts`

```typescript
import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(12),
  confirmPassword: z.string(),
});

// Générer le type TypeScript depuis le schéma Zod
export type SignUpInput = z.infer<typeof signUpSchema>;

// Équivalent manuel :
type SignUpInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
```

---

## 9.6. Typage des composants React

### Props de composant

**Fichier :** `components/ui/button.tsx` (lignes 39-58)

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(/* ... */);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  return <button {...props} />
}
```

**Décortication :**

1. **`React.ComponentProps<"button">`**
   → Tous les props HTML natifs d'un `<button>` (onClick, type, disabled...)

2. **`VariantProps<typeof buttonVariants>`**
   → Props générés par CVA (variant, size)

3. **`{ asChild?: boolean }`**
   → Prop personnalisé optionnel

### Typage des props personnalisés

```typescript
interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Card({ title, description, children, onClose }: CardProps) {
  return (
    <div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
      {onClose && <button onClick={onClose}>Fermer</button>}
    </div>
  );
}

// Utilisation
<Card title="Mon titre" onClose={() => console.log('Fermé')}>
  Contenu
</Card>
```

### React.FC (Function Component)

**Méthode alternative :**

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', onClick, children }) => {
  return (
    <button className={variant} onClick={onClick}>
      {children}
    </button>
  );
};
```

### Event handlers

```typescript
interface FormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

export function LoginForm({ onSubmit }: FormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email: "...", password: "..." });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Types d'événements courants :**

| Événement | Type TypeScript |
|-----------|-----------------|
| `onClick` | `React.MouseEvent` |
| `onChange` (input) | `React.ChangeEvent<HTMLInputElement>` |
| `onSubmit` | `React.FormEvent` |
| `onKeyDown` | `React.KeyboardEvent` |

---

## 9.7. Generics (génériques)

### Concept

**Générique = Type paramétrable (comme une fonction, mais pour les types)**

**Analogie avec le C :**
```c
// En C : fonction générique avec void*
void* getFirst(void* array[], int size) {
    return array[0];
}

// En TypeScript : générique avec <T>
function getFirst<T>(array: T[]): T {
    return array[0];
}
```

### Exemple basique

```typescript
function identity<T>(value: T): T {
  return value;
}

const num = identity<number>(42);      // Type : number
const str = identity<string>("hello"); // Type : string

// TypeScript infère souvent le type
const num2 = identity(42);      // Type inféré : number
const str2 = identity("hello"); // Type inféré : string
```

### Générique avec arrays

```typescript
function getFirst<T>(array: T[]): T | undefined {
  return array[0];
}

const firstNumber = getFirst([1, 2, 3]);     // Type : number | undefined
const firstName = getFirst(["a", "b", "c"]); // Type : string | undefined
```

### Générique dans les interfaces

```typescript
interface Response<T> {
  data: T;
  status: number;
  message: string;
}

const userResponse: Response<User> = {
  data: { id: "123", email: "..." },
  status: 200,
  message: "Success",
};

const usersResponse: Response<User[]> = {
  data: [{ id: "1", email: "..." }, { id: "2", email: "..." }],
  status: 200,
  message: "Success",
};
```

### Exemple réel : useState avec générique

```typescript
// TypeScript infère le type
const [count, setCount] = useState(0);  // Type inféré : number

// Ou explicite
const [count, setCount] = useState<number>(0);

// Avec type personnalisé
interface User {
  id: string;
  name: string;
}

const [user, setUser] = useState<User | null>(null);
```

---

## 9.8. Exercices pratiques

### Exercice 1 : Typer une fonction

**Objectif :** Ajouter les types à cette fonction

```typescript
// Avant (JavaScript)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Après (TypeScript)
interface Item {
  price: number;
  quantity: number;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

### Exercice 2 : Interface pour un composant

```typescript
interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  onAddToCart: (productId: string) => void;
  inStock?: boolean;
}

export function ProductCard({
  name,
  price,
  image,
  onAddToCart,
  inStock = true,
}: ProductCardProps) {
  return (
    <div>
      <img src={image} alt={name} />
      <h3>{name}</h3>
      <p>${price}</p>
      <button
        onClick={() => onAddToCart("product-id")}
        disabled={!inStock}
      >
        {inStock ? 'Ajouter au panier' : 'Rupture de stock'}
      </button>
    </div>
  );
}
```

### Exercice 3 : Type union et guards

```typescript
type PaymentMethod = 'card' | 'paypal' | 'crypto';

interface Payment {
  amount: number;
  method: PaymentMethod;
}

function processPayment(payment: Payment): string {
  switch (payment.method) {
    case 'card':
      return `Processing card payment of $${payment.amount}`;
    case 'paypal':
      return `Processing PayPal payment of $${payment.amount}`;
    case 'crypto':
      return `Processing crypto payment of $${payment.amount}`;
    default:
      // TypeScript s'assure qu'on a géré tous les cas
      const _exhaustive: never = payment.method;
      return _exhaustive;
  }
}
```

### Exercice 4 : Générique pour une API Response

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  return {
    data,
    status: response.status,
  };
}

async function fetchUsers(): Promise<ApiResponse<User[]>> {
  const response = await fetch('/api/users');
  const data = await response.json();

  return {
    data,
    status: response.status,
  };
}
```

---

## 📝 Résumé du Chapitre 9

### Types de base

```typescript
let name: string = "Jean";
let age: number = 25;
let isActive: boolean = true;
let data: null = null;
```

### Arrays et Objects

```typescript
let fruits: string[] = ["pomme", "banane"];
let user: { id: string; name: string } = { id: "123", name: "Jean" };
```

### Interface et Type

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
}

type Status = 'active' | 'inactive';
```

### Inférence depuis Zod et Drizzle

```typescript
const schema = z.object({ email: z.string().email() });
type Input = z.infer<typeof schema>;

export const users = pgTable('users', { ... });
type User = z.infer<typeof selectUserSchema>;
```

### Typage React

```typescript
interface Props {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}

function Component({ title, onClick, children }: Props) {
  return <div onClick={onClick}>{title}{children}</div>;
}
```

### Generics

```typescript
function identity<T>(value: T): T {
  return value;
}

interface Response<T> {
  data: T;
  status: number;
}
```

---

## ✅ Validation des acquis

- [ ] Je connais les types de base (string, number, boolean)
- [ ] Je sais créer une interface ou un type personnalisé
- [ ] Je comprends les unions types (A | B)
- [ ] Je sais typer les props d'un composant React
- [ ] Je sais utiliser `z.infer` pour générer des types depuis Zod
- [ ] Je comprends le concept de générique
- [ ] Je sais typer les événements (onClick, onChange...)

### Questions de validation

1. **Quelle est la différence entre `interface` et `type` ?**
   → Interface pour les objets/classes, Type pour unions/primitifs (mais interchangeables dans la plupart des cas)

2. **Que fait `z.infer<typeof schema>` ?**
   → Génère un type TypeScript depuis un schéma Zod

3. **Comment typer un prop optionnel ?**
   → Avec `?` : `name?: string`

4. **Que signifie `<T>` dans une fonction ?**
   → Générique : type paramétrable qui sera déterminé à l'utilisation

---

## 🎯 Prochaine étape

**[Chapitre 10 : Composants UI réutilisables](./chapitre-10-composants-ui.md)**

Dans le prochain chapitre :
- Anatomie d'un composant UI (Button, Input, Card...)
- Radix UI primitives
- CVA (Class Variance Authority)
- Créer ses propres composants réutilisables
- Composition de composants

---

**[← Chapitre précédent](./chapitre-08-api-routes.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-10-composants-ui.md)**
