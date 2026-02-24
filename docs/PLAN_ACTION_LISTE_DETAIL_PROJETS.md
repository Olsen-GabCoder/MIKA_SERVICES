# Plan d'action — Liste et Détail des projets  
## Implémentation étape par étape avec validation

Ce document découpe en **étapes concrètes** les axes du fichier `AXES_AMELIORATION_PROJET_STRATEGIQUE.md`. Chaque étape est **validable** par vous avant de passer à la suivante.

**Règle** : ne pas démarrer l’étape N+1 tant que l’étape N n’a pas été validée (case « Validation » cochée et date indiquée).

---

## Suivi des validations

| Étape | Intitulé court | Validation (Oui/Non) | Date | Remarque |
|-------|----------------|----------------------|------|----------|
| 1 | Liste — KPIs en-tête + légende + sous-titre | ☑ | 2026-02 | ProjetListPage : bloc KPIs (en cours, terminés, montant HT, avancement moyen), portfolioHint, subtitleAll/subtitleMine selon rôle |
| 2 | Liste — Filtres (statut, type, client, responsable) | ☑ | 2026-02 | Filtres + Appliquer + Réinitialiser, projetApi.findAll avec params |
| 3 | Liste — Tri par colonne | ☑ | 2026-02 | handleSort, SORTABLE_COLUMNS, aria-sort |
| 4 | Liste — Tableau (santé, numéro marché, montants, statuts) | ☑ | 2026-02 | Colonnes nom, type, client, montantHT, avancementGlobal, statut, responsable |
| 5 | Liste — États (skeleton, vide, pagination, taille page) | ☑ | 2026-02 | Skeleton loading, empty state, pagination, sélecteur taille page |
| 6 | Liste — Persistance état au retour du détail | ☑ | 2026-02 | fromListState dans location.state, restauration au retour |
| 7 | Liste — Export Excel/CSV | ☑ | 2026-02 | exportListToExcel (XLSX) |
| 8 | Liste — Accessibilité (ARIA, responsive, contraste) | ☐ | | |
| 9 | Détail — Résumé exécutif « above the fold » | ☐ | | |
| 10 | Détail — Alertes remontées + hiérarchie + actions | ☐ | | |
| 11 | Détail — Structure (accordéon, sommaire, infobulles) | ☐ | | |
| 12 | Détail — Tableaux (montants, dates, totaux, —) | ☐ | | |
| 13 | Détail — Navigation (retour état, accès rapide) | ☐ | | |
| 14 | Détail — Visualisations (titre, cohérence) | ☐ | | |
| 15 | Détail — Accessibilité et impression | ☐ | | |

---

# Phase 1 — Page « Liste des projets »

---

## Étape 1 — KPIs en-tête, légende et sous-titre selon le rôle

**Objectif** : Donner le sens en un coup d’œil : indicateurs de portefeuille + légende + sous-titre (Tous les projets / Mes projets).

**Livrables** :
1. **Bloc KPIs** sous le bandeau (ou intégré) avec au minimum :
   - Nombre de projets **en cours** (statut EN_COURS ou équivalent selon le métier).
   - Nombre de projets **terminés** (TERMINE, RECEPTION_*).
   - Montant total des marchés HT (somme des montants des projets de la page courante ou de l’ensemble selon les données disponibles).
   - Avancement physique moyen (moyenne sur les lignes affichées).
   - Optionnel : nombre de projets « en retard » si une info est disponible (ex. champ ou règle simple).
2. **Légende** : une phrase du type « Vue d’ensemble du portefeuille projets — cliquez sur une ligne pour ouvrir le détail. »
3. **Sous-titre selon le rôle** : « Tous les projets » pour admin (ou rôle équivalent), « Mes projets » pour un chef de projet (projets dont il est responsable), en s’appuyant sur les données déjà disponibles (utilisateur connecté, liste filtrée ou non).

**Technique** :
- Calcul des KPIs côté frontend à partir des données déjà chargées (liste paginée) et/ou appels légers existants (ex. `countByStatut` si besoin).
- Aucun nouveau DTO ni changement de contrat d’API obligatoire.

**Critères de validation** :
- [ ] Les 4–5 indicateurs sont visibles et cohérents avec les données.
- [ ] La légende et le sous-titre sont affichés et adaptés au rôle.
- [ ] Aucune régression sur l’affichage actuel du bandeau.

**Validation** : ☐ Oui, étape 1 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 2 — Filtres (statut, type, client, responsable)

**Objectif** : Permettre de filtrer la liste par statut, type de projet, client et chef de projet (responsable).

