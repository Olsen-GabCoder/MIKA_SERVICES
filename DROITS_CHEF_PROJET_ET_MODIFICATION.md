# Droits du chef de projet et modification des données

## Qui peut modifier le projet ?

- **Chef de projet** : l’utilisateur désigné comme « responsable projet » sur la fiche peut **modifier** le projet (bouton « Modifier le projet » actif sur la page détail).
- **Autres utilisateurs** : accès **lecture seule** à la fiche projet (pas de bouton « Modifier le projet », ou formulaire en lecture seule).

Le contrôle est fait côté backend : `currentUserService.canEditProjet(projet.responsableProjet?.id)` — seuls les champs envoyés dans `ProjetUpdateRequest` sont modifiables par le chef de projet.

---

## Données que le chef de projet est autorisé à modifier

Toutes les données ci‑dessous sont **acceptées par l’API** (`PUT /api/projets/:id`) et **écrasées uniquement si elles sont envoyées** dans le corps de la requête. Le formulaire « Modifier le projet » doit exposer les champs que le chef doit pouvoir mettre à jour.

### 1. Informations de base (déjà dans le formulaire actuel)

| Champ | Rôle | Modifiable par le chef |
|-------|------|-------------------------|
| Numéro de marché | Identification | Oui |
| Nom du projet | Identification | Oui |
| Description | Contexte | Oui |
| Type de projet | Classification | Oui |
| Statut | État global (En cours, Terminé, etc.) | Oui |
| Client | Maître d’ouvrage | Oui |
| Chef de projet | Responsable (souvent réservé à l’admin) | Oui (selon politique) |
| Source de financement | Budget | Oui |
| Imputation budgétaire | Budget | Oui |
| Province, Ville, Quartier | Localisation | Oui |
| Partenaire principal | Texte libre | Oui |

### 2. Cadre du marché / Financier

| Champ | Rôle | Modifiable par le chef |
|-------|------|-------------------------|
| Montant HT, TTC, Initial | Montants du marché | Oui |
| Montant révisé | Après avenant | Oui |
| Délai (mois) | Durée prévue | Oui |
| Date début prévue, Date fin prévue | Planning prévu | Oui |
| Date début réelle, Date fin réelle | Réalisé (démarrage / clôture effective) | Oui |

### 3. Suivi d’avancement (PV réunion hebdo)

| Champ | Rôle | Modifiable par le chef | Calcul auto ou manuel ? |
|-------|------|-------------------------|--------------------------|
| **Avancement global %** | Pourcentage global des travaux | Oui | **Manuel** (saisi par le chef) |
| **Avancement physique %** | Avancement « physique » des ouvrages | Oui | **Manuel** |
| **Avancement financier %** | Avancement basé sur les décomptes / CA | Oui | **Manuel** ou dérivable du budget (voir ci‑dessous) |
| **Délai consommé %** | Part du délai déjà écoulée | Oui | **Manuel** ou calculable à partir des dates (voir ci‑dessous) |

### 4. Texte libre (PV)

| Champ | Rôle | Modifiable par le chef |
|-------|------|-------------------------|
| Besoins matériels | Ex. : engins, matériaux | Oui |
| Besoins humains | Ex. : renforts, recrutements | Oui |
| Observations | Remarques générales | Oui |
| Propositions d’amélioration | Actions proposées (PV) | Oui |

### 5. Données non modifiables via la fiche projet

- **Points bloquants** : gérés via l’entité dédiée (création / mise à jour de points bloquants par projet).
- **Prévisions (S2, S5…)** : gérées via l’entité Prévision (création / mise à jour par projet).
- **Avancement des études (phases)** : géré via AvancementEtudeProjet (endpoints dédiés).
- **Chiffre d’affaires (tableau CA)** : dérivé du **budget** (dépenses, lignes budgétaires) et/ou du reporting, pas un champ direct du projet.
- **Code projet** : fixé à la création, non modifiable en édition.

---

## Pourcentages : manuel ou automatique ?

### Comportement actuel

- **Avancement global, physique, financier, délai consommé** : stockés sur l’entité **Projet**, **saisis manuellement** (aucun calcul automatique côté backend au moment de la mise à jour du projet).
- Le **taux de consommation du budget** (dépensé / prévu) est calculé ailleurs (module Budget / Reporting) et affiché sur la page détail et les visualisations ; il n’est **pas** recopié automatiquement dans « Avancement financier % » du projet.

### Recommandation

| Indicateur | Recommandation | Commentaire |
|------------|----------------|-------------|
| **Avancement global %** | **Manuel** | Le chef de projet est le plus à même d’estimer l’avancement global (décomptes, état du chantier). |
| **Avancement physique %** | **Manuel** | Idem, reflète l’état physique des ouvrages. |
| **Avancement financier %** | **Optionnel : auto** | Peut être dérivé du budget (dépensé / budget prévu) et affiché en lecture seule ou pré-rempli ; la saisie manuelle reste utile pour ajustements (décomptes non encore enregistrés). |
| **Délai consommé %** | **Optionnel : auto** | Peut être calculé à partir de la date du jour, date début réelle et date fin prévue (ou durée prévue en mois), puis affiché en lecture seule ou pré-rempli. |

En résumé : **tous les pourcentages peuvent rester en saisie manuelle par le chef de projet** pour coller au PV. Une évolution possible est d’**afficher** des valeurs calculées (avancement financier depuis le budget, délai consommé depuis les dates) en **aide à la saisie** ou en **lecture seule**, tout en gardant la possibilité de les corriger manuellement si besoin.

---

## Récapitulatif : formulaire « Modifier le projet »

Le formulaire d’édition expose désormais **toutes** les données que le chef de projet est autorisé à modifier (alignement PV) :

1. **Informations générales** : Numéro de marché, Nom, Type, Statut, Client, Chef de projet, Source de financement, Description, Propositions d’amélioration.
2. **Informations financières** : Montant HT, TTC, Initial, **Montant révisé**, **Imputation budgétaire**.
3. **Délais et localisation** : Délai (mois), Date début/fin prévues, **Date début/fin réelles** (en édition), Province, Ville, Quartier.
4. **Suivi d’avancement (PV)** (en édition uniquement) : Avancement global %, Avancement physique %, Avancement financier %, Délai consommé %.
5. **Besoins et observations (PV)** (en édition uniquement) : Besoins matériels, Besoins humains, Observations.

Les **pourcentages** sont **saisis par le chef de projet** ; une évolution future peut prévoir des calculs automatiques (avancement financier, délai consommé) en aide ou en lecture seule.
