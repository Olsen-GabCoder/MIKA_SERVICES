# Barème – Inventaire des données backend → affichage frontend

Ce document recense toutes les données exposées par le backend pour le module barème et indique où elles sont affichées côté frontend.

---

## 1. Sources backend

### Entités (base de données)

| Entité | Table | Champs |
|--------|--------|--------|
| **LignePrixBareme** | `bareme_lignes_prix` | id, corpsEtat, type, reference, libelle, unite, prixTtc, datePrix, fournisseurBareme, contactTexte, quantite, prixUnitaire, somme, debourse, prixVente, coefficientPv, unitePrestation, parent, ordreLigne, numeroLigneExcel |
| **FournisseurBareme** | `bareme_fournisseurs` | id, nom, contact |
| **CorpsEtatBareme** | `bareme_corps_etat` | id, code, libelle, ordreAffichage |
| **CoefficientEloignement** | `bareme_coefficients_eloignement` | id, nom, pourcentage, coefficient, note, ordreAffichage |

### DTOs de réponse API

| DTO | Endpoint / usage | Champs |
|-----|------------------|--------|
| **BaremeArticleListResponse** | `GET /bareme/articles` (liste paginée) | id, type, reference, libelle, unite, corpsEtat (id, code, libelle, ordreAffichage), fournisseurNom, fournisseurContact, prixTtc, datePrix, debourse, prixVente, unitePrestation |
| **BaremeArticleDetailResponse** | `GET /bareme/articles/{id}` (détail) | id, type, reference, libelle, unite, corpsEtat, prixParFournisseur (fournisseurId, fournisseurNom, fournisseurContact, prixTtc, datePrix), lignesPrestation (libelle, quantite, prixUnitaire, unite, somme), debourse, prixVente, coefficientPv, unitePrestation |
| **BaremeArticleCompareResponse** | `GET /bareme/articles/compare` | id, type, reference, libelle, unite, corpsEtat, prixParFournisseur, debourse, prixVente, unitePrestation |
| **CorpsEtatBaremeResponse** | `GET /bareme/corps-etat` (filtres) | id, code, libelle, ordreAffichage |
| **CoefficientEloignementResponse** | `GET /bareme/coefficients-eloignement` | id, nom, pourcentage, coefficient, note, ordreAffichage |
| **BaremeVersionResponse** | `GET /bareme/derniere-mise-a-jour` | derniereMiseAJour |

---

## 2. Où chaque donnée est affichée côté frontend

### Liste barème (BaremePage)

| Donnée API (liste) | Vue plate (sans recherche) | Vue recherche (avec recherche) |
|--------------------|----------------------------|--------------------------------|
| **id** | Utilisé pour le lien « Voir détail » et navigation | Idem (lien détail par ligne) |
| **type** | Colonne **Type** | Utilisé en interne pour format prix (vue recherche) |
| **reference** | Colonne **Référence** + fallback libellé dans Article | Utilisé pour le regroupement (clé article) |
| **libelle** | Colonne **Article** | En-tête de ligne **Article** |
| **unite** | Colonne **Unité** | Colonne **Unité** |
| **unitePrestation** | Colonne Unité (fallback) | Colonne Unité (fallback) |
| **type** | Colonne **Type** (Matériau / Prestation) | Utilisé en interne pour format prix |
| **corpsEtat** | Utilisé dans les filtres (code + libellé) | Idem |
| **fournisseurNom** | Colonne **Fournisseur** | En-têtes de colonnes (noms des fournisseurs) |
| **fournisseurContact** | Sous le nom du fournisseur dans la cellule | Non affiché en vue recherche |
| **prixTtc** | Colonne **Prix** (matériaux) | Dans les cellules (prix par fournisseur), vert/rouge min/max |
| **datePrix** | Colonne **Date prix** | ❌ Non affiché en vue recherche |
| **debourse** / **prixVente** | Colonne **Prix** (prestations) | Idem (prestations) |

