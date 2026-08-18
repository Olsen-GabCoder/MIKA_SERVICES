# V1.B Report — Paddings mobile + Tap targets 44px

Date : 2026-05-25
Branche : projets-liste-v1-mobile-elevation
Commit : feat(projets-liste): V1.B — paddings mobile + tap targets 44px

---

## Changements appliques

### Paddings horizontaux mobile

| Element | Avant | Apres | Lignes |
|---|---|---|---|
| Hero header container | `px-8` | `px-4 md:px-8` | ~426 |
| Zone defilable | `px-8` | `px-4 md:px-8` | ~489 |
| Pagination container | `px-6` | `px-4 md:px-6` | ~852 |

**Gain mobile** : 32px (360px viewport : contenu utile passe de 296px a 328px)

### Tap targets 44px

| Element | Classe ajoutee | Lignes |
|---|---|---|
| Bouton "Rechercher" | `min-h-[44px] md:min-h-0` | ~524 |
| Bouton "Appliquer filtres" | `min-h-[44px] md:min-h-0` | ~573 |
| Bouton "Reinitialiser" | `min-h-[44px] md:min-h-0` | ~581 |
| 4x Selects filtres | `min-h-[44px] md:min-h-0` | ~565 |
| Bouton clear recherche (x) | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` | ~519 |
| Bouton "Modifier" (card mobile) | `min-h-[44px]` | ~833 |
| Bouton "Supprimer" (card mobile) | `min-h-[44px]` | ~841 |
| Select taille pagination | `min-h-[44px] md:min-h-0` | ~865 |
| Bouton "Precedent" | `min-h-[44px] md:min-h-0` | ~874 |
| Bouton "Suivant" | `min-h-[44px] md:min-h-0` | ~884 |

### Bouton Export Excel (debordement mobile)

- Label texte masque sur mobile : `<span className="hidden md:inline">`
- Icone toujours visible
- `aria-label` ajoute pour accessibilite lecteur d'ecran
- `px-4` reduit a `px-3 md:px-4` pour economiser l'espace

### Pagination restructuree

- Conteneur : `flex-col md:flex-row` (empilement vertical mobile)
- Ligne 1 mobile : range + select taille (justify-between)
- Ligne 2 mobile : boutons prev/next (justify-center, flex-1 pour largeur egale)
- Desktop : comportement horizontal inchange (md:flex-row md:justify-between)

---

## Observations visuelles par viewport

### 360px (Galaxy S8, iPhone SE)
- Contenu utile : 328px (vs 296px avant) — gain significatif
- Filtres selects : wrappent proprement sur 2 lignes, tap targets confortables
- Pagination : empilement vertical propre, boutons pleine largeur
- Export : icone seule, pas de debordement
- Pas de scrollbar horizontale

### 390px (iPhone 14)
- Memes benefices, plus d'espace respirable entre les selects
- Boutons pagination legerement plus larges (flex-1)

### 412px (Pixel 7)
- Rendu optimal, filtres tiennent sur 2 lignes sans serrage
- Cards projet : actions bien alignees avec tap zones confortables

### Desktop >= 768px (md breakpoint)
- AUCUN changement visible : min-h-0 annule les min-h mobile
- Paddings reviennent a px-8 / px-6 comme avant
- Export : label + icone affiches normalement
- Pagination : layout horizontal inchange

---

## Build check

- `tsc -b --noEmit` : OK (0 erreurs)
- `npm run build` : OK (built in ~60s, PWA precache 114 entries)

---

## Dette technique reportee

| Item | Raison du report | Vague cible |
|---|---|---|
| Drawer filtres mobile (bottom sheet) | Hors scope V1.B (metriques seules) | V1.C |
| Selects natifs -> combobox custom | Necessite composant partage | V1.D+ |
| Input recherche trop petit en hauteur sur mobile | Pas de plainte actuelle, input natif OK | V1.D si besoin |
