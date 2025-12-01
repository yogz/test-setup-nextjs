# Poubelle - Fichiers Inutilisés

Ce dossier contient les fichiers qui ne sont plus utilisés dans le projet.

## Liste des fichiers déplacés

### Date: 30 novembre 2024

| Fichier | Origine | Raison |
|---------|---------|--------|
| `coach-calendar.tsx` | `components/coach/` | Non importé/utilisé nulle part dans le projet |
| `create-session-form.tsx` | `components/coach/` | Non importé/utilisé nulle part dans le projet |
| `sessions-calendar.tsx` | `components/coach/` | Non importé/utilisé nulle part dans le projet |

#### Description des fichiers

- **coach-calendar.tsx**: Composant de calendrier hebdomadaire avec vue big-calendar (probablement remplacé par `daily-slot-list.tsx`)
- **create-session-form.tsx**: Formulaire de création de session (fonctionnalité probablement intégrée ailleurs)
- **sessions-calendar.tsx**: Vue calendrier mensuel des sessions (non utilisée dans l'interface actuelle)

---

### Date: 1er décembre 2024

Suite à une analyse complète du projet, les fichiers suivants ont été identifiés comme non utilisés et déplacés :

#### Composants UI

| Fichier | Origine | Raison |
|---------|---------|--------|
| `context-menu.tsx` | `components/ui/` | Aucun import trouvé dans le projet |

- **context-menu.tsx**: Composant de menu contextuel Radix UI jamais utilisé dans l'application

#### Scripts de Développement

| Fichier | Origine | Raison |
|---------|---------|--------|
| `check-dayofweek.ts` | `scripts/` | Script de vérification ponctuel, non référencé |
| `check-franz.ts` | `scripts/` | Script de vérification pour utilisateur test "Franz" |
| `debug-slots.ts` | `scripts/` | Script de débogage des créneaux, non utilisé |
| `fix-franz-availability.ts` | `scripts/` | Script de correction ponctuel pour Franz |
| `migrate-onboarding.ts` | `scripts/` | Script de migration obsolète |
| `verify-coach.ts` | `scripts/` | Script de vérification ponctuel |

- Ces scripts étaient probablement des utilitaires ponctuels pour du débogage ou des migrations spécifiques

#### API Routes de Développement

| Dossier/Fichier | Origine | Raison |
|----------------|---------|--------|
| `debug-sessions/` | `app/api/dev/` | Route de débogage non appelée dans le code |
| `delete-test-users/` | `app/api/dev/` | Route utilitaire non utilisée |
| `fix-session-titles/` | `app/api/dev/` | Route de correction ponctuelle |
| `reset-test-users/` | `app/api/dev/` | Route utilitaire non utilisée |
| `seed-users/` | `app/api/dev/` | Route de seeding non référencée |

- Ces routes API étaient des endpoints de développement/débogage jamais appelées par l'application

#### Fichiers d'Exemples et Documentation

| Fichier | Origine | Raison |
|---------|---------|--------|
| `examples.ts` | `lib/validations/` | Fichier d'exemples de validation Zod, code de référence uniquement |
| `rbac-example.tsx` | `components/examples/` | Composant d'exemple RBAC, jamais importé |

- **examples.ts**: Contient des exemples de validation Zod pour documentation des développeurs
- **rbac-example.tsx**: Exemples de composants React avec RBAC pour référence

#### Fichiers Utilitaires

| Fichier | Origine | Raison |
|---------|---------|--------|
| `proxy.ts` | Racine du projet | Configuration proxy Next.js non utilisée (pourrait être un ancien middleware) |

- **proxy.ts**: Configuration de proxy Next.js 16 minimale, jamais importée

## Notes

Ces fichiers ont été déplacés ici au lieu d'être supprimés directement pour permettre une récupération facile si nécessaire.

La structure des dossiers dans `/poubelle` reflète l'arborescence d'origine pour faciliter la localisation et la restauration éventuelle.

## Action recommandée

Si ces fichiers ne sont pas nécessaires après quelques semaines, ils peuvent être supprimés définitivement.

### Dépendances à réviser

Si `context-menu.tsx` n'est pas restauré, considérez la désinstallation de :
```bash
npm uninstall @radix-ui/react-context-menu
```

## Restauration

Pour restaurer un fichier :
```bash
# Exemple pour context-menu.tsx
mv poubelle/components/ui/context-menu.tsx components/ui/
```
