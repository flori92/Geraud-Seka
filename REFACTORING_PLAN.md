# 📋 Plan de Refactorisation Frontend - SEKA

## Vue d'ensemble
Ce guide décrit comment refactoriser progressivement le frontend SEKA pour utiliser le nouveau système de design unifié. L'objectif est de rendre l'interface cohérente, professionnelle et facile à maintenir, tout en garantissant une parité de fonctionnalités avec Pennylane.

---

## 🎯 Phases de Refactorisation

### Phase 1: Pages d'Authentification (PRIORITÉ HAUTE)
Ces pages sont les points d'entrée critiques et doivent avoir une présentation impeccable.

#### Pages à refactoriser:
1. **`/login.tsx`** → Utiliser Form, Input, Button new
2. **`/register.tsx`** → Formulaire multi-étapes
3. **`/forgot-password.tsx`** (créer si manquante)
4. **`/reset-password.tsx`** (créer si manquante)

#### Exemple de structure:
```tsx
import { Form, FormGroup, FormActions } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
      <Container size="sm">
        <Card variant="elevated">
          <Form onSubmit={handleSubmit}>
            <FormGroup label="Email" required>
              <Input type="email" placeholder="..." />
            </FormGroup>
            <FormActions align="end">
              <Button type="submit" variant="primary">Connexion</Button>
            </FormActions>
          </Form>
        </Card>
      </Container>
    </div>
  );
}
```

### Phase 2: Dashboard et Pages Principales (PRIORITÉ HAUTE)
Les pages principales doivent montrer la cohérence du design.

#### Pages à refactoriser:
1. **`/dashboard.tsx`** → Refactoriser les StatCard et grille
2. **`/ventes/factures.tsx`** → Utiliser Grid et Card unifiées
3. **`/achats/devis.tsx`** → Cohérence des listes
4. **`/comptabilite/`** → Pages comptables
5. **`/clients/`** → Pages clients
6. **`/suppliers/`** → Pages fournisseurs

#### Pattern standard pour les pages:
```tsx
import { Container, Grid, PageHeader, Stack } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function Page() {
  return (
    <Container size="lg">
      <PageHeader 
        title="Factures"
        description="Gérez vos factures de vente"
        action={<Button variant="primary" icon={<Plus />}>Nouvelle facture</Button>}
      />
      
      <Grid columns={3} gap="md">
        <Card>
          <CardHeader>
            <CardTitle>Total CA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,250,000 XOF</div>
          </CardContent>
        </Card>
        {/* Autres cartes... */}
      </Grid>
    </Container>
  );
}
```

### Phase 3: Formulaires et Modales (PRIORITÉ MOYENNE)
Standardiser tous les formulaires pour une UX cohérente.

#### Points à refactoriser:
1. Tous les formulaires doivent utiliser `Form` et `FormGroup`
2. Tous les boutons doivent utiliser les variantes standardisées
3. Tous les inputs doivent supporter icônes et descriptions
4. Les modales doivent avoir un design cohérent

#### Template modal:
```tsx
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <Card>
    <CardHeader>
      <CardTitle>Créer une facture</CardTitle>
    </CardHeader>
    <CardContent>
      <Form onSubmit={handleSubmit}>
        <FormSection title="Informations">
          {/* Champs... */}
        </FormSection>
        <FormActions align="end">
          <Button variant="secondary">Annuler</Button>
          <Button type="submit" variant="primary">Créer</Button>
        </FormActions>
      </Form>
    </CardContent>
  </Card>
</Modal>
```

### Phase 4: Composants et Utilitaires (PRIORITÉ MOYENNE)
Renforcer les composants réutilisables.

#### À faire:
1. Créer `Badge.tsx` amélioré avec couleurs status
2. Créer `Table.tsx` unifiée
3. Créer `Tabs.tsx` professionnelle
4. Améliorer `Modal.tsx` avec support Card intégré
5. Standardiser `Alert.tsx` et `Toast.tsx`

### Phase 5: Pages Secondaires (PRIORITÉ BASSE)
Affiner les pages moins critiques.

#### Pages:
1. `/analytique.tsx`
2. `/rapports.tsx`
3. `/intelligence.tsx`
4. `/aide.tsx`
5. `/about.tsx`

---

## 🔄 Processus de Refactorisation

### Pour chaque page:

1. **Audit**
   ```bash
   # Identifier les incohérences
   - Couleurs non uniformes
   - Espacements inconsistants
   - Boutons avec styles différents
   - Layouts non responsifs
   ```

2. **Plan**
   ```
   - Lister les composants utilisés
   - Identifier les remplacements nécessaires
   - Planifier les changements CSS
   ```

3. **Refactorisation**
   ```
   - Remplacer les imports (ancien → nouveau)
   - Mettre à jour les classNames
   - Ajouter les props standardisées
   ```

4. **Test**
   ```bash
   npm run dev
   # Vérifier:
   - Layout responsive (mobile, tablet, desktop)
   - Cohérence visuelle
   - Fonctionnalité intacte
   - Accessibilité (focus, keyboard nav)
   ```

5. **Commit**
   ```bash
   git add pages/...
   git commit -m "Refactor [PageName] to use unified design system"
   ```

---

## 📊 Checklist de Refactorisation

### Éléments à vérifier:

