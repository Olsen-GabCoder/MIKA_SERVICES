# Axes d'amélioration stratégiques — Pages Liste et Détail des projets  
## MIKA Services — Niveau excellence & validation PDG

**Périmètre** : Uniquement la **page qui liste les projets** et la **page qui affiche le détail d’un projet**. Aucune modification de l’existant, des types de données ou de l’architecture. Objectif : pousser la réflexion pour atteindre un niveau d’excellence perçu comme irréprochable en présentation dirigeante.

---

# Partie 1 — Page « Liste des projets »

## 1.1 En-tête de page : donner le sens en un coup d’œil

**Constat** : L’en-tête affiche le titre « Gestion des Projets », le total de projets et la page en cours. Pour un PDG ou un directeur, il manque une **lecture synthétique** de la situation.

**Pistes (sans changer les données ni l’API)** :
- **Bloc de 4–5 indicateurs** juste sous le bandeau (ou intégré au bandeau) : nombre de projets **en cours**, **terminés**, **en retard** (si disponible côté backend), **montant total des marchés (HT)** sur la page ou sur l’ensemble, **avancement physique moyen** (calculé sur les lignes affichées).
- **Légende courte** : une phrase du type « Vue d’ensemble du portefeuille projets — cliquez sur une ligne pour ouvrir le détail. »
- **Contexte utilisateur** : selon le rôle (admin, chef de projet), afficher un sous-titre adapté (ex. « Tous les projets » vs « Mes projets ») en s’appuyant sur les données déjà disponibles.

**Bénéfice** : La page liste ne se limite pas à un tableau ; elle devient une **page de pilotage** : le dirigeant comprend en 5 secondes l’ampleur du portefeuille et sa dynamique.

---

## 1.2 Filtrage et tri : retrouver vite l’information

**Constat** : Une recherche texte existe ; il n’y a pas de filtres par critère (statut, type, chef de projet, client) ni de tri par colonne.

**Pistes** :
- **Filtres** (au-dessus du tableau ou en barre latérale repliable) : **Statut** (liste déroulante), **Type de projet**, **Chef de projet**, **Client**, éventuellement **plage de dates** (début / fin) ou **tranche d’avancement** (ex. &lt; 50 %, 50–80 %, &gt; 80 %). Réutiliser les endpoints existants (`findByStatut`, `findByResponsable`, `search`) ou ajouter des paramètres de requête sur l’endpoint de liste (sans changer le DTO).
- **Tri** : clic sur l’en-tête de colonne pour trier par **Intitulé**, **Type**, **Client**, **Montant HT**, **Avancement physique**, **Statut**, **Chef de projet**, avec indicateur visuel (flèche) et ordre ascendant/descendant. Tri côté client sur la page courante ou paramètres `sort` côté API si disponibles.
- **Combinaison** : recherche texte + filtres + tri pour des cas comme « Tous les projets en cours dont je suis responsable, par montant décroissant ».

**Bénéfice** : Réponse rapide aux questions « Où en sont les projets en retard ? », « Quels sont les plus gros marchés ? », « Que pilote M. X ? ». Indispensable en réunion de direction.

---

## 1.3 Tableau : lisibilité et hiérarchie de l’information

**Constat** : Toutes les colonnes ont le même poids visuel. Pour une lecture dirigeante, certaines informations doivent **guider l’œil** (état de santé, risque).

