# Analyse : format des nombres (avant implémentation)

## Objectif

Permettre à l’utilisateur de choisir le **format d’affichage des nombres** (séparateurs milliers et décimaux) dans **Paramètres → Affichage**, indépendamment de la langue de l’interface :
- **Style FR** : `1 234,56` (espace milliers, virgule décimale)
- **Style EN** : `1,234.56` (virgule milliers, point décimal)

Les libellés existent déjà dans les locales (`numberFormat`, `numberFormatDesc`, `numberFormatFR`, `numberFormatEN`) ; la ligne est actuellement en « Bientôt ».

---

## État actuel du projet

### 1. Source de la locale pour les nombres

Partout, la locale utilisée pour `Intl.NumberFormat` est dérivée de **la langue i18n** :
- `i18n.language === 'en'` → `'en-GB'` (ou `'en-US'`)
- sinon → `'fr-FR'`

Il n’existe **aucune préférence dédiée** au format des nombres ; le style suit donc uniquement la langue.

### 2. Fichiers et usages recensés

| Fichier | Usage actuel |
|--------|---------------|
| **ProjetDetailPage.tsx** | `locale = i18n → fr-FR/en-GB` ; `formatMontant` local avec `Intl.NumberFormat(locale, { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })`. Passé au payload d’export (Word/PDF/Excel) et à `ProjetVisualisations`. |
| **ProjetListPage.tsx** | `lang = i18n` ; `formatMontant` en `useCallback([lang])` ; même options Intl. |
| **ProjetFormPage.tsx** | Plusieurs `new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 0 })` pour placeholders (seuils 15 %, 30 %). |
| **ProjetVisualisations.tsx** | `formatMontant` au niveau module avec `i18n.language`. Reçoit aussi `formatMontantFn` en prop (depuis ProjetDetailPage). |
| **DashboardPage.tsx** | `locale = i18n` ; `fmt` (montant XAF) ; `fmtS` (format court 1.5G, 2M, 3K) avec `.toFixed(1)` / `.toFixed(0)` (toujours point décimal). |
| **ReportingPage.tsx** | `formatMontant(val, locale)` et `formatShort(val, locale)` avec `locale === 'en' ? 'en-GB' : 'fr-FR'`. |
| **BudgetPage.tsx** | `locale = i18n` ; `formatMontant` local (XAF). |
| **FournisseurPage.tsx** | `locale = i18n` ; `formatMontant` local (XAF). |
| **wordDocument.ts** | Reçoit `formatMontant` dans le payload, pas d’Intl local. |
| **pdfDocument.tsx** | Idem. |
| **excelDocument.ts** | Idem. |
| **ProjetPdfRapportComplet.tsx**, **ProjetPdfSynthese.tsx**, **ProjetPdfFiche.tsx** | Reçoivent `formatMontant` dans `data` / payload. |

### 3. Constantes communes

- **Devise** : `XAF` partout pour les montants.
- **Décimales** : `maximumFractionDigits: 0` pour les montants en devise ; `maximumFractionDigits` variable ou `toFixed` pour pourcentages / nombres courts.

### 4. Pourcentages

Affichage actuel : `${value} %` (sans formatter dédié). Les décimales (ex. `12,5` vs `12.5`) pourraient à terme suivre la même préférence « format nombres » ; non traité dans cette première mission.

---

## Approche recommandée (alignée date/heure)

1. **Préférence**
   - Fichier `src/utils/numberFormatPreferences.ts` :
     - Clé localStorage : `mika-number-format`
     - Type : `NumberFormatPreference = 'FR' | 'EN'`
     - `getStoredNumberFormat()` avec défaut cohérent (ex. `'FR'` ou dérivé de la locale initiale).

2. **Store**
   - **uiSlice** : state `numberFormat`, reducer `setNumberFormat`, persistance localStorage.