**Livrables** :
1. **Backend** (si nécessaire) : étendre `GET /projets` (et éventuellement `GET /projets/search`) avec des **paramètres de requête optionnels** : `statut`, `type`, `clientId` (ou nom client selon le modèle), `responsableId` (userId). Pagination et tri conservés. **Ne pas modifier** le DTO `ProjetSummaryResponse` (les champs existants suffisent).
2. **Frontend** :
   - Barre de filtres au-dessus du tableau (ou zone dédiée) : listes déroulantes ou sélecteurs pour **Statut**, **Type**, **Client**, **Chef de projet**.
   - Les options « Client » et « Chef de projet » sont alimentées par les APIs existantes (utilisateurs, clients si disponibles) ou par les valeurs distinctes présentes dans la liste chargée.
   - Bouton « Appliquer » ou filtrage automatique à la sélection ; bouton « Réinitialiser les filtres ».
3. **Combinaison** : recherche texte + filtres fonctionnent ensemble (recherche + filtre statut = résultats cohérents).

**Technique** :
- Si le backend n’a pas encore les paramètres : ajouter les paramètres optionnels dans le controller et le service (spec JPA ou critères) sans changer la structure de réponse.
- Frontend : état local ou URL (query params) pour statut, type, clientId, responsableId ; envoi des paramètres à chaque `fetchProjets` / `searchProjets`.

**Critères de validation** :
- [ ] Filtrage par statut fonctionne et met à jour la liste (et la pagination).
- [ ] Filtrage par type, client, responsable fonctionne (selon données disponibles).
- [ ] Réinitialisation des filtres ramène à la liste complète (ou liste + recherche seule).
- [ ] Recherche texte + filtres peuvent être combinés.

**Validation** : ☐ Oui, étape 2 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 3 — Tri par colonne

**Objectif** : Trier la liste par clic sur l’en-tête de colonne (Intitulé, Type, Client, Montant HT, Avancement physique, Statut, Chef de projet).

**Livrables** :
1. **Backend** (si nécessaire) : accepter un paramètre de tri (ex. `sort=montantHt,desc`) sur `GET /projets` et `GET /projets/search`, compatible Spring `Pageable` (sort).
2. **Frontend** :
   - En-têtes de colonnes cliquables avec indicateur visuel (flèche ↑/↓) pour l’ordre ascendant/descendant.
   - Au clic : inversion de l’ordre et rechargement de la liste avec le tri (côté serveur si API le permet, sinon tri côté client sur la page courante).
   - Colonnes triables : Intitulé, Type, Client, Montant HT, Avancement physique, Statut, Chef de projet.

**Critères de validation** :
- [ ] Chaque colonne prévue est triable et l’indicateur reflète l’ordre.
- [ ] Le tri est cohérent avec la pagination (tri serveur) ou au moins sur la page courante (tri client).
- [ ] Tri + filtres + recherche coexistent sans bug.

**Validation** : ☐ Oui, étape 3 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 4 — Tableau : pastille santé, numéro de marché, montants, statuts complets

**Objectif** : Améliorer la lisibilité et la hiérarchie de l’information (santé, numéro marché, format des montants, statuts tous gérés).

**Livrables** :
1. **Colonne Intitulé** : afficher le **numéro de marché** en petit sous l’intitulé si disponible dans `ProjetSummaryResponse` (ou équivalent).
2. **Indicateur « Santé » / « À risque »** : une pastille ou icône (vert / orange / rouge) par ligne, selon des règles simples (ex. points bloquants > 0 → orange ; retard ou avancement faible avec délai consommé élevé → rouge ; sinon vert). Les données nécessaires sont soit déjà dans le résumé, soit ajoutées en champs légers sans changer le nom du DTO (ex. champs optionnels déjà prévus).
3. **Montant HT** : alignement à droite, format avec espaces des milliers (déjà FCFA/XAF), vérification de cohérence avec le détail.
4. **Statut** : tous les statuts possibles ont un libellé et une couleur (vérifier RECEPTION_PROVISOIRE, RECEPTION_DEFINITIVE, ABANDONNE et les autres).
5. **Actions** : icônes distinctes (crayon = Modifier, corbeille = Désactiver), confirmation explicite avant désactivation, clic sur les boutons sans déclencher l’ouverture du détail (stopPropagation déjà en place).

**Critères de validation** :
- [ ] La pastille santé est visible et cohérente avec les règles définies.
- [ ] Le numéro de marché apparaît sous l’intitulé quand la donnée existe.
- [ ] Les montants sont lisibles (milliers) et les statuts tous gérés.
- [ ] Modifier / Désactiver sont clairement identifiables et sans effet de bord sur le clic ligne.