**Pistes** :
- **Colonne « Intitulé »** : conserver l’icône projet ; éventuellement afficher le **numéro de marché** en petit sous l’intitulé (s’il est disponible dans le résumé) pour une identification rapide.
- **Indicateur visuel « Santé » ou « À risque »** : une petite pastille ou icône (ex. vert / orange / rouge) selon des règles simples (ex. retard planning, points bloquants &gt; 0, avancement &lt; X % avec délai consommé &gt; Y %). Les données nécessaires sont soit déjà dans `ProjetSummary`, soit à faire remonter en champs légers sans changer les types existants.
- **Montant HT** : alignement à droite, police à chasse fixe déjà en place ; s’assurer que les grands nombres sont lisibles (espaces des milliers) et cohérents avec le détail.
- **Avancement physique** : la barre de progression est déjà claire ; garder la note de bas de tableau et éventuellement une **infobulle sur l’en-tête** rappelant la définition (déjà en place). Pas de seconde colonne « avancement financier » sur la liste si les données ne sont pas dans le résumé, pour éviter toute confusion.
- **Statut** : les pastilles colorées sont adaptées ; vérifier que **tous les statuts** possibles ont un libellé et une couleur (y compris RECEPTION_PROVISOIRE, RECEPTION_DEFINITIVE, ABANDONNE) pour cohérence.
- **Actions** : distinguer clairement « Modifier » et « Désactiver » (ex. icône crayon vs corbeille), avec **confirmation explicite** avant désactivation (déjà le cas) ; éviter le déclenchement au clic sur la ligne (stopPropagation déjà en place).

**Bénéfice** : Tableau **scannable** : le regard va d’abord aux indicateurs de santé et aux montants, puis aux détails. Image professionnelle et alignée avec les attentes d’une grande entreprise.

---

## 1.4 États vides, chargement et pagination

**Constat** : État de chargement (spinner + message), état vide (aucun projet / aucun résultat de recherche), pagination (précédent/suivant, première/dernière page).

**Pistes** :
- **Chargement** : conserver le message « Chargement des projets… » ; éventuellement **skeleton** (lignes factices avec animation) pour réduire la sensation d’attente, sans changer l’API.
- **Vide** : différencier « Aucun projet dans le système » (invitation à créer) et « Aucun résultat pour les filtres/recherche » (invitation à élargir les critères). Message et illustration adaptés à chaque cas.
- **Pagination** : afficher le **nombre total d’éléments** (ex. « 1–20 sur 47 ») en plus de « Page 1 sur 3 ». Option **taille de page** (20 / 50 / 100) si l’API le permet sans changement de contrat, pour les utilisateurs qui gèrent beaucoup de projets.
- **Persistance** : après ouverture du détail puis retour, **revenir sur la même page et les mêmes filtres/recherche** (état dans l’URL ou dans le store) pour ne pas perdre le contexte.

**Bénéfice** : Comportement prévisible et rassurant ; pas de « page blanche » ou de perte de contexte au retour du détail.

---

## 1.5 Export de la liste et partage

**Constat** : La page détail propose l’export Word/Excel/PDF du projet ; la **liste** elle-même n’est pas exportable.

**Pistes** :
- **Bouton « Exporter la liste »** (ou « Exporter cette page ») : export **Excel ou CSV** des lignes visibles (avec les filtres et le tri appliqués), colonnes : Intitulé, Numéro de marché (si dispo), Type, Client, Montant HT, Avancement physique %, Statut, Chef de projet. Génération côté frontend à partir des données déjà chargées (pas de nouveau type ni d’API obligatoire).
- **Libellé** : « Exporter la liste (Excel) » pour être explicite. Placé à côté de la recherche ou dans l’en-tête de la zone tableau.

**Bénéfice** : Réunions de pilotage, rapports internes, partage avec la direction sans recopier les données ; renforce l’image d’un outil de **prise de décision**.

---

## 1.6 Accessibilité et usage sur différents écrans

**Pistes** :
- **En-têtes de tableau** : sémantique HTML correcte (`<th>`, `scope="col"`), et **aria-sort** si tri au clavier/lecteur d’écran.
- **Ligne cliquable** : s’assurer que « clic = ouvrir le détail » est annoncé (aria-label ou texte visible pour « Voir le détail ») et que le focus clavier est géré (Tab, Entrée).
- **Responsive** : sur petits écrans, le tableau peut devenir **cartes** (une carte par projet avec les mêmes infos) pour éviter le scroll horizontal et garder la lisibilité.
- **Contraste** : vérifier que les pastilles de statut et les barres d’avancement respectent un contraste suffisant (texte sur fond, normes WCAG).