3. **Formatage**
   - Option A : util `formatDisplayNumber(n, { locale, numberFormat, style?: 'currency', currency?: string })` + hook **useFormatNumber** qui lit `state.ui.locale` et `state.ui.numberFormat` et retourne au minimum `formatMontant` (et optionnellement `formatNumber` pour entiers/décimales sans devise).
   - Option B : hook seul qui construit les formatters via `Intl.NumberFormat` avec la locale dérivée de la préférence (FR → `fr-FR`, EN → `en-GB` ou `en-US`).
   - La **locale Intl** pour les nombres sera dérivée de la **préférence** (FR / EN), pas de la langue de l’interface, pour respecter le choix « Format des nombres ».

4. **Paramètres**
   - Remplacer la ligne « Bientôt » du **Format des nombres** par un **select** (ex. « 1 234,56 » / « 1,234.56 ») branché sur `setNumberFormat`.

5. **Remplacements**
   - **ProjetDetailPage** : remplacer le `formatMontant` local par `formatMontant` issu de `useFormatNumber()` (ou équivalent) ; le payload d’export conserve `formatMontant` (déjà le cas).
   - **ProjetListPage**, **BudgetPage**, **FournisseurPage** : idem, utiliser le hook.
   - **ProjetFormPage** : utiliser le formatter du store/préférence pour les placeholders (seuils).
   - **ProjetVisualisations** : soit utiliser le hook en interne et supprimer la dépendance à `i18n`, soit continuer à recevoir `formatMontantFn` depuis la page (qui lui-même viendra du hook).
   - **DashboardPage** : `fmt` et `fmtS` utilisant la préférence (pour `fmtS`, choix à trancher : garder "1.5G" partout ou "1,5G" en FR).
   - **ReportingPage** : remplacer `formatMontant(val, locale)` / `formatShort(val, locale)` par des formatters issus du store (ou hook).

6. **Exports**
   - Aucun changement structurel : **ProjetDetailPage** continuera à passer `formatMontant` dans le payload ; cette fonction sera celle du hook, donc déjà conforme à la préférence.

7. **Points à trancher**
   - Défaut de `numberFormat` : `'FR'` fixe ou dérivé de `getInitialLocale()` (ex. fr → FR, en → EN).
   - Format court (K/M/G) : même séparateur décimal que le format nombres (1,5 M vs 1.5 M) ou laisser en point pour simplicité.
   - Pourcentages avec décimales : inclure dans le périmètre (même préférence) ou laisser pour plus tard.

---

## Résumé des fichiers à modifier (au moment de l’implémentation)

| Fichier | Action |
|--------|--------|
| **numberFormatPreferences.ts** | Créer (type, clé, getStored). |
| **uiSlice** | Ajouter numberFormat, setNumberFormat, persistance. |
| **formatDisplayNumber.ts** (ou équivalent) | Créer si on centralise la logique Intl. |
| **useFormatNumber.ts** | Créer (hook retournant formatMontant, optionnellement formatNumber). |
| **ParametresPage.tsx** | Select format nombres, retirer « numberFormat » de la liste Bientôt. |
| **ProjetDetailPage.tsx** | Remplacer formatMontant local par hook. |
| **ProjetListPage.tsx** | Idem. |
| **ProjetFormPage.tsx** | Utiliser formatter préférence pour placeholders. |
| **ProjetVisualisations.tsx** | Utiliser hook ou garder prop depuis détail. |
| **DashboardPage.tsx** | Remplacer fmt / fmtS par formatters préférence. |
| **ReportingPage.tsx** | Remplacer formatMontant / formatShort par hook/store. |
| **BudgetPage.tsx** | Remplacer formatMontant local par hook. |
| **FournisseurPage.tsx** | Idem. |

Aucun changement nécessaire dans les templates PDF/Word/Excel tant que le payload reçoit `formatMontant` depuis ProjetDetailPage (qui sera alimenté par le hook).

---

*Document généré pour la mission « Format des nombres » — à utiliser comme base avant toute modification du code.*