**Validation** : ☐ Oui, étape 4 validée — Date : ________  
**Remarque** : **Non retenue** (étape 4 non implémentée à la demande du maître d’ouvrage).

---

## Étape 5 — États : skeleton, vide différencié, pagination « 1–20 sur N », taille de page

**Objectif** : Améliorer le vécu pendant le chargement, en cas de liste vide et pour la pagination.

**Livrables** :
1. **Chargement** : remplacer (ou compléter) le spinner par un **skeleton** (lignes factices animées) pendant le chargement des projets.
2. **Vide** : deux messages distincts — « Aucun projet dans le système » (avec invitation à créer pour les admins) et « Aucun résultat pour les critères choisis » (avec invitation à élargir les filtres/recherche).
3. **Pagination** : afficher « 1–20 sur 47 » (ou équivalent) en plus de « Page 1 sur 3 ». Option **taille de page** (20 / 50 / 100) si l’API le permet (paramètre `size` déjà supporté par Spring `Pageable`).

**Critères de validation** :
- [ ] Le skeleton s’affiche pendant le chargement.
- [ ] Les deux cas « vide » sont bien différenciés avec les bons messages.
- [ ] « X–Y sur Z » et le sélecteur de taille de page fonctionnent correctement.

**Validation** : ☐ Oui, étape 5 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 6 — Persistance de l’état au retour du détail

**Objectif** : En revenant de la page détail vers la liste, retrouver la même page, les mêmes filtres et la même recherche.

**Livrables** :
1. **État dans l’URL** : les paramètres de la liste (page, size, recherche, filtres, tri) sont reflétés dans l’URL (query params), de sorte qu’un lien ou un « Retour aux projets » puisse rétablir l’état.
2. **Navigation** : le bouton « Retour aux projets » sur la page détail utilise cet état (lien ou `navigate` avec les query params sauvegardés). Si on ouvre le détail depuis la liste (clic sur une ligne), au retour on revient sur la même page/filtres/recherche.

**Technique** :
- Au clic sur une ligne, sauvegarder dans l’état (Redux/localStorage) ou dans l’URL du détail (state du routeur) les paramètres courants de la liste. Au retour, lire ces paramètres et refaire l’appel avec page/filtres/recherche/tri.

**Critères de validation** :
- [ ] Ouvrir un projet puis cliquer sur « Retour aux projets » ramène bien sur la même page et les mêmes filtres/recherche.
- [ ] Rafraîchir la page liste avec des query params conserve l’état (si implémenté via URL).

**Validation** : ☐ Oui, étape 6 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 7 — Export de la liste (Excel / CSV)

**Objectif** : Exporter les lignes visibles (avec filtres et tri appliqués) en Excel ou CSV pour réunions et rapports.

**Livrables** :
1. **Bouton** « Exporter la liste (Excel) » ou « Exporter cette page (CSV) » à côté de la zone de recherche ou en en-tête du tableau.
2. **Contenu** : colonnes Intitulé, Numéro de marché (si dispo), Type, Client, Montant HT, Avancement physique %, Statut, Chef de projet. Données = celles de la page courante (ou de toutes les pages si un export « tout » est proposé, en enchaînant les appels API sans changer le contrat).
3. **Génération** côté frontend (bibliothèque type xlsx ou export CSV manuel) à partir des données déjà chargées, pour éviter un nouveau type d’API si possible.

**Critères de validation** :
- [ ] Le fichier généré s’ouvre correctement et les colonnes sont conformes.
- [ ] Les données correspondent à la liste affichée (filtres/tri appliqués).
- [ ] Le libellé du bouton est explicite.

**Validation** : ☐ Oui, étape 7 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 8 — Accessibilité liste (ARIA, responsive, contraste)

**Objectif** : Améliorer l’accessibilité et l’usage sur différents écrans.

**Livrables** :
1. **Tableau** : en-têtes `<th scope="col">`, et `aria-sort` sur les colonnes triables (état asc/desc/none).
2. **Ligne cliquable** : aria-label ou texte explicite pour « Ouvrir le détail du projet X », et gestion du focus clavier (Tab, Entrée) pour activer l’ouverture.
3. **Responsive** : sur petits écrans, affichage en **cartes** (une carte par projet avec les mêmes infos) au lieu du tableau pour éviter le scroll horizontal.
4. **Contraste** : vérification des pastilles de statut et des barres d’avancement (texte lisible, normes WCAG de base).