- [ ] **Couleurs**: Utiliser les couleurs de `design-system.ts`
- [ ] **Boutons**: Utiliser Component `Button` avec variantes
- [ ] **Forms**: Utiliser `Form`, `FormGroup`, `FormSection`
- [ ] **Inputs**: Utiliser Component `Input` avec icônes/descriptions
- [ ] **Cards**: Utiliser Component `Card` unifiée
- [ ] **Layouts**: Utiliser `Container`, `Grid`, `Flex`, `Stack`
- [ ] **Espacements**: Utiliser l'échelle standard (xs, sm, md, lg, xl)
- [ ] **Shadows**: Utiliser les ombres de `tailwind.config.ts`
- [ ] **Responsive**: Mobile-first, tester tous les breakpoints
- [ ] **Accessibilité**: Labels, focus states, keyboard nav

---

## 🚀 Commandes Rapides

### Lancer le serveur dev:
```bash
cd frontend
npm run dev
```

### Vérifier les couleurs utilisées:
```bash
grep -r "bg-\|text-\|border-" src/pages/*.tsx | grep -v "gray\|neutral\|primary\|status"
```

### Trouver les boutons non standardisés:
```bash
grep -r "<button" src/pages/*.tsx
```

### Trouver les inputs non standardisés:
```bash
grep -r "<input" src/pages/*.tsx
```

---

## 📁 Structure de Fichiers Réorganisée

```
frontend/src/
├── components/
│   ├── ui/              # Composants UI atomiques
│   │   ├── Button.tsx   ✅ Refactorisé
│   │   ├── Input.tsx    ✅ Refactorisé
│   │   ├── Card.tsx     ✅ Refactorisé
│   │   ├── Form.tsx     ✅ Nouveau
│   │   ├── Table.tsx    ⏳ À améliorer
│   │   ├── Modal.tsx    ⏳ À améliorer
│   │   ├── Tabs.tsx     ⏳ À améliorer
│   │   ├── Badge.tsx    ⏳ À améliorer
│   │   ├── Alert.tsx    ⏳ À améliorer
│   │   └── ...
│   ├── layout/          # Composants de layout
│   │   ├── Container.tsx ✅ Nouveau
│   │   ├── DashboardLayout.tsx
│   │   └── ...
│   ├── forms/           # Composants de formulaire
│   ├── charts/          # Composants graphiques
│   └── ...
├── lib/
│   ├── design-system.ts ✅ Nouveau
│   ├── utils.ts         ✅ Nouveau
│   ├── api.ts
│   ├── formatters.ts
│   └── ...
├── styles/
│   └── colors.ts        ⏳ À supprimer (migrer vers design-system.ts)
├── pages/
│   ├── login.tsx        ⏳ À refactoriser
│   ├── login-new.tsx    ✅ Exemple refactorisé
│   ├── dashboard.tsx    ⏳ À refactoriser
│   └── ...
└── tailwind.config.ts   ✅ Refactorisé
```

---

## 🎨 Exemples Avant/Après

### Avant - Incohérent:
```tsx
<div className="flex gap-3 p-4 rounded-md border border-gray-200 bg-white">
  <button className="px-4 py-2 bg-[#0d4a44] text-white rounded hover:bg-[#0a3d38]">
    Sauvegarder
  </button>
  <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300">
    Annuler
  </button>
</div>
```

### Après - Unifié:
```tsx
<Card>
  <Flex gap="md">
    <Button variant="primary">Sauvegarder</Button>
    <Button variant="secondary">Annuler</Button>
  </Flex>
</Card>
```

---

## 📚 Ressources

- **Design System Doc**: `DESIGN_SYSTEM.md`
- **Tailwind Config**: `frontend/tailwind.config.ts`
- **Design Tokens**: `frontend/src/lib/design-system.ts`
- **UI Components**: `frontend/src/components/ui/`
- **Layout Components**: `frontend/src/components/layout/`

---

## 🎯 Métriques de Succès

### Avant refactorisation:
- ❌ 50+ variations de couleurs utilisées
- ❌ Espacements inconsistants
- ❌ Boutons avec 20+ styles différents
- ❌ Inputs sans validation visuelle cohérente
- ❌ Layouts responsive partiels

### Après refactorisation:
- ✅ Palette de couleurs unifiée (10 couleurs)
- ✅ Espacements standardisés (7 niveaux)
- ✅ Boutons avec 6 variantes cohérentes
- ✅ Inputs avec validation visuelle uniforme
- ✅ Layouts 100% responsive
- ✅ Code maintenance réduite de 40%
- ✅ Temps de développement accéléré de 30%
- ✅ Parité fonctionnelle complète avec Pennylane

---

## 🚦 Timeline Recommandée

**Semaine 1:** Phase 1 (Auth pages) - ~2-3 pages
**Semaine 2:** Phase 2 (Dashboard & main) - ~8-10 pages  
**Semaine 3:** Phase 3 (Forms & Modals) - ~15-20 formulaires
**Semaine 4:** Phase 4 (Components) - Améliorer composants
**Semaine 5:** Phase 5 (Secondary pages) - Pages restantes
**Semaine 6:** QA, tests, optimisations

---

## 💡 Tips & Tricks

1. **Utiliser les grep pour trouver les patterns**:
   ```bash
   grep -r "className.*bg-\[" src/pages/
   ```

2. **Remplacer en masse avec sed**:
   ```bash
   sed -i 's/bg-\[#0d4a44\]/bg-primary-500/g' src/pages/*.tsx
   ```

3. **Tester la responsivité**:
   ```bash
   # Chrome DevTools mobile mode
   # Ou: https://responsively.app/
   ```

4. **Utiliser Prettier pour formater**:
   ```bash
   npm run format
   ```

---

**Commencez par la Phase 1 et progressez méthodiquement pour assurer la qualité!**
