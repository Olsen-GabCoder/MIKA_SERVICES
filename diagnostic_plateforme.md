# Diagnostic Complet — Base de Données MIKA Services (PRODUCTION)

> **Date du diagnostic** : 25 juin 2026
> **Source** : Base PostgreSQL de production (Render), interrogée via l'API REST backend
> **Compte** : SUPER_ADMIN (olsenkampala@gmail.com)
> **Mode** : Lecture seule — aucune donnée modifiée
> **Fichier de données** : `stats_qui_fait_quoi.json` (94 Ko, toutes les données brutes)

---

## 1. INVENTAIRE DES DONNÉES EN PRODUCTION

| Entité | Volume | Remarque |
|--------|-------:|----------|
| **Audit logs** | **4 189** | Table de tracking principale |
| **Tâches** | **719** | Toutes en statut A_FAIRE, **676 en retard** |
| **Prévisions hebdo** | **467** | Planification par semaine |
| **Suivi mensuel** | **161** | CA et avancement par mois |
| **Points bloquants** | **43** | Alertes terrain |
| **Projets** | **31** | Entité métier principale |
| **DQE** | **594 lignes** | Sur 4 projets seulement |
| **Utilisateurs** | **20** | 13 opérationnels + 9 admins |
| **Documents** | 1 | 1 seul document uploadé |
| Engins, Matériaux, Messagerie, QSHE | 0 | Modules non utilisés |

---

## 2. PÉRIMÈTRE UTILISATEURS

### Classification réelle (validée par la Direction)

**9 comptes administratifs** (exclus des métriques d'adoption) :
Olsen KAMPALA, Ulrich NKWEME EFERA, Jeremie OMPINDI AKAGA, Yvannis Trécy ALLOGO, Ramzi JRIBI, Lewis AWA NYARE, Lee Gesnere BINOMBO, Patrice ZAVROSA, JOALIKA KEAT MANDAKA

**13 opérationnels** (inclus dans le rapport) :

| # | Nom | Logins | Pages vues | Modif. projet | Dernière activité |
|---|-----|-------:|-----------:|--------------:|-------------------|
| 1 | **Justin NDONG** | 41 | 348 | 51 | 23/06/2026 |
| 2 | **Adnen BEN SALAH** | 6 | 176 | 18 | 12/06/2026 |
| 3 | **Cindy ANDRIANJAFY** | 5 | 169 | 40 | 11/06/2026 |
| 4 | **Davy NDONG ENGONE** | 14 | 158 | 22 | 12/06/2026 |
| 5 | **Berenger YEMBI** | 27 | 154 | 38 | 19/06/2026 |
| 6 | **Ulrich Landry IBOUANA** | 14 | 133 | 22 | 22/06/2026 |
| 7 | **ARMAND KARL NENE NZIENGUI** | 3 | 137 | 17 | 25/06/2026 |
| 8 | **Carine MOUGUIANA** | 11 | 111 | 33 | 19/06/2026 |
| 9 | **Valaria Grace BIBALOU IKONDO** | 1 | 59 | 22 | 24/06/2026 |
| 10 | **Xavier NGUEMA** | 2 | 34 | 6 | 11/06/2026 |
| 11 | **Yves Alexis DITENGOU** | 4 | 28 | 10 | 27/03/2026 |
| 12 | **Yannick Gerly OBAME ELLA** | 1 | 12 | 0 | 24/04/2026 |
| 13 | **Evrard ZUE MINTSA** | 1 | 4 | 1 | 24/06/2026 |

> **"Modif. projet"** = nombre de fois où l'utilisateur a ouvert la page "Modification projet" (proxy d'écriture, le tracking ne trace pas les saves).

### Profils d'engagement