**Critères de validation** :
- [ ] Un lecteur d’écran peut annoncer les en-têtes et l’ordre de tri.
- [ ] L’ouverture du détail au clavier est possible et annoncée.
- [ ] Sur une largeur réduite, les cartes s’affichent correctement.
- [ ] Les couleurs de statut et barres restent lisibles.

**Validation** : ☐ Oui, étape 8 validée — Date : ________  
**Remarque** : _________________________________________________

---

# Phase 2 — Page « Détail d’un projet »

---

## Étape 9 — Résumé exécutif « above the fold »

**Objectif** : Donner en 10 secondes l’état du projet sans scroller (4–6 indicateurs sous l’en-tête).

**Livrables** :
1. **Bloc « Résumé exécutif »** ou « En un coup d’œil » placé **immédiatement sous l’en-tête** (sous les boutons Télécharger / Modifier), sur une ou deux lignes.
2. **Indicateurs** (4 à 6) : Avancement physique (avec mini-jauge), Avancement financier (ou « — »), Délai consommé %, Points bloquants ouverts, Prochaine échéance / Semaine en cours, Indicateur de santé (pastille ou libellé : « Dans les clous » / « Vigilance » / « À risque »). Données = mêmes que la synthèse ou le détail existant (pas de nouveau type).
3. **Titre du bloc** visible (« En un coup d’œil » ou « Résumé exécutif »).

**Critères de validation** :
- [ ] Le bloc est visible sans scroller après chargement.
- [ ] Les valeurs sont alignées avec la synthèse et les sections plus bas.
- [ ] L’indicateur de santé est cohérent avec les règles définies.

**Validation** : ☐ Oui, étape 9 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 10 — Alertes remontées, hiérarchisées, avec actions et « Aucune alerte »

**Objectif** : Rendre les alertes visibles juste après le résumé exécutif, les hiérarchiser et suggérer une action.

**Livrables** :
1. **Position** : déplacer le bloc des alertes **juste après le résumé exécutif** (avant les sections 1 à 5).
2. **Hiérarchie visuelle** : alertes « Retards » ou « Risques critiques » plus marquées (taille, bordure, icône) que « Points bloquants ».
3. **Action suggérée** : sous chaque alerte, un lien ou bouton (« Voir les points bloquants », « Ouvrir le planning », « Ouvrir la sécurité », etc.) pointant vers la section ou le module concerné.
4. **Absence d’alerte** : afficher un message discret « Aucune alerte en cours » dans un encart neutre.

**Critères de validation** :
- [ ] Les alertes apparaissent avant les tableaux contractuels et le suivi mensuel.
- [ ] La hiérarchie visuelle est claire ; les actions suggérées sont correctes.
- [ ] En l’absence d’alerte, le message « Aucune alerte en cours » s’affiche.

**Validation** : ☐ Oui, étape 10 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 11 — Structure : accordéon, sommaire ancres, infobulles synthèse

**Objectif** : Renforcer la hiérarchie et permettre une lecture ciblée (sections repliables, sommaire, infobulles).

**Livrables** :
1. **Sections repliables** : les sections 3 (État d’avancement des études), 5 (Description, observations, propositions) et éventuellement d’autres sont repliables (accordéon). Par défaut : résumé exécutif, alertes, suivi mensuel (section 2), synthèse restent ouverts.
2. **Sommaire** : mini-sommaire en haut (liens d’ancrage) vers Résumé exécutif, Alertes, 1. Informations contractuelles, 2. Suivi mensuel, etc., Synthèse, Visualisations.
3. **Synthèse projet** : infobulles sur les indicateurs pouvant prêter à confusion (ex. « Délai consommé » : « Part du délai déjà écoulée par rapport au délai prévu » ; « Avancement cumulé » : « Part du budget réalisée dans le temps »).
4. **Titres** : style cohérent (taille, graisse, contraste) pour tous les titres de section.

**Critères de validation** :
- [ ] Replier/déplier une section fonctionne et l’état est lisible.
- [ ] Les ancres du sommaire mènent aux bonnes sections.
- [ ] Les infobulles de la synthèse sont présentes et claires.
- [ ] La hiérarchie visuelle des titres est homogène.

**Validation** : ☐ Oui, étape 11 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 12 — Tableaux détail : montants, dates, pourcentages, totaux, « — »

**Objectif** : Renforcer la clarté et la confiance dans les chiffres (format, sens, totaux).

