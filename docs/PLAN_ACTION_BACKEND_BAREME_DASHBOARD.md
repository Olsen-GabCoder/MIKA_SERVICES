# Plan d'action backend — Barème & Dashboard comparaison prix

**Objectif :** Mettre en place la partie backend qui prend en charge **toutes** les données du fichier Excel du barème bâtiment et expose les APIs nécessaires au futur dashboard (filtres, articles, détail avec prix par fournisseur).

**Règle :** Avant de passer d'une étape à une autre, validation de votre part est requise.

---

## Données Excel à prendre en charge (rappel)

| Source Excel | Contenu à intégrer |
|--------------|--------------------|
| **Feuille 1 — Coef d'éloignement** | Villes/localités (42 lignes), colonnes : Ville, %, Coef, Note |
| **Feuilles 2 à 16 — Corps d'état** | Pour chaque feuille : N° \| Matériaux \| U \| P.TTC \| Date \| Fournisseurs \| Contacts \| Libellé \| Qté \| P.U \| U \| Sommes \| Déboursé \| P.V Coëf (et colonnes supplémentaires pour certaines feuilles, ex. Charpente 22 colonnes) |
| **Types de lignes** | 1) Lignes « référentiel prix » (matériau + fournisseur + P.TTC) ; 2) Lignes « prestations / sous-détails » (Libellé prestation, puis décomposition Qté × P.U = Sommes, Déboursé, P.V) |
| **Fournisseurs** | Tous les noms et contacts issus des colonnes Fournisseurs / Contacts du fichier |

---

## Étapes du plan (backend uniquement)

---

### **ÉTAPE 1 — Schéma de données (modèle de domaine)**

**Objectif :** Définir les entités JPA et les tables pour stocker l’intégralité des données du barème, sans perte d’information.

**Livrables proposés :**

1. **Coefficient d’éloignement**
   - Entité `CoefficientEloignement` (ou `LocaliteBarème`) : id, nom (ville/localité), pourcentage, coefficient, note (texte optionnel), ordre d’affichage.

2. **Corps d’état**
   - Entité `CorpsEtatBarème` : id, code (ex. GROS_OEUVRE), libelle (ex. "Gros-Oeuvre"), ordre. Les 15 feuilles métier = 15 enregistrements.

3. **Fournisseurs barème**
   - Réutilisation de l’entité existante `Fournisseur` (module fournisseur) **ou** entité dédiée `FournisseurBarème` (nom, contact/téléphone) si vous préférez ne pas mélanger avec les fournisseurs « commandes ». À valider.

4. **Lignes de prix (matériaux / prestations)**
   - Entité `LignePrixBarème` : id, corpsEtat, reference (N° type "G.13"), libelle (Matériaux ou Libellé), unite (U), prixTtc (P.TTC), datePrix (optionnel), fournisseur (FK ou nom texte), contact (texte), type (MATERIAU / PRESTATION / SOUS_DETAIL), coefficientPv (1.4 ou 1.6), debourse (pour prestations), prixVente (P.V), unitePrestation (m², ml, U…), ordreLigne, numeroLigneExcel (pour traçabilité).  
   - Ou découpage en deux : `LigneMateriauBarème` (référentiel prix) et `LignePrestationBarème` (prestations avec sous-détails). À trancher selon votre préférence (une table polyvalente vs deux tables).

5. **Sous-détails des prestations**
   - Entité `LigneSousDetailBarème` : id, lignePrestation (FK vers la ligne « prestation » parente), libelle, quantite, prixUnitaire, unite, somme, ordre. Permet de stocker chaque ligne de décomposition (Qté × P.U = Sommes) sous une prestation.

6. **Lien Corps d’état ↔ Feuille Excel**
   - Chaque ligne de prix est rattachée à un `CorpsEtatBarème` (feuille d’origine).

**Données couvertes :** Toutes les feuilles (1 à 16), toutes les colonnes pertinentes (N°, Matériaux, U, P.TTC, Date, Fournisseurs, Contacts, Libellé, Qté, P.U, U, Sommes, Déboursé, P.V + colonnes extra si besoin).

**Validation requise :**  
- Validez-vous ce schéma (noms d’entités, champs, choix une table vs deux pour matériaux/prestations) ?  
- Souhaitez-vous lier les fournisseurs du barème à l’entité `Fournisseur` existante ou garder une table séparée (nom + contact) pour le barème uniquement ?

