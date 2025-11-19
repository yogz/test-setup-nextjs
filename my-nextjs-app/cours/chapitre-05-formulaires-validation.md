# Chapitre 5 : Formulaires et validation avec Zod

> ⏱️ **Durée estimée :** 2-3 heures
> 🎯 **Objectif :** Maîtriser la création de formulaires et la validation de données avec Zod

---

## 📑 Table des matières

1. [Les formulaires en React](#51-les-formulaires-en-react)
2. [Controlled vs Uncontrolled components](#52-controlled-vs-uncontrolled-components)
3. [Validation avec Zod](#53-validation-avec-zod)
4. [Formulaires multi-étapes](#54-formulaires-multi-étapes)
5. [Gestion des erreurs](#55-gestion-des-erreurs)
6. [Soumission et envoi au serveur](#56-soumission-et-envoi-au-serveur)
7. [Exercices pratiques](#57-exercices-pratiques)
8. [Résumé](#résumé-du-chapitre-5)

---

## 5.1. Les formulaires en React

### Le problème avec les formulaires HTML classiques

**HTML classique :**
```html
<form action="/api/submit" method="POST">
  <input name="email" type="email">
  <button type="submit">Envoyer</button>
</form>
```
→ Recharge la page à chaque soumission

**React moderne :**
```typescript
<form onSubmit={handleSubmit}>
  <input value={email} onChange={(e) => setEmail(e.target.value)}>
  <button type="submit">Envoyer</button>
</form>
```
→ Contrôle total, pas de rechargement

### Exemple dans ton code : `app/page.tsx`

**Formulaire de connexion par mot de passe (lignes 170-194) :**

```typescript
<form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
  <div className="space-y-2">
    <Label htmlFor="login-email">Email</Label>
    <Input
      id="login-email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="login-password">Password</Label>
    <Input
      id="login-password"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
  </div>
  <Button type="submit" className="w-full" size="lg">
    Sign In with Password
  </Button>
</form>
```

**Points clés :**
1. `onSubmit={handleLogin}` → Gère la soumission
2. `value={email}` → Input contrôlé par le state
3. `onChange={(e) => setEmail(e.target.value)}` → Met à jour le state
4. `required` → Validation HTML native

---

## 5.2. Controlled vs Uncontrolled components

### Controlled Component (recommandé)

**Le state React contrôle la valeur de l'input.**

**Analogie avec le C :**
```c
// En C : variable partagée
char email[255];

void onInputChange(char* newValue) {
    strcpy(email, newValue);
    renderInput(email);  // Re-rendu avec nouvelle valeur
}

// En React : state contrôle l'input
const [email, setEmail] = useState('');

<input
  value={email}                              // ← Source de vérité = state
  onChange={(e) => setEmail(e.target.value)} // ← Met à jour le state
/>
```

**Exemple dans ton code : `app/(dashboard)/onboarding/page.tsx` (lignes 124-135)**

```typescript
const [formData, setFormData] = useState({
  name: '',
  dateOfBirth: '',
  sex: '',
  phone: '',
});

<Input
  id="onboarding-name"
  type="text"
  value={formData.name}                    // ← Controlled
  onChange={(e) =>
    setFormData({ ...formData, name: e.target.value })
  }
  placeholder="Enter your full name"
/>
```

**Avantages :**
- ✅ Validation en temps réel
- ✅ Formatage automatique (ex: téléphone)
- ✅ Désactivation conditionnelle
- ✅ Valeurs par défaut depuis le serveur

### Uncontrolled Component (moins courant)

**Le DOM gère la valeur, React ne fait que lire.**

```typescript
const emailRef = useRef<HTMLInputElement>(null);

const handleSubmit = () => {
  console.log(emailRef.current?.value);  // Lit la valeur du DOM
};

<input ref={emailRef} type="email" />
```

**Quand utiliser ?**
→ Formulaires simples où tu n'as besoin de la valeur qu'à la soumission

---

## 5.3. Validation avec Zod

### Qu'est-ce que Zod ?

**Zod = Bibliothèque de validation TypeScript**

**Analogie avec le C :**
```c
// En C : validation manuelle
int validateEmail(char* email) {
    if (strlen(email) < 3) return 0;
    if (!strchr(email, '@')) return 0;
    return 1;
}

// Avec Zod : schéma déclaratif
const emailSchema = z.string()
  .min(3, 'Too short')
  .email('Invalid email');
```

### Schémas de validation dans ton projet

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/lib/validations/auth.ts`

**Email (lignes 12-16) :**
```typescript
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');
```

**Mot de passe (lignes 18-26) :**
```typescript
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val),
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );
```

**Points clés :**
- `.string()` → Le type doit être une chaîne
- `.min(12)` → Longueur minimale
- `.email()` → Format email valide
- `.refine()` → Validation personnalisée (regex)

### Autres types de validation

**Nom (lignes 27-34) :**
```typescript
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters')
  .refine(
    (val) => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(val),
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );
```

**Téléphone (lignes 36-43) :**
```typescript
export const phoneSchema = z
  .string()
  .refine(
    (val) => val === '' || /^\+[1-9]\d{1,14}$/.test(val),
    'Phone must be in international format (e.g., +33612345678)'
  )
  .optional()
  .or(z.literal(''));
```

**Date de naissance (lignes 45-59) :**
```typescript
export const dateOfBirthSchema = z
  .string()
  .refine(
    (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
    'Date must be in YYYY-MM-DD format'
  )
  .refine((date) => {
    if (date === '') return true;
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13 && age <= 120;
  }, 'Must be at least 13 years old')
  .optional();
```

**Validation de l'âge :** Vérifie que l'utilisateur a entre 13 et 120 ans.

### Schéma d'objet complet

**Formulaire d'inscription (lignes 72-82) :**
```typescript
export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],  // Attache l'erreur au champ confirmPassword
  });
```

**Utilisation :**
```typescript
const result = signUpSchema.safeParse({
  name: 'Jean Dupont',
  email: 'jean@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
});

if (result.success) {
  console.log('Valide !', result.data);
} else {
  console.log('Erreurs :', result.error.issues);
}
```

### Types TypeScript depuis Zod

**Zod génère automatiquement les types TypeScript :**

```typescript
// lib/validations/auth.ts (ligne 135)
export type SignUpInput = z.infer<typeof signUpSchema>;

// Équivalent à :
type SignUpInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
```

---

## 5.4. Formulaires multi-étapes

### Exemple complet : Onboarding en 3 étapes

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/(dashboard)/onboarding/page.tsx`

### Gestion de l'étape actuelle

**Ligne 22 :**
```typescript
const [step, setStep] = useState(1);
```

**Navigation entre étapes (lignes 43-53) :**
```typescript
const handleNext = () => {
  if (step < 3) {
    setStep(step + 1);
  }
};

const handleBack = () => {
  if (step > 1) {
    setStep(step - 1);
  }
};
```

### État partagé entre les étapes

**Lignes 23-28 :**
```typescript
const [formData, setFormData] = useState({
  name: '',
  dateOfBirth: '',
  sex: '',
  phone: '',
});
```

**Tous les champs sont dans un seul objet** → Facilite la validation et l'envoi final.

### Étape 1 : Nom (lignes 119-145)

```typescript
{step === 1 && (
  <div className="space-y-4 sm:space-y-6">
    <div className="space-y-2">
      <Label htmlFor="onboarding-name">What's your name?</Label>
      <Input
        id="onboarding-name"
        type="text"
        value={formData.name}
        onChange={(e) =>
          setFormData({ ...formData, name: e.target.value })
        }
        placeholder="Enter your full name"
        autoFocus
      />
    </div>
    <Button
      onClick={handleNext}
      disabled={!canProceedStep1}
      className="w-full"
      size="lg"
    >
      Continue
    </Button>
  </div>
)}
```

**Validation avant de continuer (ligne 87) :**
```typescript
const canProceedStep1 = formData.name.trim().length > 0;
```

### Étape 2 : Date de naissance (lignes 147-184)

```typescript
{step === 2 && (
  <div className="space-y-4 sm:space-y-6">
    <div className="space-y-2">
      <Label htmlFor="onboarding-dob">
        When were you born? <span className="text-gray-500 font-normal">(optional)</span>
      </Label>
      <Input
        id="onboarding-dob"
        type="date"
        value={formData.dateOfBirth}
        onChange={(e) =>
          setFormData({ ...formData, dateOfBirth: e.target.value })
        }
      />
    </div>
    <div className="flex gap-3">
      <Button onClick={handleBack} variant="secondary" className="flex-1">
        Back
      </Button>
      <Button onClick={handleNext} className="flex-1">
        Continue
      </Button>
    </div>
  </div>
)}
```

### Étape 3 : Sexe et téléphone (lignes 186-293)

**Select pour le sexe :**
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

**Input téléphone avec formatage automatique (lignes 214-242) :**
```typescript
<Input
  id="onboarding-phone"
  type="tel"
  value={formData.phone}
  onChange={(e) => {
    const value = e.target.value;

    if (value.length === 0) {
      setFormData({ ...formData, phone: '' });
    } else if (value.startsWith('+')) {
      // Format international, autorisé
      setFormData({ ...formData, phone: value });
    } else if (value.startsWith('0') && value.replace(/\D/g, '').length <= 10) {
      // Format français (0X XX XX XX XX) → Convertit en +33
      const digits = value.replace(/\D/g, '');
      if (digits.startsWith('0')) {
        const formatted = '+33 ' + digits.substring(1);
        setFormData({ ...formData, phone: formatted });
      }
    } else if (!value.includes('+')) {
      // Ajoute automatiquement le +
      setFormData({ ...formData, phone: '+' + value });
    }
  }}
  placeholder="+33 6 12 34 56 78"
/>
```

**Formatage automatique :**
- Si l'utilisateur tape `0612345678` → Transformé en `+33 612345678`
- Si l'utilisateur tape `612345678` → Transformé en `+612345678`

### Barre de progression

**Lignes 95-105 :**
```typescript
<div className="mb-6 sm:mb-8">
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs sm:text-sm font-medium text-gray-700">
      Step {step} of 3
    </span>
    <span className="text-xs sm:text-sm font-medium text-black">
      {Math.round((step / 3) * 100)}% Complete
    </span>
  </div>
  <Progress value={(step / 3) * 100} className="h-2" />
</div>
```

---

## 5.5. Gestion des erreurs

### Erreurs de validation côté client

**Sans bibliothèque de formulaire :**

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};

  if (!email.includes('@')) {
    newErrors.email = 'Email invalide';
  }

  if (password.length < 12) {
    newErrors.password = 'Mot de passe trop court';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  // Envoyer au serveur
};
```

**Affichage des erreurs :**
```typescript
<Input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <p className="text-sm text-red-600">{errors.email}</p>
)}
```

### Validation côté serveur

**Fichier :** `/home/user/test-setup-nextjs/my-nextjs-app/app/api/update-profile/route.ts`

**Lignes 18-20 :**
```typescript
const body = await request.json();
const validatedData = updateProfileSchema.parse(body);
```

**Gestion des erreurs Zod (lignes 33-45) :**
```typescript
catch (error) {
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
  // ...
}
```

**Réponse d'erreur :**
```json
{
  "error": "Validation failed",
  "issues": [
    {
      "path": "email",
      "message": "Invalid email address"
    },
    {
      "path": "password",
      "message": "Password must be at least 12 characters"
    }
  ]
}
```

---

## 5.6. Soumission et envoi au serveur

### Exemple : Connexion avec mot de passe

**Fichier :** `app/page.tsx` (lignes 18-37)

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();  // ← Empêche le rechargement de la page

  await authClient.signIn.email(
    {
      email,
      password,
    },
    {
      onSuccess: () => {
        // Redirect to dashboard after successful login
        window.location.href = '/dashboard';
      },
      onError: (ctx) => {
        // Show error message if login fails
        alert(ctx.error.message);
      },
    }
  );
};
```

### Exemple : Compléter l'onboarding

**Fichier :** `app/(dashboard)/onboarding/page.tsx` (lignes 55-85)

```typescript
const handleComplete = async () => {
  setIsSubmitting(true);  // ← Désactive le bouton
  try {
    // Update user profile with collected data via API route
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
        hasCompletedOnboarding: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    // Force a full page reload to refresh the session
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    alert('Failed to save your information. Please try again.');
  } finally {
    setIsSubmitting(false);  // ← Réactive le bouton
  }
};
```

**Bouton avec état de chargement (lignes 257-290) :**
```typescript
<Button
  onClick={handleComplete}
  disabled={!canProceedStep3 || isSubmitting}
  className="flex-1"
  size="lg"
>
  {isSubmitting ? (
    <>
      <svg className="animate-spin h-4 w-4">
        {/* Icône de chargement */}
      </svg>
      Saving...
    </>
  ) : (
    'Complete Setup'
  )}
</Button>
```

---

## 5.7. Exercices pratiques

### Exercice 1 : Formulaire de contact simple

**Objectif :** Créer un formulaire avec nom, email, message

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Données soumises :', formData);
    alert('Message envoyé !');
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            className="w-full min-h-[100px] p-3 border rounded-md"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Envoyer
        </Button>
      </form>
    </div>
  );
}
```

### Exercice 2 : Validation avec Zod

**Objectif :** Ajouter la validation Zod au formulaire

```typescript
import { z } from 'zod';