**Bénéfice** : Confort pour tous les utilisateurs et conformité aux attentes d’une politique RSE / accessibilité en entreprise.

---

# Partie 2 — Page « Détail d’un projet »

## 2.1 Résumé exécutif « above the fold » : la réponse en 10 secondes

**Constat** : L’en-tête contient le nom du projet, le chef de projet, le statut, la semaine en cours et les boutons d’action. Ensuite viennent les sections 1 à 5, les alertes, la synthèse et les visualisations. Un dirigeant qui ouvre la page doit **comprendre l’état du projet sans scroller**.

**Pistes** :
- **Bloc « Résumé exécutif »** placé **immédiatement sous l’en-tête** (ou intégré dans une première bande sous les boutons), sur une seule ligne ou deux, avec **4 à 6 indicateurs** :
  - **Avancement physique** (déjà en synthèse plus bas) : le remonter ici avec la même valeur et une mini-jauge.
  - **Avancement financier** : taux de consommation budgétaire (rapport) ou « — » si indisponible.
  - **Délai consommé** : pourcentage déjà affiché en synthèse ; le dupliquer ici pour lecture rapide.
  - **Points bloquants ouverts** : nombre (déjà disponible).
  - **Prochaine échéance** : date de fin prévue ou réelle, ou « Semaine en cours : Sx (année) » (déjà présent).
  - **Indicateur de santé** : pastille ou libellé synthétique (ex. « Dans les clous » / « Vigilance » / « À risque ») dérivé de règles simples (retard, dérive budget, nombre de PB).
- **Titre du bloc** : « En un coup d’œil » ou « Résumé exécutif » pour cadrer la lecture dirigeante.

**Bénéfice** : Le PDG ou un directeur obtient **sans scroller** la réponse à « Où en est ce projet ? Faut-il s’en inquiéter ? ». Le reste de la page reste disponible pour le détail opérationnel.

---

## 2.2 Alertes : visibilité et action

**Constat** : Les alertes (points bloquants, tâches en retard, risques critiques) apparaissent en bloc après les sections 4 et 5. Elles sont conditionnelles et bien visibles en couleur, mais pas **priorisées** par rapport au flux de contenu.

**Pistes** :
- **Remonter les alertes** juste après le résumé exécutif (ou dans la même zone) pour qu’elles soient vues **avant** les tableaux contractuels et le suivi mensuel. Conserver le même design (encarts colorés) pour cohérence.
- **Hiérarchiser** : une alerte « Retards » ou « Risques critiques » peut être visuellement plus forte (taille, bordure, icône) que « Points bloquants » selon la gravité perçue par MIKA Services.
- **Action suggérée** : sous chaque alerte, un court lien ou bouton (« Voir les points bloquants », « Ouvrir le planning », « Ouvrir la sécurité ») pour passer à l’action sans chercher dans la page.
- **Absence d’alerte** : afficher un court message positif (ex. « Aucune alerte en cours ») dans un encart discret pour confirmer que l’information a bien été vérifiée.

**Bénéfice** : Les alertes deviennent un **levier de décision** immédiat : le dirigeant sait quoi regarder et où agir.

---

## 2.3 Structure et hiérarchie des sections : qui lit quoi

**Constat** : Les sections sont numérotées (1 à 5), puis « Synthèse projet », puis les visualisations. La numérotation est claire ; la **hiérarchie visuelle** (titres, espacements, repli) peut être renforcée.