- **Noyau actif (8 personnes)** : Justin NDONG, Adnen BEN SALAH, Cindy ANDRIANJAFY, Davy NDONG ENGONE, Berenger YEMBI, Ulrich L. IBOUANA, A.K. NZIENGUI, Carine MOUGUIANA → utilisent la plateforme régulièrement (>100 vues, actifs en juin)
- **Contributeurs ponctuels (3)** : Valaria BIBALOU, Xavier NGUEMA, Yves DITENGOU → usage sporadique
- **Très faible usage (2)** : Yannick OBAME ELLA, Evrard ZUE MINTSA → 1 login, quasi aucune activité

---

## 3. ANALYSE APPROFONDIE DES PROJETS

### 3.1 Vue d'ensemble du portefeuille

| Métrique | Valeur |
|----------|--------|
| **Nombre de projets** | 31 |
| **Montant HT total** | **157,8 milliards FCFA** |
| **Avancement physique moyen** | **10,0 %** |
| **Projets avec tâches** | 15 / 31 (48 %) |
| **Projets sans aucune activité** | 16 / 31 (52 %) |
| **Projets avec DQE** | 4 / 31 (13 %) |
| **Projets avec suivi mensuel** | 17 / 31 (55 %) |
| **Projets avec responsable assigné** | Variable (champ souvent vide) |
| **Projets avec description** | Variable |
| **Projets avec client** | Variable |

### 3.2 Répartition par statut et type

| Statut | Nb | | Type | Nb |
|--------|----|---|------|----|
| EN_COURS_EXECUTION | 12 | | VOIRIE | 13 |
| INITIALISATION | 9 | | BATIMENT | 9 |
| RECEPTION_DEFINITIVE | 9 | | AMENAGEMENT | 4 |
| RECEPTION_PROVISOIRE | 1 | | PONT | 3 |
| | | | GENIE_CIVIL | 1 |
| | | | REHABILITATION | 1 |

### 3.3 Classement des projets par activité (score composite)

Le **score d'activité** = tâches + prévisions + suivi×2 + DQE/10 + points bloquants. Il mesure la profondeur d'alimentation de chaque projet dans la plateforme.

