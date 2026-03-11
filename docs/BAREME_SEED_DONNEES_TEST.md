# Peuplement barème – données de test (seed)

Pour disposer d’une base barème **entièrement remplie** (aucun champ vide) et pouvoir tester l’application, un **seed** remplit automatiquement les tables barème au démarrage du backend.

## Import Excel : remplissage des vides

Quand l'import lit le fichier Excel existant, tout champ vide est rempli : coefficients (ville/°/note/coef), matériaux (réf, unité, date, fournisseur "Non renseigné", contact, prix 0), prestations (libellé, unité, somme, déboursé, P.V, coef). Les lignes de coefficients totalement vides sont ignorées.

---

### Activation du seed

En **développement** (`application-dev.yml`) :

```yaml
bareme:
  seed-enabled: true   # remplit la base au démarrage
  import:
    path: ""          # laissé vide quand le seed est utilisé
```

Avec `seed-enabled: true` et `import.path` vide, au démarrage le seed :

1. **Vide** les tables barème (lignes, coefficients, fournisseurs, corps d’état).
2. **Insère** :
   - **10 coefficients d’éloignement** (Libreville, Port-Gentil, Franceville, etc.) avec %, coefficient et note.
   - **8 corps d’état** (Gros-Œuvre, Électricité, Plomberie, Assainissement, Menuiserie, Peinture, Carrelage, Couverture).
   - **7 fournisseurs** (Bernabé BTP, Dupont Matériaux, Leroy Gabon, Point P, Bricomarché, Socopa, Batimat) avec **nom et contact** toujours renseignés.
   - **Matériaux** : pour chaque corps d’état, une quinzaine d’articles (référence, libellé, unité) avec **4 fournisseurs par article** et des prix différents (pour tester la comparaison).
   - **Prestations** : pour chaque corps d’état, 5 prestations avec **décomposition complète** (lignes qté × P.U = somme) et **total déboursé / P.V** (aucun champ vide).

## Désactiver le seed

Pour revenir à un import Excel ou à une base vide :

```yaml
bareme:
  seed-enabled: false
  import:
    path: ../docs/MON_FICHIER.xls   # optionnel
```

## Contenu des données

- **Références** : REF-GO-001, REF-EL-001, etc.
- **Prix** : variés par fournisseur pour permettre la comparaison (prix min/max en vert/rouge).
- **Dates** : date du jour - 7 jours pour `date_prix`.
- **Contacts** : tous les fournisseurs ont un contact (nom + téléphone).
- **Prestations** : libellé, quantités, prix unitaires, unités, sommes, déboursé, P.V et coefficient P.V renseignés.

Aucune cellule ne reste vide : l’ensemble est prévu pour tester listes, filtres, recherche, comparaison fournisseurs et page détail.