**Pistes** :
- **Titres de section** : conserver la numérotation (1. Informations contractuelles, 2. Tableau de suivi mensuel, etc.) ; s’assurer que le style (taille, graisse, couleur) est cohérent et que le contraste avec le corps de texte est suffisant.
- **Sections repliables (accordéon)** : permettre de **replier** les blocs (ex. « 3. État d’avancement des études », « 5. Description, observations et propositions ») pour que le lecteur « détail » puisse n’ouvrir que ce qui l’intéresse. Par défaut, les sections les plus stratégiques (résumé exécutif, alertes, suivi mensuel, synthèse) restent ouvertes.
- **Ancres / sommaire** : un **mini-sommaire** en haut (liens d’ancrage vers chaque section) pour les projets très longs ; utile sur grand écran pour la direction.
- **Synthèse projet** : déjà riche (avancement global, type, sous-projets, PB ouverts, délai consommé, etc.). La considérer comme le **bloc de référence** pour une lecture « chef de projet / directeur » : s’assurer que les libellés sont explicites (ex. « Délai consommé » avec infobulle « Part du délai déjà écoulée par rapport au délai prévu »).

**Bénéfice** : Chacun trouve rapidement l’information dont il a besoin (direction = résumé + alertes + synthèse ; opérationnel = suivi mensuel, études, travaux). Image structurée et professionnelle.

---

## 2.4 Tableaux et données : clarté et confiance

**Constat** : Tableaux bien structurés (en-têtes, alignements). Quelques points peuvent renforcer la **lisibilité** et la **confiance** dans les chiffres.

**Pistes** :
- **Montants** : partout où un montant est affiché, **unité cohérente** (FCFA ou XAF) et **format milliers** (espaces) pour éviter les erreurs de lecture.
- **Dates** : format court et unifié (jj/mm/aaaa) sur toute la page ; pas de mélange avec des formats ISO visibles.
- **Pourcentages** : préciser le sens quand il peut prêter à confusion (ex. « Avancement cumulé % » = part du budget réalisée dans le temps ; « Délai consommé % » = part du délai écoulée). Les infobulles ou la note sous le tableau suivi mensuel peuvent porter ce message.
- **Valeurs manquantes** : le « — » est déjà utilisé ; s’assurer qu’il est systématique pour toute donnée absente, et éviter les cellules vides ou « 0 » ambigus (ex. 0 % vs non renseigné).
- **Tableau de suivi mensuel** : la phrase de contexte (budget prévu, dépenses réalisées) est déjà présente ; éventuellement ajouter une **ligne de totaux** en bas (total CA prévisionnel, total CA réalisé, écart total) si pertinent pour la lecture, en cohérence avec les données déjà calculées.

**Bénéfice** : Les chiffres sont **interprétables sans ambiguïté** ; la direction peut s’appuyer sur la page pour valider un état ou un reporting.

---

## 2.5 Actions et navigation : fluidité du parcours

**Constat** : « Retour aux projets », « Télécharger le document », « Modifier le projet » (si chef de projet), et liens « Accès rapide » (Budget, Planning, Qualité, Sécurité, Documents).

**Pistes** :
- **Retour** : le bouton « ← Retour aux projets » est clair ; s’assurer qu’il ramène bien à la **liste avec la même page/filtres** (état conservé côté client ou URL) pour ne pas perdre le contexte.
- **Télécharger le document** : le libellé est explicite ; pendant la génération, le bouton désactivé avec « Génération… » évite les double-clics. À conserver.
- **Modifier le projet** : visible uniquement pour le chef de projet ; positionnement à côté du téléchargement est logique. Pas de changement nécessaire si les droits sont déjà cohérents.
- **Accès rapide** : les liens vers Budget, Planning, Qualité, Sécurité, Documents sont utiles. On peut les regrouper sous un titre unique « Modules liés » ou « Aller à » pour clarifier qu’il s’agit de **navigation transversale** (et non d’une section du projet). Optionnel : ouvrir dans un nouvel onglet pour garder la page détail ouverte.

**Bénéfice** : Parcours **fluide** : entrée par la liste, détail, action (export ou modification), puis retour sans perte de contexte. Image d’un outil pensé pour le travail quotidien et le pilotage.

---

## 2.6 Visualisations et indicateurs stratégiques

**Constat** : La section `ProjetVisualisationsSection` (jauges, planning, etc.) apporte une **vue stratégique** en bas de page.