**✅ Réalisé (avancement) :** Entités créées : `CoefficientEloignement`, `CorpsEtatBareme`, `FournisseurBareme`, `LignePrixBareme` (une table polyvalente avec type MATERIAU / PRESTATION_ENTETE / PRESTATION_LIGNE / PRESTATION_TOTAL, self-reference parent pour blocs prestations). Enum `TypeLigneBareme`. Repositories créés. Tables créées au démarrage via JPA `ddl-auto: update`.

---

### **ÉTAPE 2 — Migrations base de données**

**Objectif :** Créer les tables en base (Flyway ou JPA DDL) pour le module barème, sans casser l’existant.

**Livrables :**

- Script(s) de migration (V1__barème_*.sql ou entités JPA avec `ddl-auto` selon votre convention).
- Tables : coefficients_eloignement, corps_etat_bareme, (fournisseur_bareme si séparé), lignes_prix_bareme, lignes_sous_detail_bareme (+ index pour filtres : corps_etat, type, fournisseur, libelle).

**Validation requise :**  
- Les noms de tables et colonnes vous conviennent-ils ?  
- Souhaitez-vous des contraintes particulières (unicité, non-null) à ajouter dès maintenant ?

---

### **ÉTAPE 3 — Import des données Excel vers la base**

**Objectif :** Charger **toutes** les données du fichier Excel dans les nouvelles tables (une seule fois ou rejouable).

**Livrables :**

- Service (Kotlin) ou script d’import qui :
  - Lit le fichier .xls (Apache POI ou conversion préalable en .xlsx).
  - Feuille 1 : insère les 42 lignes dans `CoefficientEloignement` (ou équivalent).
  - Feuilles 2 à 16 : pour chaque feuille, parcourt les lignes (à partir de la ligne 3 après en-têtes) ; pour chaque ligne :
    - Remplit les champs correspondant à : N°, Matériaux, U, P.TTC, Date, Fournisseurs, Contacts, Libellé, Qté, P.U, U, Sommes, Déboursé, P.V (et colonnes supplémentaires pour Charpente etc.).
    - Détecte le type (ligne « matériau » vs ligne « prestation / sous-détail ») à partir du contenu (ex. présence de P.TTC + Fournisseurs vs Libellé + Qté + Déboursé).
    - Crée ou réutilise les fournisseurs (par nom + contact).
    - Enregistre les sous-détails (lignes de décomposition) liés à la prestation courante.
  - Gère l’encodage (Windows-1252 / UTF-8) pour les libellés.
- Option : endpoint admin `POST /api/bareme/import` (upload du fichier) ou exécution en batch au démarrage si fichier présent.

**Données couvertes :** Intégralité du fichier (toutes les lignes, toutes les colonnes utiles), sans perte.

**Validation requise :**  
- Préférence : import par API (upload) ou script batch (fichier sur le serveur) ?  
- Souhaitez-vous un rapport d’import (nombre de lignes lues, insérées, erreurs éventuelles) ?

---

### **ÉTAPE 4 — APIs « lecture » pour le dashboard**

**Objectif :** Exposer les endpoints nécessaires au dashboard : listes filtrées d’articles, détail d’un article avec prix par fournisseur.

**Livrables :**

1. **Coefficients d’éloignement**
   - `GET /api/bareme/coefficients-eloignement` → liste des villes avec %, coef, note (pour filtre ou affichage dans le détail).

2. **Corps d’état**
   - `GET /api/bareme/corps-etat` → liste des corps d’état (pour filtre du dashboard).

3. **Articles (liste avec filtres)**
   - `GET /api/bareme/articles` avec paramètres optionnels : `corpsEtatId`, `type` (MATERIAU / PRESTATION), `fournisseurId` ou `fournisseurNom`, `unite`, `recherche` (texte sur libellé).  
   - Réponse : liste paginée (id, libelle, unite, corpsEtat, type, nombre d’offres fournisseurs, prix min/max ou dernier prix).  
   - Les « articles » côté API = regroupement par (libellé + unité + corps d’état) avec agrégation des offres (plusieurs fournisseurs pour un même libellé).

4. **Détail d’un article**
   - `GET /api/bareme/articles/{id}` (ou par identifiant logique : corpsEtat + libelle + unite) :  
     - En-tête : libellé, unité, corps d’état, type.  
     - Liste des **prix par fournisseur** : fournisseur (nom, contact), prix TTC, date/version, coefficient P.V si pertinent.  
     - Si prestation : décomposition (sous-détails : libellé, Qté, P.U, Sommes) + Déboursé total + P.V.

