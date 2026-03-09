# Référence : template PDF du procès-verbal (PV)

## 1. Fichier à modifier pour le design et la présentation

**Un seul fichier à toucher pour le design/présentation du PDF PV :**

```
frontend_web/mika-services-frontend/src/features/reunionhebdo/export/pdfDocument.tsx
```

- C’est le **template** du PDF (composant React-PDF qui produit les pages).
- Toute modification de **style**, **mise en page**, **ordre des blocs** ou **textes affichés** se fait dans ce fichier.
- **Ne pas** modifier les types de données ni la façon dont le payload est construit (sauf si tu as une raison métier précise et que tu demandes avant).

---

## 2. Règle stricte : pas de régression

- **Ne pas** changer les **noms des props** du composant : `PVDocumentPdf` reçoit exactement `{ payload: PVDocumentPayload }`. Si tu renommes ou ajoutes des champs dans `types.ts`, il faudra adapter `pdfDocument.tsx` et tout appelant.
- **Ne pas** supprimer ou renommer l’**export** `PVDocumentPdf` : il est importé dynamiquement dans `index.ts` ; une erreur d’import casserait le téléchargement du PV.
- **Ne pas** utiliser d’**API ou de hooks React** non autorisés par `@react-pdf/renderer` (pas de `useState` / `useEffect` pour la mise en page, pas de DOM, pas de `className` Tailwind). Seuls les composants et la **StyleSheet** de `@react-pdf/renderer` sont utilisables dans ce fichier.
- **Tester** après chaque changement : lancer « Télécharger le PV » et ouvrir le PDF pour vérifier que tout s’affiche et que le fichier se génère sans erreur.

---

## 3. Dépendances du fichier (ce qu’il utilise et qui l’utilise)

### Ce que `pdfDocument.tsx` importe (dépendances entrantes)

| Import | Rôle | Risque si modifié ailleurs |
|--------|------|-----------------------------|
| `@react-pdf/renderer` | `Document`, `Page`, `View`, `Text`, `Image`, `StyleSheet` | Changer de version peut casser la génération PDF. |
| `./types` | `PVDocumentPayload` | Si la structure de `PVDocumentPayload` change (champs supprimés/renommés), il faudra adapter ce fichier. |

### Qui importe `pdfDocument.tsx` (dépendances sortantes)

| Fichier | Rôle |
|---------|------|
| `frontend_web/.../reunionhebdo/export/index.ts` | Import dynamique `import('./pdfDocument')` pour obtenir `PVDocumentPdf` et appeler `pdf(doc).toBlob()`. |

Donc : toute modification du **nom du composant exporté** ou de la **signature** `(props: { payload: PVDocumentPayload })` doit être répercutée dans `index.ts` (et éventuellement dans les types dans `types.ts`).

### Fichiers liés (à connaître, à ne modifier qu’en connaissance de cause)

| Fichier | Rôle |
|---------|------|
| `.../reunionhebdo/export/types.ts` | Définit `PVDocumentPayload` et `ProjetDonneesSemaine`. Changer les champs ici impose de mettre à jour `pdfDocument.tsx` (et éventuellement la construction du payload dans la page). |
| `.../reunionhebdo/export/index.ts` | Orchestre l’appel à `PVDocumentPdf`, `pdf(...).toBlob()` et le téléchargement. Ne pas modifier sa logique sauf besoin précis (ex. nom du fichier, format). |
| `.../reunionhebdo/pages/ReunionHebdoPVPage.tsx` | Construit le `payload` (reunion, projetsData, formatDate, formatTime) et appelle `generatePVDocument(payload)`. Les champs disponibles dans le PDF sont ceux fournis par ce payload.|

---

## 4. Risques par type de modification

### 4.1 Modifier les **styles** (couleurs, polices, marges, espacements)

- **Risque** : texte illisible, blocs qui se chevauchent, ou PDF trop long/court.
- **Bonnes pratiques** :
  - Garder les **noms des clés** dans `StyleSheet.create({ ... })` (ex. `secTitle`, `tbl`, `tRow`) pour ne pas casser les références `style={s.xxx}` dans le JSX.
  - Si tu ajoutes de nouveaux styles, utilise des noms explicites et applique-les uniquement aux éléments concernés.
  - Les couleurs sont en dur dans l’objet `C` en tête de fichier ; les modifier change l’apparence de tout le document (cohérent mais à tester).

### 4.2 Modifier la **structure** (ordre des sections, ajout/suppression de blocs)

