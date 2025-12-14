# 📐 SEKA Design System - Guide Complet

## Vue d'ensemble

SEKA est une copie des fonctionnalités de **Pennylane** avec un système de design cohérent et uniforme. Tous les composants, couleurs, espacements et layouts doivent respecter ce guide pour assurer une expérience utilisateur fluide et professionnelle.

---

## 🎨 Palette de Couleurs

### Couleurs Primaires (Teal/Dark Green)
```
Primary 500: #0d4a44 (Couleur principale de la marque)
Primary 600: #0a3d38 (État hover)
Primary 700: #08302c (État actif)
```

### Couleurs d'Accent
```
Cyan:   #06b6d4
Blue:   #3b82f6
Purple: #8b5cf6
Orange: #f97316
Teal:   #14b8a6
```

### Couleurs de Statut
```
Succès:  #10b981 (Vert)
Warning: #f59e0b (Orange)
Danger:  #ef4444 (Rouge)
Info:    #3b82f6 (Bleu)
```

### Couleurs Neutres
```
Neutral 50:  #f9fafb (Très clair)
Neutral 100: #f3f4f6 (Clair)
Neutral 200: #e5e7eb (Gris léger)
Neutral 500: #6b7280 (Gris moyen)
Neutral 700: #374151 (Gris foncé)
Neutral 900: #111827 (Très foncé)
```

---

## 🔘 Boutons

### Variantes Disponibles

