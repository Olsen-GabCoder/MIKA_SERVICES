# Plan d'action — Barème : comparaison des prix par fournisseur

**Objectif principal :** Permettre à l’utilisateur de **comparer les prix proposés par chaque fournisseur pour un même article** (ex. « Sable »). Les filtres doivent porter d’abord sur le **libellé**, le **corps d’état** et éventuellement le **type**, et non sur le fournisseur.

**Contexte :** Le travail déjà réalisé (liste, détail, coefficients d’éloignement, import) reste en place. Ce plan décrit les ajustements pour mettre la **comparaison fournisseurs** au centre du module.

---

## 1. Repositionnement des filtres

**À faire :**
- **Recherche (libellé)** : rester le filtre principal (ex. « Sable », « Ciment »). Déjà en place ; s’assurer qu’il est bien mis en avant (recherche sur le libellé côté API).
- **Corps d’état** : filtre principal (déjà en place).
- **Type** : Matériau / Prestation / Tous (déjà en place, optionnel).
- **Fournisseur** : ne plus figurer comme filtre principal. Soit le retirer de la barre de filtres, soit le proposer en option secondaire du type « Afficher uniquement les prix de : [Tous / Bernabé / …] » pour affiner la vue après comparaison.

**Livrable :**  
- Côté frontend : ordre et libellés des filtres = **Recherche (libellé)** → **Corps d’état** → **Type** → (optionnel) Fournisseur.  
- Retirer ou déplacer le filtre fournisseur pour qu’il ne soit pas au même niveau que libellé / corps d’état.

---

## 2. Regrouper les résultats par « article » (même produit)

**Problème actuel :**  
L’API `GET /api/bareme/articles` renvoie une ligne par enregistrement barème (une ligne = un article × un fournisseur). Pour « Sable », on obtient donc plusieurs lignes (Bernabé, Brosset, etc.) sans regroupement. La comparaison n’est pas immédiate.

**Objectif :**  
Afficher **un bloc par article** (même libellé + référence + corps d’état + unité), avec à l’intérieur **tous les fournisseurs et leurs prix** pour cet article.

**Deux approches possibles :**

### Option A — Backend : nouvel endpoint « articles pour comparaison »

- **Endpoint proposé :** `GET /api/bareme/articles/compare` (ou réutilisation de `GET /api/bareme/articles` avec un paramètre `grouped=true`).
- **Comportement :**  
  - Mêmes filtres que aujourd’hui : `recherche` (libellé), `corpsEtatId`, `type`, `fournisseurId` (optionnel).  
  - Réponse = liste **pagined d’articles groupés** : chaque élément = un article (libellé, référence, corps d’état, unité, type) avec une liste **prix par fournisseur** (fournisseurNom, fournisseurContact, prixTtc, datePrix, id ligne si besoin).
- **Backend :**  
  - Requête qui groupe par (corps_etat_id, libellé, référence, unité, type) et agrège les lignes matériau par fournisseur.  
  - Pour les prestations : un article = une ligne entête ; pas de « prix par fournisseur » multiples, garder Déboursé / P.V comme aujourd’hui.
- **Pagination :** sur le nombre **d’articles** (groupes), pas sur le nombre de lignes brutes.

**Avantages :**  
- Une seule requête, pas de surcharge côté front.  
- Pagination cohérente (une page = N articles comparables).

### Option B — Frontend : regroupement côté client

- Garder l’API actuelle `GET /api/bareme/articles` (liste plate).
- Côté frontend : après récupération des données, **grouper** les lignes par (libellé, référence, corpsEtat.id, unité) (et type si besoin).
- Afficher un bloc par groupe avec un tableau Fournisseur | Prix.
- **Inconvénient :** la pagination actuelle (par ligne) peut couper un même article entre deux pages (ex. 3 fournisseurs sur la page 1, 2 sur la page 2). Pour une comparaison fiable, il faudrait soit augmenter la taille de page, soit un endpoint dédié (Option A).