### Page détail article (BaremeArticleDetailPage)

| Donnée API (détail) | Affichage |
|--------------------|-----------|
| id, type, reference, libelle, unite, corpsEtat (libelle) | En-tête : titre + bloc Référence, Unité, Corps d'état, Type |
| prixParFournisseur (fournisseurNom, fournisseurContact, prixTtc, datePrix) | Tableau « Prix par fournisseur » |
| lignesPrestation (libelle, quantite, prixUnitaire, unite, somme) | Tableau « Décomposition » |
| debourse, prixVente, coefficientPv, unitePrestation | Bloc « Totaux » |

Toutes les données du détail sont affichées.

### Filtres (BaremeFilters)

| Donnée | Affichage |
|--------|-----------|
| **CorpsEtat** (id, libelle) | Liste déroulante « Corps d'état » (libellé uniquement) |
| **CorpsEtat** (code) | Affiché dans le dropdown : « code – libellé » |
| **CorpsEtat** (ordreAffichage) | Utilisé pour le tri côté backend |

### Coefficients d'éloignement (section en bas de la liste)

| Donnée | Affichage |
|--------|-----------|
| nom, pourcentage, coefficient, note | Tableau (toutes les colonnes) |
| ordreAffichage | Utilisé pour le tri côté backend |

### Version / dernière mise à jour

| Donnée | Affichage |
|--------|-----------|
| derniereMiseAJour | Bandeau header de la page barème |

---

## 3. Champs ajoutés à l’affichage (mise à jour frontend)

- **Liste (vue plate)** : colonne **Référence**, colonne **Type** (Matériau / Prestation), **Contact fournisseur** affiché sous le nom du fournisseur dans la même cellule.
- **Filtres** : **code** du corps d'état affiché dans le dropdown sous la forme « code – libellé » (ex. « GO – Gros-Œuvre »).

En vue recherche, les en-têtes de colonnes sont les noms des fournisseurs et les cellules n’affichent que le prix (pas la date ni le contact, pour garder la lecture simple).

---

## 4. Récapitulatif par écran

| Écran | Données affichées | Données manquantes à l’affichage (optionnel) |
|-------|-------------------|---------------------------------------------|
| Liste (plate) | Article, **Référence**, Unité, **Type**, Fournisseur (**+ Contact**), Prix, Date, Action | — |
| Liste (recherche) | Article, Unité, colonnes fournisseurs (nom en en-tête, prix en cellule), Action | Date prix / Contact (omis pour lisibilité) |
| Détail | Toutes les champs du détail | — |
| Filtres | Corps d’état (libellé), Type, Recherche | Code corps d’état |
| Coefficients | nom, %, coefficient, note | — |

---

## 5. Interroger les données barème (debug / vérification)

### Via l’API (backend démarré)

- **`GET /bareme/debug/dump?maxLignes=500`**  
  Retourne en JSON : coefficients, corps d’état, fournisseurs, nombre total de lignes et un échantillon de lignes (par défaut 500, max 2000).  
  **Authentification** : requête soumise à la même sécurité que les autres endpoints barème (`/bareme/*`), donc un token valide est nécessaire (ex. Swagger après login, ou requête avec `Authorization: Bearer <token>`).

### Via SQL (client MySQL)

- **Scripts** :  
  - **`docs/bareme_dump.sql`** : listes complètes + échantillon de lignes + comptages par type / corps d’état.  
  - **`docs/bareme_dump_complet_et_espaces_vides.sql`** : **tout connaître** (structure des tables, comptages, **analyse détaillée des champs vides** : NULL, chaîne vide, espaces seuls). Indique combien de lignes ont une référence, un libellé, une unité, un fournisseur ou un contact vide — pour comprendre les « espaces vides » affichés au frontend.  
  Exécution exemple :  
  `mysql -u <user> -p <nom_base> < docs/bareme_dump_complet_et_espaces_vides.sql`
