# Chapitre 10 : Composants UI réutilisables

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Comprendre comment créer et utiliser des composants UI réutilisables

---

## 📑 Table des matières

1. [Philosophie des composants réutilisables](#101-philosophie-des-composants-réutilisables)
2. [Radix UI : Les primitives](#102-radix-ui--les-primitives)
3. [CVA : Class Variance Authority](#103-cva--class-variance-authority)
4. [Anatomie d'un composant : Button](#104-anatomie-dun-composant--button)
5. [Composant Input](#105-composant-input)
6. [Composant Select](#106-composant-select)
7. [Composant Card](#107-composant-card)
8. [Créer ses propres composants](#108-créer-ses-propres-composants)
9. [Exercices pratiques](#109-exercices-pratiques)
10. [Résumé](#résumé-du-chapitre-10)

---

## 10.1. Philosophie des composants réutilisables

### Pourquoi des composants réutilisables ?

**Problème sans composants :**
```typescript
// Page 1
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Sauvegarder
</button>

// Page 2
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Envoyer
</button>

// Page 3
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Confirmer
</button>
```

**Avec un composant réutilisable :**
```typescript
// Définition du composant (une seule fois)
<Button>Sauvegarder</Button>
<Button>Envoyer</Button>
<Button>Confirmer</Button>
```

**Avantages :**
- ✅ Code plus court et lisible
- ✅ Cohérence visuelle
- ✅ Modification centralisée
- ✅ Testable et maintenable

### Principes de conception

1. **Composabilité** : Les composants s'emboîtent
2. **Flexibilité** : Props pour personnaliser
3. **Accessibilité** : ARIA, clavier, screen readers
4. **Consistance** : Design system uniforme

---

## 10.2. Radix UI : Les primitives

### Qu'est-ce que Radix UI ?

**Radix UI = Bibliothèque de composants headless (sans style)**

**Headless = Fonctionnalité sans apparence**
→ Radix gère : accessibilité, interactions clavier, états
→ Toi tu ajoutes : le style (Tailwind)

### Exemple : Select

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/components/ui/select.tsx`

**Import Radix (ligne 4) :**
```typescript
import * as SelectPrimitive from "@radix-ui/react-select"
```

**Utilisation des primitives Radix :**
```typescript
function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({ className, children, ...props }) {
  return (
    <SelectPrimitive.Trigger className={cn(/* styles Tailwind */)}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}
```

**Ce que Radix gère automatiquement :**
- ✅ Ouverture/fermeture au clic
- ✅ Navigation au clavier (flèches haut/bas)
- ✅ Accessibilité (aria-* attributes)
- ✅ Fermeture au clic extérieur
- ✅ Focus management

### Autres primitives Radix utilisées

| Primitive | Usage dans ton projet |
|-----------|----------------------|
| `@radix-ui/react-select` | Composant Select (dropdown) |
| `@radix-ui/react-slot` | Button avec asChild |
| `@radix-ui/react-collapsible` | Collapsible (signup page) |

---

## 10.3. CVA : Class Variance Authority

### Qu'est-ce que CVA ?

**CVA = Bibliothèque pour gérer les variants de composants**

**Exemple conceptuel :**
```typescript
// Sans CVA : conditions imbriquées
const buttonClasses = `
  ${variant === 'primary' ? 'bg-blue-500' : ''}
  ${variant === 'secondary' ? 'bg-gray-500' : ''}
  ${size === 'sm' ? 'px-2 py-1' : ''}
  ${size === 'lg' ? 'px-6 py-3' : ''}
`;

// Avec CVA : déclaratif et lisible
const buttonVariants = cva(/* base */, {
  variants: {
    variant: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-500',
    },
    size: {
      sm: 'px-2 py-1',
      lg: 'px-6 py-3',
    },
  },
});
```

### Exemple réel : Button

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/components/ui/button.tsx` (lignes 7-37)

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  // Classes de base (toujours appliquées)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // Variant : type de bouton
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Size : taille du bouton
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    // Valeurs par défaut
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**Utilisation :**
```typescript
<Button variant="ghost" size="lg">
  Cliquer
</Button>

// Classes générées :
// - Base : inline-flex items-center justify-center...
// - Variant ghost : hover:bg-accent hover:text-accent-foreground
// - Size lg : h-10 rounded-md px-6
```

---

## 10.4. Anatomie d'un composant : Button

### Structure complète

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/components/ui/button.tsx`

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 1. Définir les variants avec CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 ...",
  {
    variants: {
      variant: { default: "...", ghost: "...", /* ... */ },
      size: { default: "...", sm: "...", lg: "..." },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 2. Définir le composant
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
  // asChild : si true, utilise Slot (pour wrapper un autre élément)
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// 3. Exporter
export { Button, buttonVariants }
```

### Décortication

**1. Types des props :**
```typescript
React.ComponentProps<"button">              // Props HTML natifs (onClick, type, disabled...)
& VariantProps<typeof buttonVariants>      // Props générés par CVA (variant, size)
& { asChild?: boolean }                    // Prop personnalisé
```

**2. asChild :**
```typescript
// Normal : génère un <button>
<Button>Cliquer</Button>

// asChild : utilise l'enfant comme élément
<Button asChild>
  <a href="/dashboard">Aller au dashboard</a>
</Button>

// Résultat : <a> avec les styles du Button
```

**3. cn() - Combiner les classes :**
```typescript
className={cn(buttonVariants({ variant, size, className }))}

// Combine :
// - Classes de base (de buttonVariants)
// - Classes du variant sélectionné
// - Classes du size sélectionné
// - Classes personnalisées (className prop)
```

### Exemples d'utilisation

**Fichier :** `app/page.tsx`

**Bouton primary par défaut (ligne 139) :**
```typescript
<Button type="submit" className="w-full" size="lg">
  Sign in with Magic Link
</Button>
```

**Bouton ghost (ligne 149) :**
```typescript
<Button
  type="button"
  variant="ghost"
  onClick={() => setShowMagicLink(true)}
>
  Or sign in with password →
</Button>
```

**Bouton link (ligne 96) :**
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

---

## 10.5. Composant Input

### Structure

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/components/ui/input.tsx`

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Styles de base
        "h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs",
        // Focus
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Erreur
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        // Dark mode
        "dark:bg-input/30",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Classes personnalisées
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

### Utilisation

```typescript
<Input
  id="email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="your@email.com"
  required
/>
```

### États gérés automatiquement

- **Focus :** Bordure colorée + anneau
- **Disabled :** Opacité réduite + curseur non autorisé
- **Invalid :** Bordure rouge (avec `aria-invalid`)
- **Dark mode :** Fond légèrement transparent

---

## 10.6. Composant Select

### Structure modulaire

**Le Select est composé de plusieurs sous-composants :**

```typescript
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choisir..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Exemple dans ton code

**Fichier :** `app/(dashboard)/onboarding/page.tsx` (lignes 193-208)

```typescript
<Select
  value={formData.sex}
  onValueChange={(value) =>
    setFormData({ ...formData, sex: value })
  }
>
  <SelectTrigger className="w-full text-base sm:text-lg">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="male">Male</SelectItem>
    <SelectItem value="female">Female</SelectItem>
    <SelectItem value="non-binary">Non-binary</SelectItem>
    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
  </SelectContent>
</Select>
```

### Props importantes

| Prop | Type | Description |
|------|------|-------------|
| `value` | string | Valeur sélectionnée |
| `onValueChange` | (value: string) => void | Callback au changement |
| `disabled` | boolean | Désactive le select |
| `defaultValue` | string | Valeur initiale |

---

## 10.7. Composant Card

### Structure hiérarchique

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/components/ui/card.tsx`

```typescript
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("leading-none font-semibold", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />
}
```

### Utilisation

**Fichier :** `app/page.tsx` (lignes 68-76)

```typescript
<Card className="p-6 sm:p-8">
  <CardHeader className="p-0 mb-6">
    <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-center">
      Mon Super Projet
    </CardTitle>
    <CardDescription className="text-center text-sm sm:text-base">
      Sign in to enter to your account
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    {/* Formulaire */}
  </CardContent>
</Card>
```

**Hiérarchie typique :**
```
Card
├── CardHeader
│   ├── CardTitle
│   └── CardDescription
└── CardContent
    └── (contenu)
```

---

## 10.8. Créer ses propres composants

### Exemple 1 : Badge simple

```typescript
// components/ui/badge.tsx
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        success: "bg-green-500 text-white",
        warning: "bg-yellow-500 text-black",
        danger: "bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

**Utilisation :**
```typescript
<Badge variant="success">Actif</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="danger">Erreur</Badge>
```

### Exemple 2 : Alert/Message

```typescript
// components/ui/alert.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        success: "border-green-500 bg-green-50 text-green-900",
        warning: "border-yellow-500 bg-yellow-50 text-yellow-900",
        error: "border-red-500 bg-red-50 text-red-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Alert }
```

---

## 10.9. Exercices pratiques

### Exercice 1 : Créer un composant Avatar

**Objectif :** Créer un composant pour afficher une photo de profil

```typescript
// components/ui/avatar.tsx
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  }

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-gray-600">
          {fallback || alt[0]?.toUpperCase()}
        </span>
      )}
    </div>
  )
}

export { Avatar }
```

**Utilisation :**
```typescript
<Avatar src="/user.jpg" alt="Jean Dupont" size="lg" />
<Avatar fallback="JD" size="md" />
```

### Exercice 2 : Créer un composant Progress

```typescript
// components/ui/progress.tsx
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number  // 0-100
  max?: number
}

function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
```

### Exercice 3 : Composant Tooltip

```typescript
// components/ui/tooltip.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

export { Tooltip }
```

---

## 📝 Résumé du Chapitre 10

### Composants réutilisables

**Avantages :**
- Cohérence visuelle
- Code DRY (Don't Repeat Yourself)
- Maintenance facilitée
- Testabilité

### Technologies clés

**1. Radix UI**
- Composants headless (sans style)
- Accessibilité intégrée
- Gestion des interactions

**2. CVA (Class Variance Authority)**
```typescript
const buttonVariants = cva(baseClasses, {
  variants: {
    variant: { default: "...", ghost: "..." },
    size: { sm: "...", lg: "..." },
  },
})
```

**3. cn() - Utilitaire de fusion**
```typescript
className={cn(baseClasses, variantClasses, customClasses)}
```

### Composants de base

- **Button :** Variants (default, ghost, link...), sizes (sm, lg...)
- **Input :** États (focus, disabled, invalid...)
- **Select :** Dropdown avec options
- **Card :** Container avec header, title, description, content

### Pattern de création

```typescript
// 1. Imports
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 2. Variants CVA
const componentVariants = cva(baseClasses, { variants, defaultVariants })

// 3. Interface props
interface Props extends React.ComponentProps<"element">, VariantProps<typeof componentVariants> {}

// 4. Composant
function Component({ className, ...props }: Props) {
  return <element className={cn(componentVariants({ ...props }), className)} />
}

// 5. Export
export { Component }
```

---

## ✅ Validation des acquis

- [ ] Je comprends l'intérêt des composants réutilisables
- [ ] Je sais ce qu'est Radix UI et son rôle
- [ ] Je comprends CVA et les variants
- [ ] Je sais utiliser Button, Input, Select, Card
- [ ] Je sais créer un composant simple avec CVA
- [ ] Je comprends le pattern asChild

### Questions de validation

1. **Qu'est-ce qu'un composant headless ?**
   → Un composant qui fournit la fonctionnalité/logique mais pas le style

2. **À quoi sert CVA ?**
   → Gérer les variants d'un composant de manière déclarative

3. **Que fait la fonction `cn()` ?**
   → Fusionne des classes Tailwind en résolvant les conflits

4. **Quel est l'avantage de `asChild` dans Button ?**
   → Permet d'appliquer les styles du Button à un autre élément (comme `<a>`)

---

## 🎯 Prochaine étape

**[Chapitre 11 : Flow complet - De l'UI à la base de données](./chapitre-11-flow-complet.md)**

Dans le prochain chapitre :
- Suivre le parcours complet d'une requête
- Du clic utilisateur à la BDD
- Comprendre chaque étape
- Débogage et logs

---

**[← Chapitre précédent](./chapitre-09-typescript.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-11-flow-complet.md)**
