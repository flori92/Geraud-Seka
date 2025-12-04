# Audit des Boutons Non Fonctionnels

**Date**: 4 décembre 2025  
**Statut**: En cours de correction

## ✅ Corrigés

### Comptabilité
- [x] **Plan comptable** (`accounting/ledger.tsx`) - Bouton "Nouveau compte"
- [x] **Journal** (`accounting/journal.tsx`) - Bouton "Nouvelle écriture"

## 🔧 À Corriger (Priorité Haute)

### Pages Principales avec alert()

1. **Clients** (`clients.tsx`)
   - Ligne 48: `alert("Client créé avec succès !")`
   - Ligne 56: `alert("Erreur lors de la création du client")`
   - **Action**: Remplacer par toast notifications

2. **Activités** (`activities.tsx`)
   - Ligne 54: `alert("Activité créée avec succès !")`
   - Ligne 62: `alert("Erreur lors de la création de l'activité")`
   - **Action**: Remplacer par toast notifications

3. **Trésorerie - Comptes** (`treasury/accounts.tsx`)
   - Ligne 85: `alert(err.response?.data?.detail || 'Erreur lors de la création du compte')`
   - **Action**: Remplacer par toast notifications

4. **Documents - Validation** (`documents/[id]/validate.tsx`)
   - Ligne 81: `alert("Document validé avec succès !")`
   - Ligne 85: `alert("Erreur lors de la validation")`
   - **Action**: Remplacer par toast notifications

5. **Exports** (`exports.tsx`)
   - Ligne 47: `alert("Export téléchargé avec succès !")`
   - Ligne 50: `alert("Erreur lors de l'export")`
   - **Action**: Remplacer par toast notifications

6. **Pricing** (`pricing.tsx`)
   - Ligne 97: `alert(\`Abonnement ${tier.name} activé avec succès via Stripe !\`)`
   - Ligne 109: `alert('Erreur lors de la création du lien de paiement.')`
   - Ligne 114: `alert('Une erreur est survenue lors du paiement.')`
   - **Action**: Remplacer par toast notifications

## ⚠️ Pages Spéciales (Priorité Basse)

7. **Landing Page** (`landing.tsx`)
   - Ligne 10: `alert(\`Merci ! Nous vous contacterons sur ${email}\`)`
   - **Note**: Page marketing, peut garder alert temporairement

8. **Sentry Test** (`sentry-test.tsx`)
   - Lignes 14, 37, 51: Alerts pour tests Sentry
   - **Note**: Page de test, garder les alerts

## 📋 Plan d'Action

### Phase 1 (Immédiate)
- [ ] Corriger `clients.tsx`
- [ ] Corriger `activities.tsx`
- [ ] Corriger `treasury/accounts.tsx`

### Phase 2 (Court terme)
- [ ] Corriger `documents/[id]/validate.tsx`
- [ ] Corriger `exports.tsx`
- [ ] Corriger `pricing.tsx`

### Phase 3 (Optionnel)
- [ ] Améliorer `landing.tsx` avec un vrai formulaire
- [ ] Garder `sentry-test.tsx` tel quel (page de debug)

## 🎯 Objectif

Remplacer tous les `alert()` par le système de toast notifications pour une meilleure UX.