5. **Export / comparaison (optionnel pour cette étape)**
   - `GET /api/bareme/articles/export?ids=...` (CSV/Excel) pour comparaison multi-articles. À inclure ou reporter selon votre priorité.

**Validation requise :**  
- Les paramètres de filtres listés vous suffisent-ils pour le dashboard ?  
- Souhaitez-vous que « article » soit strictement (libellé + unité + corps d’état) avec agrégation des fournisseurs, ou une ligne de prix = un article (plusieurs lignes pour le même libellé) ?

**✅ Réalisé (avancement) :**  
- `GET /api/bareme/coefficients-eloignement` → liste des coefficients (ville, %, coef, note).  
- `GET /api/bareme/corps-etat` → liste des 15 corps d’état.  
- `GET /api/bareme/articles` → liste paginée avec filtres : `corpsEtatId`, `type` (MATERIAU / PRESTATION_ENTETE), `fournisseurId`, `recherche` (sur libellé). Réponse : id, type, reference, libelle, unite, corpsEtat, fournisseur, prixTtc, debourse/prixVente pour prestations.  
- `GET /api/bareme/articles/{id}` → détail : en-tête + `prixParFournisseur` (matériaux) ou `lignesPrestation` + debourse/prixVente (prestations).

---

### **ÉTAPE 5 — Sécurité et cohérence**

**Objectif :** Restreindre l’accès (lecture pour tous les utilisateurs concernés, import réservé à l’admin) et garantir la cohérence des données.

**Livrables :**

- Contrôle d’accès sur les endpoints barème (rôles existants ou nouveau rôle « Référent barème »).
- Endpoint d’import protégé (admin uniquement).
- Option : endpoint `GET /api/bareme/version` ou `derniere-mise-a-jour` pour afficher la date du dernier import sur le dashboard.

**Validation requise :**  
- Qui doit pouvoir consulter le barème (tous les utilisateurs connectés, ou certains rôles seulement) ?  
- Qui doit pouvoir lancer un réimport (admin uniquement, ou rôle dédié) ?

**✅ Réalisé (avancement) :**  
- **Lecture** : tous les `GET /api/bareme/*` sont accessibles à tout utilisateur **authentifié** (aucun rôle particulier).  
- **Import** : `POST /api/bareme/import` protégé par `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")`.  
- **Version** : `GET /api/bareme/derniere-mise-a-jour` renvoie `{ "derniereMiseAJour": "..." }` (max `updated_at` des lignes de prix, ou `null` si vide).

---

### **ÉTAPE 6 — Tests et recette**

**Objectif :** Vérifier que toutes les données Excel sont bien présentes en base et que les APIs renvoient les bonnes données.

**Livrables :**

- Tests unitaires ou d’intégration : import d’un extrait Excel → vérification des comptes (nombre de coefficients, nombre de lignes par corps d’état).
- Vérification manuelle ou script : comparaison nombre de lignes Excel vs nombre d’enregistrements en base (par feuille).
- Checklist de recette : filtres, détail article, prix par fournisseur pour quelques cas (matériau avec plusieurs fournisseurs, prestation avec sous-détails).

**Validation requise :**  
- Souhaitez-vous des jeux de tests (fichier Excel de test réduit) ou tests sur le fichier complet uniquement ?

**✅ Réalisé (avancement) :**  
- **Tests d’intégration** : `BaremeImportServiceIntegrationTest` — Excel minimal créé en mémoire (2 coefficients, 1 feuille Gros-Oeuvre avec 1 ligne) → import puis vérification des comptes (coefficients, corps d’état, fournisseurs, lignes).  
- **Tests du service de lecture** : `BaremeLectureServiceTest` — `getCoefficientsEloignement`, `getCorpsEtat`, `getArticles` (pagination), `getDerniereMiseAJour` sans erreur.  
- **Configuration test** : profil `test` avec H2 en mémoire (`src/test/resources/application-test.yml`), dépendance `h2` (scope test) dans `pom.xml`.  
- **Checklist de recette** (à valider manuellement ou via scripts) :
  1. **Filtres** : `GET /api/bareme/articles?corpsEtatId=1`, `?type=MATERIAU`, `?recherche=sable` → réponses cohérentes.
  2. **Détail article** : `GET /api/bareme/articles/{id}` — matériau : liste `prixParFournisseur` ; prestation : `lignesPrestation` + `debourse` / `prixVente`.
  3. **Prix par fournisseur** : un même libellé (ex. Sable m3) avec plusieurs fournisseurs → détail affiche tous les prix.
  4. **Script de vérification** : `backend/scripts/verif_bareme.py` pour contrôler les comptes en base après import.

