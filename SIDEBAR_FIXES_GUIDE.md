# Guide de Correction des Problèmes de Sidebar

## Problèmes Identifiés

1. **Navigation conflictuelle** : La sidebar personnalisée entre en conflit avec la navigation native d'Appsmith
2. **Changement de mode incorrect** : Cliquer sur un sous-menu en mode "Comptabilité" bascule vers "Gestion"
3. **Largeur de sidebar** : La sidebar cache une partie du contenu des pages
4. **Persistance d'état** : Les menus ne restent pas ouverts lors de la navigation

## Solutions Implémentées

### 1. Configuration Appsmith (application.json)
```json
"navigationSetting": {
  "showNavbar": false,
  "showSignIn": false
}
```
- Désactive la navigation native d'Appsmith pour éviter les conflits

### 2. Hook de Navigation (useNavigation.ts)
- Gestion centralisée de l'état de navigation
- Détection automatique du mode basé sur la route
- Persistance des menus ouverts lors de la navigation

### 3. Composant Layout (AppLayout.tsx)
- Gestion correcte de l'espacement pour la sidebar
- Support responsive

### 4. Corrections CSS
- `sidebar-fixes.css` : Corrections générales
- `appsmith-overrides.css` : Corrections spécifiques à Appsmith

### 5. Widget JavaScript (sidebar-fix-widget.js)
- Script à injecter dans chaque page Appsmith
- Corrections automatiques du DOM
- Observer pour les changements dynamiques

## Instructions d'Implémentation

### Étape 1 : Mise à jour des Composants React

1. **Utiliser le nouveau hook dans PennylaneSidebar** :
```typescript
import { useNavigation } from "@/hooks/useNavigation";

const { viewMode, openMenus, setViewMode, toggleMenu, navigateToSubmenu } = useNavigation();
```

2. **Remplacer les liens par des boutons** pour les sous-menus :
```typescript
<button
  onClick={() => navigateToSubmenu(subItem.href, item.id)}
  className="..."
>
  {subItem.label}
</button>
```

### Étape 2 : Configuration Appsmith

1. **Désactiver la navigation native** dans `application.json`
2. **Ajouter le widget de correction** dans chaque page :
   - Créer un widget HTML
   - Copier le contenu de `sidebar-fix-widget.js`
   - Placer le widget en haut de chaque page

### Étape 3 : Styles CSS

1. **Importer les styles** dans votre application :
```typescript
import '@/styles/sidebar-fixes.css';
import '@/styles/appsmith-overrides.css';
```

2. **Ou ajouter directement dans Appsmith** via un widget HTML avec balises `<style>`

### Étape 4 : Test et Validation

1. **Tester la navigation** :
   - Basculer entre modes Comptabilité/Gestion
   - Cliquer sur les sous-menus
   - Vérifier que les menus restent ouverts

2. **Vérifier l'affichage** :
   - Contenu non caché par la sidebar
   - Tables et widgets correctement dimensionnés
   - Modales bien positionnées

## Code à Ajouter dans Chaque Page Appsmith

Créer un widget HTML avec ce code :

```html
<script>
// Coller ici le contenu de sidebar-fix-widget.js
</script>
```

## Corrections Spécifiques par Page

### Page Validation
- Vérifier que les tables d'écritures comptables ne débordent pas
- S'assurer que les boutons d'export sont visibles

### Page Fournisseurs
- Contrôler l'affichage des formulaires de saisie
- Vérifier les modales de validation

### Page Dashboard
- Ajuster les graphiques et widgets de statistiques
- Vérifier les cartes de résumé

## Dépannage

### Si la sidebar ne s'affiche pas correctement :
1. Vérifier que les styles CSS sont bien chargés
2. Contrôler la console pour les erreurs JavaScript
3. S'assurer que le widget de correction est présent sur la page

### Si les menus ne restent pas ouverts :
1. Vérifier l'implémentation du hook `useNavigation`
2. Contrôler que `navigateToSubmenu` est utilisé au lieu de `Link`

### Si le contenu est toujours caché :
1. Forcer l'application des styles avec `!important`
2. Augmenter la fréquence du script de correction
3. Vérifier les sélecteurs CSS pour les nouveaux éléments Appsmith

## Maintenance

- Surveiller les mises à jour d'Appsmith qui pourraient changer les sélecteurs CSS
- Tester régulièrement sur différentes tailles d'écran
- Mettre à jour les routes dans le hook de navigation selon les nouvelles pages