**Recommandation :** **Option A** (endpoint dédié ou paramètre `grouped`) pour une comparaison fiable et une pagination par article.

**Livrables (Option A) :**
1. Backend : nouveau DTO (ex. `BaremeArticleCompareResponse` : infos article + liste `prixParFournisseur`).
2. Backend : méthode service + endpoint qui retournent les articles groupés avec prix par fournisseur, paginés par article.
3. Frontend : appeler ce nouvel endpoint (ou le paramètre adapté) pour la liste « comparaison ».
4. Frontend : afficher une **carte ou bloc par article** avec un **tableau comparatif** (colonnes : Fournisseur, Contact, Prix TTC, Date prix) et un lien « Voir détail » vers la page détail existante (pour décomposition prestation ou coefficient d’éloignement).

---

## 3. Affichage liste : priorité à la comparaison

**À faire :**
- Pour chaque **article** (groupe) :
  - En-tête : **Libellé**, Référence, Unité, Corps d’état, Type.
  - Tableau : **Fournisseur** | **Prix TTC** (ou Déboursé / P.V pour prestations) | Date prix (si utile).
  - Optionnel : tri des lignes du tableau par prix (du moins cher au plus cher).
  - Lien « Voir détail » (vers `/bareme/articles/:id` avec un id représentatif de l’article, ex. première ligne du groupe) pour ouvrir la fiche détail (décomposition, coefficient d’éloignement, etc.).
- Message explicite si aucun fournisseur n’a de prix pour cet article (ex. « Aucun prix fournisseur renseigné »).
- Pour les **prestations** : pas de tableau multi-fournisseur ; afficher Déboursé / P.V comme aujourd’hui et garder le lien vers la page détail.

**Livrable :**  
- Liste = succession de blocs « article » avec tableau de comparaison des prix fournisseurs (matériaux) ou synthèse Déboursé/P.V (prestations).

---

## 4. Page détail et navigation

**Conserver :**
- Page détail `/bareme/articles/:id` : en-tête, prix par fournisseur (matériaux), décomposition + totaux (prestations), coefficient d’éloignement, retour à la liste avec filtres préservés.
- Retour à la liste avec conservation des paramètres (recherche, corps d’état, type, page).

**Ajustement éventuel :**
- Depuis la liste « comparaison », le lien « Voir détail » peut envoyer l’id d’une des lignes du groupe (ex. la première). La page détail charge déjà tous les prix du même article via la logique existante (findSameArticle). Rien à changer si le backend détail agrège bien tous les fournisseurs pour cet article.

---

## 5. Ordre des étapes proposé

| Étape | Action | Validation |
|-------|--------|------------|
| **1** | Repositionner les filtres (recherche libellé + corps d’état + type en premier ; fournisseur optionnel ou retiré) | OK frontend |
| **2** | Backend : définir DTO + endpoint (ou paramètre) « articles groupés pour comparaison » avec prix par fournisseur, paginé par article | OK backend |
| **3** | Frontend : appeler le nouvel endpoint et afficher la liste par **article** avec tableau Fournisseur / Prix par bloc | OK frontend |
| **4** | Affiner l’UX : tri par prix dans le tableau, message si aucun prix, lien détail cohérent | Recette |

---

## 6. Résumé

- **Filtres :** principal = **libellé** (recherche), **corps d’état**, **type** ; fournisseur en option ou retiré.
- **Liste :** un **bloc par article** (même produit) avec **tableau de comparaison des prix par fournisseur** (matériaux) ou synthèse Déboursé/P.V (prestations).
- **Backend :** nouvel endpoint (ou variante) qui renvoie des **articles groupés** avec la liste des prix par fournisseur, paginé par article.
- **Détail :** inchangé ; sert de vue complète (décomposition, coefficient d’éloignement) avec retour liste préservé.

Une fois ce plan validé, on peut enchaîner par l’**étape 1** (filtres) puis l’**étape 2** (backend groupé) et l’**étape 3** (affichage comparaison).