| Rang | Projet | Statut | Tâches | Prév. | Suivi | DQE | PB | Retard | Avanc. phys. | Score |
|------|--------|--------|-------:|------:|------:|----:|---:|-------:|-------------:|------:|
| 1 | **Voies JB-Camp de Gaulle** (#25) | EN_COURS | 98 | 98 | 13 | 0 | 7 | **98** | 0,0 % | 229 |
| 2 | **Réhab. voiries Sotega-PK7** (#27) | EN_COURS | 89 | 61 | 25 | 0 | 2 | **74** | 27,3 % | 202 |
| 3 | **Voiries desserte Qrt Atsié** (#23) | EN_COURS | 126 | 33 | 5 | 0 | 0 | **114** | 71,1 % | 169 |
| 4 | **Centre appui pêche artisanale** (#4) | EN_COURS | 49 | 41 | 13 | **274** | 1 | **49** | 25,0 % | 144 |
| 5 | **Berge de la Lowé** (#3) | EN_COURS | 65 | 58 | 7 | 0 | 4 | **53** | 21,0 % | 141 |
| 6 | **2 ponts fleuve Louetsié** (#39) | INIT | 77 | 50 | 2 | 0 | 6 | **77** | 0,0 % | 137 |
| 7 | **Voiries 5ème arrondissement** (#34) | EN_COURS | 83 | 27 | 11 | 0 | 3 | **83** | 0,0 % | 135 |
| 8 | **Extension Akemidjongoni** (#24) | INIT | 32 | 16 | 9 | **229** | 0 | **28** | 0,0 % | 88 |
| 9 | **Voie de Bel Air** (#2) | EN_COURS | 41 | 33 | 0 | 29 | 6 | **41** | 8,8 % | 82 |
| 10 | **Pont Carrefour Camp de Gaulle** (#20) | EN_COURS | 17 | 17 | 3 | 0 | 7 | **17** | 27,4 % | 47 |
| 11 | **Voiries desserte Camp de Gaulle** (#19) | INIT | 18 | 13 | 5 | 0 | 4 | **18** | 0,0 % | 45 |
| 12 | **Salle polyvalente Kango** (#40) | EN_COURS | 6 | 3 | 16 | 0 | 0 | **6** | 2,0 % | 41 |
| 13 | **Carrefour Charbonnages** (#37) | EN_COURS | 7 | 7 | 10 | 0 | 3 | **7** | 0,0 % | 37 |
| 14 | **Marché municipal Owendo** (#5) | EN_COURS | 10 | 10 | 4 | 0 | 0 | **10** | 8,0 % | 28 |
| 15 | **Maurel & Prom** (#8) | REC_DEF | 0 | 0 | 13 | 0 | 0 | 0 | 0,0 % | 26 |
| — | *16 autres projets* | — | 0 | 0 | 0-13 | 0 | 0 | 0 | — | 0-20 |

### 3.4 ALERTE : État des tâches

| Métrique | Valeur | Signal |
|----------|--------|--------|
| Total tâches | **719** | — |
| Statut A_FAIRE | **719 (100 %)** | Aucune tâche terminée ni en cours |
| **En retard** | **676 (94 %)** | Quasi toutes les tâches sont en retard |
| Sans assignation | **719 (100 %)** | Aucune tâche assignée à quelqu'un |
| Avec échéance | 719 (100 %) | Toutes ont une date butoir |

> **Constat critique** : les 719 tâches sont toutes en statut "A_FAIRE", toutes en retard, et aucune n'est assignée à un utilisateur. La fonctionnalité planning/tâches est utilisée comme **liste de prévisions hebdomadaires** (description des travaux à faire), mais pas comme outil de suivi d'exécution (pas de passage en "EN_COURS" / "TERMINEE", pas d'assignation nominative).

### 3.5 Prévisions hebdomadaires

| Métrique | Valeur |
|----------|--------|
| Total prévisions | **467** |
| Projets avec prévisions | **15 / 31** |
| Prévisions / projet (actifs) | ~31 en moyenne |
| Semaines couvertes | S11 à S25 (mars à juin 2026) |

Les prévisions sont le mécanisme réel d'alimentation hebdomadaire : chaque semaine, les chefs de projet saisissent les travaux prévus pour la semaine suivante. C'est le signe le plus tangible d'usage régulier.

### 3.6 Suivi mensuel (CA et avancement)

| Métrique | Valeur |
|----------|--------|
| Total entrées suivi | **161** |
| Projets avec suivi | **17 / 31** |
| Projet le plus suivi | #27 Réhab. Sotega-PK7 (25 mois de suivi) |

Le suivi mensuel contient les données de CA prévisionnel/réalisé et d'avancement physique par mois. C'est la source la plus riche pour mesurer la performance financière des projets.

### 3.7 Points bloquants

| Métrique | Valeur |
|----------|--------|
| Total | **43** |
| Ouverts | Variable |
| Projets concernés | 10 / 31 |

> Note : les champs `detectePar` et `assigneA` sont NULL sur tous les points bloquants.

### 3.8 DQE (Devis Quantitatif Estimatif)

| Projet | Chapitres | Lignes |
|--------|----------:|-------:|
| Centre appui pêche (#4) | — | **274** |
| Extension Akemidjongoni (#24) | — | **229** |
| Pont mixte Kango (#18) | — | **62** |
| Voie de Bel Air (#2) | — | **29** |
| **Total** | | **594** |

Seuls 4 projets sur 31 ont un DQE saisi dans la plateforme (13 %).

---

## 4. LIMITE : colonnes created_by / updated_by

Les colonnes `created_by` et `updated_by` existent dans le schéma (BaseEntity.kt) mais sont **NULL sur toutes les tables métier** en production. Le mécanisme JPA Auditing (`@EnableJpaAuditing` + `AuditorAware`) n'est pas implémenté. Seule la table `users` renseigne `created_by` (manuellement dans UserService).

**Conséquence** : il est impossible de savoir qui a créé ou modifié un projet, une tâche ou une prévision. L'analyse "qui fait quoi" repose sur les audit_logs (vues de page) comme proxy, pas sur une attribution directe.

---

## 5. FICHES OPÉRATIONNELS — QUI FAIT QUOI

### Contributeurs actifs (noyau dur)

| Opérationnel | Logins | Vues | Modif. projet | Tâches assignées | Période d'activité |
|--------------|-------:|-----:|--------------:|-----------------:|-------------------|
| **Justin NDONG** | 41 | 348 | 51 | 0 | 25/03 → 23/06 |
| **Cindy ANDRIANJAFY** | 5 | 169 | 40 | 0 | 18/03 → 11/06 |
| **Berenger YEMBI** | 27 | 154 | 38 | 0 | 25/03 → 19/06 |
| **Carine MOUGUIANA** | 11 | 111 | 33 | 0 | 25/03 → 19/06 |
| **Ulrich Landry IBOUANA** | 14 | 133 | 22 | 0 | 26/03 → 22/06 |
| **Davy NDONG ENGONE** | 14 | 158 | 22 | 0 | 25/03 → 12/06 |
| **Valaria Grace BIBALOU IKONDO** | 1 | 59 | 22 | 0 | 16/06 → 24/06 |
| **Adnen BEN SALAH** | 6 | 176 | 18 | 0 | 24/03 → 12/06 |
| **ARMAND KARL NENE NZIENGUI** | 3 | 137 | 17 | 0 | 20/04 → 25/06 |

### Contributeurs faibles ou inactifs

| Opérationnel | Logins | Vues | Modif. projet | Période |
|--------------|-------:|-----:|--------------:|---------|
| Yves Alexis DITENGOU | 4 | 28 | 10 | 25/03 → 27/03 (3 jours) |
| Xavier NGUEMA | 2 | 34 | 6 | 16/04 → 11/06 |
| Evrard ZUE MINTSA | 1 | 4 | 1 | 24/06 (1 jour) |
| Yannick Gerly OBAME ELLA | 1 | 12 | 0 | 20/04 → 24/04 |

> **Aucune tâche n'est assignée à aucun opérationnel** (0 sur 719). Le champ `assigneA` est systématiquement vide.

---

## 6. SYNTHÈSE ET ALERTES

### Ce qui fonctionne

1. **Le noyau d'adoption existe** : 8 opérationnels utilisent régulièrement la plateforme (>100 vues, actifs en juin)
2. **La saisie hebdomadaire est réelle** : 467 prévisions sur 15 semaines = ~31/semaine. Les chefs de projet planifient
3. **Le suivi mensuel est alimenté** : 161 entrées sur 17 projets, avec CA prévu/réalisé
4. **Le portefeuille est conséquent** : 31 projets, 157,8 milliards FCFA, diversité géographique et typologique

### Alertes critiques

1. **94 % des tâches en retard, 100 % non assignées, 100 % A_FAIRE** — le module Planning n'est pas utilisé comme outil de suivi mais comme liste de prévisions. Aucune tâche n'a jamais changé de statut.

2. **`created_by` NULL partout** — impossible de tracer qui crée quoi. Recommandation technique : implémenter `AuditorAware` pour peupler automatiquement ces colonnes.

3. **52 % des projets sans aucune tâche ni prévision** — la moitié du portefeuille existe dans la plateforme mais n'est pas alimentée.

4. **DQE sur seulement 4 projets (13 %)** — outil sous-utilisé.

5. **Écart consultation / saisie** : 379 ouvertures de page "Modification projet" mais très peu de champs réellement remplis (description, responsable, client toujours vides sur la majorité).

### Recommandation pour le rapport DG

Le message central devrait être : **la plateforme est adoptée pour la consultation et la planification hebdomadaire, mais pas encore pour le pilotage opérationnel**. Les tâches ne sont pas suivies, les DQE ne sont pas généralisés, et la moitié des projets reste une coquille vide. Le levier d'amélioration est davantage organisationnel que technique.

---

*Diagnostic mis à jour le 25/06/2026 — données de production Render (PostgreSQL) — fichier complet : `stats_qui_fait_quoi.json`*
