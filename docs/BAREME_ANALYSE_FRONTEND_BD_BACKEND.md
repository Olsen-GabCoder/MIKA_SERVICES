# Barème — Analyse Frontend / Base de données / Backend

## 1. Flux actuel

### Frontend (BaremePage)

- **Toujours** un seul appel : `useBaremeArticles(apiParams, page, size)` → **GET /bareme/articles** (liste paginée de **lignes**).
- **Sans recherche** : affichage d’un tableau “liste plate” (une ligne = une ligne barème : article + fournisseur + prix).
- **Avec recherche** : même API, mais le frontend **regroupe côté client** les lignes reçues par `(libelle, unite, type)` et affiche un tableau “comparaison” (une ligne = un article, une colonne par fournisseur).

Problème : on reçoit une **page de lignes** (ex. 20), on les regroupe → on obtient N “articles”. Les colonnes fournisseurs = union des fournisseurs présents **dans ces 20 lignes seulement**. Donc beaucoup de cellules vides, car :
- une ligne = un seul (article, fournisseur) ;
- si un article n’a qu’un fournisseur dans la page, les autres colonnes restent vides ;
- la pagination est sur les **lignes** (totalElements = nombre de lignes), pas sur les **articles**, donc incohérent avec l’affichage “une ligne = un article”.

### Backend

- **GET /bareme/articles** : `findArticlesFiltered` → page de **lignes** (`parent IS NULL`), tri/pagination par ligne. Retourne des `BaremeArticleListResponse` (une entrée par ligne).
- **GET /bareme/articles/compare** : charge jusqu’à 10 000 lignes, **regroupe** par `(corps_etat_id, libelle, reference, unite, type)`, pagine par **groupe** (article), retourne des `BaremeArticleCompareResponse` avec `prixParFournisseur` pour chaque article. **Cette API n’est pas utilisée par le frontend en recherche.**

### Base de données

- Une ligne = un (article, fournisseur) pour les matériaux ; ou une ligne prestation (entête / détail / total).
- Beaucoup d’(article, fournisseur) n’existent pas → cellules vides dès qu’on affiche par fournisseur.

---

## 2. Inadéquations identifiées

| Zone | Problème |
|------|----------|
| **Frontend (recherche)** | Utilise la **liste** (lignes) au lieu de **compare** (articles groupés) → groupes incomplets, pagination sur les lignes alors que l’écran est “par article”. |
| **Frontend (recherche)** | Clé de regroupement = `(libelle, unite, type)` sans `reference` ni `corps_etat` → fusion d’articles différents si même libellé/unité. |
| **Backend** | L’API **compare** existe et pagine correctement par article, mais le frontend ne l’appelle pas. |
| **Backend** | En compare, `prixParFournisseur` ne contient que les fournisseurs **présents en base** pour cet article → pas de complément “estimé” pour les fournisseurs manquants. |
| **Base de données** | Beaucoup de couples (article, fournisseur) absents ; les scripts d’insertion aident mais, avec une pagination par **lignes**, les nouvelles lignes peuvent rester sur d’autres pages. |

---

## 3. Alignement recommandé

1. **En recherche** : utiliser **GET /bareme/articles/compare** au lieu de GET /bareme/articles, et adapter l’écran pour consommer `BaremeArticleCompare` (une ligne = un article, `prixParFournisseur` = liste de prix par fournisseur).
2. **Backend (compare)** : pour chaque article matériau, compléter `prixParFournisseur` avec les fournisseurs **du même corps d’état** qui n’ont pas de ligne en base, en ajoutant un prix **estimé** (et `prixEstime = true`).
3. **Pagination** : garder la pagination par **article** (compare) en recherche, cohérente avec l’affichage.
4. **Liste plate (sans recherche)** : garder GET /bareme/articles inchangé (liste de lignes).

---

## 4. Résumé

- **Frontend** : en recherche, appeler l’API **compare** et afficher les articles + `prixParFournisseur` (avec colonnes fournisseurs déduites de ces données).
- **Backend** : dans la réponse compare, pour chaque article, **compléter** les fournisseurs manquants avec un prix estimé (jaune côté frontend).
- **Base de données** : les scripts de remplissage restent utiles pour la liste plate et le détail ; en recherche, le fait de compléter côté backend évite de dépendre de la pagination par lignes pour “voir” les prix estimés.