// Schéma de validation
const contactSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  message: z.string().min(10, 'Le message doit faire au moins 10 caractères'),
});

export default function ContactFormWithValidation() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Valider les données
    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      // Extraire les erreurs
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    // Pas d'erreurs, envoyer
    setErrors({});
    console.log('Données valides :', result.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      {/* ... */}
    </form>
  );
}
```

### Exercice 3 : Formulaire multi-étapes simple

**Objectif :** Créer un wizard en 2 étapes (infos perso + préférences)

```typescript
export default function WizardForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1
    name: '',
    email: '',
    // Étape 2
    theme: 'light',
    notifications: true,
  });

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = () => {
    console.log('Formulaire complet :', formData);
  };

  return (
    <div className="max-w-md mx-auto p-8">
      {/* Indicateur d'étape */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">Étape {step} sur 2</p>
        <div className="h-2 bg-gray-200 rounded-full mt-2">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Étape 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Informations personnelles</h2>
          <Input
            placeholder="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Button onClick={handleNext} className="w-full">
            Suivant
          </Button>
        </div>
      )}

      {/* Étape 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Préférences</h2>
          <div>
            <Label>Thème</Label>
            <select
              className="w-full p-2 border rounded"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleBack} variant="secondary" className="flex-1">
              Retour
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Terminer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Résumé du Chapitre 5

### Concepts clés

1. **Controlled Components**
   ```typescript
   const [value, setValue] = useState('');
   <input value={value} onChange={(e) => setValue(e.target.value)} />
   ```

2. **Validation avec Zod**
   ```typescript
   const schema = z.object({
     email: z.string().email(),
     age: z.number().min(18),
   });

   const result = schema.safeParse(data);
   if (!result.success) {
     console.log(result.error.issues);
   }
   ```

3. **Formulaire multi-étapes**
   ```typescript
   const [step, setStep] = useState(1);
   const [formData, setFormData] = useState({ /* tous les champs */ });

   {step === 1 && <StepOne />}
   {step === 2 && <StepTwo />}
   ```

4. **Soumission asynchrone**
   ```typescript
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     try {
       await fetch('/api/endpoint', {
         method: 'POST',
         body: JSON.stringify(formData),
       });
     } finally {
       setIsSubmitting(false);
     }
   };
   ```

### Checklist - Bonnes pratiques

- [ ] Toujours utiliser `e.preventDefault()` dans `onSubmit`
- [ ] Valider les données côté client ET serveur
- [ ] Afficher des messages d'erreur clairs
- [ ] Désactiver les boutons pendant la soumission
- [ ] Utiliser `required` pour les champs obligatoires
- [ ] Formater automatiquement les données (téléphone, date...)
- [ ] Précharger les valeurs par défaut si disponibles

---

## ✅ Validation des acquis

- [ ] Je comprends la différence entre controlled et uncontrolled components
- [ ] Je sais créer un schéma de validation Zod
- [ ] Je sais gérer un formulaire multi-étapes
- [ ] Je sais afficher les erreurs de validation
- [ ] Je sais soumettre un formulaire de manière asynchrone
- [ ] Je sais désactiver un bouton pendant la soumission

### Questions de validation

1. **Pourquoi utiliser `e.preventDefault()` ?**
   → Pour empêcher le rechargement de la page lors de la soumission

2. **Quelle est la différence entre `.parse()` et `.safeParse()` en Zod ?**
   → `.parse()` lance une exception, `.safeParse()` retourne `{ success, data/error }`

3. **Comment partager les données entre plusieurs étapes d'un formulaire ?**
   → En utilisant un seul objet state qui contient tous les champs

4. **Pourquoi valider côté serveur si on valide déjà côté client ?**
   → Pour la sécurité : le client peut être contourné, le serveur est la source de vérité

---

## 🎯 Prochaine étape

**[Chapitre 6 : Authentification avec Better-auth](./chapitre-06-authentification.md)**

Dans le prochain chapitre :
- Les 3 méthodes d'authentification (email/password, magic link, Google OAuth)
- Comment fonctionne Better-auth
- Sessions et cookies
- Protection de routes
- Déconnexion

---

**[← Chapitre précédent](./chapitre-04-tailwind-css.md)** | **[Retour au sommaire](./README.md)** | **[Chapitre suivant →](./chapitre-06-authentification.md)**