---

## Récapitulatif des validations

| Étape | Titre | Point de validation |
|-------|--------|---------------------|
| 1 | Schéma de données | Valider entités, champs, lien ou non avec `Fournisseur` existant |
| 2 | Migrations BDD | Valider noms de tables/colonnes et contraintes |
| 3 | Import Excel | Valider mode d’import (API vs batch) et rapport d’import |
| 4 | APIs lecture | Valider filtres et définition d’« article » (agrégé vs ligne de prix) |
| 5 | Sécurité | Valider qui consulte / qui importe |
| 6 | Tests et recette | Valider stratégie de tests (fichier réduit vs complet) |

---

## Ordre d’exécution

1. **Étape 1** → validation → puis **Étape 2** → validation → puis **Étape 3** → validation → etc.  
2. Aucune étape ne sera entamée sans votre feu vert sur l’étape précédente.

Dès que vous validez l’**Étape 1** (schéma de données), je pourrai détailler les champs exacts (noms de colonnes en base, types) et proposer les classes Kotlin (entités JPA) correspondantes.

---

## Étape 3 — Import réalisé : peuplement et vérification

### Peuplement automatique au démarrage (recommandé)

Dans `application-dev.yml` la propriété `bareme.import.path` pointe vers le fichier Excel. **Il suffit de lancer le backend** (depuis le dossier `backend/`) : l’import s’exécute au démarrage et la base est peuplée automatiquement. Les logs affichent le résultat (nombre de coefficients, corps d’état, fournisseurs, lignes).

Pour désactiver : commenter ou vider `bareme.import.path` dans la config.

### Lancer l’import à la demande (API)

Si vous préférez déclencher l’import manuellement (compte admin requis) :

- **PowerShell :**
```powershell
$token = "VOTRE_TOKEN_JWT"
$uri = "http://localhost:8080/api/bareme/import"
$filePath = "..\docs\BAREME DES PRIX BÂTIMENT AVEC SOUS DETAILS (Tout_Corps_d'Etat).xls"
Invoke-RestMethod -Uri $uri -Method Post -Headers @{ Authorization = "Bearer $token" } -Form @{ file = Get-Item $filePath }
```

- **Swagger :** `POST /api/bareme/import` → champ `file` = sélection du fichier Excel.

La réponse indique : `coefficientsCount`, `corpsEtatCount`, `fournisseursCount`, `lignesCount`.

### Commandes pour vérifier la base après import

Exécuter ces requêtes dans votre client MySQL (base `mika_services_dev` ou celle configurée).

**Comptages par table :**
```sql
SELECT 'bareme_coefficients_eloignement' AS table_name, COUNT(*) AS nb FROM bareme_coefficients_eloignement
UNION ALL SELECT 'bareme_corps_etat', COUNT(*) FROM bareme_corps_etat
UNION ALL SELECT 'bareme_fournisseurs', COUNT(*) FROM bareme_fournisseurs
UNION ALL SELECT 'bareme_lignes_prix', COUNT(*) FROM bareme_lignes_prix;
```

**Liste des corps d’état :**
```sql
SELECT id, code, libelle, ordre_affichage FROM bareme_corps_etat ORDER BY ordre_affichage;
```

**Nombre de lignes par type :**
```sql
SELECT type, COUNT(*) AS nb FROM bareme_lignes_prix GROUP BY type ORDER BY type;
```

**Nombre de lignes par corps d’état :**
```sql
SELECT ce.code, ce.libelle, COUNT(l.id) AS nb_lignes
FROM bareme_corps_etat ce
LEFT JOIN bareme_lignes_prix l ON l.corps_etat_id = ce.id
GROUP BY ce.id, ce.code, ce.libelle
ORDER BY ce.ordre_affichage;
```

**Exemples de lignes matériaux (Gros-Oeuvre) :**
```sql
SELECT l.id, l.reference, LEFT(l.libelle, 40) AS libelle, l.unite, l.prix_ttc, f.nom AS fournisseur
FROM bareme_lignes_prix l
JOIN bareme_corps_etat ce ON ce.id = l.corps_etat_id
LEFT JOIN bareme_fournisseurs f ON f.id = l.fournisseur_bareme_id
WHERE ce.code LIKE '%GROS%' AND l.type = 'MATERIAU'
ORDER BY l.ordre_ligne LIMIT 15;
```

Un script SQL complet est disponible dans : `backend/scripts/sql/verification_bareme.sql`.