- **Risque** : contenu manquant ou doublon, ou erreur si tu accèdes à une propriété inexistante sur `payload` (ex. `payload.reunion.xxx` qui n’existe pas).
- **Bonnes pratiques** :
  - Ne pas supprimer de section sans vérifier qu’elle n’est pas indispensable (ex. en-tête, participants, boucle sur `projetsData`).
  - Pour tout **nouveau bloc** qui utilise des données, s’assurer que ces champs existent bien sur `PVDocumentPayload` ou sur les objets qu’il contient (`reunion`, `projetsData[].projet`, etc.). Sinon, il faudra les ajouter dans `types.ts` et dans la construction du payload dans `ReunionHebdoPVPage.tsx`.

### 4.3 Modifier les **textes** (libellés, titres)

- **Risque** : faute, incohérence avec le reste de l’app, ou régression si tu supprimes un libellé utilisé pour la compréhension du document.
- **Bonnes pratiques** : les chaînes sont en dur en français dans ce fichier ; si l’app est multilingue ailleurs, une évolution future pourrait être d’injecter des libellés via le payload (à faire seulement si tu en as besoin et après en avoir discuté).

### 4.4 Utiliser des **images** (ex. logo)

- **Risque** : chemin d’image incorrect ou image manquante → le PDF peut échouer à la génération ou afficher une erreur.
- **Actuellement** : `const LOGO = '/Logo_mika_services.png'` et `<Image style={...} src={LOGO} />`. Le chemin est relatif au domaine de l’app (public). Ne pas déplacer ou renommer l’asset sans mettre à jour cette constante.

### 4.5 Toucher à la **logique des données** (filtres, calculs dans le template)

- **Risque** : contenu faux ou vide (ex. plus de tâches “réalisées”, mauvais calcul de pourcentage).
- **Bonnes pratiques** :
  - La logique actuelle (ex. `tachesRealise`, `tachesReportees`, `prevAvecReport`, `globalPct`) est calquée sur la section « Avancement des travaux » du document projet. Si tu la modifies, vérifier que les formules et filtres (semaine courante / semaine suivante) restent cohérents avec `semaineReunion` / `anneeReunion` et avec les champs des entités (ex. `Prevision.semaine`, `Prevision.annee`).
  - Ne pas changer les noms des variables utilisées dans le JSX (ex. `tachesRealise`, `pointsBloquants`) sans mettre à jour toutes les références dans le même fichier.

---

## 5. Récap des risques principaux

| Élément | Risque principal |
|--------|-------------------|
| Export `PVDocumentPdf` ou signature `(props)` | Casse l’import dans `index.ts` → le bouton « Télécharger le PV » peut ne plus générer de PDF ou lever une erreur. |
| Structure de `PVDocumentPayload` (dans `types.ts`) | Si tu modifies les types sans adapter `pdfDocument.tsx`, erreurs TypeScript ou données manquantes dans le PDF. |
| Noms des styles `s.xxx` | En renommer ou en supprimer sans mettre à jour le JSX → erreur à l’exécution ou styles manquants. |
| Chemins ou noms d’assets (LOGO) | Image non trouvée → échec ou placeholder dans le PDF. |
| Boucle sur `projetsData` ou champs `reunion` | Si tu accèdes à un champ inexistant (typo ou champ non fourni par le payload), erreur au moment de la génération du PDF. |

---

## 6. Si tu as besoin de précisions

- Pour **comprendre** un bloc précis du template (ex. « à quoi sert cette section », « d’où viennent ces données »), demande une explication ciblée (en indiquant le nom du fichier et, si possible, les numéros de lignes ou le titre de section).
- Pour **ajouter** un nouveau type de contenu (ex. une nouvelle section, un nouveau champ affiché), demande d’abord comment l’intégrer sans régression (types, payload, puis template).
- Pour **réutiliser** le style du document projet (fiche projet PDF), le fichier de référence est :  
  `frontend_web/mika-services-frontend/src/features/projet/export/pdfDocument.tsx`  
  Tu peux t’en inspirer pour les couleurs, la structure des titres et des tableaux, sans copier-coller sans vérifier (les payloads et les données ne sont pas les mêmes).

---

**En résumé** : le seul fichier à modifier pour améliorer le design et la présentation du PDF du PV est **`pdfDocument.tsx`** dans `reunionhebdo/export`. Respecter les contraintes ci‑dessus et tester après chaque modification limite les régressions et les risques.