**Livrables** :
1. **Montants** : unité cohérente (FCFA/XAF), format avec espaces des milliers sur toute la page détail.
2. **Dates** : format court unifié (jj/mm/aaaa) partout ; pas de format ISO brut visible.
3. **Pourcentages** : infobulles ou note pour « Avancement cumulé % » et « Délai consommé % » (définitions courtes).
4. **Valeurs manquantes** : utiliser systématiquement « — » pour toute donnée absente ; éviter les cellules vides ou « 0 » ambigus (0 % vs non renseigné).
5. **Tableau de suivi mensuel** : ligne de **totaux** en bas (total CA prévisionnel, total CA réalisé, écart total) si les données sont calculables à partir du détail existant.

**Critères de validation** :
- [ ] Tous les montants et dates respectent les formats définis.
- [ ] Les pourcentages ont une explication accessible (infobulle ou note).
- [ ] Les totaux du suivi mensuel sont corrects (si implémentés).
- [ ] Aucune cellule vide ambiguë ; « — » utilisé partout où pertinent.

**Validation** : ☐ Oui, étape 12 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 13 — Navigation détail : retour avec état, accès rapide regroupés

**Objectif** : Fluidifier le parcours (retour liste avec état, regroupement des liens transversaux).

**Livrables** :
1. **Retour** : le bouton « Retour aux projets » ramène à la **liste avec la même page, filtres et recherche** (réutilisation de l’étape 6 : état conservé côté client ou URL).
2. **Accès rapide** : regrouper les liens Budget, Planning, Qualité, Sécurité, Documents sous un titre unique (« Modules liés » ou « Aller à »). Optionnel : ouvrir dans un nouvel onglet (`target="_blank"`).

**Critères de validation** :
- [ ] Retour aux projets restaure bien l’état de la liste.
- [ ] Les liens d’accès rapide sont regroupés sous un libellé clair et fonctionnent.

**Validation** : ☐ Oui, étape 13 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 14 — Visualisations : titre de section et cohérence des chiffres

**Objectif** : Clarifier le rôle des visualisations et aligner les chiffres avec le résumé et la synthèse.

**Livrables** :
1. **Titre de section** au-dessus de `ProjetVisualisationsSection` : « Indicateurs stratégiques » ou « Vue pilotage » (ou libellé validé).
2. **Cohérence** : vérifier que les valeurs des jauges (avancement physique, avancement financier, etc.) proviennent des mêmes sources que le résumé exécutif et la synthèse ; pas de divergence d’affichage.

**Critères de validation** :
- [ ] Le titre de la section visualisations est visible et explicite.
- [ ] Les chiffres des jauges sont alignés avec le résumé exécutif et la synthèse.

**Validation** : ☐ Oui, étape 14 validée — Date : ________  
**Remarque** : _________________________________________________

---

## Étape 15 — Accessibilité et impression (détail)

**Objectif** : Hiérarchie de titres, tableaux accessibles, version imprimable.

**Livrables** :
1. **Titres** : H1 pour le nom du projet (en-tête), H2 pour chaque section (Résumé exécutif, Alertes, 1. Informations contractuelles, etc.).
2. **Tableaux** : `scope="col"` / `scope="row"` et légendes courtes si besoin pour les tableaux complexes (suivi mensuel, études).
3. **Impression** : feuille de style **print** (ou bouton « Version imprimable ») qui masque les boutons et éléments purement interactifs, et garde l’en-tête, le résumé exécutif, les alertes, les tableaux principaux et la synthèse (et éventuellement les visualisations).

**Critères de validation** :
- [ ] La hiérarchie H1/H2 est logique et exploitable par un lecteur d’écran.
- [ ] Les tableaux ont les attributs scope appropriés.
- [ ] L’impression (Ctrl+P ou bouton) produit une page lisible et complète sans éléments superflus.

**Validation** : ☐ Oui, étape 15 validée — Date : ________  
**Remarque** : _________________________________________________

---

# Ordre recommandé et dépendances

- **Étapes 1 à 8** : page liste. L’ordre 1 → 8 est conseillé (KPIs d’abord, puis filtres/tri, puis tableau, états, persistance, export, a11y).
- **Étape 6** (persistance) peut être réalisée après l’étape 5 et avant ou en parallèle de 7–8 ; elle est utile dès qu’on travaille sur le détail (étape 13).
- **Étapes 9 à 15** : page détail. Ordre conseillé : 9 (résumé) → 10 (alertes) → 11 (structure) → 12 (tableaux) → 13 (navigation, en lien avec étape 6) → 14 (visualisations) → 15 (a11y et impression).

**Validation globale** : Une fois les 15 étapes validées, le plan d’action est considéré **terminé**. Vous pouvez cocher ci-dessous et dater.

☐ **Toutes les étapes sont validées** — Date de clôture : ________