**Pistes** (sans modifier le composant ni les types) :
- **Position** : garder les visualisations après la synthèse pour ne pas surcharger le haut de page ; le résumé exécutif (cf. 2.1) complète ces indicateurs pour une lecture « above the fold ».
- **Cohérence** : s’assurer que les **chiffres** affichés dans les jauges (avancement physique, avancement financier, etc.) sont **alignés** avec ceux du résumé exécutif et de la synthèse (même source, même libellé).
- **Titre de section** : un titre clair (« Indicateurs stratégiques » ou « Vue pilotage ») au-dessus des visualisations pour que le lecteur comprenne qu’il s’agit d’une **synthèse graphique** du même projet.

**Bénéfice** : Les visualisations restent un **complément** à la lecture tabulaire ; avec le résumé exécutif en haut, la page couvre à la fois la lecture rapide (direction) et l’analyse approfondie (chef de projet, direction technique).

---

## 2.7 Accessibilité et impression

**Pistes** :
- **Titres** : hiérarchie de titres logique (H1 = nom du projet dans l’en-tête, H2 = titres des sections) pour la navigation au clavier et les lecteurs d’écran.
- **Tableaux** : `scope="col"` / `scope="row"` et légendes courtes si besoin pour les tableaux complexes (suivi mensuel, études).
- **Impression** : une **feuille de style print** (ou bouton « Version imprimable ») peut masquer les boutons et les éléments purement interactifs, et garder l’en-tête, le résumé exécutif, les alertes, les tableaux principaux et la synthèse. Utile pour archivage ou réunion hors écran.

**Bénéfice** : Page détail utilisable par tous et exploitable en support papier si besoin, sans changer la structure des données.

---

# Synthèse des priorités (Liste + Détail uniquement)

| Priorité | Page | Axe | Impact dirigeant | Effort |
|----------|------|-----|------------------|--------|
| Haute | Liste | Indicateurs synthétiques en tête (KPIs portefeuille) | Très fort | Faible |
| Haute | Liste | Filtres (statut, type, responsable, client) + tri par colonne | Très fort | Moyen |
| Haute | Détail | Résumé exécutif « above the fold » (4–6 indicateurs) | Très fort | Moyen |
| Haute | Détail | Remonter et renforcer les alertes + actions suggérées | Très fort | Faible |
| Moyenne | Liste | Indicateur « Santé » / « À risque » par ligne | Fort | Moyen |
| Moyenne | Liste | Export de la liste (Excel/CSV) | Fort | Faible |
| Moyenne | Détail | Sections repliables (accordéon) + sommaire ancres | Fort | Moyen |
| Moyenne | Détail | Infobulles / précisions sur indicateurs (délai consommé, avancement cumulé) | Fort | Faible |
| Basse | Liste | Skeleton chargement, pagination « 1–20 sur 47 », persistance page/filtres au retour | Confort | Faible à moyen |
| Basse | Détail | Retour liste avec état conservé ; version imprimable | Confort | Faible |
| Basse | Les deux | Accessibilité (ARIA, contraste, responsive liste en cartes sur mobile) | Conformité | Moyen |

---

# Conclusion

Les **pages liste et détail des projets** sont déjà opérationnelles et conformes au cahier des charges. Les axes ci‑dessus visent à les faire passer au niveau **excellence** attendu pour une présentation au PDG et une digitalisation irréprochable, en restant **strictement dans le périmètre** de ces deux écrans, **sans modifier l’existant**, les types de données ni l’architecture.

**Fils directeurs** :
- **Liste** : transformer l’écran en **tableau de bord de portefeuille** (KPIs, filtres, tri, export) et en **table scannable** (santé, lisibilité).
- **Détail** : donner **en 10 secondes** l’état du projet (résumé exécutif + alertes) puis structurer le reste pour une lecture par niveaux (synthèse, tableaux, visualisations).

Ces propositions sont **pertinentes, réalistes et adaptées** à une grande entreprise, orientées **performance**, **lisibilité** et **prise de décision**, sans altérer la base existante.