#### 1. Primary (Action principale)
```tsx
<Button variant="primary">Sauvegarder</Button>
```
- Couleur: Teal (#0d4a44)
- Utilisé pour: Actions principales et CTA
- Hover: Background plus foncé

#### 2. Secondary (Action alternative)
```tsx
<Button variant="secondary">Annuler</Button>
```
- Couleur: Gris clair
- Utilisé pour: Actions alternatives
- Hover: Background légèrement plus foncé

#### 3. Tertiary (Action subtile)
```tsx
<Button variant="tertiary">Plus d'informations</Button>
```
- Style: Transparent avec bordure
- Utilisé pour: Actions secondaires
- Hover: Background gris léger

#### 4. Danger (Action destructive)
```tsx
<Button variant="danger">Supprimer</Button>
```
- Couleur: Rouge (#ef4444)
- Utilisé pour: Suppressions, confirmations dangereuses
- Hover: Red plus foncé

#### 5. Success (Action positive)
```tsx
<Button variant="success">Confirmer</Button>
```
- Couleur: Vert (#10b981)
- Utilisé pour: Actions positives/confirmations
- Hover: Vert plus foncé

#### 6. Outline (Bouton borduré)
```tsx
<Button variant="outline">Bordure</Button>
```
- Style: Bordure primaire avec fond blanc
- Utilisé pour: Actions importantes secondaires

### Tailles de Boutons

```tsx
<Button size="xs">Extra Small</Button>  {/* 8px h, text-xs */}
<Button size="sm">Small</Button>        {/* 9px h, text-sm */}
<Button size="md">Medium</Button>       {/* 10px h, text-sm (défaut) */}
<Button size="lg">Large</Button>        {/* 12px h, text-base */}
```

### Props Additionnels

```tsx
// Full width
<Button fullWidth>Largeur complète</Button>

// Avec icône
<Button icon={<Plus />}>Ajouter</Button>

// Icône à droite
<Button icon={<ChevronRight />} iconPosition="right">Suivant</Button>

// État loading
<Button loading>Chargement...</Button>

// Disabled
<Button disabled>Désactivé</Button>
```

---

## 📝 Formulaires

### Structure de Formulaire

```tsx
<Form onSubmit={handleSubmit}>
  <FormSection title="Informations Générales" description="Remplissez les informations de base">
    <FormRow columns={2}>
      <FormGroup label="Prénom" required error={errors.firstName}>
        <Input name="firstName" />
      </FormGroup>
      
      <FormGroup label="Nom" required error={errors.lastName}>
        <Input name="lastName" />
      </FormGroup>
    </FormRow>
  </FormSection>

  <FormSection title="Adresse" description="Entrez votre adresse complète">
    <FormGroup label="Rue" required>
      <Input name="street" />
    </FormGroup>
  </FormSection>

  <FormActions align="end">
    <Button variant="secondary">Annuler</Button>
    <Button type="submit">Soumettre</Button>
  </FormActions>
</Form>
```

### Input Variantes

```tsx
// Default
<Input placeholder="Entrez du texte" />

// Avec label
<Input label="Email" type="email" />

// Avec description
<Input label="Téléphone" description="Format: +33 6 12 34 56 78" />

// Avec erreur
<Input label="Mot de passe" error="Le mot de passe est obligatoire" />

// Avec icône
<Input icon={<Mail />} placeholder="E-mail" />

// Disabled
<Input disabled placeholder="Désactivé" />

// Variante subtle
<Input variant="subtle" placeholder="Entrée subtile" />
```

---

## 🎭 Composants UI

### Cards

```tsx
// Card par défaut
<Card>
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
    <CardDescription>Description optionnelle</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu de la carte
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Card interactive
<Card interactive hoverable>
  Contenu interactif
</Card>

// Card variantes
<Card variant="elevated">Élevée</Card>
<Card variant="outlined">Bordée</Card>
<Card variant="default">Par défaut</Card>
```

---

## 📐 Layouts

### Container (Wrapper principal)

```tsx
<Container size="lg">
  <PageHeader 
    title="Facturation"
    description="Gérez vos factures et paiements"
    action={<Button variant="primary">Nouvelle facture</Button>}
  />
  
  <Grid columns={3} gap="md">
    <Card>Item 1</Card>
    <Card>Item 2</Card>
    <Card>Item 3</Card>
  </Grid>
</Container>
```

### Sizes de Container
```
sm:   max-width: 42rem  (672px)
md:   max-width: 56rem  (896px)
lg:   max-width: 64rem  (1024px) - Défaut
xl:   max-width: 80rem  (1280px)
full: 100%
```

### Section (Zones thématiques)

```tsx
<Section spacing="lg" background="neutral">
  <Container>
    <h2>Titre de la section</h2>
    <p>Contenu de la section</p>
  </Container>
</Section>
```

### Grid (Disposition en grille)

```tsx
// 3 colonnes par défaut
<Grid columns={3} gap="md">
  <Card>Élément 1</Card>
  <Card>Élément 2</Card>
  <Card>Élément 3</Card>
</Grid>

// 2 colonnes
<Grid columns={2}>
  <Card>Élément A</Card>
  <Card>Élément B</Card>
</Grid>
```

### Flex (Disposition flexible)

```tsx
<Flex direction="row" align="center" justify="between" gap="md">
  <h3>Titre</h3>
  <Button>Action</Button>
</Flex>
```

### Stack (Pile verticale)

```tsx
<Stack gap="lg">
  <Card>Élément 1</Card>
  <Card>Élément 2</Card>
  <Card>Élément 3</Card>
</Stack>
```

---

## 📏 Espacements

```
xs:  4px   - Espacements très petits
sm:  8px   - Espacements petits
md:  16px  - Espacements moyens (défaut)
lg:  24px  - Espacements grands
xl:  32px  - Espacements très grands
2xl: 40px  - Espacements énormes
3xl: 48px  - Espacements massifs
```

---

## 🎯 Bonnes Pratiques

### ✅ À Faire

1. **Utiliser les composants UI du système de design**
   ```tsx
   // ✅ BON
   <Button variant="primary">Sauvegarder</Button>
   <Card>Contenu</Card>
   <Grid columns={3}><Item /></Grid>
   ```

2. **Respecter la hiérarchie des couleurs**
   - Primary pour les actions principales
   - Secondary pour les alternatives
   - Status pour les retours utilisateur

3. **Utiliser les variantes de taille cohérentes**
   ```tsx
   // ✅ BON
   <Button size="md" />
   <Input />
   ```

4. **Grouper logiquement les éléments**
   ```tsx
   // ✅ BON
   <FormSection title="Adresse">
     <FormRow columns={2}>
       <FormGroup><Input /></FormGroup>
     </FormRow>
   </FormSection>
   ```

### ❌ À Éviter

1. **Hardcoder des couleurs**
   ```tsx
   // ❌ MAUVAIS
   <div className="bg-[#0d4a44]">
   
   // ✅ BON
   <div className="bg-primary-500">
   ```

2. **Mélanger différentes variantes de boutons**
   ```tsx
   // ❌ MAUVAIS
   <button className="bg-blue-500">Mélangé</button>
   
   // ✅ BON
   <Button variant="primary">Cohérent</Button>
   ```

3. **Utiliser des espacements inconsistants**
   ```tsx
   // ❌ MAUVAIS
   <div className="p-5 gap-3">
   
   // ✅ BON
   <div className="p-6 gap-4">
   ```

4. **Ignorer la responsivité**
   ```tsx
   // ❌ MAUVAIS
   <Grid columns={4}>
   
   // ✅ BON (1 col sur mobile, 2 sur tablet, 3+ sur desktop)
   <Grid columns={3}>
   ```

---

## 🔄 Comparaison Pennylane ↔ SEKA

Tous les éléments UI disponibles sur Pennylane doivent être reproductibles sur SEKA :

| Feature | Pennylane | SEKA |
|---------|-----------|------|
| Formulaires | ✅ | ✅ |
| Tableaux | ✅ | ✅ |
| Modales | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Graphiques | ✅ | ✅ |
| Cartes | ✅ | ✅ |
| Listes | ✅ | ✅ |
| Navigation | ✅ | ✅ |

---

## 📚 Ressources

- **Design System File**: `src/lib/design-system.ts`
- **Components**: `src/components/ui/`
- **Layouts**: `src/components/layout/`
- **Utilities**: `src/lib/utils.ts`
- **Tailwind Config**: `tailwind.config.ts`

---

## 🎯 Prochaines Étapes

1. ✅ Système de design créé
2. ⏳ Refactoriser les pages existantes
3. ⏳ Harmoniser les modales et notifications
4. ⏳ Tester la cohérence visuelle
5. ⏳ Mettre à jour la documentation
