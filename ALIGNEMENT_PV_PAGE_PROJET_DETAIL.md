# Alignement PV réunion hebdo ↔ Page Projet détail

Référence : **PV réunions hebdos** (`Rapports/PV_réunions_hebdos_S01-2026.md`)  
Objectif : la **page projet détail** doit contenir toutes les informations présentes dans le PV pour chaque affaire/projet, sans oubli.

---

## Structure du PV par affaire (projet)

Pour chaque **AFFAIRE** le PV contient :

| Bloc PV | Contenu |
|--------|---------|
| **En-tête** | AFFAIRE N — Chef de Projet : [nom] |
| **Titre** | Marché N°… — [Nom du projet] (parfois 2 lignes si 2 marchés) |
| **Cadre du marché** | Montant Marché (HT) · Délai · Date début · Date de fin |
| **Chiffre d'affaires** | Tableau : Mois \| CA prévisionnel \| CA réalisé \| Écart \| Avancement cumulé % |
| **État d'avancement des Études** | Tableau : Phase \| Avancement % \| Dépôt à l'administration \| État de validation |
| **Avancement des travaux / Prévisions** | Avancement % (parfois : **avancement physique %**, **avancement financier %**, **délai consommé %**) · Points bloquants · Prévision S2 / S5 · Besoins S2 / S5 · Besoins humains · **Propositions d'amélioration** (parfois) |

---

## Comparaison : Page projet détail vs PV

### ✅ Aligné (présent sur la page détail)

| Élément PV | Où sur la page détail |
|------------|------------------------|
| Chef de projet | Hero « Chef de projet : … » + colonne droite « Chef de projet » |
| Marché N° / Nom | Hero « Marché N°… — Nom » + code projet, statut |
| Montant(s) marché | Section **Cadre du marché** : Montant HT, TTC, initial, révisé |
| Délai | Cadre du marché : « Délai X mois » |
| Date début / Date fin | Cadre du marché : dates prévues + dates réelles |
| Chiffre d'affaires | Section **Chiffre d'affaires** : tableau Mois, CA prévisionnel, CA réalisé, Écart, Avancement cumulé % |
| État d'avancement des études | Section **État d'avancement des études** : tableau Phase, Avancement %, Dépôt, État de validation |
| Avancement global % | Section **Avancement des travaux / Prévisions** + Synthèse projet + Visualisations |
| Points bloquants | Section **Avancement des travaux** (liste détaillée) + Synthèse décisionnelle (nombre) |
| Prévisions (S2, S5, etc.) | Section **Avancement des travaux** : liste prévisions (type, année, semaine, statut, description) |
| Besoins matériels / humains | Section **Description, besoins et observations** : Besoins matériels, Besoins humains |
| Observations | Section **Description, besoins et observations** : Observations |
| Délai consommé % | Colonne droite **Synthèse projet** : « Délai consommé » |
| Client, localisation, accès rapide | Colonne droite |

### ⚠️ Partiellement aligné (à renforcer sur la page)

| Élément PV | Situation actuelle | Recommandation |
|------------|--------------------|----------------|
| **Avancement physique %** et **Avancement financier %** | Présents dans le **modèle** (Projet) et affichés uniquement en sous-texte dans la carte KPI « Avancement global » (Visualisations). Dans le PV ils figurent dans le bloc « Avancement des travaux / Prévisions ». | Les afficher **explicitement** dans la section « Avancement des travaux / Prévisions » (même bloc que l’avancement global et le délai consommé) pour coller au PV. |
| **Délai consommé %** | Affiché dans la colonne droite (Synthèse projet) mais pas dans le bloc « Avancement des travaux / Prévisions ». | L’ajouter dans la section « Avancement des travaux / Prévisions » en plus de la synthèse, pour alignement avec le PV (ex. « Avancement financier 7% / Avancement physique 5% / Consommation du délai 4% »). |

### ❌ Manquant par rapport au PV

| Élément PV | Situation | Recommandation |
|------------|-----------|----------------|
| **Propositions d'amélioration** | Présent dans le PV (ex. AFFAIRE 8 : « Propositions d'amélioration : Établir planning… »). Dans l’application, ce champ existe dans le module **réunion hebdo** (PointProjetPV), **pas** sur l’entité **Projet**. La page projet détail n’a donc pas de champ dédié. | Pour « aucun oubli » : ajouter un champ **propositionsAmelioration** sur l’entité Projet (backend + DTOs + frontend) et une ligne dans la section « Description, besoins et observations » (ou une sous-section « Propositions d’amélioration »). Sinon, documenter que cette info reste dans le contexte PV uniquement. |

### ℹ️ Limites acceptables (PV vs modèle)

| Élément PV | Note |
|------------|------|
| **Plusieurs montants pour un même projet** | Le PV AFFAIRE 1 a « Montant Marché 144 » et « Montant Marché 92 » (2 marchés). Le modèle Projet a un seul montant HT (+ initial, révisé). Pour un projet = 2 marchés fusionnés, les 2 montants ne sont pas modélisés séparément ; on peut utiliser description ou champs additionnels si besoin. |
| **Prévisions S2 / S5** | Le PV structure en « Prévision S2 : », « Besoins S2 : », « Prévisions S5 : ». Les prévisions en base ont type, année, semaine, description. La page affiche la liste des prévisions ; le libellé « S2 »/« S5 » peut être déduit de (année + semaine) ou affiché en libellé si besoin. |

---

## Résumé

- **Alignés** : En-tête (chef, marché, nom), cadre du marché (montants, délai, dates), chiffre d’affaires, état des études, avancement global, points bloquants, prévisions, besoins matériels/humains, observations, délai consommé (en synthèse), client, localisation.
- **À renforcer sur la page** : Afficher **avancement physique %**, **avancement financier %** et **délai consommé %** dans la section « Avancement des travaux / Prévisions » (en plus des visualisations / synthèse).
- **Manquant pour alignement complet** : **Propositions d’amélioration** (à ajouter au modèle Projet et à la page détail si vous souhaitez tout centraliser sur la page projet).

Aucune autre page n’est requise : tout est centralisé sur la **page projet détail**.
