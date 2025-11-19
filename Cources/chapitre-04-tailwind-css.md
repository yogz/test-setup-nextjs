# Chapitre 4 : Tailwind CSS

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Maîtriser Tailwind CSS pour styliser rapidement et efficacement tes interfaces

---

## 📑 Table des matières

1. [Qu'est-ce que Tailwind CSS ?](#41-quest-ce-que-tailwind-css-)
2. [Les classes utilitaires](#42-les-classes-utilitaires)
3. [Le système de design](#43-le-système-de-design)
4. [Responsive Design](#44-responsive-design)
5. [États et interactions](#45-états-et-interactions)
6. [Dark Mode](#46-dark-mode)
7. [Composition et réutilisation](#47-composition-et-réutilisation)
8. [Exercices pratiques](#48-exercices-pratiques)
9. [Résumé](#résumé-du-chapitre-4)

---

## 4.1. Qu'est-ce que Tailwind CSS ?

### Le concept

**Tailwind = CSS utilitaire**

Au lieu d'écrire du CSS personnalisé, tu utilises des classes prédéfinies.

**Analogie avec le C :**
```c
// En C : tu définis des fonctions réutilisables
void setColor(char* element, char* color);
void setPadding(char* element, int value);

// En CSS classique : tu écris du CSS personnalisé
.my-button {
  background-color: blue;
  padding: 16px;
  border-radius: 8px;
}

// Avec Tailwind : tu composes avec des classes
<button class="bg-blue-500 p-4 rounded-lg">
```

### CSS classique vs Tailwind

**CSS classique :**
```css
/* styles.css */
.card {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

```html
<div class="card">Contenu</div>
```

**Avec Tailwind :**
```html
<!-- Pas de CSS séparé -->
<div class="bg-white p-6 rounded-lg shadow-sm">
  Contenu
</div>
```

### Exemple réel dans ton code : `app/page.tsx`

**Ligne 66 :**
```typescript
<main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
```

**Décomposition :**
- `flex` → `display: flex`
- `min-h-screen` → `min-height: 100vh`
- `flex-col` → `flex-direction: column`
- `items-center` → `align-items: center`
- `justify-center` → `justify-content: center`
- `p-4` → `padding: 1rem` (16px)
- `bg-gradient-to-br` → Gradient de haut-gauche à bas-droite
- `from-gray-50 to-gray-100` → Couleurs du gradient

---

## 4.2. Les classes utilitaires

### Espacements (padding et margin)

**Système d'espacement de Tailwind :**

| Classe | Valeur | Pixels |
|--------|--------|--------|
| `p-0` | 0 | 0px |
| `p-1` | 0.25rem | 4px |
| `p-2` | 0.5rem | 8px |
| `p-3` | 0.75rem | 12px |
| `p-4` | 1rem | 16px |
| `p-6` | 1.5rem | 24px |
| `p-8` | 2rem | 32px |

**Directions spécifiques :**

| Classe | Signification |
|--------|---------------|
| `pt-4` | Padding top |
| `pr-4` | Padding right |
| `pb-4` | Padding bottom |
| `pl-4` | Padding left |
| `px-4` | Padding horizontal (left + right) |
| `py-4` | Padding vertical (top + bottom) |

**Exemple dans ton code : `app/(dashboard)/onboarding/page.tsx` (ligne 92)**
```typescript
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
```

### Couleurs

**Palette de couleurs de Tailwind :**

```typescript
// app/page.tsx (ligne 70-71)
<CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
  Mon Super Projet
</CardTitle>
```

**Classes de couleurs courantes :**

| Classe | CSS équivalent |
|--------|----------------|
| `text-gray-600` | `color: rgb(75, 85, 99)` |
| `bg-blue-500` | `background-color: rgb(59, 130, 246)` |
| `border-red-300` | `border-color: rgb(252, 165, 165)` |

**Nuances :** 50 (très clair) → 900 (très foncé)

### Typographie

**Tailles de texte :**

| Classe | Taille |
|--------|--------|
| `text-xs` | 0.75rem (12px) |
| `text-sm` | 0.875rem (14px) |
| `text-base` | 1rem (16px) |
| `text-lg` | 1.125rem (18px) |
| `text-xl` | 1.25rem (20px) |
| `text-2xl` | 1.5rem (24px) |
| `text-4xl` | 2.25rem (36px) |

**Exemple : `app/page.tsx` (ligne 86)**
```typescript
<h2 className="text-xl sm:text-2xl font-bold">Check your email</h2>
```

**Poids de police :**

| Classe | Valeur |
|--------|--------|
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

### Flexbox

**Ton code utilise beaucoup Flexbox !**

**Exemple : `app/page.tsx` (ligne 66)**
```typescript
<main className="flex min-h-screen flex-col items-center justify-center">
```

**Classes Flexbox courantes :**

| Classe | CSS équivalent |
|--------|----------------|
| `flex` | `display: flex` |
| `flex-col` | `flex-direction: column` |
| `flex-row` | `flex-direction: row` |
| `items-center` | `align-items: center` |
| `items-start` | `align-items: flex-start` |
| `justify-center` | `justify-content: center` |
| `justify-between` | `justify-content: space-between` |
| `gap-4` | `gap: 1rem` |

### Bordures et arrondis

**Exemple : `components/ui/card.tsx` (ligne 10)**
```typescript
className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
```

**Classes de bordures :**

| Classe | Signification |
|--------|---------------|
| `border` | Bordure de 1px |
| `border-2` | Bordure de 2px |
| `border-gray-300` | Couleur de bordure |
| `rounded` | Border-radius: 0.25rem |
| `rounded-md` | Border-radius: 0.375rem |
| `rounded-lg` | Border-radius: 0.5rem |
| `rounded-xl` | Border-radius: 0.75rem |
| `rounded-full` | Border-radius: 9999px (cercle) |

### Ombres

**Exemple : `app/page.tsx` (ligne 68)**
```typescript
<Card className="p-6 sm:p-8">
```

**Classes d'ombres :**

| Classe | Effet |
|--------|-------|
| `shadow-sm` | Ombre légère |
| `shadow` | Ombre normale |
| `shadow-md` | Ombre moyenne |
| `shadow-lg` | Ombre large |
| `shadow-xl` | Ombre extra-large |

---

## 4.3. Le système de design

### Variables CSS personnalisées

**Ton projet utilise des variables CSS pour les couleurs.**

**Fichier :** `app/globals.css`

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    /* ... */
  }
}
```

**Utilisation dans Tailwind :**
```typescript
<div className="bg-background text-foreground">
  {/* bg-background utilise var(--background) */}
</div>
```

### Classes personnalisées avec @apply

**Exemple (hypothétique) :**

```css
/* globals.css */
@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90;
  }
}
```

```typescript
// Utilisation
<button className="btn-primary">Cliquer</button>
```

---

## 4.4. Responsive Design

### Le système mobile-first

**Tailwind = Mobile-first par défaut**

```typescript
// app/page.tsx (ligne 70)
<CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
```

**Signification :**
- Par défaut (mobile) : `text-2xl` (24px)
- À partir de 640px (`sm:`) : `text-3xl` (30px)
- À partir de 768px (`md:`) : `text-4xl` (36px)

### Breakpoints de Tailwind

| Préfixe | Largeur min | Exemple |
|---------|-------------|---------|
| (rien) | 0px | `text-sm` |
| `sm:` | 640px | `sm:text-base` |
| `md:` | 768px | `md:text-lg` |
| `lg:` | 1024px | `lg:text-xl` |
| `xl:` | 1280px | `xl:text-2xl` |
| `2xl:` | 1536px | `2xl:text-4xl` |

### Exemple responsive complet : `app/(dashboard)/dashboard/page.tsx`

**Ligne 132 :**
```typescript
<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
    <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back!</p>
  </div>
  <Button className="w-full sm:w-auto">
    Sign Out
  </Button>
</header>
```

**Comportement :**

**Mobile (< 640px) :**
- `flex-col` → Disposition verticale
- `items-start` → Alignement à gauche
- `text-2xl` → Titre plus petit
- `text-sm` → Texte plus petit
- `w-full` → Bouton pleine largeur

**Desktop (≥ 640px) :**
- `sm:flex-row` → Disposition horizontale
- `sm:items-center` → Alignement centré
- `sm:text-3xl` → Titre plus grand
- `sm:text-base` → Texte plus grand
- `sm:w-auto` → Bouton taille automatique

### Masquer/afficher selon la taille

```typescript
<div className="hidden md:block">
  Visible uniquement sur desktop
</div>

<div className="block md:hidden">
  Visible uniquement sur mobile
</div>
```

---

## 4.5. États et interactions

### Hover (survol)

**Exemple : `components/ui/button.tsx` (ligne 12)**
```typescript
"bg-primary text-primary-foreground hover:bg-primary/90"
```

**Classes hover courantes :**

| Classe | Effet |
|--------|-------|
| `hover:bg-blue-600` | Change la couleur au survol |
| `hover:scale-105` | Agrandit de 5% |
| `hover:shadow-lg` | Ajoute une ombre |
| `hover:underline` | Souligne le texte |

### Focus (pour l'accessibilité)

**Exemple : `components/ui/input.tsx` (ligne 12)**
```typescript
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

**Classes focus :**

| Classe | Effet |
|--------|-------|
| `focus:outline-none` | Supprime l'outline par défaut |
| `focus:ring-2` | Ajoute un anneau de focus |
| `focus:border-blue-500` | Change la couleur de bordure |

### Active (clic)

```typescript
<button className="active:scale-95 active:bg-blue-700">
  Cliquer
</button>
```

### Disabled

**Exemple : `components/ui/button.tsx` (ligne 8)**
```typescript
"disabled:pointer-events-none disabled:opacity-50"
```

### Groupes et états parents

```typescript
<div className="group">
  <img className="group-hover:scale-110" />
  <p className="group-hover:text-blue-600">Texte</p>
</div>
```

---

## 4.6. Dark Mode

### Configuration dans Tailwind

**Fichier :** `tailwind.config.ts`

```typescript
export default {
  darkMode: 'class', // ou 'media'
  // ...
}
```

**Deux modes :**
1. `'class'` : Contrôlé manuellement (toggle)
2. `'media'` : Suit la préférence système

### Utiliser le dark mode

```typescript
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  {/* Blanc en mode clair, gris foncé en mode sombre */}
</div>
```

### Exemple dans ton code : `components/ui/button.tsx`

**Ligne 16 :**
```typescript
"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
```

**Comportement :**
- Mode clair : `bg-background`
- Mode sombre : `dark:bg-input/30` (fond légèrement transparent)

### Activer le dark mode

**Ajouter la classe `dark` à `<html>` :**

```typescript
// app/layout.tsx
<html lang="en" className="dark">
  {/* ... */}
</html>
```

---

## 4.7. Composition et réutilisation

### Fonction cn() - Combiner des classes

**Ton projet utilise `cn()` partout !**

**Fichier :** `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Utilisation : `components/ui/button.tsx` (ligne 54)**
```typescript
className={cn(buttonVariants({ variant, size, className }))}
```

**Pourquoi cn() ?**

1. **clsx** : Combine des classes conditionnellement
2. **twMerge** : Résout les conflits de classes Tailwind

**Exemple :**
```typescript
cn('p-4 text-sm', 'p-6 text-lg')
// Résultat : 'p-6 text-lg' (p-6 remplace p-4)
```

### Class Variance Authority (CVA)

**Ton projet utilise CVA pour les variants de composants.**

**Exemple : `components/ui/button.tsx` (lignes 7-37)**

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Classes de base (toujours appliquées)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Utilisation :**
```typescript
<Button variant="ghost" size="lg">Cliquer</Button>
// Classes appliquées : base + ghost + lg
```

---

## 4.8. Exercices pratiques

### Exercice 1 : Créer une Card stylisée

**Objectif :** Créer une carte avec Tailwind

```typescript
export default function TestCard() {
  return (
    <div className="max-w-sm mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Titre de la carte</h2>
          <p className="text-gray-600 mb-4">
            Ceci est une description de la carte avec du texte.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            En savoir plus
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Exercice 2 : Grid responsive

**Objectif :** Créer une grille d'éléments qui s'adapte

```typescript
export default function Grid() {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <div
            key={num}
            className="bg-gray-200 h-32 rounded-lg flex items-center justify-center text-2xl font-bold"
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Comportement :**
- Mobile : 1 colonne
- Tablet (`sm:`) : 2 colonnes
- Desktop (`lg:`) : 3 colonnes

### Exercice 3 : Bouton avec états

**Objectif :** Créer un bouton interactif

```typescript
export default function InteractiveButton() {
  return (
    <button className="
      bg-blue-600 text-white font-medium px-6 py-3 rounded-lg
      hover:bg-blue-700
      active:scale-95
      focus:outline-none focus:ring-4 focus:ring-blue-300
      transition-all duration-150
      disabled:opacity-50 disabled:cursor-not-allowed
    ">
      Cliquer ici
    </button>
  );
}
```

### Exercice 4 : Formulaire responsive

**Objectif :** Créer un formulaire adaptatif

```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ResponsiveForm() {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <form className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstname">Prénom</Label>
            <Input id="firstname" placeholder="Jean" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastname">Nom</Label>
            <Input id="lastname" placeholder="Dupont" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="jean@example.com" />
        </div>
        <Button className="w-full sm:w-auto" type="submit">
          Envoyer
        </Button>
      </form>
    </div>
  );
}
```

---

## 📝 Résumé du Chapitre 4

### Concepts clés

1. **Classes utilitaires**
   ```typescript
   className="p-4 text-lg bg-blue-500 rounded-lg"
   ```

2. **Système d'espacement**
   - `p-4` = padding: 1rem (16px)
   - `m-4` = margin: 1rem
   - `gap-4` = gap: 1rem

3. **Responsive design (mobile-first)**
   ```typescript
   className="text-sm sm:text-base md:text-lg lg:text-xl"
   ```

4. **États**
   ```typescript
   className="hover:bg-blue-600 focus:ring-2 active:scale-95 disabled:opacity-50"
   ```

5. **Dark mode**
   ```typescript
   className="bg-white dark:bg-gray-900"
   ```

6. **Composition avec cn() et CVA**
   ```typescript
   className={cn(buttonVariants({ variant, size }), className)}
   ```

### Breakpoints

```
Mobile    Tablet    Desktop    Large
0px       640px     1024px     1280px
|---------|---------|----------|---------|
          sm:       md:  lg:   xl:
```

### Cheat sheet - Classes essentielles

**Layout :**
- `flex`, `flex-col`, `grid`
- `items-center`, `justify-center`
- `gap-4`, `space-y-4`

**Spacing :**
- `p-4`, `px-4`, `py-4`
- `m-4`, `mx-auto`

**Sizing :**
- `w-full`, `w-1/2`, `w-64`
- `h-screen`, `min-h-screen`

**Colors :**
- `text-gray-600`, `bg-blue-500`
- `border-red-300`

**Typography :**
- `text-sm`, `text-lg`, `text-2xl`
- `font-bold`, `font-medium`

**Borders :**
- `border`, `rounded-lg`
- `shadow-md`

---

## ✅ Validation des acquis

- [ ] Je comprends le concept des classes utilitaires
- [ ] Je sais utiliser les espacements (`p-4`, `m-4`, etc.)
- [ ] Je maîtrise le système responsive (mobile-first)
- [ ] Je sais appliquer des styles au hover et focus
- [ ] Je comprends comment fonctionne le dark mode
- [ ] Je sais utiliser `cn()` pour combiner des classes

### Questions de validation

1. **Quelle est la différence entre `p-4` et `px-4` ?**
   → `p-4` applique un padding de 1rem sur tous les côtés, `px-4` uniquement horizontal

2. **Comment appliquer `text-lg` uniquement sur desktop ?**
   → `lg:text-lg`

3. **Qu'est-ce que le mobile-first ?**
   → Les styles sans préfixe s'appliquent d'abord au mobile, puis sont surchargés pour les écrans plus grands

4. **À quoi sert la fonction `cn()` ?**
   → Combiner et fusionner des classes Tailwind en résolvant les conflits

---

## 🎯 Prochaine étape

**[Chapitre 5 : Formulaires avec React Hook Form + Zod](./chapitre-05-formulaires-validation.md)**

Dans le prochain chapitre :
- Gérer les formulaires avec React Hook Form
- Valider les données avec Zod
- Afficher les erreurs
- Formulaires multi-étapes
- Intégration avec ton onboarding

---

**[← Chapitre précédent](./chapitre-03-nextjs-app-router.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-05-formulaires-validation.md)**
