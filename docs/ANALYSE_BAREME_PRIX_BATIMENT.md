# Analyse complète — BAREME DES PRIX BÂTIMENT AVEC SOUS DÉTAILS (Tout Corps d'État)

**Fichier source :** `docs/BAREME DES PRIX BÂTIMENT AVEC SOUS DETAILS (Tout_Corps_d'Etat).xls`  
**Format :** Excel 97-2003 (.xls), encodage Windows-1252 (caractères accentués affichés en dans une lecture brute).

---

## 1. Vue d’ensemble

Le classeur contient **16 feuilles** :

| # | Nom de la feuille | Lignes | Colonnes | Rôle principal |
|---|-------------------|--------|----------|----------------|
| 1 | **Coef d'éloignement** | 42 | 5 | Coefficients par ville/localité (Gabon) |
| 2 | **Gros-Oeuvre** | 385 | 17 | Matériaux GO, location, M.O + sous-détails prestations |
| 3 | **Assainissement** | 316 | 15 | Matériaux assainissement + fosses, puisards, regards |
| 4 | **Charpente-Couverture étanchéité** | 300 | 22 | Bois, couverture, étanchéité, M.O + PU dérivés |
| 5 | **Plafonds Bois et STAFF** | 116 | 15 | Lattes, CP, staff, plafonds, cornices |
| 6 | **Clôture-Soutènements** | 224 | 15 | Murs, grillages, pilastres, soubassements |
| 7 | **Jardins-Espaces Verts** | 95 | 15 | Terre, plantations, bordures, allées, dalles |
| 8 | **Voirie-Réseaux Divers-Sols Pavé** | 231 | 15 | Terrassement, bordures, caniveaux, buses, pavés, enrobé |
| 9 | **Lot Fabrication de Menuiserie** | 493 | 15 | Bois, CP, formica, atelier, cadres, M.O |
| 10 | **Pose de Menuiserie Extérieures** | 287 | 16 | Chassis naco, portes, fenêtres, quincaillerie |
| 11 | **Pose de Menuiserie Intérieurs** | 306 | 17 | Portes isoplanes, placards, vasques, M.O |
| 12 | **Plomberie** | 223 | 18 | Tuyaux, appareils sanitaires, M.O |
| 13 | **Electricité** | 330 | 17 | Tableaux, câbles, gaines, prises, climatisation, M.O |
| 14 | **Carrelages-Faiences-Moquettes** | 107 | 15 | Carrelage, faïence, moquette, vinyl, plinthes |
| 15 | **Ferronnerie-Construction Métallique** | 440 | 16 | Tubes, fers, IPE, grilles, portails, boulonnerie |
| 16 | **Peinture-Vitrerie-Tenture-Nettoyage** | 179 | 16 | Enduits, peintures, vitrage, tenture, capitonnage |
| 17 | **Sheet1** | 0 | 0 | Feuille vide |

---

## 2. Feuille « Coef d'éloignement »

- **En-tête :** Titre « Coefficient d'éloignement », ligne de colonnes : Villes ou Localités | % | Coef | (vide) | Note.
- **Contenu :** Liste de **villes/localités du Gabon** avec :
  - **%** : pourcentage d’éloignement (0 à 42).
  - **Coef** : coefficient multiplicateur (1 à 1,42).
- **Exemples :** LIBREVILLE 0 % coef 1 ; COCOBEACH 5 % coef 1,05 ; PORT GENTIL 8 % coef 1,08 ; MOANDA 32 % coef 1,32 ; MEKAMBO 42 % coef 1,42.
- **Note en bas de feuille :** Les pourcentages sont indicatifs et peuvent varier selon la saison, l’état des routes, la disponibilité des matériaux locaux, l’importance du matériel à mettre en œuvre, etc.

**Usage attendu :** Appliquer le coefficient de la localité au coût (déboursé ou P.V) pour tenir compte de l’éloignement.

---

## 3. Structure commune des feuilles « Corps d’État »

Chaque feuille métier (Gros-Oeuvre à Peinture) suit la même logique :

### 3.1 En-tête (lignes 0–2)

- **Gauche :** « BAREME DE PRIX DES MATERIAUX PAR FOURNISSEURS AGREES » puis « Prix des matériaux ».
- **Droite :** « BAREME DE PRIX AVEC SOUS DETAILS ».
- **Ligne de colonnes :**
  - **Partie matériaux (gauche) :** N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts.
  - **Partie sous-détails (droite) :** Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coëf 1.4 ou 1.6.

### 3.2 Partie « Prix des matériaux »

- Lignes de **référence de prix** : numéro (ex. G.13, G.14), libellé matériau, unité (m3, kg, U, ml, m², h…), **P.TTC** (prix total TTC), fournisseur, contact (souvent n° tél.).
- **Fournisseurs cités** (selon les feuilles) : Transp, Gab gra, Détail, Bernabé, Briquet, SGPB, Abido, Sogame, Ferronier, Scierie, Mat Gab, Tecnobat, Soga-Imp, Cimentiers, SGBM, Matelec, Brosset, Socimat, SAMCE, etc.
- **Sections récurrentes en fin de feuille :**
  - **Location de matériel** (pelle, bull, camion, échafaudage, niveleuse, compacteur…).
  - **Main-d’œuvre** (M.O) : taux horaire (Maçon, Manœuvre, Plombier, Charpentier, Menuisier, etc.) et souvent **Taux horaire moyen** (ex. 1 100 F/h).

### 3.3 Partie « BAREME DE PRIX AVEC SOUS DETAILS »

- **Libellé :** description d’une prestation complète (ex. « Fosse septique 8 usagers 2 m3 », « Murs de clôture 2 m en agglos 15 », « Fourniture et pose de cadres chassis naco… »).
- **Lignes de décomposition :** pour chaque poste : Libellé (ex. Sable, Ciment, M.O) | Qté | P.U | U | **Sommes** (Qté × P.U).
- **Totaux :**
  - **Déboursé** : somme des lignes pour cette prestation (unité en dernière colonne : U, m², ml, m3…).
  - **P.V Coëf 1.4 ou 1.6** : prix de vente = Déboursé × coefficient (1,4 ou 1,6 selon feuille).

Les prix sont en **Francs CFA** (F) ou unité locale cohérente avec le contexte Gabon.

---

## 4. Résumé par feuille métier

### Gros-Oeuvre (385 lignes)

- **Matériaux :** Sable, gravier, ciment, acier TOR (T6 à T20), fil d’attache, treillis soudé, polyane, agglos (creux 5/10/15/20), hourdis, bois (lattes, chevrons, planches), pointes, paxalu, feutre bitumé, flinkote, laine de verre, polystyrène, bacs à laver, bidim, tôles ondulées, etc.
- **Location :** Pelle poclain, Bull D6, camion 12T, échafaudage.
- **M.O :** Maçon, Manœuvre, Taux horaire (1 100 F/h).
- **Sous-détails :** Débroussaillage, baraque de chantier 30 m², implantation et traçage, terrassement grande masse, terrassement manuel, soubassements agglos, béton de propreté, béton armé semelles, coffrage poteaux, remblai sable compacté, coffrage dallage, polyane sous dallage, treillis dallage, béton dallage, maçonneries agglos 20/15, etc. Chaque bloc se termine par un Déboursé et un P.V (coef 1.4).

### Assainissement (316 lignes)

- **Matériaux :** Sable, gravier, ciment, acier, agglos, PVC (tuyaux, coudes, té, culottes, réductions), colle PVC, colliers, pattes à vis, chevilles, bois coffrage, pointes.
- **M.O :** Plombier, Manœuvre, Taux horaire moyen.
- **Sous-détails :** Fosses septiques (2 m3 à 7,5 m3, 8 à 60 usagers), puisards (diam. 1,50 et 2,00), regard maçonnerie 40×40×40. Chaque prestation en Déboursé + P.V Coëf 1.6.

### Charpente-Couverture étanchéité (300 lignes, 22 colonnes)

- **Matériaux :** Bois charpente (Douka, Moabi, Ozigo…), planches, lattes, chevrons, pannes, bacs alu, faîtières, plaques Éternit, tuiles ciment, tôles ondulées, xylophène, shingles, gouttières PVC, produits étanchéité (bitume, feutre, paxalu, culottes plomb, crépines), dalette béton.
- **Atelier :** Rabotage charpente/menuiserie, machinage.
- **M.O :** Charpentier couvreur, Manœuvre, Taux horaire moyen.
- **Sous-détails :** Fermes moisées (6 à 16 m), pannes (lattes, chevrons, bastaings), habillage pignons, planches de rive, gouttières (détail goulotte, naissance, jonction, descente, crochet). Certaines colonnes en plus : Prix matériel, Unité, %, matériel+M.O, PU ép. 20 cm, PU ép. 40 cm.

### Plafonds Bois et STAFF (116 lignes)

- **Matériaux :** Lattes 4×8, chevrons 8×8, pointes, xylamon, CP 4/5/8 mm, couvre-joints, cornices bois, panneaux/corniches/bandeaux/rosace staff, moustiquaire, colle néoprène.
- **M.O :** Charpentier, Manœuvre, Taux horaire.
- **Sous-détails :** Plafonds bois (CP 4 mm avec couvre-joints ou joints creux, CP 5 mm, CP 8 mm), ventilation 40×50 avec grille, plafonds intérieurs CP 4/5/8, cornices et bandeaux bois, trappe d’accès combles, plafond décoratif CP ébénisterie, traitement bois, plafonds staff (pose, cornice, bandeau, rosace).

### Clôture-Soutènements (224 lignes)

- **Matériaux :** Sable, gravier, ciment, acier, agglos, bois coffrage, pointes, grillage galvanisé/plastifié (100/150/200), fil tendeur, tendeurs, piquets fer, tuyaux PVC, bidim, CP 19, terre, moellons, treillis soudé.
- **M.O :** Manœuvre, Taux horaire.
- **Sous-détails :** Murs clôture 2 m (agglos 15, chaînages, enduit), mur bahut 1 m + poteaux 2 m, pilastres béton 30×30, clôtures grillage galvanisé/plastifié (hauteur 100/150/200), soubassement 2 rangs agglos 15.

### Jardins-Espaces Verts (95 lignes)

- **Matériaux :** Sable, gravier, terre remblai/végétale, engrais, arbres, arbustes, bordures P1, dalles, calcaire 0/6, pavés, arrosage, tonte, petit matériel, rouleaux, béton ouvrages d’art (dosé 350 kg/m3).
- **M.O :** Jardinier, Manœuvre, Taux horaire.
- **Sous-détails :** Préparation sol (bull), apport terre végétale 15 cm, engazonnement (semence, engrais, tonte), plantation arbres/arbustes/haies, bordures P1, allées cendré, pas japonais, dalles 20×20 sur sable ou béton, allées béton, pavés décoratifs.

### Voirie-Réseaux Divers-Sols Pavé (231 lignes)

- **Matériaux :** Sable, gravier, ciment, acier, bois, pointes, bordures P1/P2, caniveaux 50×50, dallettes, pavés autoblocants 8/11/13, dalles rondes, buses ciment 400 à 1000, dallots, buses métalliques 800/1000, latérite, cut-back, émulsion, enrobé, bidim.
- **Location :** Bull, pelle, chargeur, niveleuse, compacteur, camion, grue, compresseur, bétonnière, rouleau vibrant.
- **M.O :** Maçon-coffreur, Manœuvre, Taux horaire.
- **Sous-détails :** Terrassement (bull, pelle, chargement/évacuation), décaissement, latérite base, profilage, imprégnation cut-back, bicouche, enrobé 5 cm, bordures T2 + dalettes, caniveaux 50×50, dalettes couverture caniveaux, buses métalliques 800/1000 avec terrassement/remblai, dalle béton sur buses, tête de buse, pavés autoblocants 8/11/13.

### Lot Fabrication de Menuiserie (493 lignes)

- **Bois :** Izombé, Padouk, Moabi, Movingui, Iroko, Ozigo, Okoumé (prix au m3).
- **CP :** 5/8/15/19 mm, CP ébénisterie 5 mm (plaqué 1 face) et 19 mm (2 faces), diverses essences.
- **Formica :** 7/10, 9/10, 11/10 brillant, 9/10 mat ; placage de chants.
- **Colle, pointes, vis, chevilles, paumelles, poignées.**
- **Atelier :** Rabotage, toupie (gros/petits débits, petits bois), persiennage.
- **M.O :** Menuisier assembleur, Manœuvre, Taux horaire moyen.
- **Sous-détails :** Fabrication cadres menuiserie bois dur (murs 18 et 13), différentes dimensions (63×204 à 146×215), cadres pour chassis naco (140×2×8 lames, etc.), cadres 7×7 avec traverses.

### Pose de Menuiserie Extérieures (287 lignes)

- **Menuiseries :** Cadres bois dur (73/83/93/146×215), chassis naco (140×2×8, 120×2×8, 140×2×5, 70×5, cadres climatiseurs), portes pleines grands/petits panneaux, cadres 7×7 feuillure, fenêtres avec pièces d’appuis, volets lames, quincaillerie (paumelles, serrures, crémones, espagnolettes, targettes, vis, chassis naco 3/5/6/8 lames).
- **M.O :** Menuisier poseur, Manœuvre, Taux horaire.
- **Sous-détails :** Fourniture + pose + scellement cadres et chassis naco (plusieurs dimensions), portes pleines avec cadres (73 à 146×215), portes-fermetures à la française.

### Pose de Menuiserie Intérieurs (306 lignes)

- **Cadres :** Portes mur 18 (63 à 146×204), placards 7×7 (60×255 à 240×255, sous évier).
- **Portes :** Isoplanes (63 à 146×204), bois dur à petits carreaux, à persiennes pour placards.
- **Meubles :** Évier (1/2 bacs), vasques (1/2), CP 5/8/10/15/19 mm, CP ébénisterie, colle, couvre-joints, liteaux, plinthes, formica, coffres à rideaux.
- **Quincaillerie :** Paumelles, serrures, verrous, targettes, tringles, dominos, pointes, chevilles.
- **M.O :** Menuisier poseur, Manœuvre, Taux horaire.
- **Sous-détails :** Portes isoplanes + cadres (mur 18 et 13), portes intérieures petits carreaux, meubles évier/vasques, façades placards.

### Plomberie (223 lignes)

- **Tuyaux :** Galvanisés (12/17 à 50/60), coudes, té, manchons, mamellons, réductions, bouchons ; cuivre gainé/nu ; gaine annelée ; nourrices ; polyéthylène 20/25/32 ; PVC 40.
- **Vannes laiton, robinets, colliers, chevilles, pattes à vis.**
- **Appareils sanitaires :** Lave-mains, lavabo, colonne, bidet, douche, baignoire, WC chasse basse/haute/turque, urinoir, lavabo collectif.
- **M.O :** Plombier, Manœuvre, Taux horaire.
- **Sous-détails :** Lave-mains, lavabo sur colonne (EF ou mélangeur), bidet mélangeur, colonne douche (EF ou mélangeur), baignoire acier 170, WC chasse basse/haute/turque, urinoir, lavabo collectif 100.

### Electricité (330 lignes)

- **Tableaux/armoires :** 13 modules, 2×13, coupe-circuit, disjoncteurs, fusibles, barres alimentation, bornes, piquet terre, barrette coupure.
- **Câbles :** Torsadé 4×16, nu 29, TH 1,5 à 10, GVG 2×1,5 à 4×6, télévision, téléphone.
- **Gaines :** 9 à 21 mm ; boîtes 105×105 à 165×165, rondes ; dominos.
- **Appareillage :** Interrupteurs, prises 2P/2P+T, télérupteur, dimastic, réglettes fluo, hublots, appliques, tubes/vasques fluo, ampoules, douilles.
- **Climatisation :** Climatiseur 1 à 1,5 cv, split 1/2 cv, brasseur d’air, extracteurs buée FV 25 à 40.
- **M.O :** Électricien, Manœuvre, Taux horaire (parfois 2 200 F/h).
- **Sous-détails :** Tableaux 2×13 et 13 modules, armoires encastrées, disjoncteur 15A bi-polaire/tétrapolaire 60A, mise à la terre, raccordement SEEG, gaines encastrées 11/13/16/21, boîtes dérivation, boîtes rondes, tirage fil TH 1,5.

### Carrelages-Faiences-Moquettes (107 lignes)

- **Carrelage :** Grès (6 850, 12 300 F/m²), faïence 15×15, carrelage sol/mur, décor ; ciment colle, fermajoint ; dalettes ciment 20×20, octogonale.
- **Sols souples :** Moquette (3 600, 8 500, 13 500 F/m²), colle, barres de seuils 73/83/146, dalles vinyl 33×33 et grande largeur.
- **M.O :** Carreleur, Manœuvre, Taux horaire.
- **Sous-détails :** Carrelage grès au mortier (2 gammes), plinthes carrelage, faïence 15×15 (blanche, décorée), carrelage bac douche, moquette collée (3 gammes), barres seuil laiton, dalles thermoplastiques, vinyl grande largeur, chapes ciment 5 cm.

### Ferronnerie-Construction Métallique (440 lignes)

- **Tubes :** Carrés 80×80 à 16×16, ronds 20/27 à 40/40 ; fer rond 6/10/16 (6 ml) ; IPE 80 à 300 (12 m), stop-bloc, cornières, té ; tôles noires 8/10 à 60/10 et 1 mm, galvanisées ; plats ; UPN 80/140.
- **Quincaillerie :** Paumelles Maroc, roues portails, serrures crochet, guides, rails et chariots portails suspendus, électrodes, verrous.
- **Boulonnerie :** Boulons, tiges filetées, écrous, rondelles.
- **Divers :** Bacs alu, faîtières, paxalu, flinkote, antirouille, sable, gravier, ciment.
- **M.O :** Ferronnier, Manœuvre, Taux horaire.
- **Sous-détails :** Grilles protection tube 20×20 (150×130, 130×130, 150×90, 130×90, 150×110, 90×90), grille climatiseur, portes portails 1/2 ouvrants (85 à 146×225), portillon.

### Peinture-Vitrerie-Tenture-Nettoyage (179 lignes)

- **Enduits/peintures :** Enduit C, Tropix, Equatex, Pantex, Pancryl, Pantinox, Pantimat, Crépitex, Pantigrès, Pantexsol, Vogor SR, antirouille, Néo-Granilox, Celdécor, Xyladécor, Top-Wood, vernis, diluants, colorants, peinture BAC alu, Pantexroute, nettoyant, réfléchissant, Ajax, Vogor-Sol, Vitrex.
- **Vitrerie :** Verre clair/fumé/imprimé (lames naco), vitrage 4/5 mm (clair, imprimé, fumé), colle d’étanchéité.
- **Tenture :** Tissus muraux, colle Polymurale, rideaux, voilages, ruflette, skaï, mousse, boutons, fil, papier peint, colle.
- **M.O :** Peintre-Tapissier, Manœuvre, Taux horaire.
- **Sous-détails :** Préparation murs (enduit, M.O), préparation bois (Néo-Garnilox), peinture murs extérieurs (acrylique), intérieurs (vinylique), plafonds ciment/bois, débords toits (huile mate), menuiserie bois (glycérophtalique), ferronnerie, BAC alu, sols (Pantexsol), marquage route (blanc, réfléchissant), vitrage lames naco (clair/fumé/imprimé), petits carreaux (clair/fumé/imprimé), capitonnage portes (73/83/93) en skaï.

---

## 5. Éléments importants pour réutilisation

### 5.1 Unités utilisées

- **Volumes :** m3, L.
- **Longueurs :** ml, m.
- **Surfaces :** m², m (affichage m²).
- **Poids :** kg.
- **Temps :** h (heures), H (location).
- **Pièces :** U (unité).

### 5.2 Coefficients de vente

- **1,4** : utilisé dans Gros-Oeuvre (P.V Coëf 1.4).
- **1,6** : utilisé dans la majorité des autres feuilles (P.V Coëf 1.6).

### 5.3 Fournisseurs / contacts

Les colonnes **Fournisseurs** et **Contacts** (souvent numéros de téléphone) permettent d’identifier la source du prix (Transp, Gab gra, Bernabé, Abido, Sogame, SGPB, Briquet, Matelec, Tecnobat, Soga-Imp, SGBM, etc.). Utile pour un module fournisseurs ou pour tracer l’origine des lignes de barème.

### 5.4 Structure « sous-détails »

Chaque prestation composée est :

1. Décrite par un **libellé** (une ou plusieurs lignes).
2. Décomposée en **lignes** : Libellé poste | Qté | P.U | U | Sommes.
3. Totalisée en **Déboursé** (unité : U, m², ml, m3…).
4. Prix de vente : **P.V = Déboursé × coefficient**.

Pour une future base de données ou un outil de devis, on peut modéliser : **Prestation** (libellé, corps d’état, unité) → **Lignes de décomposition** (référence matériau ou M.O, quantité, P.U) → **Déboursé** → **Coefficient** → **P.V**.

### 5.5 Encodage

Le fichier .xls est en **Windows-1252** (ou proche). Les caractères accentués (é, è, ê, à, ô, î, û, ç, etc.) peuvent apparaître en ou en séquences bizarres si lues en UTF-8. Pour une importation propre : ouvrir en CP1252 puis exporter ou enregistrer en UTF-8.

---

## 6. Synthèse

- **1 feuille** de coefficients d’éloignement (villes Gabon).
- **15 feuilles** de barème par corps d’état, chacune avec :
  - **Référentiel de prix** (matériaux, location, M.O) avec fournisseurs et contacts.
  - **Prestations avec sous-détails** (décomposition Qté × P.U, Déboursé, P.V avec coef 1.4 ou 1.6).
- **1 feuille vide** (Sheet1).
- **Monnaie / contexte :** Francs CFA (F), taux horaire moyen souvent 1 100 F/h, fournisseurs et localités gabonais.
- Le fichier peut servir de **base pour un référentiel de prix**, un **module devis/estimation** ou une **liaison avec un module fournisseurs** (référence des prix par fournisseur).
---

# DONNÉES DU BARÈME — ORGANISÉES PAR FEUILLE

Les tableaux ci-dessous reprennent **toutes** les lignes du fichier Excel, avec des en-têtes de colonnes explicites. Chaque feuille est présentée dans un tableau unique pour faciliter la recherche et l’exploitation.

## Sommaire des feuilles

| # | Feuille | Lignes | Colonnes |
|---|---------|--------|----------|
| 1 | Coéf d'éloignement | 42 | 5 |
| 2 | Gros-Oeuvre | 385 | 17 |
| 3 | Assainissement | 316 | 15 |
| 4 | Charpente-Couverture étanchéité | 300 | 22 |
| 5 | Plafonds Bois et STAFF | 116 | 15 |
| 6 | Clôture-Soutènements | 224 | 15 |
| 7 | Jardins-Espaces Verts | 95 | 15 |
| 8 | Voirie-Réseaux Divers-Sols Pavé | 231 | 15 |
| 9 | Lot Fabrication de Menuiserie | 493 | 15 |
| 10 | Pose de Menuiserie Extérieures | 287 | 16 |
| 11 | Pose de Menuiserie Intérieurs | 306 | 17 |
| 12 | Plomberie | 223 | 18 |
| 13 | Electricité | 330 | 17 |
| 14 | Carrelages-Faiences-Moquettes | 107 | 15 |
| 15 | Ferronnerie-ConstructionMétalli | 440 | 16 |
| 16 | Peinture-Vitrerie-Tenture-Nétoy | 179 | 16 |
| 17 | Sheet1 | 0 | 0 |

---

## 1 — Coéf d'éloignement

*Lignes : 42 | Colonnes : 5*

| Ville / Localité | % | Coef | Note |
|------------------|---|------|------|
| LIBREVILLE | 0 | 1 | Ces pourcentages sont donnés à titre indicatif, ils peuvent varier en |
| COCOBEACH | 5 | 1.05 | fonction de la saison, de l'état des routes, de la possibilité à trouver |
| KANGO | 3 | 1.03 | certains matériaux locaux, de l'importance du  matériel à mettre en |
| MEDOUNEU | 25 | 1.25 | œuvre, Etc… |
| BIFOUN | 5 | 1.05 | - |
| NDJOLE | 10 | 1.1 | - |
| LAMBARENE | 10 | 1.1 | - |
| FOUGAMOU | 15 | 1.15 | - |
| MOUILA | 25 | 1.25 | - |
| MANDJI | 25 | 1.25 | - |
| NDENDE | 27 | 1.27 | - |
| LEBAMBA | 30 | 1.3 | - |
| MIMONGO | 38 | 1.38 | - |
| MBIGOU | 38 | 1.38 | - |
| TCHIBANGA | 32 | 1.32 | - |
| MAYOUMBA | 38 | 1.38 | - |
| NDINDI | 42 | 1.42 | - |
| PORT GENTIL | 8 | 1.08 | - |
| OMBOUE | 20 | 1.2 | - |
| GAMBA | 20 | 1.2 | - |
| LASTOURVILLE | 30 | 1.3 | - |
| KOULAMOUTOU | 34 | 1.34 | - |
| PANA | 40 | 1.4 | - |
| MOANDA | 32 | 1.32 | - |
| FRANCEVILLE | 32 | 1.32 | - |
| BAKOUMBA | 35 | 1.35 | - |
| BOUMANGO | 37 | 1.37 | - |
| LEKONI | 38 | 1.38 | - |
| AKIENI | 38 | 1.38 | - |
| OKONDJA | 42 | 1.42 | - |
| BOOUE | 27 | 1.27 | - |
| OVAN | 30 | 1.3 | - |
| MAKOKOU | 34 | 1.34 | - |
| MEKAMBO | 42 | 1.42 | - |
| MITZIC | 20 | 1.2 | - |
| OYEM | 25 | 1.25 | - |
| BITAM | 28 | 1.28 | - |
| MINVOUL | 30 | 1.3 | - |

---

## 2 — Gros-Oeuvre

*Lignes : 385 | Colonnes : 17*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.4 | Col16 | Col17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | Débroussaillage d'un terrain | - | - | - | - | - | - | - | - |
| G. | 13 | Sable | m3 | 12500 | - | Transp | - | Fourniture | 1 | 53.75 | - | 53.75 | - | - | - | - |
| G. | 14 | Gravier granit | m3 | 37750 | - | Gab gra | 756381 | M.O | 0.1 | 1100 | - | 110 | - | - | - | - |
| G. | 15 | Gravier calcaire | m3 | 21600 | - | Gab gra | 756381 | - | - | - | m² | - | 163.75 | 262 | - | - |
| G. | 16 | Gravillon calcaire 0/6 | m3 | 10800 | - | Gab gra | 756381 | Construction de baraque de chantier | - | - | - | - | - | - | - | - |
| G. | 17 | Tout venant stérile | m3 | 10500 | - | Transp | - | de 30m² (7.5x4.00) | - | - | - | - | - | - | - | - |
| G. | 18 | Sable de remblai | m3 | 10500 | - | Transp | - | Chevrons de 4m | 8 | 4000 | - | 32000 | - | - | - | - |
| G. | 19 | Ciment détail | kg | 93 | - | Détail | - | Lattes de 4m | 30 | 2500 | - | 75000 | - | - | - | - |
| G. | 20 | Acier TOR prix moyen | kg | 510 | - | Bernabé | 743432 | Planches de 4m | 115 | 5800 | - | 667000 | - | - | - | - |
| G. | 21 | Aier T6 | U | 1430 | - | Bernabé | 743432 | Pointes | 5 | 2000 | - | 10000 | - | - | - | - |
| G. | 22 | Acier T8 | U | 2300 | - | Bernabé | 743432 | Tôles ondulées | 24 | 3064 | - | 73536 | - | - | - | - |
| G. | 23 | Acier T10 | U | 3650 | - | Bernabé | 743432 | Pointes tôles | 150 | 27 | - | 4050 | - | - | - | - |
| G. | 24 | Acier T12 | U | 5240 | - | Bernabé | 743432 | Quincaillerie | 1 | 26875 | - | 26875 | - | 1.4 | - | - |
| G. | 25 | Acier T14 | U | 8020 | - | Bernabé | 743432 | M.O | 30 | 1100 | - | 33000 | - | - | - | - |
| G. | 26 | Acier T16 | U | 10690 | - | Bernabé | 743432 | - | - | - | U | - | 921461 | 1290045.4 | - | - |
| G. | 27 | Acier T20 | U | 16890 | - | Bernabé | 743432 | Construction de Baraque ….. M² | - | - | - | - | - | - | - | - |
| G. | 28 | Fil d'attache | kg | 1420 | - | Bernabé | 743432 | - | - | - | m² | - | 11274.67 | 18039.5 | - | - |
| G. | 29 | Treillis soudé 150/300 | m² | 1050 | - | Bernabé | 743432 | Implantation bâtiment et traçage | - | - | - | - | - | - | - | - |
| G. | 30 | Treillis soudé 150/150 | m² | 1420 | - | Bernabé | 743432 | Latte (1.6m) | 0.35 | 16555 | - | 539 | - | - | - | - |
| G. | 31 | Treillis soudé 200/280 | m² | 690 | - | Bernabé | 743432 | Pointes | 0.1 | 1075 | - | 100 | - | 1.4 | - | - |
| G. | 32 | Polyane (450m²) | m² | 150 | - | Bernabé | 743432 | M.O | 0.5 | 1100 | - | 550 | - | - | - | - |
| G. | 33 | Agglos creux de 20x20x40 | U | 450 | - | Briquet | - | - | - | - | ml | - | 1189 | 1664.6 | - | - |
| G. | 34 | Agglos creux de 15x20x40 | U | 400 | - | Briquet | - | Terrassement en grande masse avec | - | - | - | - | - | - | - | - |
| G. | 35 | Agglos creux de 10x20x40 | U | 375 | - | Briquet | - | pelle hydraulique | - | - | - | - | - | - | - | - |
| G. | 36 | Agglos cerux de 5x20x50 Grav | U | 550 | - | SGPB | 705471 | pelle hydraulique | 0.05 | 64500 | - | 3000 | - | 1.4 | - | - |
| G. | 37 | Agglos creux de 5x20x50 Grav | U | 475 | - | SGPB | 705471 | M.O | 0.1 | 1100 | - | 110 | - | - | - | - |
| G. | 38 | Agglos creux de 5x20x50 Grav | U | 375 | - | SGPB | 705471 | - | - | - | m3 | - | 3110 | 4354 | - | - |
| G. | 39 | Agglos creux de 5x20x50 Grav | U | 200 | - | SGPB | 705471 | Chargement et évacuation des déblais | - | - | - | - | - | - | - | - |
| G. | 40 | Hourdis creux de 15 | U | 700 | - | SGPB | 705471 | camion | 0.4 | 13437 | - | 5000 | - | 1.4 | - | - |
| G. | 41 | Agglos creux de 5x20x50 Grav | U | 850 | - | SGPB | 705471 | M.O | 0.1 | 1100 | - | 110 | - | - | - | - |
| G. | 42 | Agglos creux de 5x20x50 Grav | U | 750 | - | SGPB | 705471 | - | - | - | m3 | - | 5110 | 7154 | - | - |
| G. | 43 | Agglos creux de 5x20x50 Grav | U | 650 | - | SGPB | 705471 | Terrassement manuel en tranché | - | - | - | - | - | - | - | - |
| G. | 44 | Agglos creux de 5x20x50 Grav | U | 450 | - | SGPB | 705471 | déblais aux abords | - | - | - | - | - | - | - | - |
| G. | 45 | Agglos creux de 5x20x50 Grav | U | 350 | - | SGPB | 705471 | Petit matériel | 1 | 1075 | - | 100 | - | 1.4 | - | - |
| G. | 46 | Lattes Okoumé de 400 | U | 1540 | - | Abido | 710447 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 47 | Chevrons de 400 | U | 3080 | - | Abido | 710447 | - | - | - | m3 | - | 4500 | 6300 | - | - |
| G. | 48 | Planches de 400x15x3 | U | 2160 | - | Abido | 710447 | Réglage du fond de fouille | - | - | - | - | - | - | - | - |
| G. | 49 | Planches de 400x25x3 | U | 3600 | - | Abido | 710447 | Fournitures | 1 | 161 | - | 150 | - | 1.4 | - | - |
| G. | 50 | Planches de 400x20x2 | U | 1150 | - | Abido | 710447 | M.O | 0.2 | 1100 | - | 220 | - | - | - | - |
| G. | 51 | Bois de coffrage | m3 | 115000 | - | Abido | 710447 | - | - | - | m² | - | 370 | 592 | - | - |
| G. | 52 | Pointes | kg | 1000 | - | Bernabé | 743432 | Béton de propreté sous semelles | - | - | - | - | - | - | - | - |
| G. | 53 | Trappe de baignoire | U | 12500 | - | Ferron | - | Sable | 0.4 | 15000 | - | 6000 | - | - | - | - |
| G. | 54 | Paxalu. De 40 | m² | 3950 | - | Bernabé | 743432 | Gravier | 0.8 | 43624 | - | 34899.2 | - | - | - | - |
| G. | 55 | Paxalu. De 30 | m² | 2875 | - | Bernabé | 743432 | Ciment | 250 | 100 | - | 25000 | - | 1.4 | - | - |
| G. | 56 | Feutre bitum. | m² | 2760 | - | Bernabé | 743432 | M.O | 7 | 1100 | - | 7700 | - | - | - | - |
| G. | 57 | Flinkote | kg | 1550 | - | Bernabé | 743432 | - | - | - | m3 | - | 73599.2 | 103038.88 | - | - |
| G. | 58 | Laine de verre | m² | 3240 | - | Bernabé | 743432 | Béton armé pour semelle | - | - | - | - | - | - | - | - |
| G. | 59 | Polystyrène 100x50x2 | m² | 2610 | - | Bernabé | 743432 | Sable | 0.4 | 15000 | - | 6000 | - | - | - | - |
| G. | 60 | Polystyrène 100x50x2 | m² | 5830 | - | Bernabé | 743432 | Gravier | 0.8 | 45000 | - | 36000 | - | - | - | - |
| G. | 61 | Bac à laver ciment 1 bac | U | 76000 | - | SGBM | - | Ciment | 350 | 100 | - | 35000 | - | 1.4 | - | - |
| G. | 62 | Bac à laver ciment 2 bac | U | 93800 | - | SGBM | - | M.O | 8 | 1100 | - | 8800 | - | - | - | - |
| G. | 63 | Bidim (2 ou 6 m de large) | m² | 1340 | - | Bernabé | 743432 | - | - | - | m3 | - | 85800 | 120120.0 | - | - |
| G. | 64 | Tôles ondulées | U | 2850 | - | Abido | 710447 | Armature pour tous bétons armés | - | - | - | - | - | - | - | - |
| G. | 65 | Poines et joints de tôles | U | 25 | - | Abido | 710447 | Acier | 1 | 589 | - | 589 | - | - | - | - |
| G. | 66 | Quincaillerie | U | 25000 | - | Abido | 710447 | Fil d'attache | 0.25 | 1642 | - | 410.5 | - | 1.4 | - | - |
| G. | 67 | CP de 4m/m | m² | 2000 | - | Abido | 710447 | M.O | 0.2 | 1100 | - | 220 | - | - | - | - |
| G. | 68 | CP de 8m/m | m² | 4500 | - | Abido | 710447 | - | - | - | kg | - | 1219.5 | 1707.3 | - | - |
| - | - | - | - | - | - | - | - | soubassements en agglos pleins de 20 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 13 | 550 | - | 7150 | - | - | - | - |
| - | - | LOCATION  DE  MATERIL | - | - | - | - | - | Sable | 0.13 | 15000 | - | 1950 | - | - | - | - |
| G. | 72 | Pelle poclain | h | 60000 | - | - | - | Ciment | 40 | 100 | - | 4000 | - | 1.4 | - | - |
| G. | 73 | Bull D6 | h | 56000 | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - | - | - |
| G. | 74 | Camion  12T | h | 12500 | - | - | - | - | - | - | m² | - | 14750 | 20650 | - | - |
| G. | 75 | Echafaudage | m² | 800 | - | - | - | soubassements en agglos pleins de 15 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 13 | 500 | - | 6500 | - | - | - | - |
| - | - | MAIN-D'ŒUVRE | - | - | - | - | - | Sable | 0.1 | 15000 | - | 1500 | - | - | - | - |
| G. | 77 | Maçon | h | 1400 | - | - | - | Ciment | 28 | 100 | - | 2800 | - | 1.4 | - | - |
| G. | 78 | Manœuvre | h | 800 | - | - | - | M.O | 1.3 | 1100 | - | 1430 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 12230 | 17122 | - | - |
| G. | 80 | Taux horaire | h | 1100 | - | - | - | Béton pour potaux en soubassements | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 34 | 15000 | - | 510000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.8 | 45000 | - | 36000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 350 | 100 | - | 35000 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 8 | 1100 | - | 8800 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 589800 | 825720 | - | - |
| - | - | - | - | - | - | - | - | Coffrage de poteaux en soubassements | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.01 | 132895 | - | 1328.95 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1156 | - | 115.6 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 2764.55 | 3870.37 | - | - |
| - | - | - | - | - | - | - | - | Remblai en sable, en soubassements sous le dallage, | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | compactage hydraulique | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 1 | 12500 | - | 12500 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 13820 | 19348 | - | - |
| - | - | - | - | - | - | - | - | Coffrage périphérique du dallage | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.008 | 132895 | - | 1063.16 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.05 | 1075 | - | 53.75 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 1666.91 | 2333.674 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de polyane sous le dallge | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | polyane | 1.1 | 625 | - | 687.5 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.05 | 1100 | - | 55 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 742.5 | 1039.5 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de treillis soudé pour | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | armature du dallage | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Treillis | 1.1 | 1214 | - | 1335.4 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.1 | 1100 | - | 110 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 1445.4 | 2023.56 | - | - |
| - | - | - | - | - | - | - | - | Béton pour dallage sur remblai | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.4 | 15000 | - | 6000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.8 | 45000 | - | 36000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 350 | 100 | - | 35000 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 9 | 1100 | - | 9900 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 86900 | 121660.0 | - | - |
| - | - | - | - | - | - | - | - | Maçonneries en agglos creux de 20x20x40 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 13 | 550 | - | 7150 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.072 | 15000 | - | 1080 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 100 | - | 2000 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.3 | 1100 | - | 1430 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 11660 | 16324.0 | - | - |
| - | - | - | - | - | - | - | - | Maçonneries en agglos creux de 15x20x40 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 13 | 500 | - | 6500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.06 | 15000 | - | 900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 100 | - | 1500 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 10220 | 14308 | - | - |
| - | - | - | - | - | - | - | - | Maçonneries en agglos creux de 10x20x40 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 13 | 403 | - | 4875 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.03 | 13438 | - | 375 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 10 | 93 | - | 930 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.1 | 1100 | - | 1210 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 7390 | 11824 | - | - |
| - | - | - | - | - | - | - | - | Maçonneries en agglos creux de 20x20x50 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 10 | 591 | - | 5500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.072 | 13438 | - | 900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 93 | - | 1860 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.3 | 1100 | - | 1530 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 9690 | 15504 | - | - |
| - | - | - | - | - | - | - | - | Maçonneries en agglos creux de 15x20x50 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 10 | 511 | - | 4750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.06 | 13438 | - | 750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 93 | - | 1395 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 8215 | 13144 | - | - |
| - | - | - | - | - | - | - | - | Maçonneries en agglos creux de 10x20x50 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 10 | 511 | - | 3750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.03 | 13438 | - | 375 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 10 | 93 | - | 930 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.1 | 1100 | - | 1210 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 6265 | 10024 | - | - |
| - | - | - | - | - | - | - | - | Maçonneries en agglos creux de 7x20x50 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 10 | 1075 | - | 2000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.016 | 13438 | - | 200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 5 | 93 | - | 465 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.1 | 1100 | - | 1210 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 3875 | 6200 | - | - |
| - | - | - | - | - | - | - | - | Béton armé pour poteaux, poutres, chainage, chainages, | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | linteaux, dalles pleines et escalier | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.4 | 15000 | - | 6000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.8 | 4058 | - | 30200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 350 | 100 | - | 35000 | - | 1.4 | - | - |
| - | - | - | - | - | - | - | - | ferraillage | 0.65 | 67500 | - | 43875 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 19 | 1100 | - | 20900 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 135975 | 190365 | - | - |
| - | - | - | - | - | - | - | - | Coffrage de béton armé | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.015 | 12363 | - | 1725 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1075 | - | 100 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.6 | 1100 | - | 1760 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 3585 | 5736 | - | - |
| - | - | - | - | - | - | - | - | Coffrage pour dalles pleines | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 4m/m | 1.1 | 2150 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.02 | 123625 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Etayage | 0.03 | 123625 | - | 3450 | - | - | - | - |
| - | - | - | - | - | - | - | - | pointes | 0.6 | 1075 | - | 600 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 11300 | 18080 | - | - |
| - | - | - | - | - | - | - | - | Coffrages pour voussures | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.02 | 123625 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 8m/m | 0.2 | 4838 | - | 900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.15 | 1075 | - | 150 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 6100 | 9760 | - | - |
| - | - | - | - | - | - | - | - | Coffrage pour escaliers, volées droites | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.02 | 123625 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.6 | 1075 | - | 600 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP 4m/m | 1 | 2150 | - | 2000 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 8200 | 13120 | - | - |
| - | - | - | - | - | - | - | - | Coffrage pour escaliers balancés | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.02 | 123625 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.06 | 1075 | - | 600 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP 4m/m | 1 | 2150 | - | 2000 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 5 | 1100 | - | 5500 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 10400 | 16640 | - | - |
| - | - | - | - | - | - | - | - | Plancher hourdis creux de 15, poutrelles et dalle | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 5 d'épaisseur en béton armés | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois de coffrage | 0.03 | 123625 | - | 3450 | - | - | - | - |
| - | - | - | - | - | - | - | - | Hourdis | 8.5 | 753 | - | 5950 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 1 | 1075 | - | 1000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier T 8 | 4 | 548 | - | 2040 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier T 10 et T 1 | 4 | 548 | - | 2040 | - | - | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.5 | 1527 | - | 710 | - | - | - | - |
| - | - | - | - | - | - | - | - | Treillis soudé | 1.1 | 1129 | - | 1155 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.05 | 13438 | - | 625 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.1 | 406081 | - | 3775 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 45 | 93 | - | 4185 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 6 | 1100 | - | 6600 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 31530 | 50448 | - | - |
| - | - | - | - | - | - | - | - | Consoles en béton armé pour pignons | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffrage | 0.02 | 123625 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.3 | 1075 | - | 300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 2 | 548 | - | 1020 | - | - | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.1 | 1527 | - | 142 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.01 | 13438 | - | 125 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.02 | 40581 | - | 755 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 8 | 93 | - | 744 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 8686 | 13897.6 | - | - |
| - | - | - | - | - | - | - | - | Pose et scellement de cadres de menuiseries et grille de protection | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.01 | 13438 | - | 125 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 5 | 93 | - | 465 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 3890 | 6224 | - | - |
| - | - | - | - | - | - | - | - | Enduit ciment taloché sur murs intérieur et extérieur | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.024 | 13438 | - | 300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 10 | 93 | - | 930 | - | - | - | - |
| - | - | - | - | - | - | - | - | Divers | 1 | 54 | - | 50 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 2600 | 4160 | - | - |
| - | - | - | - | - | - | - | - | Enduit ciment taloché en plafonds | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.03 | 13438 | - | 375 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 10 | 93 | - | 930 | - | - | - | - |
| - | - | - | - | - | - | - | - | Divers | 1 | 54 | - | 50 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.7 | 1100 | - | 1870 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 3225 | 5160 | - | - |
| - | - | - | - | - | - | - | - | Enduit ciment taloché en tableaux d'ouvertures | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.008 | 13438 | - | 100 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 2 | 93 | - | 186 | - | - | - | - |
| - | - | - | - | - | - | - | - | Divers | 1 | 37 | - | 34 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.8 | 1100 | - | 880 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 1200 | 1920 | - | - |
| - | - | - | - | - | - | - | - | Plus-value pour enduit à la tyrolienne | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.004 | 13438 | - | 50 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1 | 93 | - | 93 | - | - | - | - |
| - | - | - | - | - | - | - | - | Divers | 1 | 112 | - | 104 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.3 | 1100 | - | 330 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 577 | 923.2 | - | - |
| - | - | - | - | - | - | - | - | Plus-value pour enduit jeté à la truelle | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.006 | 13438 | - | 75 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 2 | 93 | - | 186 | - | - | - | - |
| - | - | - | - | - | - | - | - | Divers | 1 | 112 | - | 104 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.3 | 1100 | - | 330 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 695 | 1112 | - | - |
| - | - | - | - | - | - | - | - | Plus-value pour échafaudage, hauteur | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | supérieure à 4 mètre | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Location | 1 | 860 | - | 800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Divers | 1 | 161 | - | 150 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O  montage | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 1390 | 2224 | - | - |
| - | - | - | - | - | - | - | - | Jambages d'évier en agglos creux de 10 avec | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | enduit ciment taloché sur toutes les faces | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos de 10 | 6 | 403 | - | 2250 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.03 | 13438 | - | 375 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 6 | 97 | - | 540 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 6465 | 10344 | - | - |
| - | - | - | - | - | - | - | - | Paillasse d'évier en béton armé compris | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | coffrage et acier | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.02 | 123625 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.6 | 1075 | - | 600 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 4m/m | 1 | 2150 | - | 2000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 2 | 548 | - | 1020 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.04 | 13438 | - | 500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.08 | 40581 | - | 3020 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 10 | 100 | - | 930 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 13670 | 21872 | - | - |
| - | - | - | - | - | - | - | - | Construction d'un bac à douche en maçonnerie | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 4 | 430 | - | 1600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.05 | 13438 | - | 625 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 93 | - | 1860 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 7385 | 11816 | - | - |
| - | - | - | - | - | - | - | - | Habillage de baignoire en agglos creux de 10 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | avec enduit, compris trappe de visite | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos de 10 | 18 | 403 | - | 6750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.07 | 13438 | - | 875 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 93 | - | 1860 | - | - | - | - |
| - | - | - | - | - | - | - | - | Trappe de vis | 1 | 13438 | - | 12500 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 6 | 1100 | - | 6600 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 28585 | 45736 | - | - |
| - | - | - | - | - | - | - | - | Socles de placards, en béton avec chape | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | ciment lissée | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 0.03 | 12500 | - | 375 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.06 | 37750 | - | 2265 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 40 | 93 | - | 3720 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 9110 | 14576 | - | - |
| - | - | - | - | - | - | - | - | Pose d'un lavoir en ciment 1 bac | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lavoir | 1 | 76000 | - | 76000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos de 10 | 7 | 375 | - | 2625 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.06 | 12500 | - | 750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 93 | - | 1860 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 7 | 1100 | - | 7700 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 88935 | 142296 | - | - |
| - | - | - | - | - | - | - | - | Pose d'un lavoir en ciment 2 bacs | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lavoir | 1 | 93800 | - | 93600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos de 10 | 7 | 375 | - | 2625 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.06 | 12500 | - | 750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 93 | - | 1860 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 8 | 1100 | - | 8800 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 107835 | 172536 | - | - |
| - | - | - | - | - | - | - | - | Marches en béton, compris coffrage, pour | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | emmargemens extérieur | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffrage | 0.01 | 115000 | - | 1150 | - | - | - | - |
| - | - | - | - | - | - | - | - | pointes | 0.15 | 1000 | - | 150 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.04 | 37750 | - | 1510 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 93 | - | 1860 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 7670 | 12272 | - | - |
| - | - | - | - | - | - | - | - | Arase de murs pignons, en béton armé,compris | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | coffrage et scellement de pannes | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.01 | 12500 | - | 125 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.02 | 37750 | - | 755 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 10 | 93 | - | 930 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 1 | 510 | - | 510 | - | - | - | - |
| - | - | - | - | - | - | - | - | coffrage | 0.02 | 115000 | - | 2300 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 6820 | 10912 | - | - |
| - | - | - | - | - | - | - | - | Calfeutrement de charpente sur murs | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de façades, agglos de 15 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Agglos | 2.5 | 400 | - | 1000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.01 | 12500 | - | 125 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 5 | 93 | - | 465 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2690 | 4304 | - | - |
| - | - | - | - | - | - | - | - | Chapes ciment talochées fin, de 3 cm | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | d'épaisseur, dosées à 400 kg | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.04 | 12500 | - | 500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 93 | - | 1395 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 2995 | 4792 | - | - |
| - | - | - | - | - | - | - | - | Chapes ciment talochées et bouchardées, | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 3 cm d'épaisseur, dosées à 400kg | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.04 | 12500 | - | 500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 93 | - | 1395 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.3 | 1100 | - | 1430 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 3325 | 5320 | - | - |
| - | - | - | - | - | - | - | - | Construction de caniveaux en béton | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | armé compris terrassement | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Caniveau de 20x20 intérieur | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrass | 1.5 | 1100 | - | 1650 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.05 | 12500 | - | 625 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.01 | 37750 | - | 377.5 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 45 | 93 | - | 4185 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier | 7 | 510 | - | 3570 | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois  coeff | 0.02 | 115000 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.5 | 1000 | - | 500 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 16507.5 | 26412 | - | - |
| - | - | - | - | - | - | - | - | Caniveau de 30x30 intérieur | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrass | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.7 | 0 | - | 0 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.14 | 37750 | - | 5285 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 60 | 93 | - | 5580 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier | 9 | 510 | - | 4590 | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois  coeff | 0.03 | 115000 | - | 3450 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.8 | 1000 | - | 800 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 26305 | 42088 | - | - |
| - | - | - | - | - | - | - | - | Caniveau de 40x40 intérieur | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrass | 2.5 | 1100 | - | 2750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.08 | 12500 | - | 1000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.16 | 37750 | - | 6040 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 70 | 93 | - | 6510 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier | 11 | 510 | - | 5610 | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois  coeff | 0.04 | 115000 | - | 4600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 1 | 1000 | - | 1000 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 5 | 1100 | - | 5500 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 33010 | 52816 | - | - |
| - | - | - | - | - | - | - | - | Caniveau de 50x50 intérieur | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrass | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.1 | 12500 | - | 1250 | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.2 | 37750 | - | 7550 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 90 | 93 | - | 8370 | - | - | - | - |
| - | - | - | - | - | - | - | - | Acier | 13 | 510 | - | 6630 | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois  coeff | 0.05 | 115000 | - | 5750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 1.5 | 1000 | - | 1500 | - | 1.6 | - | - |
| - | - | - | - | - | - | - | - | M.O | 6 | 1100 | - | 6600 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 40950 | 65520 | - | - |

---

## 3 — Assainissement

*Lignes : 316 | Colonnes : 15*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | Fosse septique pour 8 usagers, capacité 2m3, | - | - | - | - | - | - |
| G. | 13 | Sable | m3 | 12500 | - | Transp | - | dimensions extérieures 1.50x2.20x1.50 | - | - | - | - | - | - |
| G. | 14 | Gravier granit | m3 | 37750 | - | Gab gra | 756381 | M.O terrass | 22 | 1100 | - | 24200 | - | - |
| G. | 15 | Gravier de calcaire | m3 | 21600 | - | Gab gra | 756381 | Sable | 1.3 | 12500 | - | 16250 | - | - |
| G. | 16 | Sable de remblai | m3 | 10500 | - | - | - | Gravier | 0.7 | 37750 | - | 26425 | - | - |
| G. | 17 | Ciment détail | kg | 93 | - | Détail | - | Ciment | 600 | 93 | - | 55800 | - | - |
| G. | 18 | Acier TOR prix moyen | kg | 510 | - | - | - | Agglos de 15 | 130 | 400 | - | 52000 | - | - |
| G. | 19 | Fil d'attache | kg | 1420 | - | Bernabé | 743432 | Acier TOR | 17 | 510 | - | 8670 | - | - |
| G. | 20 | Agglos creux de 15x20x40 | U | 400 | - | Briquet | - | Fil d'attache | 0.2 | 1420 | - | 284 | - | - |
| G. | 21 | P.V.C. de 160 | ml | 7000 | - | Sogame | 760554 | Bois de coffrage | 0.1 | 115000 | - | 11500 | - | - |
| G. | 22 | P.V.C. de 125 | ml | 3300 | - | Abido | 710447 | Pointes | 3 | 1000 | - | 3000 | - | - |
| G. | 23 | P.V.C. de 100 | ml | 2000 | - | Abido | 710447 | Coude de 100 | 2 | 2500 | - | 5000 | - | - |
| G. | 24 | P.V.C. de 80 | ml | 1600 | - | Abido | 710447 | Tuyau de 100 | 2 | 2000 | - | 4000 | - | - |
| G. | 25 | P.V.C. de 63 | ml | 1300 | - | Abido | 710447 | M.O | 40 | 1100 | - | 44000 | - | - |
| G. | 26 | P.V.C. de 50 | ml | 1100 | - | Abido | 710447 | - | - | - | U | - | 251129 | 401806 |
| G. | 27 | P.V.C. de 40 | ml | 900 | - | Abido | 710447 | Fosse septique pour 12 usagers, capacité 3m3, | - | - | - | - | - | - |
| G. | 28 | P.V.C. de 32 | ml | 700 | - | Abido | 710447 | dimensions extérieures 1.60x2.40x1.60 | - | - | - | - | - | - |
| G. | 29 | Coudes de 125 à 87° | U | 5720 | - | Abido | 710447 | M.O terrass | 30 | 1100 | - | 33000 | - | - |
| G. | 30 | Coudes de 100 à 87° | U | 2500 | - | Abido | 710447 | Sable | 1.5 | 12500 | - | 18750 | - | - |
| G. | 31 | Coudes de 80 à 87° | U | 2200 | - | Abido | 710447 | Gravier | 0.8 | 37750 | - | 30200 | - | - |
| G. | 32 | Coudes de 63 à 87° | U | 1800 | - | Abido | 710447 | Ciment | 700 | 100 | - | 70000 | - | - |
| G. | 33 | Coudes de 50 à 87° | U | 1200 | - | Abido | 710447 | Agglos de 15 | 160 | 400 | - | 64000 | - | - |
| G. | 34 | Coudes de 40 à 87° | U | 1000 | - | Abido | 710447 | Acier TOR | 20 | 510 | - | 10200 | - | 1.6 |
| G. | 35 | Coudes de 32 à 87° | U | 750 | - | Abido | 710447 | Fil d'attache | 0.3 | 1420 | - | 426 | - | - |
| G. | 36 | Coudes de 100 à 45° | U | 2500 | - | Abido | 710447 | Bois de cof. | 0.12 | 115000 | - | 13800 | - | - |
| G. | 37 | Coudes de 80 à 45° | U | 2200 | - | Abido | 710447 | Pointes | 3 | 1000 | - | 3000 | - | - |
| G. | 38 | Coudes de 63 à 45° | U | 1800 | - | Abido | 710447 | Coude de PVC de 100 | 2 | 2500 | - | 5000 | - | - |
| G. | 39 | Coudes de 50 à 45° | U | 1200 | - | Abido | 710447 | Tuyau PVC de 100 | 2 | 2000 | - | 4000 | - | - |
| G. | 40 | Coudes de 40 à 45° | U | 1000 | - | Abido | 710447 | M.O | 60 | 1100 | - | 66000 | - | - |
| G. | 41 | Tés de 100 | U | 3500 | - | Abido | 710447 | - | - | 0 | U | 318376 | 318376 | 509401.6 |
| G. | 42 | Tés de 80 | U | 3000 | - | Abido | 710447 | Fosse septique pour 15 usagers, capacité 4m3, | - | - | - | - | - | - |
| G. | 43 | Tés de 63 | U | 2500 | - | Abido | 710447 | dimensions extérieures 1.80x2.60x1.60 | - | - | - | - | - | - |
| G. | 44 | Tés de 50 | U | 1500 | - | Abido | 710447 | M.O terrass | 34 | 1100 | - | 37400 | - | - |
| G. | 45 | Tés de 40 | U | 1200 | - | Abido | 710447 | Sable | 1.8 | 12500 | - | 22500 | - | - |
| G. | 46 | Tés de 32 | U | 1000 | - | Abido | 710447 | Gravier | 1 | 37750 | - | 37750 | - | - |
| G. | 47 | Culottes de 100 | U | 5900 | - | Sogame | 760554 | Ciment | 840 | 100 | - | 84000 | - | - |
| G. | 48 | Culottes de 80 | U | 4450 | - | Sogame | 760554 | Agglos de 15 | 170 | 400 | - | 68000 | - | - |
| G. | 49 | Culottes de 63 | U | 3900 | - | Sogame | 760554 | Acier TOR | 25 | 510 | - | 12750 | - | 1.6 |
| G. | 50 | Culottes de 50 | U | 2300 | - | Sogame | 760554 | Fil d'attache | 0.5 | 1420 | - | 710 | - | - |
| G. | 51 | Culottes de 40 | U | 1600 | - | Sogame | 760554 | Bois de cof. | 0.14 | 115000 | - | 16100.0 | - | - |
| G. | 52 | Culottes de 32 | U | 1000 | - | Sogame | 760554 | Pointes | 4 | 1000 | - | 4000 | - | - |
| G. | 53 | Réduc. de 50/32 | U | 780 | - | Sogame | 760554 | Coude de 100 | 2 | 2500 | - | 5000 | - | - |
| G. | 54 | Réduc. de 40/32 | U | 750 | - | Sogame | 760554 | Tuyau de 100 | 2 | 2000 | - | 4000 | - | - |
| G. | 55 | Réduc. de 100/63 | U | 2200 | - | Sogame | 760554 | M.O | 65 | 1100 | - | 71500 | - | - |
| G. | 56 | Réduc. de 63/40 | U | 1160 | - | Sogame | 760554 | - | - | - | U | 363710 | 363710 | 581936 |
| G. | 57 | Colle PVC ( 1kg ) | U | 8500 | - | Sogame | 760554 | Fosse septique pour 20 usagers, capacité 5m3, | - | - | - | - | - | - |
| G. | 58 | Colle PVC ( 350gr ) | U | 3100 | - | Sogame | 760554 | dimensions extérieures 1.90x2.80x1.80 | - | - | - | - | - | - |
| G. | 59 | Colle PVC en tube | U | 2600 | - | Sogame | 760554 | M.O terrass | 40 | 1100 | - | 44000 | - | - |
| G. | 60 | Colliers de 40 | U | - | - | Sogame | 760554 | Sable | 2.5 | 12500 | - | 31250 | - | - |
| G. | 61 | Colliers de 50 | U | - | - | Sogame | 760554 | Gravier | 2 | 37750 | - | 75500 | - | - |
| G. | 62 | Colliers de 80 | U | - | - | Sogame | 760554 | Ciment | 1250 | 93 | - | 116250 | - | - |
| G. | 63 | Colliers de 100 | U | - | - | Sogame | 760554 | Agglos de 15 | 160 | 400 | - | 64000 | - | - |
| G. | 64 | Colliers de 125 | U | - | - | Sogame | 760554 | Acier TOR | 95 | 510 | - | 48450 | - | - |
| G. | 65 | Pattes à vis | U | 155 | - | Sogame | 760554 | Fil d'attache | 1 | 1420 | - | 1420 | - | - |
| G. | 66 | Chevilles de 8 | U | 20 | - | Sogame | 760554 | Bois de cof. | 0.2 | 115000 | - | 23000 | - | - |
| G. | 67 | Bois de coffrage | U | 115000 | - | Abido | 710447 | Pointes | 5 | 1000 | - | 5000 | - | - |
| G. | 68 | Pointes | U | 1000 | - | Abido | 710447 | Coude de 100 | 2 | 2500 | - | 5000 | - | - |
| G. | - | Agglos de 10 | U | 375 | - | - | - | Tuyau de 100 | 2 | 2000 | - | 4000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 74 | 1100 | - | 81400 | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | - | - | - | U | - | 499270 | 798832 |
| G. | 117 | Plombier | h | 1400 | - | - | - | Fosse septique pour 30 usagers, capacité 7.5m3, | - | - | - | - | - | - |
| G. | 118 | Manoeuvre | h | 800 | - | - | - | dimensions extérieures 2.10x3.30x2.10 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O terrass | 54 | 1100 | - | 59400 | - | - |
| G. | 120 | Taux horaire moyen | h | 1100 | - | - | - | Sable | 3.5 | 12500 | - | 43750 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 2.5 | 37750 | - | 94375 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1700 | 93 | - | 158100 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 230 | 400 | - | 92000 | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 112 | 510 | - | 57120 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 1.5 | 1420 | - | 2130 | - | - |
| - | - | - | - | - | - | - | - | Bois de cof. | 3 | 115000 | - | 345000 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 6 | 1000 | - | 6000 | - | - |
| - | - | - | - | - | - | - | - | Coude de 100 | 4 | 2500 | - | 10000 | - | - |
| - | - | - | - | - | - | - | - | Tuyau de 100 | 4 | 2000 | - | 8000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 100 | 1100 | - | 110000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 985875 | 1577400 |
| - | - | - | - | - | - | - | - | Fosse septique pour 60 usagers, capacité 7.5m3, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | dimensions extérieures 2.10x3.30x2.10 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O terrass | 90 | 1100 | - | 99000 | - | - |
| - | - | - | - | - | - | - | - | Sable | 4.4 | 12500 | - | 55000 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 2.7 | 37750 | - | 101925 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 2050 | 93 | - | 190650 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 400 | 400 | - | 160000 | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 56 | 510 | - | 28560 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 1.5 | 1420 | - | 2130 | - | - |
| - | - | - | - | - | - | - | - | Bois de cof. | 0.35 | 115000 | - | 40250 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 8 | 1000 | - | 8000 | - | - |
| - | - | - | - | - | - | - | - | Coude de 100 | 4 | 2500 | - | 10000 | - | - |
| - | - | - | - | - | - | - | - | Tuyau de 100 | 4 | 2000 | - | 8000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 145 | 1100 | - | 159500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 863015 | 1380824 |
| - | - | - | - | - | - | - | - | Puisard, diamètre intérieur 1.50, profondeur 2.00 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O terrass | 20 | 1100 | - | 22000 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 150 | 400 | - | 60000 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.6 | 12500 | - | 7500 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.16 | 37750 | - | 6040 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 250 | 93 | - | 23250 | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 8 | 510 | - | 4080 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.2 | 1420 | - | 284 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffr | 0.1 | 115000 | - | 11500 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.5 | 1000 | - | 500 | - | - |
| - | - | - | - | - | - | - | - | M.O | 27 | 1100 | - | 29700 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 164854 | 263766 |
| - | - | - | - | - | - | - | - | Puisard, diamètre intérieur 2.00, profondeur 2.00 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O terrass | 33 | 1100 | - | 36300 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 190 | 400 | - | 76000 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.85 | 12500 | - | 10625 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.3 | 37750 | - | 11325 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 350 | 93 | - | 32550 | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 16 | 510 | - | 8160 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.2 | 1420 | - | 284 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffr | 0.1 | 115000 | - | 11500 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.5 | 1000 | - | 500 | - | - |
| - | - | - | - | - | - | - | - | M.O | 32 | 1100 | - | 35200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 222444 | 355910 |
| - | - | - | - | - | - | - | - | Regard en maçonnerie de 40x40x40 avec dallette béton | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.08 | 12500 | - | 1000 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.1 | 37750 | - | 3775 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 12 | 400 | - | 4800 | - | 1.6 |
| - | - | - | - | - | - | - | - | Ciment | 65 | 100 | - | 6500 | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 2 | 510 | - | 1020 | - | - |
| - | - | - | - | - | - | - | - | M.O | 6 | 1100 | - | 6600 | - | - |
| - | - | - | - | - | - | - | - | - | - | 52360 | U | 23695 | 23695 | 37912 |
| - | - | - | - | - | - | - | - | Regard en maçonnerie de 60x60x60 avec dallette béton | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.18 | 12500 | - | 2250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.17 | 37750 | - | 6417.5 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 24 | 400 | - | 9600 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 110 | 93 | - | 10230 | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 3 | 510 | - | 1530 | - | - |
| - | - | - | - | - | - | - | - | M.O | 9 | 1100 | - | 9900 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 39927.5 | 63884 |
| - | - | - | - | - | - | - | - | Regard en maçonnerie de 60x60x80 avec dallette béton | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.3 | 12500 | - | 3750 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.2 | 37750 | - | 7550 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 32 | 400 | - | 12800 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 145 | 93 | - | 13485 | - | - |
| - | - | - | - | - | - | - | - | Acier TOR | 3 | 510 | - | 1530 | - | - |
| - | - | - | - | - | - | - | - | M.O | 12 | 1100 | - | 13200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 52315 | 83704 |
| - | - | - | - | - | - | - | - | Canalisations en tuyaux PVC de 100 posés en tranchées | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tranchée | 0.7 | 1100 | - | 770 | - | - |
| - | - | - | - | - | - | - | - | Tuyau de 100 | 1 | 2000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | Colle de PVC | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | Pose tuyau | 0.2 | 1100 | - | 220 | - | - |
| - | - | - | - | - | - | - | - | Remblai | 0.6 | 1100 | - | 660 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 4075 | 6520 |
| - | - | - | - | - | - | - | - | Canalisations en tuyaux PVC de 125 posés en tranchées | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tranchée | 0.7 | 1100 | - | 770 | - | - |
| - | - | - | - | - | - | - | - | Tuyau de 125 | 1 | 3300 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | Colle de PVC | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | Pose tuyau | 0.2 | 1100 | - | 220 | - | - |
| - | - | - | - | - | - | - | - | Remblai | 0.6 | 1100 | - | 660 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 5375 | 8600 |
| - | - | - | - | - | - | - | - | Canalisations en tuyaux PVC de 160 posés en tranchées | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tranchée | 0.9 | 1100 | - | 990 | - | - |
| - | - | - | - | - | - | - | - | Tuyau de 125 | 1 | 7000 | - | 7000 | - | - |
| - | - | - | - | - | - | - | - | Colle de PVC | 0.8 | 8500 | - | 6800 | - | - |
| - | - | - | - | - | - | - | - | Pose tuyau | 0.4 | 1100 | - | 440 | - | - |
| - | - | - | - | - | - | - | - | Remblai | 0.7 | 1100 | - | 770 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 16000 | 25600 |
| - | - | - | - | - | - | - | - | Canalisation en tuyau PVC posés sous ledallage pour évacuationdes eaux usées | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyau PVC de 100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyau | 1 | 2000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 170 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2720 | 4352 |
| - | - | - | - | - | - | - | - | Tuyau PVC de 80 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyau | 1 | 1600 | - | 1600 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 170 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2320 | 3712 |
| - | - | - | - | - | - | - | - | Tuyau PVC de 63 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyau | 1 | 1300 | - | 1300 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 170 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2020 | 3232 |
| - | - | - | - | - | - | - | - | Tuyau PVC de 50 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyau | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 170 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1820 | 2912 |
| - | - | - | - | - | - | - | - | Tuyau PVC de 40 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyau | 1 | 900 | - | 900 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 170 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1620 | 2592 |
| - | - | - | - | - | - | - | - | Coudes PVC de 100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coude | 1 | 2500 | - | 2500 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.04 | 8500 | - | 340 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3390 | 5424 |
| - | - | - | - | - | - | - | - | Coudes PVC de 80 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coude | 1 | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.04 | 8500 | - | 340 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3090 | 4944 |
| - | - | - | - | - | - | - | - | Coudes PVC de 63 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coude | 1 | 1800 | - | 1800 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 255 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2605 | 4168 |
| - | - | - | - | - | - | - | - | Coudes PVC de 50 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coude | 1 | 1200 | - | 1200 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 170 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1920 | 3072 |
| - | - | - | - | - | - | - | - | Coudes PVC de 40 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coude | 1 | 1000 | - | 1000 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 8500 | - | 170 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1720 | 2752 |
| - | - | - | - | - | - | - | - | Culottes PVC de 100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Culotte | 1 | 5900 | - | 5900 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.08 | 8500 | - | 680 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 7130 | 11408 |
| - | - | - | - | - | - | - | - | Culottes PVC de 80 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Culotte | 1 | 4450 | - | 4450 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.07 | 8500 | - | 595 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 5595 | 8952 |
| - | - | - | - | - | - | - | - | Culottes PVC de 63 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Culotte | 1 | 3900 | - | 3900 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.06 | 8500 | - | 510 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 4960 | 7936 |
| - | - | - | - | - | - | - | - | Culottes PVC de 50 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Culotte | 1 | 1600 | - | 1600 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2575 | 4120 |
| - | - | - | - | - | - | - | - | Culottes PVC de 40 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Culotte | 1 | - | - | 1000 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1975 | 3160 |
| - | - | - | - | - | - | - | - | Tés PVC de 100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tés | 1 | 3500 | - | 3500 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.08 | 8500 | - | 680 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 4730 | 7568 |
| - | - | - | - | - | - | - | - | Tés PVC de 80 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tés | 1 | 3000 | - | 3000 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.07 | 8500 | - | 595 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 4145 | 6632 |
| - | - | - | - | - | - | - | - | Tés PVC de 63 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tés | 1 | 2500 | - | 2500 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.06 | 8500 | - | 510 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3560 | 5696 |
| - | - | - | - | - | - | - | - | Tés PVC de 50 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tés | 1 | 1500 | - | 1500 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2475 | 3960 |
| - | - | - | - | - | - | - | - | Tés PVC de 40 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tés | 1 | 1200 | - | 1200 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2175 | 3480 |
| - | - | - | - | - | - | - | - | Réduction PVC de 40/32 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Réduction | 1 | 750 | - | 750 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1725 | 2760 |
| - | - | - | - | - | - | - | - | Réduction PVC de 50/32 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Réduction | 1 | 780 | - | 780 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | 1755 | 2808 |
| - | - | - | - | - | - | - | - | Réduction PVC de 63/32 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Réduction | 1 | 1160 | - | 1160 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 8500 | - | 425 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2135 | 3416 |
| - | - | - | - | - | - | - | - | Réduction PVC de 100/63 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Réduction | 1 | 2200 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.07 | 8500 | - | 595 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3345 | 5352 |
| - | - | - | - | - | - | - | - | Construction des filtre à cheminement lent, radier et dalle en béton armé, parois | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en agglos de 15, cloisonnement en agglos de 10, enduit et chape, compris mis en | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | place de charbon de bois | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Filtre de 150c20-0 pour 8 à 15 usagers | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 15 | 1100 | - | 16500 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.7 | 12500 | - | 8750 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.7 | 37750 | - | 26425 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 305 | 93 | - | 28365 | - | - |
| - | - | - | - | - | - | - | - | Acier | 10 | 510 | - | 5100 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 32 | 400 | - | 12800 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 10 | 12 | 375 | - | 4500 | - | - |
| - | - | - | - | - | - | - | - | Coffrage | 0.05 | 115000 | - | 5750 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.5 | 1000 | - | 500 | - | - |
| - | - | - | - | - | - | - | - | M.O | 56 | 1100 | - | 61600 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 170290 | 272464 |
| - | - | - | - | - | - | - | - | Filtre de 200x300 pour plus de 15 usagers | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 24 | 1100 | - | 26400 | - | - |
| - | - | - | - | - | - | - | - | Sable | 1.2 | 12500 | - | 15000 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 1.2 | 37750 | - | 45300 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 690 | 93 | - | 64170 | - | - |
| - | - | - | - | - | - | - | - | Acier | 23 | 510 | - | 11730 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 50 | 400 | - | 20000 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 10 | 20 | 375 | - | 7500 | - | - |
| - | - | - | - | - | - | - | - | Coffrage | 0.1 | 115000 | - | 11500 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 80 | 1100 | - | 88000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 291600 | 466560 |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |

---

## 4 — Charpente-Couverture étanchéité

*Lignes : 300 | Colonnes : 22*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 | Col16 | Prix matériel | Unité | pourcentage | materiel + mo | PU Ep 20cm | PU Ep 40cm |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | Bois de charpente | - | - | - | - | - | Fermes moisées en planches de 15 ou 20x3 | - | - | - | - | - | - | - | 5870 | m2 | 0.3 | 7631 | 9157.2 | 10683.4 |
| G. | 14 | Douka, Moabi, Iroko | m3 | 210000 | - | Scirie | - | Planche (56) | 224 | 630 | - | 141120 | - | - | - | - | - | - | - | 10988.64 | 12820.08 |
| G. | 15 | Movingui, Béli | m3 | 185000 | - | Scirie | - | Pointes | 25 | 1000 | - | 25000 | - | - | - | - | - | - | - | - | - |
| G. | 16 | Ozigo, Afo | m3 | 140000 | - | Scirie | - | M.O | 85 | 1100 | - | 93500 | - | - | - | - | - | - | - | - | - |
| - | - | Bois decharpente débité, Ozigo | - | - | - | - | - | - | - | - | m3 | - | 259620 | 415392 | - | - | - | - | - | - | - |
| G. | 18 | Planches de 15x3 | ml | 630 | - | Scirie | - | Ferme moisées en planches de 15x3 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 19 | Planches de 20x3 | ml | 840 | - | Scirie | - | de 6 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 20 | Planches de 25x3 | ml | 1050 | - | Scirie | - | Planches (9) | 36 | 630 | - | 22680 | - | - | - | - | - | - | - | - | - |
| G. | 21 | Planches de 30x3 | ml | 1500 | - | Scirie | - | Pointes (4kg) | 6 | 1000 | - | 6000 | - | - | - | - | - | - | - | - | - |
| G. | 22 | Lattes de 8x4 | ml | 450 | - | Scirie | - | M.O | 6 | 1100 | - | 6600 | - | - | - | - | - | - | - | - | - |
| G. | 23 | Chevrons de  8x8 | ml | 900 | - | Scirie | - | - | - | - | U | - | 35280 | 56448 | - | - | - | - | - | - | - |
| G. | 24 | Pannes de 6x12 | ml | 1010 | - | Scirie | - | de 8 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 25 | Pannes de 6x18 | ml | 1520 | - | Scirie | - | Planches (12) | 48 | 630 | - | 30240 | - | - | - | - | - | - | - | - | - |
| G. | 26 | Pannes de 8x22 | ml | 2470 | - | Scirie | - | Pointes | 8 | 1000 | - | 8000 | - | - | - | - | - | - | - | - | - |
| G. | 27 | Linteaux de 3x3 | ml | 450 | - | Scirie | - | M.O | 7 | 1100 | - | 7700 | - | - | - | - | - | - | - | - | - |
| G. | 28 | Pointes têtes plates | kg | 1000 | - | Abido | 710447 | - | - | - | U | - | 45940 | 73504 | - | - | - | - | - | - | - |
| G. | 29 | Bacs Alu 6/10 | m² | 5870 | - | Abido | 710447 | de 10 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 30 | Bacs Alu 7/10 | m² | - | - | - | - | Planches (15) | 60 | 630 | - | 37800 | - | - | - | - | - | - | - | - | - |
| G. | 31 | Faitières pour bacs alu | ml | 3940 | - | Abido | 710447 | Pointes | 10 | 1000 | - | 10000 | - | - | - | - | - | - | - | - | - |
| G. | 32 | Fixations tire-fonds | u | 170 | - | Abido | 710447 | M.O | 8 | 1100 | - | 8800 | - | - | - | - | - | - | - | - | - |
| G. | 33 | Plaques éternit | m² | 11130 | - | Mat Gab | 741087 | - | - | - | U | - | 566000 | 90560 | - | - | - | - | - | - | - |
| G. | 34 | Faitières éternit | u | 17920 | - | Mat Gab | 741087 | de 12 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 35 | Fixations tore-fonds | u | 280 | - | Mat Gab | - | Planches (18) | 72 | 630 | - | 45360 | - | - | - | - | - | - | - | - | - |
| G. | 36 | Tuiles ciment "Owendo" | u | 800 | - | - | - | Pointes | 12 | 1000 | - | 12000 | - | - | - | - | - | - | - | - | - |
| G. | 37 | Tuiles faitières "Owendo" | u | 100 | - | - | - | M.O | 9 | 1100 | - | 9900 | - | - | - | - | - | - | - | - | - |
| G. | 38 | Tuiles ciment "Nzeng-Ayong" | u | 600 | - | - | - | - | - | - | U | - | 67260 | 107616 | - | - | - | - | - | - | - |
| G. | 39 | Tuiles faitières"Nzeng-ayong" | u | 800 | - | - | - | Fermes moisées en planches de 20x3 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 40 | Tôles ondulées | m² | 2050 | - | Abido | 710447 | de 10 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 41 | Faitières tôles | ml | 3680 | - | Abido | 710447 | Planches (15) | 60 | 840 | - | 50400 | - | - | - | - | - | - | - | - | - |
| G. | 42 | Pointes et joints | u | 25 | - | Abido | 710447 | Pointes | 12 | 1000 | - | 12000 | - | - | - | - | - | - | - | - | - |
| G. | 43 | Xilix | l | 8700 | - | Mat Gab | 741087 | M.O | 9 | 1100 | - | 9900 | - | - | - | - | - | - | - | - | - |
| G. | 44 | Xylophène | l | 3870 | - | Sogame | 760554 | - | - | - | U | - | 72300 | 115680 | - | - | - | - | - | - | - |
| G. | 45 | Xylamon | l | 3450 | - | Abido | 710447 | de 12 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 46 | Shingles | m² | 11570 | - | Soga-imp | 740994 | Planches (18) | 72 | 840 | - | 60480 | - | - | - | - | - | - | - | - | - |
| G. | 47 | Pointes à Shingles | m² | 1030 | - | Soga-imp | 740994 | Pointes | 14 | 1000 | - | 14000 | - | - | - | - | - | - | - | - | - |
| G. | 48 | Colle à Shingle | m² | 1150 | - | Soga-imp | 740994 | M.O | 12 | 1100 | - | 13200 | - | - | - | - | - | - | - | - | - |
| G. | 49 | Bavette alu | ml | 2450 | - | Soga-imp | 740994 | - | - | - | U | - | 87680 | 140288 | - | - | - | - | - | - | - |
| G. | 50 | CP de 15m/m | m² | 7000 | - | Abido | 710447 | de 14 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 51 | Bacs translucides | ml | 8020 | - | Bernabé | 743432 | Planches (21) | 84 | 840 | - | 70560 | - | - | - | - | - | - | - | - | - |
| G. | 52 | Goutières PVC | ml | 4260 | - | Tecnob | 772222 | Pointes | 16 | 1000 | - | 16000 | - | - | - | - | - | - | - | - | - |
| G. | 53 | Suspentes sur bacs | u | 2740 | - | Tecnob | 772222 | M.O | 15 | 1100 | - | 16500 | - | - | - | - | - | - | - | - | - |
| G. | 54 | Jonctions | u | 1380 | - | Tecnob | 772222 | - | - | - | U | - | 103060 | 164896 | - | - | - | - | - | - | - |
| G. | 55 | Equerres | u | 4820 | - | Tecnob | 772222 | de 16 mètres | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 56 | Naissances | u | 5380 | - | Tecnob | 772222 | Planches (24) | 96 | 840 | - | 80640 | - | - | - | - | - | - | - | - | - |
| G. | 57 | Embouts | u | 1420 | - | Tecnob | 772222 | Pointes | 18 | 1000 | - | 18000 | - | - | - | - | - | - | - | - | - |
| G. | 58 | Paxalu de 30 | u | 2880 | - | Soga-imp | 740994 | M.O | - | 1100 | - | 0 | - | - | - | - | - | - | - | - | - |
| G. | 59 | Paxalu de 30 | u | 4860 | - | Soga-imp | 740994 | - | - | - | U | - | 98640 | 157824 | - | - | - | - | - | - | - |
| G. | 60 | Frises en bois dur | m² | 4700 | - | Menuisier | - | Fermes en bois dur collées et boulonnées | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 61 | Pattes à vis | u | 115 | - | - | - | Bois dur | 1 | 210000 | - | 210000 | - | - | - | - | - | - | - | - | - |
| G. | 62 | Colliers de 80 | u | 760 | - | - | - | Rabotage | 1 | 27000 | - | 27000 | - | - | - | - | - | - | - | - | - |
| G. | 63 | Colliers de 100 | u | 1010 | - | - | - | Colle | 5 | 5200 | - | 26000 | - | - | - | - | - | - | - | - | - |
| G. | 64 | Colliers de 125 | u | 1200 | - | - | - | Boulon de 15 | 200 | 480 | - | 96000 | - | - | - | - | - | - | - | - | - |
| G. | 65 | Colle blache "SADER" | kg | 5200 | - | Abido | 710447 | Rondelles de 12 | 200 | 60 | - | 12000 | - | - | - | - | - | - | - | - | - |
| G. | 66 | Boulons à bois de 12/140 | u | 480 | - | Tecnob | 772222 | Pointes | 25 | 1000 | - | 25000 | - | - | - | - | - | - | - | - | - |
| G. | 67 | Rondelles de 12 | u | 60 | - | Tecnob | 772222 | M.O | 135 | 1100 | - | 148500 | - | - | - | - | - | - | - | - | - |
| G. | 68 | Sable | m3 | 12500 | - | Transp | - | - | - | - | m3 | - | 544500 | 871200 | - | - | - | - | - | - | - |
| G. | 69 | Ciment | kg | 93 | - | - | - | Pannes en lattes de 4x8 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 70 | Flinkote | kg | 1550 | - | Bernabé | 743432 | Lattes | 1 | 450 | - | 450 | - | - | - | - | - | - | - | - | - |
| G. | 71 | Coudes PVC de 100 | u | 2500 | - | Abido | 710447 | Pointes | 0.005 | 1000 | - | 5 | - | - | - | - | - | - | - | - | - |
| G. | 72 | Tuyaux PVC de 100 | ml | 1970 | - | Abido | 710447 | M.O | 0.2 | 1100 | - | 220 | - | - | - | - | - | - | - | - | - |
| G. | 73 | Tuyaux PVC de 125 | ml | 3250 | - | Abido | 710447 | - | - | - | ml | - | 675 | 1080 | - | - | - | - | - | - | - |
| G. | 74 | Tuyaux PVC de 160 | ml | 7000 | - | Abido | 710447 | Pannes en chevrons de 8x8 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 75 | Colle PVC | kg | 8500 | - | Abido | 710447 | Chevrons | 1 | 900 | - | 900 | - | - | - | - | - | - | - | - | - |
| G. | 76 | Gravier 5/15 | m3 | 38000 | - | Transp | - | pointes | 0.01 | 1000 | - | 10 | - | - | - | - | - | - | - | - | - |
| G. | 77 | Pointes Toc | kg | 7500 | - | Abido | 710447 | M.O | 0.2 | 1100 | - | 220 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1130 | 1808 | - | - | - | - | - | - | - |
| - | PRODUITS POUR ETANCHEITE | - | - | - | - | - | - | Pannes en Bastaings de 6x12 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 92 | Bitume | kg | 770 | - | Soga-imp | 740994 | Bastaing | 1 | 1010 | - | 1010 | - | - | - | - | - | - | - | - | - |
| G. | 93 | Feutre 27S | m² | 3980 | - | Soga-imp | 740994 | Pointes | 0.04 | 1000 | - | 40 | - | - | - | - | - | - | - | - | - |
| G. | 94 | Paxalu de 30 | m² | 2875 | - | Soga-imp | 740994 | M.O | 0.2 | 1100 | - | 220 | - | - | - | - | - | - | - | - | - |
| G. | 95 | Paxalu de 40 | m² | 4860 | - | Soga-imp | 740994 | - | - | - | ml | - | 1270 | 2032 | - | - | - | - | - | - | - |
| G. | 96 | Feutre ardoisé | m² | 4370 | - | Soga-imp | 740994 | Pannes en Bastaings de 6x18 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 97 | Bavette alu | ml | 2450 | - | Tibe-Gab | 762357 | Bastaing | 1 | 1520 | - | 1520 | - | - | - | - | - | - | - | - | - |
| G. | 98 | Culotte plomb de 150 | u | 50400 | - | Tibe-Gab | 762357 | Pointes | 0.04 | 1000 | - | 40 | - | - | - | - | - | - | - | - | - |
| G. | 99 | Culotte plomb de 100 | u | 44500 | - | Tibe-Gab | 762357 | M.O | 0.2 | 1100 | - | 220 | - | - | - | - | - | - | - | - | - |
| G. | 100 | Crépine de 150 | u | 8300 | - | Tibe-Gab | 762357 | - | - | - | ml | - | 1780 | 2848 | - | - | - | - | - | - | - |
| G. | 101 | Crépine de 100 | u | 6600 | - | Tibe-Gab | 762357 | Pannes en Bastaings de 8x18 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 102 | Dalette béton de 20x20 | m² | 7600 | - | Cimentiers | - | Bastaing | 1 | 2470 | - | 2470 | - | - | - | - | - | - | - | - | - |
| G. | 103 | Gaz pour chalumeau | m² | 350 | - | - | - | Pointes | 0.05 | 1000 | - | 50 | - | - | - | - | - | - | - | - | - |
| - | TRAVAIL EN ATELIER | - | - | - | - | - | - | M.O | 0.2 | 1100 | - | 220 | - | - | - | - | - | - | - | - | - |
| G. | 110 | Rabotage de bois charpente | m3 | 27000 | - | - | - | - | - | - | ml | - | 2740 | 4384 | - | - | - | - | - | - | - |
| G. | 111 | Rabotage de bois menuiserie | m3 | 27000 | - | - | - | Habillage de pignons en planches de 20x3 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 112 | Machinage de bois menuiserie | m3 | 28000 | - | - | - | Planches | 5 | 840 | - | 4200 | - | - | - | - | - | - | - | - | - |
| - | MAIN D'ŒUVRE | - | - | - | - | - | - | Lattes | 3 | 450 | - | 1350 | - | - | - | - | - | - | - | - | - |
| G. | 117 | Charpentier couvreur | h | 1400 | - | - | - | Pointes | 0.5 | 1000 | - | 500 | - | - | - | - | - | - | - | - | - |
| G. | 118 | Manœuvre | h | 800 | - | - | - | M.O | 1.3 | 1100 | - | 1430 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 7480 | 11968 | - | - | - | - | - | - | - |
| G. | 120 | Taux horaire moyen | h | 1100 | - | - | - | Habillage de pignons en frizes bois dur | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Frizes | 1 | 4700 | - | 4700 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 3 | 450 | - | 1350 | - | - | - | - | - | - | - | - | - |
| - | - | goutière | - | 3375 | - | - | - | pointes | 0.5 | 1000 | - | 500 | - | - | - | - | - | - | - | - | - |
| - | - | naissance | - | 5380 | - | - | - | M.O | 1.3 | 1100 | - | 1430 | - | - | - | - | - | - | - | - | - |
| - | - | jonction | - | 2760 | - | - | - | - | - | - | m² | - | 7980 | 12768 | - | - | - | - | - | - | - |
| - | - | fond | - | 2500 | - | - | - | Planches de rives de 15x3 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | descente | - | 4250 | - | - | - | Planches | 1 | 630 | - | 630 | - | - | - | - | - | - | - | - | - |
| - | - | crochet | - | 28000 | - | - | - | Rabotage | 0.005 | 27000 | - | 135 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.2 | 1000 | - | 200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | 46265 | - | 11566.25 | 18506 | M.O | 1.1 | 1100 | - | 1210 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2175 | 3480 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Planches de rives de 20x3 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Planches | 1 | 840 | - | 840 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.006 | 27000 | - | 162 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.2 | 1000 | - | 200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.1 | 1100 | - | 1210 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2412 | 3859.2 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Planches de rives de 25x3 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Planches | 1 | 1050 | - | 1050 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.008 | 27000 | - | 216 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.2 | 1000 | - | 200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.1 | 1100 | - | 1210 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2676 | 4281.6 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Planches de rives de 30x3 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Planches | 1 | 1500 | - | 1500 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.009 | 32500 | - | 292.5 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.3 | 1000 | - | 300 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3412.5 | 5460 | - | - | - | - | - | - | - |
| - | - | - | - | f | m² | - | - | Couverture Bacs alu sur pannes bois | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | 11264 | 1 | - | - | Bacs | 1 | 5870 | - | 5870 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | 8448 | 0.75 | - | - | Fixations | 3 | 170 | - | 510 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.6 | 1100 | - | 660 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 7040 | 11264 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faitière pour bacs alu | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faitières | 1 | 3940 | - | 3940 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fixations | 3 | 170 | - | 510 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Paxalu | 0.3 | 2880 | - | 864 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.7 | 1100 | - | 770 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 6084 | 9734.4 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Couverture en tôles ondulées | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tôles ondulées | 1 | 2050 | - | 2050 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pointes et joints | 9 | 25 | - | 225 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 2715 | 4344 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faitière pour tôles ondulées | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faitières | 1 | 3680 | - | 3680 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 4 | 25 | - | 100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 4220 | 6752 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Couverture fibro-ciment "éternit" | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Plaques fibro | 1 | 11130 | - | 11130 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fixation | 4 | 280 | - | 1120 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.6 | 1100 | - | 660 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 12910 | 20656 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faîtière et arêtiers fibro-ciment | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faîtières | 1 | 17920 | - | 17920 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fixations | 3 | 280 | - | 840 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.6 | 1100 | - | 660 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 19420 | 31072 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevrons pour couverture en tuiles | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevrons | 1 | 900 | - | 900 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.05 | 1000 | - | 50 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.3 | 1100 | - | 330 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1280 | 2048 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Liteaux bois pour support de tuiles | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Liteaux | 1 | 450 | - | 450 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.05 | 1000 | - | 50 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.2 | 1100 | - | 220 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 720 | 1152 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Couverture en tuiles ciment "Owendo" | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuiles | 13 | 800 | - | 10400 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 11720 | 18752 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faîtages et arêtiers en tuiles ciment "Owendo" | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuiles rondes | 3.5 | 100 | - | 350 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 5 | 93 | - | 465 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2165 | 3464 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Couverture en tuiles ciment "Nzeng Ayong" | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuiles | 8 | 600 | - | 4800 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 5600 | 9440 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faîtages et arêtiers en tuiles ciment "Nzeng Ayong" | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuiles rondes | 3.5 | 600 | - | 2100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 5 | 93 | - | 465 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3915 | 6264 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Noue en bois avec étanchéité paxalu | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois | 0.04 | 140000 | - | 5600 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.6 | 1000 | - | 600 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Paxalu de 40 | 1 | 4860 | - | 4860 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Flinkote | 2 | 1550 | - | 3100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 18560 | 29696 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Solin au ciment avec Paxalu | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.006 | 12500 | - | 75 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 2 | 93 | - | 186 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Paxalu de 30 | 0.3 | 2880 | - | 864 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bavette en alu | 1 | 2450 | - | 2450 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Flinkote | 0.3 | 1550 | - | 465 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 6240 | 9984 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Habillage des débords de toits, sur chevrons pour toitures en tuiles | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Frise | 1 | 4700 | - | 4700 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.5 | 1000 | - | 500 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 7400 | 11840 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Traitement des bois de charpentes | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Xylamon | 0.2 | 3450 | - | 690 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.3 | 1100 | - | 330 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 1020 | 1632 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Goutières en PVC avec suspentes pour bacs alu | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Gouttière | 1 | 4260 | - | 4260 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Suspente | 1.5 | 2740 | - | 4110 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 9470 | 15152 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Naissances de chute EP | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Naissance | 1 | 5380 | - | 5380 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | u | - | 6480 | 10368 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Jonction d'élément de goutières | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Jonction | 1 | 1380 | - | 1380 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | u | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Equerres | - | - | - | - | 1930 | 3088 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Equerre | 1 | 4820 | - | 4820 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | u | - | 5920 | 9472 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Départ de chutes EP,coudes PVC | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | coudes | 2 | 2500 | - | 5000 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | PVC de 100 | 0.5 | 1970 | - | 985 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | colle | 0.2 | 3250 | - | 650 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | u | - | 8835 | 14136 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chutes EP en tuyaux PVC de 100 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyaux de 100 | 1 | 1970 | - | 1970 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pattes à vis | 1 | 115 | - | 115 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Collier | 1 | 1010 | - | 1010 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | u | - | 2225 | 3560 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Couverture en shingle | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 19 | 1.1 | 7000 | - | 7700 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Shingle | 1 | 11570 | - | 11570 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 1 | 1030 | - | 1030 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle à shingle | 1 | 1150 | - | 1150 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 24200 | 38720 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Plus value pour faîtages et arêtiers | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Shingles | 0.5 | 11570 | - | 5785 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.5 | 1030 | - | 515 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.5 | 1150 | - | 575 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 7975 | 12760 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Travaux d'étancheité | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Etancheité multicouche | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Feutre  27S  (3x37) | 3 | 3980 | - | 11940 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bitume  (3kgx700) | 3 | 770 | - | 2310 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Gaz et divers | 1 | 350 | - | 350 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 16250 | 26000 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Relevés d'étancheité | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Paxalu 40s | 1 | 4860 | - | 4860 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bitume | 2 | 770 | - | 1540 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Gaz et divers | 1 | 350 | - | 350 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 8950 | 14320 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Protection d'étancheité avec gravillon de 5/15 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | épaisseur 5cm | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Gravillon 5/15 | 0.05 | 38000 | - | 1900 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 4650 | 7440 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Etancheité multicouche avec protection ardoisée | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Feutre  27S | 2 | 3980 | - | 7960 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Feutre ardoisée | 1 | 4370 | - | 4370 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bitume | 3 | 770 | - | 2310 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Gaz et divers | 1 | 350 | - | 350 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 17740 | 28384 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Protection lourde pour terrasse accessible, dallettes | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en ciment de 20x20, posées sur sable | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.04 | 12500 | - | 500 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Dallettes | 1 | 7600 | - | 7600 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1 | 93 | - | 93 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 10943 | 17508.8 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Protection de relevé d'étancheité par dallettes | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | collées au bitume | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Dallettes | 0.2 | 7600 | - | 1520 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bitume | 2 | 770 | - | 1540 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 5260 | 8416 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Naissance de chutes EP de 160 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Culotte de plomb | 1 | 50400 | - | 50400 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Crépine | 1 | 8300 | - | 8300 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.0 | 2 | 1100 | - | 2200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 60900 | 97440 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Naissance de chutes EP de 100 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Culotte de plomb | 1 | 44500 | - | 44500 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Crépine | 1 | 6600 | - | 6600 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.0 | 2 | 1100 | - | 2200 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 53300 | 85280 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bavette en alu sur acrotères | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bavette en alu sur acrotères | 1 | 2450 | - | 2450 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes toc | 0.03 | 7500 | - | 225 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.6 | 1100 | - | 660 | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3335 | 5336 | - | - | - | - | - | - | - |

---

## 5 — Plafonds Bois et STAFF

*Lignes : 116 | Colonnes : 15*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G. | 13 | Lattes bois de 4x8 | ml | 450 | - | Scierie | - | Plafonds bois | - | - | - | - | - | - |
| G. | 14 | Chevrons bois de 8x8 | ml | 900 | - | Scierie | - | Habillage en sous faces des débord des toits, | - | - | - | - | - | - |
| G. | 15 | Pointes à têtes plates | kg | 1000 | - | Abido | 710447 | en CP de 4m/m avec couvre -joints, posée sur | - | - | - | - | - | - |
| G. | 16 | pointes toc | kg | 7500 | - | Abido | 710447 | ossature bois | - | - | - | - | - | - |
| G. | 17 | Xylamon | L | 3450 | - | Abido | 710447 | Lattes | 4.5 | 450 | - | 2025 | - | - |
| G. | 18 | CP de 4m/m | m² | 2000 | - | Abido | 710447 | CP de 4m/m | 1.1 | 2000 | - | 2200 | - | - |
| G. | 19 | CP de 5m/m | m² | 2850 | - | Abido | 710447 | Couvre-joints | 4 | 450 | - | 1800 | - | - |
| G. | 20 | CP de 8m/m | m² | 4500 | - | Abido | 710447 | Pointes | 2 | 1000 | - | 2000 | - | - |
| G. | 21 | CP de 5m/m ébénisterie | m² | 11350 | - | Soga-Imp | 740994 | M.O. | 2 | 1100 | - | 2200 | - | - |
| G. | 22 | Couvre-joints plats | ml | 450 | - | Abido | 710447 | - | - | - | m² | - | 10225 | 16360 |
| G. | 23 | Corniches bois | ml | 1200 | - | Menuisier | - | Habillage en sous faces des débords de toits, | - | - | - | - | - | - |
| G. | 24 | Panneaux en staff | m² | 10820 | - | Staffeur | - | en CP de 5m/m joints en creux,posé sur | - | - | - | - | - | - |
| G. | 25 | Corniches en staff | ml | 3500 | - | Staffeur | - | ossature bois | - | - | - | - | - | - |
| G. | 26 | Bandeaux en staff | ml | 3500 | - | Staffeur | - | Lattes | 4.5 | 450 | - | 2025 | - | - |
| G. | 27 | Rosace en staff | U | 8500 | - | Staffeur | - | CP de 5m/m | 1.1 | 2850 | - | 3135 | - | - |
| G. | 29 | Fillasse (poupée) | U | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| G. | 30 | Moustiquaire | m² | 2200 | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| G. | 31 | Colle néoprène | kg | 3300 | - | Abido | 710447 | - | - | - | m² | - | 9360 | 14976 |
| - | - | - | - | - | - | - | - | Façon de ventilation des débords de toits | - | - | - | - | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | de 40x50 avec grille moustiquaire | - | - | - | - | - | - |
| G. | 56 | Charpentier | h | 1400 | - | - | - | CP perforé | 0.5 | 2850 | - | 1425 | - | - |
| G. | 57 | Manoeuvre | h | 800 | - | - | - | Grille | 0.5 | 2200 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 1 | 1000 | - | 1000 | - | - |
| G. | 59 | Taux horaire | h | 1100 | - | - | - | Liteaux | 2 | 450 | - | 900 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.05 | 3300 | - | 165 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 6790 | 10864 |
| - | - | - | - | - | - | - | - | Plafonds intérieur en CP de 4m/m, posé sur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | ossature bois, avec couvre-joints | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 4.5 | 450 | - | 2025 | - | - |
| - | - | - | - | - | - | - | - | CP de 4m/m | 1.1 | 2000 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | Couvre-joints | 4 | 450 | - | 1800 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 10225 | 16360 |
| - | - | - | - | - | - | - | - | Plafonds intérieur en CP de 4m/m, posé sur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | ossature bois, avec joints en creux | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 4.5 | 1200 | - | 5400 | - | - |
| - | - | - | - | - | - | - | - | CP de 4m/m | 1.1 | 2000 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 11800 | 18880 |
| - | - | - | - | - | - | - | - | Plafonds intérieur en CP de 5m/m, posé sur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | ossature bois, avec joints en creux | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 4.5 | 450 | - | 2025 | - | - |
| - | - | - | - | - | - | - | - | CP de 5m/m | 1.1 | 2850 | - | 3135 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 9360 | 14976 |
| - | - | - | - | - | - | - | - | Plafonds intérieur en CP de 8m/m, posé sur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | ossature bois, avec joints en G13 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 4.5 | 450 | - | 2025 | - | - |
| - | - | - | - | - | - | - | - | CP de 8m/m | 1.1 | 4500 | - | 4920 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 11175 | 17880 |
| - | - | - | - | - | - | - | - | Couvre-joints plats posée au pourtour des | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pièces | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Liteaux plats | 1.2 | 450 | - | 540 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.04 | 1000 | - | 40 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 0.3 | 1100 | - | 330 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 910 | 1456 |
| - | - | - | - | - | - | - | - | Corniches bois posés au pourtour des | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pièce | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Corniches | 1.2 | 1200 | - | 1440 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.05 | 1000 | - | 50 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 0.3 | 1100 | - | 330 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 1820 | 2912 |
| - | - | - | - | - | - | - | - | Trappe d'accés aux combles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 3 | 450 | - | 1350 | - | - |
| - | - | - | - | - | - | - | - | CP de 5m/m | 0.5 | 2850 | - | 1425 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.2 | 1000 | - | 200 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 5175 | 8280 |
| - | - | - | - | - | - | - | - | Plafonds décoratif en CP ébénisterie de 5m/m | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | posé sur ossature bois, joints en creux | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 4.5 | 450 | - | 2025 | - | - |
| - | - | - | - | - | - | - | - | CP de 5m/m | 1.2 | 2850 | - | 3420 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2.5 | 1100 | - | 2750 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 10195 | 16312 |
| - | - | - | - | - | - | - | - | Traitement des bois de plafonds | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Produit | 0.2 | 3450 | - | 690 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 0.2 | 1100 | - | 220 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 910 | 1456 |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Plafonds en staff | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Plafonds en staff, posé sur ossature bois | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lattes | 4.5 | 450 | - | 2025 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 2 | 1000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | Staff | 1 | 10820 | - | 10820 | - | - |
| - | - | - | - | - | - | - | - | Fillasse | 0.2 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | Platre | 1 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 18145 | 29032 |
| - | - | - | - | - | - | - | - | Corniche en staff | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Corniche | 1 | 3500 | - | 3500 | - | - |
| - | - | - | - | - | - | - | - | Fillasse | 0.05 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | Platre | 0.2 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 4600 | 7360 |
| - | - | - | - | - | - | - | - | Bandeau en staff | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bandeau | 1 | 3500 | - | 3500 | - | - |
| - | - | - | - | - | - | - | - | Fillasse | 0.05 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | Platre | 0.2 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 4600 | 7360 |
| - | - | - | - | - | - | - | - | Rosace en staff | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rosace | 1 | 8500 | - | 8500 | - | - |
| - | - | - | - | - | - | - | - | Fillasse | 0.05 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | Platre | 0.2 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 10700 | 17120 |

---

## 6 — Clôture-Soutènements

*Lignes : 224 | Colonnes : 15*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G. | 13 | Sable | m3 | 12500 | - | Transp | - | Murs de clôture de 2 mètre de haut, en | - | - | - | - | - | - |
| G. | 14 | Gravier granit | m3 | 37750 | - | Gab gra | 756381 | agglos de 15, compris poteaux et chaînages | - | - | - | - | - | - |
| G. | 15 | Gravier calcaire | m3 | 21600 | - | Gab gra | 756381 | en béton armé, enduit aux deux faces | - | - | - | - | - | - |
| G. | 16 | Sable de remblai | m3 | 10500 | - | Transp | - | M.O. terrass | 0.8 | 1100 | - | 880 | - | - |
| G. | 17 | Ciment détail | kg | 94 | - | Détail | - | Sable | 0.27 | 125000 | - | 3375 | - | - |
| G. | 18 | Acier TOR prix moyen | kg | 510 | - | Bernabé | 743432 | Gravier | 0.12 | 37750 | - | 4530 | - | - |
| G. | 19 | Fil d'attache | kg | 1500 | - | Bernabé | 743432 | Ciment | 110 | 94 | - | 10340 | - | - |
| G. | 20 | Agglos creux de 20x20x40 | U | 450 | - | Briquet | - | Acier "TOR" | 6 | 510 | - | 3060 | - | - |
| G. | 21 | Agglos creux de 15x20x40 | U | 400 | - | Briquet | - | Fil d'attache | 0.1 | 1500 | - | 150 | - | - |
| G. | 22 | Bois de coffrage | m3 | 115000 | - | Abido | 710447 | Bois de coffr. | 0.01 | 115000 | - | 1150 | - | - |
| G. | 23 | Pointes | kg | 1000 | - | Abido | 710447 | Pointes | 0.1 | 1000 | - | 100 | - | - |
| - | - | Grillage simple torsion galvanisé | - | - | - | - | - | Agglos de 15 | 22 | 400 | - | 8800 | - | - |
| G. | 25 | de 100 | ml | 1850 | - | Bernabé | 743432 | M.O. construc. | 10 | 1100 | - | 11000 | - | - |
| G. | 26 | de 150 | ml | 2780 | - | Bernabé | 743432 | - | - | - | ml | - | 43385 | 69416 |
| G. | 27 | de 200 | ml | 3580 | - | Bernabé | 743432 | Mur bahut de 1 mètre de haut, poteaux de | - | - | - | - | - | - |
| G. | 28 | Fil tendeur galvanisé | ml | 1320 | - | Bernabé | 743432 | 2 mètre de haut, chaperon sur mur et | - | - | - | - | - | - |
| G. | 29 | Tendeurs galvanisés | U | 1170 | - | Bernabé | 743432 | couronnement des poteaux | - | - | - | - | - | - |
| G. | 30 | Fil d'attache galvanisé | kg | 2795 | - | Bernabé | 743432 | M.O. terrass | 0.8 | 1100 | - | 880 | - | - |
| - | - | Grillage simple torsion plastifié | - | - | - | - | - | Sable | 0.17 | 125000 | - | 2125 | - | - |
| G. | 32 | de 100 | ml | 2500 | - | Bernabé | 743432 | Gravier | 0.12 | 37750 | - | 4530 | - | - |
| G. | 33 | de 150 | ml | 3180 | - | Bernabé | 743432 | Ciment | - | 94 | - | 8460 | - | - |
| G. | 34 | de 200 | ml | 4470 | - | Bernabé | 743432 | Acier "TOR" | 90 | 510 | - | 3060 | - | - |
| G. | 35 | Fil tendeur plastifié | ml | 125 | - | Bernabé | 743432 | Fil d'attache | 6 | 1500 | - | 150 | - | - |
| G. | 36 | Tendeurs plastifiés | U | 2350 | - | Bernabé | 743432 | Bois de coffr. | 0.1 | 115000 | - | 1840 | - | - |
| G. | 37 | Fil d'attache plastifié | kg | 3150 | - | Bernabé | 743432 | Pointes | 0.016 | 1000 | - | 100 | - | - |
| G. | 38 | Piquet fer té de 1.20 | U | 2900 | - | Ferronier | - | Agglos de 15 | 0.1 | 400 | - | 6000 | - | - |
| G. | 39 | Piquet fer té de 1.70 | U | 4250 | - | Ferronier | - | M.O. construc. | 15 | 1100 | - | 13200 | - | - |
| G. | 40 | Piquet fer té de 2.20 | U | 8550 | - | Ferronier | - | - | 12 | - | ml | - | 40345 | 64552 |
| G. | 41 | Jambe de force | U | 2500 | - | Ferronier | - | Pilastres en béton armé de 30x30, hauteur | - | - | - | - | - | - |
| G. | 42 | Tuyaux PVC de 100 | U | 1970 | - | Abido | 710447 | 2.15, chaperon sur le dessus, compris | - | - | - | - | - | - |
| G. | 43 | Tuyaux PVCde 40 | U | 850 | - | Abido | 710447 | terrassements et fondations | - | - | - | - | - | - |
| G. | 44 | Bidim | m² | 1340 | - | Bernabé | 743432 | M.O. terrass | 0.6 | 1100 | - | 660 | - | - |
| G. | 45 | CP de 19 | m² | 9000 | - | - | - | Sable | 0.21 | 125000 | - | 2625 | - | - |
| G. | 46 | Terre de déblais | m3 | 6500 | - | - | - | Gravier | 0.27 | 37750 | - | 10192.5 | - | - |
| G. | 47 | Moellons de latérite | m3 | 56000 | - | - | - | Ciment | 140 | 94 | - | 13160 | - | - |
| G. | 48 | Treillis soudé | m² | 1050 | - | - | - | Acier "TOR" | 15 | 510 | - | 7650 | - | - |
| G. | 49 | 1/4 de ronds pour larmiers | ml | 450 | - | - | - | Fil d'attache | 0.2 | 1500 | - | 300 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffr. | 0.02 | 115000 | - | 2300 | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | Pointes | 0.2 | 1000 | - | 200 | - | - |
| G. | - | Manoeuvre | h | 800 | - | - | - | M.O. construc. | 18 | 400 | - | 19800 | - | - |
| G. | - | - | - | - | - | - | - | - | - | 1100 | U | - | 56887.5 | 91020 |
| G. | - | Taux horaire | h | 1100 | - | - | - | Clotures en grillage galvanisé posé sur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | piquets en fer en tés avec jambes de forces, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | compris tendeur et fils | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 100 de haut | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.04 | 37750 | - | 1510 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 94 | - | 1410 | - | - |
| - | - | - | - | - | - | - | - | piquet | 0.3 | 2900 | - | 870 | - | - |
| - | - | - | - | - | - | - | - | Fils tendeurs | 3 | 1320 | - | 3960 | - | - |
| - | - | - | - | - | - | - | - | Tendeurs | 0.1 | 1170 | - | 117 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.05 | 2795 | - | 139.75 | - | - |
| - | - | - | - | - | - | - | - | Grillage | 1 | 1850 | - | 1850 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2.5 | 1100 | - | 2750 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 12856.75 | 20570.8 |
| - | - | - | - | - | - | - | - | de 150 de haut | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.04 | 37750 | - | 1510 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 94 | - | 1410 | - | - |
| - | - | - | - | - | - | - | - | piquet | 0.3 | 4250 | - | 1275 | - | - |
| - | - | - | - | - | - | - | - | Fils tendeurs | 3 | 1320 | - | 3960 | - | - |
| - | - | - | - | - | - | - | - | Tendeurs | 0.1 | 1170 | - | 117 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.05 | 2795 | - | 139.75 | - | - |
| - | - | - | - | - | - | - | - | Grillage | 1 | 2780 | - | 2780 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2.5 | 1100 | - | 2750 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 14191.75 | 22706.8 |
| - | - | - | - | - | - | - | - | de 200 de haut | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.04 | 37750 | - | 1510 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 94 | - | 1410 | - | - |
| - | - | - | - | - | - | - | - | piquet | 0.3 | 8550 | - | 2565 | - | - |
| - | - | - | - | - | - | - | - | Fils tendeurs | 3 | 1320 | - | 3960 | - | - |
| - | - | - | - | - | - | - | - | Tendeurs | 0.1 | 1170 | - | 117 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.05 | 2795 | - | 139.75 | - | - |
| - | - | - | - | - | - | - | - | Grillage | 1 | 3580 | - | 3580 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 16831.75 | 26930.8 |
| - | - | - | - | - | - | - | - | Clotures en grillage plastifié posé sur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | piquets en fer en tés avec jambes de forces, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | compris tendeur et fils plastifiés | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 100 de haut | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.04 | 37750 | - | 1510 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 94 | - | 1410 | - | - |
| - | - | - | - | - | - | - | - | piquet | 0.3 | 2900 | - | 870 | - | - |
| - | - | - | - | - | - | - | - | Fils tendeurs | 3 | 125 | - | 375 | - | - |
| - | - | - | - | - | - | - | - | Tendeurs | 0.1 | 2350 | - | 235 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.05 | 3150 | - | 157.5 | - | - |
| - | - | - | - | - | - | - | - | Grillage | 1 | 2500 | - | 2500 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 1.5 | 1100 | - | 1650 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 8957.5 | 14332 |
| - | - | - | - | - | - | - | - | de 150 de haut | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.04 | 37750 | - | 1510 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 94 | - | 1410 | - | - |
| - | - | - | - | - | - | - | - | piquet | 0.3 | 4250 | - | 1275 | - | - |
| - | - | - | - | - | - | - | - | Fils tendeurs | 3 | 125 | - | 375 | - | - |
| - | - | - | - | - | - | - | - | Tendeurs | 0.1 | 2350 | - | 235 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.05 | 3150 | - | 157.5 | - | - |
| - | - | - | - | - | - | - | - | Grillage | 1 | 3180 | - | 3180 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 1.5 | 1100 | - | 1650 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 10042.5 | 16068 |
| - | - | - | - | - | - | - | - | de 200 de haut | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.04 | 37750 | - | 1510 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 94 | - | 1410 | - | - |
| - | - | - | - | - | - | - | - | piquet | 0.3 | 8550 | - | 2565 | - | - |
| - | - | - | - | - | - | - | - | Fils tendeurs | 3 | 125 | - | 375 | - | - |
| - | - | - | - | - | - | - | - | Tendeurs | 0.1 | 2350 | - | 235 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.05 | 3150 | - | 157.5 | - | - |
| - | - | - | - | - | - | - | - | Grillage | 1 | 4470 | - | 4470 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 1.5 | 1100 | - | 1650 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 12622.5 | 20196 |
| - | - | - | - | - | - | - | - | Soubassement pour clôture en grillage, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | 2 rangs d'agglos de 15 sur assise ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terras | 0.4 | 1100 | - | 440 | - | - |
| - | - | - | - | - | - | - | - | Agglos de 15 | 5 | 400 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.1 | 12500 | - | 1250 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 25 | 94 | - | 2350 | - | - |
| - | - | - | - | - | - | - | - | M.O. construc. | 1.1 | 1100 | - | 1210 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 7250 | 11600 |
| - | - | - | - | - | - | - | - | Construction de murs de souténement | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en béton armé, compris coffrage et toutes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | sujétions de mise en œuvre | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Murs de 100 de haut et 15 d'épaisseur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.16 | 12500 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.32 | 37750 | - | 12080 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 110 | 94 | - | 10340 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffr. | 0.05 | 115000 | - | 5750 | - | - |
| - | - | - | - | - | - | - | - | CP de 19 | 0.4 | 9000 | - | 3600 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.5 | 1000 | - | 500 | - | - |
| - | - | - | - | - | - | - | - | Acier "TOR" | 18 | 510 | - | 9180 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.2 | 1500 | - | 300 | - | - |
| - | - | - | - | - | - | - | - | PVC de 40 | 1 | 850 | - | 850 | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass | 14 | 1100 | - | 15400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 61100 | 97760 |
| - | - | - | - | - | - | - | - | Murs de 150 de haut et 15 d'épaisseur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass | 1.3 | 1100 | - | 1430 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.2 | 12500 | - | 2500 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.4 | 37750 | - | 15100 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 150 | 94 | - | 14100 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffr. | 0.08 | 115000 | - | 9200 | - | - |
| - | - | - | - | - | - | - | - | CP de 19 | 0.6 | 9000 | - | 5400 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.8 | 1000 | - | 800 | - | - |
| - | - | - | - | - | - | - | - | Acier "TOR" | 21 | 510 | - | 10710 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.4 | 1500 | - | 600 | - | - |
| - | - | - | - | - | - | - | - | PVC de 40 | 1 | 850 | - | 850 | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass | 18 | 1100 | - | 19800 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 80490 | 128784 |
| - | - | - | - | - | - | - | - | Murs de 200 de haut et 15 d'épaisseur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass | 1.5 | 1100 | - | 1650 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.22 | 12500 | - | 2750 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.44 | 37750 | - | 16610 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 190 | 94 | - | 17860 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffr. | 0.1 | 115000 | - | 11500 | - | - |
| - | - | - | - | - | - | - | - | CP de 19 | 0.7 | 9000 | - | 6300 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 1 | 1000 | - | 1000 | - | - |
| - | - | - | - | - | - | - | - | Acier "TOR" | 33 | 510 | - | 16830 | - | - |
| - | - | - | - | - | - | - | - | Fil d'attache | 0.8 | 1500 | - | 1200 | - | - |
| - | - | - | - | - | - | - | - | PVC de 40 | 2 | 850 | - | 1700 | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass | 23 | 1100 | - | 25300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 102700 | 164320 |
| - | - | - | - | - | - | - | - | Construction d'un drain derrière le mur de | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | soutènement, tuyau PVC de 100 et gravier | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | enrobé dans une toile de bidim | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tuyau | 1 | 1970 | - | 1970 | - | - |
| - | - | - | - | - | - | - | - | Bidim | 2 | 1340 | - | 2680 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.14 | 37750 | - | 5285 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 13235 | 21176 |
| - | - | - | - | - | - | - | - | Remblai derrière le mur de soutènement, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en sable de reblai et terre | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.5 | 10500 | - | 5250 | - | - |
| - | - | - | - | - | - | - | - | Terre | 0?5 | 6500 | - | 3250 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 10700 | 17120 |
| - | - | - | - | - | - | - | - | Construction de muret avec parement en | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | blocs de latérite, compris coffrage et | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | blocage en béton, joints au ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Muret parement une face | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois coffr. | 0.05 | 115000 | - | 5750 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1000 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | blocs | 0.15 | 56000 | - | 8400 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.05 | 12500 | - | 625 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.08 | 37750 | - | 3020 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 45 | 94 | - | 4230 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 4 | 1100 | - | 4400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 26525 | 42440 |
| - | - | - | - | - | - | - | - | Muret parement deux faces | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois coffr. | 0.05 | 115000 | - | 5750 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1000 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | blocs | 0.25 | 56000 | - | 14000 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.05 | 12500 | - | 625 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.08 | 37750 | - | 3020 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 45 | 94 | - | 4230 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 6 | 1100 | - | 6600 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 34325 | 54920 |
| - | - | - | - | - | - | - | - | Habillage de tallus en moellons de latérite | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | posé sur lit de béton armé d'un treillis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | soudé, compris joints au ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrass. | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.07 | 12500 | - | 875 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.12 | 37750 | - | 4530 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 60 | 94 | - | 5640 | - | - |
| - | - | - | - | - | - | - | - | Treillis | 1 | 1050 | - | 1050 | - | - |
| - | - | - | - | - | - | - | - | Blocs | 0.15 | 56000 | - | 8400 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 5 | 1100 | - | 5500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 27095 | 43352 |
| - | - | - | - | - | - | - | - | Chaperon en béton armé pour couronnement | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de muret, débord de 8 cm de chaque | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | côtés,compris larmier | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffrage | 0.02 | 115000 | - | 2300 | - | - |
| - | - | - | - | - | - | - | - | 1/4  de rond | 2 | 450 | - | 900 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1000 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.02 | 12500 | - | 250 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.03 | 37750 | - | 1132.5 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 15 | 94 | - | 1410 | - | - |
| - | - | - | - | - | - | - | - | Aciers | 2 | 510 | - | 1020 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 4 | 1100 | - | 4400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 11512.5 | 18420 |

---

## 7 — Jardins-Espaces Verts

*Lignes : 95 | Colonnes : 15*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G. | 13 | Sable | m3 | 12500 | - | Transp | - | Préparation du sol, ameublement et épierrage éffectué au bull | - | - | - | - | - | - |
| - | 14 | Gravier 5/15 | m3 | 37760 | - | Transp | - | - | - | - | - | - | - | - |
| G. | 15 | Sable de reblai | m3 | 10500 | - | Transp | - | Materiel | 1 | 300 | - | 300 | - | - |
| G. | 16 | Terre de remblai | m3 | 7000 | - | Transp | - | M.O. | 0.6 | 1100 | - | 660 | - | - |
| G. | 17 | Terre végétale | m3 | 13500 | - | Transp | - | - | - | - | m² | - | 960 | 1536 |
| G. | 18 | Engrains (50kg) | kg | 600 | - | SACOA | - | Apport et épandage de terre végétale sur 15 cm d'épaisseur | - | - | - | - | - | - |
| G. | 20 | Arbres | U | 5500 | - | CK2 | 743358 | Terre | 0.15 | 13500 | - | 2025 | - | - |
| G. | 21 | Arbustes | U | 3500 | - | Horticulteurs | - | M.O. | 0.8 | 1100 | - | 880 | - | - |
| G. | 22 | Arbustes de haies | U | 2500 | - | Horticulteurs | - | - | - | - | m² | - | 2905 | 4648 |
| G. | 23 | Borduer P1 | ml | 4870 | - | Horticulteurs | - | Engazonnement, roulage et arrosage | - | - | - | - | - | - |
| G. | 24 | Dalles ronds | U | 2810 | - | - | - | compris première tonte | - | - | - | - | - | - |
| G. | 25 | Dalles 20x20 | m² | 7600 | - | - | - | semence | 0.04 | 7000 | - | 280 | - | - |
| G. | 26 | Calcaire 0/6 | m3 | 12000 | - | - | - | engrais | 0.06 | 600 | - | 36 | - | - |
| G. | 27 | Pavés décoratifs | U | 2000 | - | - | - | arrosages | 1 | 150 | - | 150 | - | - |
| - | - | - | - | - | - | - | - | tonte | 1 | 150 | - | 150 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 1 | 11000 | - | 1100 | - | - |
| G. | 30 | Arrosage | m² | 150 | - | - | - | - | - | - | m² | - | 1716 | 2745.6 |
| G. | 31 | Tonte | m² | 150 | - | - | - | Plantation d'arbres, compris trouée, | - | - | - | - | - | - |
| G. | 32 | Petit materiel (provision) | U | 300 | - | - | - | apport de fumure organique et engrais | - | - | - | - | - | - |
| G. | 33 | Rouleau à main | m² | 100 | - | - | - | Terre | 0.05 | 13500 | - | 675 | - | - |
| G. | 34 | Rouleau vbrant 1T | H | 15000 | - | - | - | Engrais | 0.06 | 600 | - | 36 | - | - |
| - | - | - | - | - | - | - | - | Arbre | 1 | 5500 | - | 5500 | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - |
| - | - | Béton pour ouvrages d'arts,dosé | - | - | - | - | - | - | - | - | U | - | 10611 | 16977.6 |
| - | - | à 350 kg au m3 | - | - | - | - | - | Plantation d'arbustes, compris trouée, | - | - | - | - | - | - |
| - | - | Sable                        0.4      12500 | - | 5000 | - | - | - | apport de fumure organique et engrais | - | - | - | - | - | - |
| - | - | Gravier                     0.8      38000 | - | 30400 | - | - | - | Terre | 0.03 | 13500 | - | 405 | - | - |
| - | - | Ciment                      350           94 | - | 32900 | - | - | - | Engrais | 0.04 | 600 | - | 24 | - | - |
| - | - | - | - | - | - | - | - | Arbustes | 1 | 3500 | - | 3500 | - | - |
| G. | 44 | - | m3 | 68300 | - | - | - | Plantation de haies vives, compris trouée, | - | - | - | - | - | - |
| G. | 45 | Treillis soudé | m² | 1050 | - | - | - | apport de fumure organique et engrais | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terre | 0.05 | 13500 | - | 675 | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | Engrais | 0.06 | 600 | - | 36 | - | - |
| G. | 56 | Jardinier | h | 1400 | - | - | - | Plantes | 3 | 2500 | - | 7500 | - | - |
| G. | 57 | Manoeuvre | h | 800 | - | - | - | M.O | 5 | 1100 | - | 5500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 13711 | 21937.6 |
| G. | 59 | Taux horaire moyen | h | 1100 | - | - | - | Fourniture et pose bordures P1 pour | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | jardins, délimitation d'espaces ou allées | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Béton | 0.05 | 68300 | - | 3415 | - | - |
| - | - | - | - | - | - | - | - | Bordures | 1 | 4870 | - | 4870 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 11585 | 18536 |
| - | - | - | - | - | - | - | - | Construction d'allées en cendré, compris | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | décaissement et compactage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Décaissement | 0.9 | 1100 | - | 990 | - | - |
| - | - | - | - | - | - | - | - | Base | 0.1 | 12500 | - | 1250 | - | - |
| - | - | - | - | - | - | - | - | Calcaire 0/6 | 0.1 | 12000 | - | 1200 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.07 | 15000 | - | 1050 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 7790 | 12464 |
| - | - | - | - | - | - | - | - | Construction de passage piétonniers | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | type pas japonnais, compris terrassement | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable d'assise | 0.01 | 12500 | - | 125 | - | - |
| - | - | - | - | - | - | - | - | Dalles rondes | 1 | 2810 | - | 2810 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 4035 | 6456 |
| - | - | - | - | - | - | - | - | Construction de terrasses et d'allées en | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | dallettes béton de 20x20 posé sur sable | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | compris décaissement | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass. | 0.9 | 1100 | - | 990 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.1 | 12500 | - | 1250 | - | - |
| - | - | - | - | - | - | - | - | Dallettes | 1 | 7600 | - | 7600 | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 13140 | 21024 |
| - | - | - | - | - | - | - | - | Construction de terrasses et d'allées en | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | dallettes béton de 20x20 posé sur sous | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | couche en béton, compris décaissement | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass. | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.15 | 68300 | - | 10245 | - | - |
| - | - | - | - | - | - | - | - | Treillis soudé | 1.1 | 1050 | - | 1155 | - | - |
| - | - | - | - | - | - | - | - | Dallettes | 1 | 12000 | - | 12000 | - | - |
| - | - | - | - | - | - | - | - | M.O béton | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 3000 | 48000 |
| - | - | - | - | - | - | - | - | Construction d'allées en béton pour | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | passage de véhicules,compris décaissement, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | finition chape bouchardée | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass. | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Béton | 0.15 | 68300 | - | 10245 | - | - |
| - | - | - | - | - | - | - | - | Treillis soudé | 1.1 | 1050 | - | 1155 | - | - |
| - | - | - | - | - | - | - | - | M.O béton | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 0.8 | 1100 | - | 880 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 16680 | 26688 |
| - | - | - | - | - | - | - | - | Revètement en pavés décoratifs posés | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | sur forme en béton | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. terrass. | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Béton | 0.15 | 68300 | - | 10245 | - | - |
| - | - | - | - | - | - | - | - | Treillis soudé | 1.1 | 1050 | - | 1155 | - | - |
| - | - | - | - | - | - | - | - | Pavés | 1 | 2000 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O béton | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 20000 | 32000 |

---

## 8 — Voirie-Réseaux Divers-Sols Pavé

*Lignes : 231 | Colonnes : 15*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G. | 13 | Sable | m3 | 12500 | - | - | - | Terrassements Généraux en Déblais/Remblais effectuer au Bull | - | - | - | - | - | - |
| G. | 14 | Gravier granit | m3 | 37750 | - | Gab Gra | 756381 | Bull | 0.1 | 56000 | - | 5600 | - | - |
| G. | 15 | Gravier calcaire | m3 | 21600 | - | Gab Gra | 756382 | M.O | 0.2 | 800 | - | 160 | - | - |
| G. | 16 | Sable de remblai | m3 | 10500 | - | - | - | - | - | - | m3 | - | 5760 | 9216 |
| G. | 17 | Ciment détail | kg | 93 | - | - | - | Terrassement en grande masse effectuer à la Pelle hydraulique | - | - | - | - | - | - |
| G. | 18 | Acier TOR prix moyen | kg | 510 | - | Bernabé | 743432 | Pelle | 0.1 | 60000 | - | 6000 | - | - |
| G. | 19 | Fil d'attache | kg | 1420 | - | Bernabé | 743433 | M.O | 0.2 | 800 | - | 160 | - | - |
| G. | 20 | Bois de coffrage | m3 | 115000 | - | Abido | 710447 | - | - | - | m3 | - | 6160 | 9856 |
| G. | 21 | Pointes | kg | 1000 | - | Abido | 710448 | Chargement et évacuation de déblais | - | - | - | - | - | - |
| G. | 22 | Bordures P1 | ml | 4870 | - | SGBM | 701310 | Chargement | 0.05 | 50000 | - | 2500 | - | - |
| G. | 23 | Caniveau 50x50 | ml | 51310 | - | SGBM | 701311 | Evacuation | 0.2 | 12500 | - | 2500 | - | - |
| G. | 24 | Dallettes pour couverture | ml | 10300 | - | SGBM | 701312 | M.O | 0.2 | 800 | - | 160 | - | - |
| G. | 25 | Pavés autoblocants de 8 | m² | 18260 | - | SGBM | 701313 | - | - | - | m3 | - | 5160 | 8256 |
| G. | 26 | Pavés autoblocants de 11 | m² | 24310 | - | SGBM | 701314 | Décaissement pour chaussée sur 0.3, exécuté au Bull, terre aux débords | - | - | - | - | - | - |
| G. | 27 | Pavés autoblocants de 13 | m² | 28440 | - | SGBM | 701315 | Bull | 0.1 | 56000 | - | 5600 | - | - |
| G. | 28 | Pavés décoratifs | U | 2810 | - | SGBM | 701316 | M.O | 0.5 | 1100 | - | 550 | - | - |
| G. | 29 | Dallettes rondes en ciment | U | 2810 | - | SGBM | 701317 | - | - | - | m3 | - | 6150 | 9840 |
| G. | 30 | Buses ciment de 400 | ml | 28320 | - | SGBM | 701318 | Latérite sur 0.25 d'épaisseur, pour couche de base, compris compactage | - | - | - | - | - | - |
| G. | 31 | Buses ciment de 500 | ml | 61480 | - | SGBM | 701319 | Latérite | 0.25 | 14500 | - | 3625 | - | - |
| G. | 32 | Buses ciment de 600 | ml | 124140 | - | SGBM | 701320 | épandage | 0.02 | 70000 | - | 1400 | - | - |
| G. | 33 | Buses ciment de 800 | ml | 129800 | - | SGBM | 701321 | Compactage | 0.02 | 70000 | - | 1400 | - | - |
| G. | 34 | Buses ciment de 1000 | ml | 229250 | - | SGBM | 701322 | M.O | 0.5 | 1100 | - | 550 | - | - |
| G. | 35 | Dallots de 500x500 | ml | 77770 | - | SGBM | 701323 | - | - | - | m² | - | 6975 | 11160 |
| G. | 36 | Dallots de 1000x1000 | ml | 283680 | - | SGBM | 701324 | Profilage des surfaces, à la niveuleuse, compris compactage | - | - | - | - | - | - |
| G. | 37 | Buses métalliques de 800 | ml | 76100 | - | Bernabé | 743432 | Profilage | 0.01 | 70000 | - | 700 | - | - |
| G. | 38 | Buses métalliques de 1000 | ml | 120370 | - | Bernabé | 743433 | Compactage | 0.01 | 70000 | - | 700 | - | - |
| G. | 39 | Dallettes de caniveaux | ml | 800 | - | SGBM | 701310 | M.O | 0.5 | 1100 | - | 550 | - | - |
| G. | 40 | Latérite | m3 | 14500 | - | - | - | - | - | - | m² | - | 1950 | 3120 |
| G. | 41 | Cut-back | kg | 1100 | - | COLAS | - | Imprégnation au Cut-Back | - | - | - | - | - | - |
| G. | 42 | Emultion | kg | 900 | - | COLAS | - | Cut-Back | 0.6 | 1100 | - | 660 | - | - |
| G. | 43 | Enrobé | m3 | 134000 | - | COLAS | - | Sable | 0.01 | 12500 | - | 125 | - | - |
| G. | 44 | Bidim | m² | 1340 | - | BERNABE | 743432 | M.O | 0.3 | 1100 | - | 330 | - | - |
| G. | 45 | Pantexroute | kg | 4100 | - | - | - | - | - | - | m² | - | 1115 | 1784 |
| G. | 46 | Nettoyant | L | 1900 | - | - | - | Revêtement en Bicouche | - | - | - | - | - | - |
| G. | 47 | Réfléchissant | L | 4500 | - | - | - | Emultion | 1 | 900 | - | 900 | - | - |
| G. | 48 | Tuyaux PVC de 40 | ml | 850 | - | ABIDO | 710447 | Gravillon | 0.02 | 37750 | - | 755 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 2095 | 3352 |
| - | - | Location de materiel | - | - | - | - | - | Revêtement en enrobé 0.10, de 5cm d'épaisseur | - | - | - | - | - | - |
| G. | 63 | Bull-dozer D6 | H | 56000 | - | T.L.M.E | 704734 | Imprégnation | 1 | 900 | - | 900 | - | - |
| G. | 64 | Pelle poclain (godet de 90) | H | 60000 | - | T.L.M.E | 704734 | Enrobé 0.10 | 0.05 | 134000 | - | 6700 | - | - |
| G. | 65 | Chargeur (godet de 2m3) | H | 50000 | - | T.L.M.E | 704734 | Compactage | 0.02 | 70000 | - | 1400 | - | - |
| G. | 66 | Niveleuse | H | 70000 | - | T.L.M.E | 704734 | M.O | 0.4 | 1100 | - | 440 | - | - |
| G. | 67 | Compacteur | H | 70000 | - | T.L.M.E | 704734 | - | - | - | m² | - | 9440 | 15104 |
| G. | 68 | Camion de 12T | H | 12500 | - | T.L.M.E | 704734 | Bordures T2 posées sur semelles béton avec dalette de canivau, compris terrassement | - | - | - | - | - | - |
| G. | 69 | Grue PPM  25T flèche de 20m | H | 80000 | - | T.L.M.E | 704734 | Terrassement | 0.5 | 800 | - | 400 | - | - |
| G. | 70 | Compresseur | H | 32000 | - | T.L.M.E | 704734 | Béton | 0.08 | 67750 | - | 5420 | - | - |
| G. | 71 | Bétonnière thermique de 300L | H | 3000 | - | T.L.M.E | 704734 | Bordures T2 | 1 | 4870 | - | 4870 | - | - |
| G. | 72 | Porte-chard | V | 200000 | - | T.L.M.E | 704734 | M.O de pose | 2.5 | 1100 | - | 2750 | - | - |
| G. | 73 | Rouleau vibrant  1T | H | 15000 | - | - | - | - | - | - | ml | - | 13440 | 21504 |
| - | - | - | - | - | - | - | - | Bordures T2 posé sur semelles béton avec dalettes de canivau, compris terrassement | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 0.8 | 800 | - | 640 | - | - |
| - | - | Béton pour ouvrages d'arts,dosé | - | - | - | - | - | Béton | 0.14 | 67750 | - | 9485 | - | - |
| - | - | à 350 kg au m3 | - | - | - | - | - | Bordures T2 | 1 | 4870 | - | 4870 | - | - |
| - | - | Sable                       0.4      12500 | - | 5000 | - | - | - | Dalettes | 1 | 8000 | - | 8000 | - | - |
| - | - | Gravier                    0.8      37750 | - | 30200 | - | - | - | M.O de pose | 4 | 1100 | - | 4400 | - | - |
| - | - | Ciment                     350           93 | - | 32550 | - | - | - | - | - | - | ml | - | 27395 | 43832 |
| - | - | - | - | - | - | - | - | Canivaux préfabriqués en béton de 50x50, compris terrassement et remblais | - | - | - | - | - | - |
| G. | 82 | - | m3 | 67750 | - | - | - | Terrassement | 0.04 | 60000 | - | 2400 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.07 | 10500 | - | 735 | - | - |
| - | - | - | - | - | - | - | - | Canivau | 1 | 51310 | - | 51310 | - | - |
| - | - | Main d'œuvre | - | - | - | - | - | Levage | 0.02 | 60000 | - | 1200 | - | - |
| G. | 117 | Maçon - coffreur | h. | 1400 | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - |
| G. | 118 | Manœuvre | h. | 800 | - | - | - | - | - | - | ml | - | 58945 | 94312 |
| - | - | - | - | - | - | - | - | Dalettes béton pour couverture de canivaux | - | - | - | - | - | - |
| G. | 120 | Taux horaire moyen | h. | 1100 | - | - | - | Dalettes | 1 | 10300 | - | 10300 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 12500 | 20000 |
| - | - | - | - | - | - | - | - | Fourniture et pose de buse métallique de 800, compris terrassement et Remblai | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 0.3 | 60000 | - | 18000 | - | - |
| - | - | - | - | - | - | - | - | Buse 800 | 1 | 76100 | - | 76100 | - | - |
| - | - | - | - | - | - | - | - | Remblai | 1 | 10500 | - | 10500 | - | - |
| - | - | - | - | - | - | - | - | M.O | 8 | 1100 | - | 8800 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 113400 | 181440 |
| - | - | - | - | - | - | - | - | Fourniture et pose de buse métallique de 1000, compris terrassement et Remblai | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 0.3 | 60000 | - | 18000 | - | - |
| - | - | - | - | - | - | - | - | Buse de 1000 | 1 | 120370 | - | 120370 | - | - |
| - | - | - | - | - | - | - | - | Remblai | 1.4 | 10500 | - | 14700 | - | - |
| - | - | - | - | - | - | - | - | M.O | 10 | 1100 | - | 11000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 164070 | 262512 |
| - | - | - | - | - | - | - | - | Dalle en béton armé de 15cm d'épaisseur sur buses | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Béton | 0.15 | 67750 | - | 10162.5 | - | - |
| - | - | - | - | - | - | - | - | Acier | 2.5 | 510 | - | 1275 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 14737.5 | 23580 |
| - | - | - | - | - | - | - | - | Tête de buse métalliques, en béton armé, compris terrasement, coffrage et aciers | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 1 | 60000 | - | 60000 | - | - |
| - | - | - | - | - | - | - | - | Béton | 2 | 67750 | - | 135500 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffrage | 0.5 | 115000 | - | 57500 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 5 | 1000 | - | 5000 | - | - |
| - | - | - | - | - | - | - | - | Aciers | 65 | 510 | - | 33150 | - | - |
| - | - | - | - | - | - | - | - | Fils d'attache | 0.5 | 1420 | - | 710 | - | - |
| - | - | - | - | - | - | - | - | M.O | 70 | 1100 | - | 77000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 368860 | 590176 |
| - | - | - | - | - | - | - | - | Pavage de cours ou voies de circulations, en pavés Autoblocants de 8 pour trafic léger | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 0.06 | 60000 | - | 3600 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.02 | 70000 | - | 1400 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.12 | 12500 | - | 1500 | - | - |
| - | - | - | - | - | - | - | - | Pavé de 8 | 1 | 18260 | - | 18260 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.06 | 15000 | - | 900 | - | - |
| - | - | - | - | - | - | - | - | M.O | 5 | 1100 | - | 5500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 31160 | 49856 |
| - | - | - | - | - | - | - | - | Pavage de cours ou voies de circulations, en pavés Autoblocants de 11 pour trafic normal | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 0.06 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.02 | 0 | - | 0 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.12 | 10500 | - | 1260 | - | - |
| - | - | - | - | - | - | - | - | Pavé de 11 | 1 | 7500 | - | 7500 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.06 | 15000 | - | 900 | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 14060 | 20387 |
| - | - | - | - | - | - | - | - | Pavage de cours ou voies de circulations, en pavés Autoblocants de 13 pour trafic lourd | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 0.06 | 60000 | - | 3600 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.02 | 70000 | - | 1400 | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.12 | 10500 | - | 1260 | - | - |
| - | - | - | - | - | - | - | - | Pavé de 11 | 1 | 28440 | - | 28440 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.06 | 15000 | - | 900 | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 40000 | 64000 |
| - | - | - | - | - | - | - | - | Drainage sous les pavés, en tuyau PVC avec gravier 5/15 et Bidim, compris terrassement manuel | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | et réglage des pentes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 0.3 | 1100 | - | 330 | - | - |
| - | - | - | - | - | - | - | - | Bidim | 1 | 1340 | - | 1340 | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.02 | 37750 | - | 755 | - | - |
| - | - | - | - | - | - | - | - | Tuyau | 1.1 | 850 | - | 935 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 5560 | 8896 |
| - | - | - | - | - | - | - | - | Dallot de 100x100 en béton armé de préfabriqués, compris béton d'ascise et remblai | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 2 | 60000 | - | 120000 | - | - |
| - | - | - | - | - | - | - | - | Béton | 0.2 | 67750 | - | 13550 | - | - |
| - | - | - | - | - | - | - | - | Dallot | 1 | 283680 | - | 283680 | - | - |
| - | - | - | - | - | - | - | - | Remblai | 2 | 10500 | - | 21000 | - | - |
| - | - | - | - | - | - | - | - | Latérite | 1 | 14500 | - | 14500 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.3 | 70000 | - | 21000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 50 | 1100 | - | 55000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 528730 | 845968 |
| - | - | - | - | - | - | - | - | Dallot de 50x50 en béton armé de préfabriqués, compris béton d'ascise et remblai | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 2 | 60000 | - | 120000 | - | - |
| - | - | - | - | - | - | - | - | Béton | 0.1 | 67750 | - | 6775 | - | - |
| - | - | - | - | - | - | - | - | Dallot | 1 | 77770 | - | 77770 | - | - |
| - | - | - | - | - | - | - | - | Remblai | 1 | 10500 | - | 10500 | - | - |
| - | - | - | - | - | - | - | - | Latérite | 0.6 | 14500 | - | 8700 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.1 | 70000 | - | 7000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 30 | 1100 | - | 33000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 263745 | 421992 |
| - | - | - | - | - | - | - | - | Tête de pont pour dallot de 50x50, compris terrassement, réglage du fond et remblai | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 1 | 60000 | - | 60000 | - | - |
| - | - | - | - | - | - | - | - | Béton | 1 | 67750 | - | 67750 | - | - |
| - | - | - | - | - | - | - | - | Aciers | 100 | 510 | - | 51000 | - | - |
| - | - | - | - | - | - | - | - | Fils d'attache | 0.5 | 1420 | - | 710 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffrage | 0.5 | 115000 | - | 57500 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 5 | 1000 | - | 5000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 70 | 1100 | - | 77000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 318960 | 510336 |
| - | - | - | - | - | - | - | - | Tête de pont pour dallot de 100x100, compris terrassement, réglage du fond et remblai | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Terrassement | 4 | 60000 | - | 240000 | - | - |
| - | - | - | - | - | - | - | - | Béton | 2.5 | 67750 | - | 169375 | - | - |
| - | - | - | - | - | - | - | - | Aciers | 200 | 510 | - | 102000 | - | - |
| - | - | - | - | - | - | - | - | Fils d'attache | 2 | 1420 | - | 2840 | - | - |
| - | - | - | - | - | - | - | - | Bois de coffrage | 0.7 | 115000 | - | 80500 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 10 | 1000 | - | 10000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 120 | 1100 | - | 132000 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 736715 | 1178744 |
| - | - | - | - | - | - | - | - | Réparation de nids de poule sur chaussée, taille des bords, curage, imprégnation, enrobé de 0.10 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | et compactage, compris évacuation des gravats | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Taille | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Curage | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Imprégnation | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Enrobé 0.10 | 0.05 | 134000 | - | 6700 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.1 | 15000 | - | 1500 | - | - |
| - | - | - | - | - | - | - | - | Evacuation | 0.4 | 12500 | - | 5000 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 4 | 1100 | - | 4400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 20900 | 33440 |
| - | - | - | - | - | - | - | - | Reprise de chausée, décaissement, avivage des bords assise latérite à 4% de ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Avivage | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Décaissement | 1.5 | 1100 | - | 1650 | - | - |
| - | - | - | - | - | - | - | - | Latérite | 1.1 | 14500 | - | 1450 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1 | 93 | - | 93 | - | - |
| - | - | - | - | - | - | - | - | Imprégnation | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Enrobé 0.10 | 0.05 | 134000 | - | 6700 | - | - |
| - | - | - | - | - | - | - | - | Compactage | 0.1 | 15000 | - | 1500 | - | - |
| - | - | - | - | - | - | - | - | M.O. | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 16893 | 27028.8 |
| - | - | - | - | - | - | - | - | Enlèvement d'éboulements | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chargement | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | Evacuation | 0.3 | 12500 | - | 3750 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 7050 | 11280 |
| - | - | - | - | - | - | - | - | Curage des fossés en terre | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Matériel | 1 | 300 | - | 300 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 3600 | 5760 |
| - | - | - | - | - | - | - | - | Curage de canivaux en béton | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Matériel | 1 | 300 | - | 300 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 2500 | 4000 |
| - | - | - | - | - | - | - | - | Curage de buses | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Matériel | 1 | 500 | - | 500 | - | - |
| - | - | - | - | - | - | - | - | M.O | 5 | 1100 | - | 5500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 6000 | 9600 |
| - | - | - | - | - | - | - | - | Chargement à la main et évacuation des déblais | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - |
| - | - | - | - | - | - | - | - | Evacuation | 0.3 | 12500 | - | 3750 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m3 | - | 6500 | 10400 |
| - | - | - | - | - | - | - | - | Débroussaillage de bords de routes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Matériel | 1 | 50 | - | 50 | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.1 | 1100 | - | 110 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 160 | 256 |
| - | - | - | - | - | - | - | - | Pose de supports pour panneaux de signalisation, compris fouilles et socles en béton | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fouilles | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | Béton | 0.1 | 67750 | - | 6775 | - | - |
| - | - | - | - | - | - | - | - | Supports | non compris | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 10075 | 16120 |
| - | - | - | - | - | - | - | - | Pose de panneaux de signalisation | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Panneaux | non compris | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fixation | non compris | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2200 | 3520 |
| - | - | - | - | - | - | - | - | Marcage de route à la peinture blanche | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Peinture | 1 | 4100 | - | 4100 | - | - |
| - | - | - | - | - | - | - | - | Néttoyant | 0.4 | 1900 | - | 760 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 7060 | 11296 |
| - | - | - | - | - | - | - | - | Marcage de route à la peinture blanche réfléchissante | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Peinture | 1 | 4100 | - | 4100 | - | - |
| - | - | - | - | - | - | - | - | Néttoyant | 0.4 | 1900 | - | 760 | - | - |
| - | - | - | - | - | - | - | - | Réfléchissant | 0.2 | 4500 | - | 900 | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 8510 | 13616 |

---

## 9 — Lot Fabrication de Menuiserie

*Lignes : 493 | Colonnes : 15*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | Fabrication de cadres de menuisserie en | - | - | - | - | - | - |
| - | - | Forniture de bois | - | - | - | - | - | bois dur, pleins murs, pour murs de 18 | - | - | - | - | - | - |
| G. | 14 | Izombé | m3 | 200000 | - | Scieries | - | Cadres de 63x204 | - | - | - | - | - | - |
| G. | 15 | Padouk | m3 | 185000 | - | Scieries | - | Padouk | 0.04 | 185000 | - | 7400 | - | - |
| G. | 16 | Moabi, Douka | m3 | 185000 | - | Scieries | - | Rabotage | 0.04 | 27000 | - | 1080 | - | - |
| G. | 17 | Movingui | m3 | 170000 | - | Scieries | - | Toupie | 0.04 | 36000 | - | 1440 | - | - |
| G. | 18 | Iroko | m3 | 170000 | - | Scieries | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| G. | 19 | Ozigo | m3 | 140000 | - | Scieries | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| G. | 20 | Okoumé | m3 | 115000 | - | Scieries | - | - | - | - | U | - | 15140 | 24224 |
| - | - | - | - | - | - | - | - | Cadres de 73x204 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.041 | 185000 | - | 7585 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.041 | 27000 | - | 1107 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.041 | 36000 | - | 1476 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | Fourniture de contreplaqué | - | - | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| G. | 27 | CP de 5 m/m | m² | 2850 | - | Abido | 710447 | - | - | - | U | - | 15388 | 24620.8 |
| G. | 28 | CP de 8 m/m | m² | 4500 | - | Abido | 710447 | Cadres de 83x204 | - | - | - | - | - | - |
| G. | 29 | CP de 15 m/m | m² | 7000 | - | Abido | 710447 | Padouk | 0.042 | 185000 | - | 7770 | - | - |
| G. | 30 | CP de 19 m/m | m² | 8670 | - | Abido | 710447 | Rabotage | 0.042 | 27000 | - | 1134 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.042 | 36000 | - | 1512 | - | - |
| - | - | Fourniture de contreplaqué ébenisterie | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | de 5 m/m plaqué une face | - | - | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| G. | 34 | Afromosia | m² | 11000 | - | Soga-Imp | 740994 | - | - | - | U | - | 15636 | 25017.6 |
| G. | 35 | Amazakoué | m² | 9900 | - | Soga-Imp | 740994 | Cadres de 93x204 | - | - | - | - | - | - |
| G. | 36 | Avodiré | m² | 10300 | - | Soga-Imp | 740994 | Padouk | 0.043 | 185000 | - | 7955 | - | - |
| G. | 37 | Bété | m² | 10800 | - | Soga-Imp | 740994 | Rabotage | 0.043 | 27000 | - | 1161 | - | - |
| G. | 38 | Kévazingo | m² | 9900 | - | Soga-Imp | 740994 | Toupie | 0.043 | 36000 | - | 1548 | - | - |
| G. | 39 | Dibétou | m² | 9600 | - | Soga-Imp | 740994 | Pointes | 0.02 | 1000 | - | 20 | - | - |
| G. | 40 | Sapelli | m² | 9900 | - | Soga-Imp | 740994 | Assemblage | 4 | 1300 | - | 5200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 15884 | 25414.4 |
| - | - | Fourniture de contreplaqué ébenisterie | - | - | - | - | - | Cadres de 146x204 | - | - | - | - | - | - |
| - | - | de 19 m/m plaqué deux faces | - | - | - | - | - | Padouk | 0.047 | 185000 | - | 8695 | - | - |
| G. | 44 | Afromosia | m² | 28000 | - | Soga-Imp | 740994 | Rabotage | 0.047 | 27000 | - | 1269 | - | - |
| G. | 45 | Amazakoué | m² | 26400 | - | Soga-Imp | 740994 | Toupie | 0.047 | 36000 | - | 1692 | - | - |
| G. | 46 | Avodiré | m² | 27200 | - | Soga-Imp | 740994 | Pointes | 0.02 | 1000 | - | 20 | - | - |
| G. | 47 | Bété | m² | 27600 | - | Soga-Imp | 740994 | Assemblage | 4 | 1300 | - | 6500 | - | - |
| G. | 48 | Kévazingo | m² | 26400 | - | Soga-Imp | 740994 | - | - | - | U | - | 18176 | 29081.6 |
| G. | 49 | Dibétou | m² | 25600 | - | Soga-Imp | 740994 | Cadres de 63x215 | - | - | - | - | - | - |
| G. | 50 | Sapelli | m² | 24200 | - | Soga-Imp | 740994 | Padouk | 0.042 | 185000 | - | 7770 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.042 | 27000 | - | 1134 | - | - |
| - | - | Foourniture de formica | - | - | - | - | - | Toupie | 0.042 | 36000 | - | 1512 | - | - |
| G. | 53 | De 7/10 brillant | m² | 4460 | - | Soga-Imp | 740994 | Pointes | 0.02 | 1000 | - | 20 | - | - |
| G. | 54 | De 9/10 brillant | m² | 5860 | - | Soga-Imp | 740994 | Assemblage | 4 | 1300 | - | 5200 | - | - |
| G. | 55 | De 11/10 brillant | m² | 9360 | - | Soga-Imp | 740994 | - | - | - | U | - | 15636 | 25017.6 |
| G. | 56 | De 9/10 mat | m² | 10700 | - | Soga-Imp | 740994 | Cadres de 73x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.043 | 185000 | - | 7955 | - | - |
| G. | 58 | Placage de chants | m² | 1900 | - | Abido | 710447 | Rabotage | 0.043 | 27000 | - | 1161 | - | - |
| G. | 59 | Colle  "SADER" | kg | 5200 | - | Abido | 710447 | Toupie | 0.043 | 36000 | - | 1548 | - | - |
| G. | 60 | Colle  "AGOPLAC" | kg | 3500 | - | Abido | 710447 | Pointes | 0.02 | 1000 | - | 20 | - | - |
| G. | 61 | Pointes tête plates | kg | 1000 | - | Abido | 710447 | Assemblage | 4 | 1300 | - | 5200 | - | - |
| G. | 62 | Pointes TOC | kg | 4500 | - | Abido | 710447 | - | - | - | U | - | 15884 | 25414.4 |
| G. | 63 | Vis | U | 15 | - | Abido | 710447 | Cadres de 83x215 | - | - | - | - | - | - |
| G. | 64 | Chevilles à bois | U | 10 | - | Abido | 710447 | Padouk | 0.044 | 185000 | - | 8140 | - | - |
| G. | 65 | Paumelles encastrées | U | 1270 | - | Tacnobat | 772222 | Rabotage | 0.044 | 27000 | - | 1188 | - | - |
| G. | 66 | Poignées de placards | U | 1150 | - | Tacnobat | 772222 | Toupie | 0.044 | 36000 | - | 1584 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 16132 | 25811.2 |
| - | - | - | - | - | - | - | - | Cadres de 93x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.045 | 185000 | - | 8325 | - | - |
| - | - | Travaille en atelier | - | - | - | - | - | Rabotage | 0.045 | 27000 | - | 1215 | - | - |
| G. | 73 | Rabotage | m3 | 27000 | - | - | - | Toupie | 0.045 | 36000 | - | 1620 | - | - |
| G. | 74 | Toupie gros débits | m3 | 36000 | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| G. | 75 | Toupie petits débit | m3 | 46000 | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| G. | 76 | Toupie petits bois | m3 | 62000 | - | - | - | - | - | - | U | - | 16380 | 26208 |
| G. | 77 | Persiennage | U | 150 | - | - | - | Cadres de 146x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.048 | 185000 | - | 8880 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.048 | 27000 | - | 1296 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.048 | 36000 | - | 1728 | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| G. | 82 | Menuisier assembleur | h | 160 | - | - | - | Assemblage | 5 | 1300 | - | 6500 | - | - |
| G. | 83 | Manœuvre | h | 1000 | - | - | - | - | - | - | U | - | 18424 | 29478.4 |
| - | - | - | - | - | - | - | - | Fabrication de cadres de menuiserie en | - | - | - | - | - | - |
| G. | 85 | Taux horaire moyen | h | 1300 | - | - | - | bois dur, pleins murs, pour murs de 13 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadres de 63x204 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.03 | 185000 | - | 5550 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.03 | 27000 | - | 810 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.03 | 36000 | - | 1080 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 12660 | 20256 |
| - | - | - | - | - | - | - | - | Cadres de 73x204 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.031 | 185000 | - | 5735 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.031 | 27000 | - | 837 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.031 | 36000 | - | 1116 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 12908 | 20652.8 |
| - | - | - | - | - | - | - | - | Cadres de 83x204 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.032 | 185000 | - | 5920 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.032 | 27000 | - | 864 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.032 | 36000 | - | 152 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 13156 | 21049.6 |
| - | - | - | - | - | - | - | - | Cadres de 93x204 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.033 | 185000 | - | 6105 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.033 | 27000 | - | 891 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.033 | 36000 | - | 1188 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 4 | 1300 | - | 5200 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 13404 | 21446.4 |
| - | - | - | - | - | - | - | - | Cadres de 146x204 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.035 | 185000 | - | 6475 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.035 | 27000 | - | 945 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.035 | 36000 | - | 1260 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 5 | 1300 | - | 6500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 15200 | 24320 |
| - | - | - | - | - | - | - | - | Fabrication de cadres de menuiserie en | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | bois dur, pleins murs, murs de 18, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour fenêtre chassis naco | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | De 140x2 fois 8 lames | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.049 | 185000 | - | 9065 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.049 | 27000 | - | 1323 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.049 | 36000 | - | 1764 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.03 | 1000 | - | 30 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 5 | 1300 | - | 6500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 18682 | 29891.2 |
| - | - | - | - | - | - | - | - | De 120x2 fois 8 lames | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.046 | 185000 | - | 8510 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.046 | 27000 | - | 1242 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.046 | 36000 | - | 1656 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.03 | 1000 | - | 30 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 5 | 1300 | - | 6500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 17938 | 28700.8 |
| - | - | - | - | - | - | - | - | De 140x2 fois 5 lames | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.04 | 185000 | - | 7400 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.04 | 27000 | - | 1080 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.04 | 36000 | - | 1440 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.03 | 1000 | - | 30 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 5 | 1300 | - | 6500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 16450 | 26320 |
| - | - | - | - | - | - | - | - | De 120x2 fois 5 lames | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.036 | 185000 | - | 6660 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.036 | 27000 | - | 972 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.036 | 36000 | - | 1296 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.03 | 1000 | - | 30 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 5 | 1300 | - | 6500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 15458 | 24732.8 |
| - | - | - | - | - | - | - | - | De 70x2 fois 5 lames | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | 0.026 | 185000 | - | 4810 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.026 | 27000 | - | 702 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.026 | 36000 | - | 936 | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.03 | 1000 | - | 30 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 3 | 1300 | - | 3900 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 10378 | 16604.8 |
| - | - | - | - | - | - | - | - | Fabrication de portes pleines en bois dur, grands | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | panneaux à plates bandes ou pointes de diamants | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | De 73x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | 0.1 | 200000 | - | 200000 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.1 | 27000 | - | 2700 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.1 | 36000 | - | 3600 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 24 | 10 | - | 240 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.15 | 5800 | - | 780 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 15 | 1300 | - | 19500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 46820 | 74912 |
| - | - | - | - | - | - | - | - | De 83x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | 0.12 | 200000 | - | 24000 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.12 | 27000 | - | 3240 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.12 | 36000 | - | 4320 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 24 | 10 | - | 240 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.15 | 5200 | - | 780 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 15 | 1300 | - | 19500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 52080 | 83328 |
| - | - | - | - | - | - | - | - | De 93x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | 0.125 | 200000 | - | 25000 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.125 | 27000 | - | 3375 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.125 | 36000 | - | 4500 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 24 | 10 | - | 240 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.15 | 5200 | - | 780 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 15 | 1300 | - | 19500 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 53395 | 85432 |
| - | - | - | - | - | - | - | - | Fabrication de portes pleines en bois dur, petits | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | panneaux à plates bandes ou pointes de diamants | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | De 73x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | 0.105 | 200000 | - | 21000 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.105 | 27000 | - | 2835 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.105 | 46000 | - | 4830 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 24 | 10 | - | 240 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.15 | 5200 | - | 780 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 18 | 1300 | - | 23400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 53085 | 84936 |
| - | - | - | - | - | - | - | - | De 83x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | 0.12 | 200000 | - | 24000 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.12 | 27000 | - | 3240 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.12 | 46000 | - | 5520 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 24 | 10 | - | 240 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.15 | 5200 | - | 780 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 18 | 1300 | - | 23400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 57180 | 91488 |
| - | - | - | - | - | - | - | - | De 93x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | 0.135 | 200000 | - | 27000 | - | - |
| - | - | - | - | - | - | - | - | Rabotage | 0.135 | 27000 | - | 3645 | - | - |
| - | - | - | - | - | - | - | - | Toupie | 0.135 | 46000 | - | 6210 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 24 | 10 | - | 240 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.15 | 5200 | - | 780 | - | - |
| - | - | - | - | - | - | - | - | Assemblage | 18 | 1300 | - | 23400 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 61275 | 98040 |
| - | - | - | - | - | - | - | - | Fabrication de cadres de portes en bois | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | dur,de 7x7 pour portes à la Française | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadres de 73x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Cadres de 83x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Cadres de 93x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Cadres de 146x204 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fabrication de cadres de menuiserie en bois dur, de 7x7 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | avec pièces d'appuis pour fenêtres à la Française | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | De 140x130 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | De 120x130 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | De 140x100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | De 120x100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | De 70x80 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Padouk | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fabrication de menuiseries ouvrant à la Française, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | avec seuils ou pièces d'appuis, à petits carreaux | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Portes de 73x215 avec seuil | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Portes de 83x215 avec seuil | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Portes de 93x215 avec seuil | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fenêtre de 140x130 avec pièce d'appuis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fenêtre de 120x130 avec pièce d'appuis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fenêtre de 140x100 avec pièce d'appuis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fenêtre de 120x100 avec pièce d'appuis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fenêtre de 70x80 avec pièce d'appuis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fabrication de volets extérieurs, en bois | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | dur, à lames sur barres et écharpes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 73x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 83x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 93x215 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 140x130 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 120x130 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 140x100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 120x100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Volets de 70x80 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fabrication de portes à persinnes, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en bois dur, pour placards | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Portes de 60x60 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Persiennes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Portes de 60x190 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Izombé | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabotage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Toupie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Persiennes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Assemblage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fabrication de coffres à rideaux, | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 avec placage Sapelli | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffre de 2 mètre | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Sader | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Agoplac | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Coffre de 3 mètre | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Sader | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Agoplac | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Coffre de 4 mètre | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Sader | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Agoplac | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Coffre de 5 mètre | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Sader | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Agoplac | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | - | - |
| - | - | - | - | - | - | - | - | Fabrication de meuble pour évier, en CP de 15 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | revêtu de formica, compris quincaillerie | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Meuble pour évier inox de 120 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois dur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabottage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Mortaisage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Formica | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coolles Sader | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Agoplac | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Meuble pour évier inox de 100 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bois dur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Rabottage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Mortaisage | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Formica | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coolles Sader | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle Agoplac | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O. | - | - | - | - | - | - |

---

## 10 — Pose de Menuiserie Extérieures

*Lignes : 287 | Colonnes : 16*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 | Col16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | Menuiseries | - | - | - | - | - | Fourniture,pose et scellement de cadres de chassis | chassis | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | naco, en bois dur, de 140x2x8 lames | - | - | - | - | - | - | - |
| - | - | Cadres en bois dur pour murs de 18 pour portes | - | - | - | - | - | Cadre | 1 | 29860 | - | 29860 | - | - | - |
| G. | 16 | De 73x215 | U | 25400 | - | Menuisrrie | 38608 | Chassis  8 L. | 2 | 6430 | - | 12860 | - | - | - |
| G. | 17 | De 83x215 | U | 25795 | - | Menuisrrie | 39208.4 | Vis | 24 | 30 | - | 720 | - | - | - |
| G. | 18 | De 93x215 | U | 26192 | - | Menuisrrie | 39811.84 | M.O | 2 | 1100 | - | 2200 | - | - | - |
| G. | 19 | De 146x215 | U | 29462 | - | Menuisrrie | 44782.24 | - | - | - | U | - | 45640 | 73024 | - |
| - | - | Pour fenêtres naco | - | - | - | - | - | Fourniture,pose et scellement de cadres de  chassis | chassis | - | - | - | - | - | - |
| G. | 21 | De 140x2x8  lames | U | 29860 | - | Menuiserie | - | naco, en bois dur, de 120x2x8 lames | - | - | - | - | - | - | - |
| G. | 22 | De 120x2x8  lames | U | 28670 | - | Menuiserie | - | Cadre | 1 | 28670 | - | 28670 | - | - | - |
| G. | 23 | De 140x2x5  lames | U | 26290 | - | Menuiserie | - | Chassis  8 L. | 2 | 6430 | - | 12860 | - | - | - |
| G. | 24 | De 120x2x5  lames | U | 24700 | - | Menuiserie | - | Vis | 20 | 30 | - | 600 | - | - | - |
| G. | 25 | De 70x5  lames | U | 16573 | - | Menuiserie | - | M.O | 2 | 1100 | - | 2200 | - | - | - |
| G. | 26 | Cadres de climatiseurs | U | 14500 | - | Menuiserie | - | - | - | - | U | - | 44330 | 70928 | - |
| - | - | Pour pleines en bois dur, à grands panneaux | - | - | - | - | - | Fourniture et pose de cadres de  chassis | chassis | - | - | - | - | - | - |
| G. | 28 | De 73x215 | U | 74912 | - | Menuisrrie | - | naco, en bois dur, de 140x2x5 lames | - | - | - | - | - | - | - |
| G. | 29 | De 83x215 | U | 83328 | - | Menuisrrie | - | Cadre | 1 | 26290 | - | 26290 | - | - | - |
| G. | 30 | De 93x215 | U | 85432 | - | Menuisrrie | - | Chassis  5 L. | 2 | 3980 | - | 7960 | - | - | - |
| G. | 31 | De 146x215 | U | 149824 | - | Menuisrrie | - | Vis | 24 | 30 | - | 720 | - | - | - |
| - | - | Portes pleines en bois dur,à petits panneaux | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - |
| G. | 33 | De 73x215 | U | 84940 | - | Menuisrrie | - | - | - | - | U | - | 37170 | 59472 | - |
| G. | 34 | De 83x215 | U | 91490 | - | Menuisrrie | - | Fourniture et pose de cadres de  chassis | chassis | - | - | - | - | - | - |
| G. | 35 | De 93x215 | U | 98040 | - | Menuisrrie | - | naco, en bois dur, de 120x2x5 lames | - | - | - | - | - | - | - |
| G. | 36 | De 146x215 | U | 169880 | - | Menuisrrie | - | Cadre | 1 | 24700 | - | 24700 | - | - | - |
| - | - | Cadres en bois dur, de 7x7 avec feuillure à l'intérieur | - | - | - | - | - | Chassis  5 L. | 2 | 3980 | - | 7960 | - | - | - |
| - | - | pour portes | - | - | - | - | - | Vis | 24 | 30 | - | 720 | - | - | - |
| G. | 39 | De 73x215 | U | 21865 | - | Menuisrrie | - | M.O | 2 | 1100 | - | 2200 | - | - | - |
| G. | 40 | De 83x215 | U | 22262 | - | Menuisrrie | - | - | - | - | U | - | 35580 | 56928 | - |
| G. | 41 | De 93x215 | U | 22660 | - | Menuisrrie | - | Fourniture et pose de cadres de  chassis | chassis | - | - | - | - | - | - |
| G. | 42 | De 146x215 | U | 24662 | - | Menuisrrie | - | naco, en bois dur, de 70x5 lames | - | - | - | - | - | - | - |
| - | - | Pour fenêtres avec pièces d'appuis | - | - | - | - | - | Cadre | 1 | 16573 | - | 16573 | - | - | - |
| G. | 44 | De 140x130 | U | 32290 | - | Menuisrrie | - | Chassis  5 L. | 1 | 3980 | - | 3980 | - | - | - |
| G. | 45 | De 120x130 | U | 28670 | - | Menuisrrie | - | Vis | 12 | 30 | - | 360 | - | - | - |
| G. | 46 | De 140x100 | U | 29085 | - | Menuisrrie | - | M.O | 1 | 1100 | - | 1100 | - | - | - |
| G. | 47 | De 120x100 | U | 27500 | - | Menuisrrie | - | - | - | - | U | - | 22013 | 35220.8 | - |
| G. | 48 | De 70x80 | U | 17220 | - | Menuisrrie | - | Fourniture et pose de portes pleines en bois dur, à | - | - | - | - | - | - | - |
| - | - | Menuiseries en bois dur, ouvrant à la française, | - | - | - | - | - | Grands panneaux, de 73x215, compris cadres | - | - | - | - | - | - | - |
| - | - | à petits carreaux portes-fenêtres | - | - | - | - | - | Cadre | 1 | 25400 | - | 25400 | - | - | - |
| G. | 51 | De 73x215 | U | 60700 | - | Menuisrrie | - | Porte | 1 | 74912 | - | 74912 | - | - | - |
| G. | 52 | De 83x215 | U | 63010 | - | Menuisrrie | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| G. | 53 | De 93x215 | U | 65320 | - | Menuisrrie | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | Fenêtres avec pièces d'appuis | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| G. | 55 | De 140x130 | U | 89010 | - | Menuisrrie | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| G. | 56 | De 120x130 | U | 77910 | - | Menuisrrie | - | - | - | - | U | - | 125487 | 200779.2 | - |
| G. | 57 | De 140x100 | U | 71460 | - | Menuisrrie | - | - | - | - | - | - | - | - | - |
| G. | 58 | De 120x100 | U | 62900 | - | Menuisrrie | - | Fourniture et pose de portes pleines en bois dur, à | - | - | - | - | - | - | - |
| G. | 59 | De 70x80 | U | 30290 | - | Menuisrrie | - | Grands panneaux, de 83x215, compris cadres | - | - | - | - | - | - | - |
| - | - | Volets extérieurs en bois dur, à lames sur barres | - | - | - | - | - | Cadre | 1 | 25795 | - | 25795 | - | - | - |
| - | - | et écharpes pour portes-fenêtres | - | - | - | - | - | Porte | 1 | 83328 | - | 83328 | - | - | - |
| G. | 62 | De 73x215 | U | 66430 | - | Menuisrrie | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| G. | 63 | De 83x215 | U | 73370 | - | Menuisrrie | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| G. | 64 | De 93x215 | U | 82500 | - | Menuisrrie | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | Pour fenêtres | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| G. | 66 | De 140x130 | U | 81150 | - | Menuisrrie | - | - | - | - | U | - | 134298 | 214876.8 | - |
| G. | 67 | De 120x130 | U | 71490 | - | Menuisrrie | - | Fourniture et pose de portes pleines en bois dur, | - | - | - | - | - | - | - |
| G. | 68 | De 140x100 | U | 66590 | - | Menuisrrie | - | Grands panneaux, de 93x215, compris cadres | - | - | - | - | - | - | - |
| G. | 69 | De 120x100 | U | 57030 | - | Menuisrrie | - | Cadre | 1 | 26192 | - | 26192 | - | - | - |
| G. | 70 | De 70x80 | U | 31170 | - | Menuisrrie | - | Porte | 1 | 85432 | - | 85432 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | sans cadre |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 136799 | 218878.4 | 176971.2 |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes pleines en bois dur, à | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Grands panneaux, de 146x215, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 29462 | - | 29462 | - | - | - |
| - | - | Quincaillerie | - | - | - | - | - | Porte | 1 | 149824 | - | 149824 | - | - | - |
| G. | 80 | Paumelles de 140 | U | 765 | - | Tecnobat | 772222 | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| G. | 81 | Serrures à canon | U | 16470 | - | Tecnobat | 772222 | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| G. | 82 | Verrous encastrés | U | 1340 | - | Tecnobat | 772222 | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| G. | 83 | Crémones de portes | U | 13790 | - | Tecnobat | 772222 | M.O. pose | 9 | 1100 | - | 9900 | - | - | sans cadre |
| G. | 84 | Crémones de fenêtres | U | 11285 | - | Tecnobat | 772222 | - | - | - | U | - | 210991 | 337585.6 | 290446.4 |
| G. | 85 | Espagnolettes | U | 7535 | - | Tecnobat | 772222 | Fourniture et pose de portes pleines en bois dur, à | - | - | - | - | - | - | - |
| G. | 86 | Targettes | U | 8535 | - | Tecnobat | 772222 | Petits panneaux, de 73x215, compris cadres | - | - | - | - | - | - | - |
| G. | 87 | Pentures et gonds | U | 5090 | - | Tecnobat | 772222 | Cadre | 1 | 25400 | - | 25400 | - | - | - |
| G. | 88 | Arrêts de volets | U | 2400 | - | Tecnobat | 772222 | Porte | 1 | 84940 | - | 84940 | - | - | - |
| G. | 89 | Vis de 4x25 | U | 15 | - | Tecnobat | 772222 | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| G. | 90 | Chassis naco 3  lames | U | 3100 | - | Tecnobat | 772222 | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| G. | 91 | Chassis naco 5  lames | U | 3980 | - | Tecnobat | 772222 | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| G. | 92 | Chassis naco 6  lames | U | 4620 | - | Tecnobat | 772222 | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| G. | 93 | Chassis naco 8  lames | U | 6430 | - | Tecnobat | 772222 | - | - | - | U | - | 135515 | 216824 | - |
| G. | 94 | Vis pour chassis naco | U | 30 | - | Tecnobat | 772222 | Fourniture et pose de portes pleines en bois dur, à | - | - | - | - | - | - | - |
| G. | 95 | boulons à bois de 8x80 | U | 120 | - | Tecnobat | 772222 | Petits panneaux, de 83x215, compris cadres | - | - | - | - | - | - | - |
| G. | 96 | Rondelles de 8 | U | 30 | - | Tecnobat | 772222 | Cadre | 1 | 25795 | - | 25795 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 91490 | - | 91490 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | - | - | - | U | - | 142460 | 227936 | - |
| G. | 104 | Menuiserie poseur | h | 1400 | - | - | - | - | - | - | - | - | - | - | - |
| G. | 105 | Manœuvre | h | 800 | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 107 | Taux horaire moyen | h | 1100 | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes pleines en bois dur, à | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Petits panneaux, de 93x215, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 26192 | - | 26192 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 98040 | - | 98040 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 149407 | 239051.2 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes pleines en bois dur, à | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Petits panneaux, de 146x215, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 29462 | - | 29462 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 169880 | - | 169880 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | Vérous encastrés | 3 | 1340 | - | 2680 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 9 | 1100 | - | 9900 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 231047 | 369675.2 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | MENUISERIE A LA FRANCAISE | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes-Fenêtres à la Française | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en bois dur, de 73x215 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 21865 | - | 21865 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 60700 | - | 60700 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 107740 | 172384 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes-Fenêtres à la Française | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en bois dur, de 83x215, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 22262 | - | 22262 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 63010 | - | 63010 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 110447 | 176715.2 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes-Fenêtres à la Française | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en bois dur, de 93x215, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 22660 | - | 22660 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 65320 | - | 65320 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 24 | 15 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 113155 | 181048 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes-Fenêtres à la Française | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en bois dur, de 146x215, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 24662 | - | 24662 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 2 | 60700 | - | 121400 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 13790 | - | 13790 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 765 | - | 2295 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 42 | 15 | - | 630 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 9 | 1100 | - | 9900 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 174972 | 279955.2 | 240496 |
| - | - | - | - | - | - | - | - | Fourniture et pose de Fenêtres à la Française, en bois dur, avec pièces d'appuis | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 140x130, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 32290 | - | 32290 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 2 | 89010 | - | 89010 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 11285 | - | 11285 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 4 | 765 | - | 3060 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 30 | 15 | - | 450 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 8 | 1100 | - | 8800 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 144895 | 231832 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de Fenêtres à la Française avec pièces d'appuis | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 120x130, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 28670 | - | 28670 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 77910 | - | 77910 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 11285 | - | 11285 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 4 | 765 | - | 3060 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 30 | 15 | - | 450 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 8 | 1100 | - | 8800 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 130175 | 208280 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de Fenêtres à la Française, en bois dur, avec pièces d'appuis | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 120x100, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 27500 | - | 27500 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 62900 | - | 62900 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 11285 | - | 11285 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 4 | 765 | - | 3060 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 30 | 15 | - | 450 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 8 | 1100 | - | 8800 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 113995 | 182392 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de Fenêtres à la Française, en bois dur, avec pièces d'appuis | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 70x80, compris cadres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 17220 | - | 17220 | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 1 | 30290 | - | 30290 | - | - | - |
| - | - | - | - | - | - | - | - | Ser. À Canon | 1 | 8535 | - | 8535 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 2 | 765 | - | 1530 | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 18 | 15 | - | 270 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 4 | 1100 | - | 4400 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 62245 | 99592 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 73x215, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 1 | 66430 | - | 66430 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 3 | 5090 | - | 15270 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 80x80 | 18 | 120 | - | 2160 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 18 | 30 | - | 540 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 106920 | 171072 | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 83x215, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 1 | 73370 | - | 73370 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 3 | 5090 | - | 15270 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 80x80 | 18 | 120 | - | 2160 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 18 | 30 | - | 540 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 113860 | 182176 | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 93x215, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 1 | 82500 | - | 82500 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 3 | 5090 | - | 15270 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 80x80 | 18 | 120 | - | 2160 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 18 | 30 | - | 540 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 16470 | - | 16470 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 122990 | 196784 | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 146x215, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 2 | 66430 | - | 132860 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 6 | 5090 | - | 30540 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 80x80 | 36 | 120 | - | 4320 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 36 | 30 | - | 1080 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 7535 | - | 7535 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 182385 | 291816 | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 140x130, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 2 | 81150 | - | 81150 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 4 | 5090 | - | 20360 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 80x80 | 24 | 120 | - | 2880 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 24 | 30 | - | 720 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 7535 | - | 7535 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 8 | 1100 | - | 8800 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 121445 | 194312 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 120x130, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 1 | 71490 | - | 71490 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 4 | 5090 | - | 20360 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 80x80 | 24 | 120 | - | 2880 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 24 | 30 | - | 720 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 7535 | - | 7535 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 109035 | 174456 | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 140x100, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 1 | 66590 | - | 66590 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 4 | 5090 | - | 20360 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 80x80 | 24 | 120 | - | 2880 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 24 | 30 | - | 720 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 7535 | - | 7535 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 8 | 1100 | - | 8800 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 106885 | 171016 | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 120x100, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 1 | 57030 | - | 57030 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 4 | 5090 | - | 20360 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 8x80 | 24 | 120 | - | 2880 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 24 | 30 | - | 720 | - | - | - |
| - | - | - | - | - | - | - | - | Espagnolette | 1 | 7535 | - | 7535 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 5.5 | 1100 | - | 6050 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 94575 | 151320 | - |
| - | - | - | - | - | - | - | - | Volets extérieurs, en bois dur, à lames sur barres et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | écharpes, de 70x80, compris quincaillerie | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Volets | 1 | 31170 | - | 31170 | - | - | - |
| - | - | - | - | - | - | - | - | Penture de gonds | 2 | 5090 | - | 10180 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 8x80 | 12 | 120 | - | 1440 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 8 | 12 | 30 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | Espagnolette | 1 | 8535 | - | 8535 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 4 | 1100 | - | 4400 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 56085 | 89736 | - |
| - | - | - | - | - | - | - | - | Fourniture pose et scellement d'arrêt de volets | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Arrêts | 1 | 2400 | - | 2400 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 1.5 | 1100 | - | 1650 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 4050 | 6480 | - |

---

## 11 — Pose de Menuiserie Intérieurs

*Lignes : 306 | Colonnes : 17*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 | Col16 | Col17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| - | - | Cadres de portes en bois dur, pour mur | - | - | - | - | - | de 63x204, compris cadres de 18 | - | - | - | - | - | - | - | - |
| - | - | de 18 d'épaisseur | - | - | - | - | - | Cadre | 1 | 24208 | - | 24208 | - | - | - | - |
| G. | 15 | De 63x204 | U | 24208 | - | Menuiseries | - | Porte | 1 | 25370 | - | 25370 | - | - | - | - |
| G. | 16 | De 73x204 | U | 24605 | - | Menuiseries | - | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 17 | De 83x204 | U | 25000 | - | Menuiseries | - | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| G. | 18 | De 93x204 | U | 25400 | - | Menuiseries | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 19 | De 146x204 | U | 29065 | - | Menuiseries | - | - | - | - | U | - | 55688 | 89100.8 | - | - |
| - | - | Cadres de portes en bois dur, pour mur | - | - | - | - | - | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| - | - | de 18 d'épaisseur | - | - | - | - | - | de 73x204, compris cadres de 18 | - | - | - | - | - | - | - | - |
| G. | 22 | De 63x204 | U | 20240 | - | Menuiseries | - | Cadre | 1 | 24605 | - | 24605 | - | - | - | - |
| G. | 23 | De 73x204 | U | 20636 | - | Menuiseries | - | Porte | 1 | 27140 | - | 27140 | - | - | - | - |
| G. | 24 | De 83x204 | U | 21034 | - | Menuiseries | - | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 25 | De 93x204 | U | 21430 | - | Menuiseries | - | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| G. | 26 | De 146x204 | U | 22704 | - | Menuiseries | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| - | - | Cadres de placards en bois dur de 7x7, | - | - | - | - | - | - | - | - | U | - | 57855 | 92568 | - | - |
| - | - | avec traverses intermediaires | - | - | - | - | - | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| G. | 29 | De 60x255 | U | 15040 | - | Menuiseries | - | de 83x204, compris cadres de 18 | - | - | - | - | - | - | - | - |
| G. | 30 | De 120x255 | U | 24530 | - | Menuiseries | - | Cadre | 1 | 25000 | - | 25000 | - | - | - | - |
| G. | 31 | De 180x255 | U | 34100 | - | Menuiseries | - | Porte | 1 | 28910 | - | 28910 | - | - | - | - |
| G. | 32 | De 240x255 | U | 43500 | - | Menuiseries | - | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 33 | De 120x60 sous évier | U | 8500 | - | Menuiseries | - | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| - | - | Portes isoplanes | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 35 | De 63x204 | U | 25370 | - | Soga-imp | 740994 | - | - | - | U | - | 60020 | 96032 | - | - |
| G. | 36 | De 73x204 | U | 27140 | - | Soga-imp | 740994 | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| G. | 37 | De 83x204 | U | 28910 | - | Soga-imp | 740994 | de 93x204, compris cadres de 18 | - | - | - | - | - | - | - | - |
| G. | 38 | De 93x204 | U | 32450 | - | Soga-imp | 740994 | Cadre | 1 | 25000 | - | 25000 | - | - | - | - |
| - | - | Portes intérieures, en bois dur, à | - | - | - | - | - | Porte | 1 | 32450 | - | 32450 | - | - | - | - |
| - | - | petit carreaux | - | - | - | - | - | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 41 | De 73x204 | U | 57000 | - | Soga-imp | 740994 | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| G. | 42 | De 83x204 | U | 59310 | - | Soga-imp | 740994 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 43 | De 93x204 | U | 61620 | - | Soga-imp | 740994 | - | - | - | U | - | 63560 | 101696 | 71660 | 85992 |
| - | - | Portes à persiennes, en bois dur, | - | - | - | - | - | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| - | - | pour placards | - | - | - | - | - | de 146x204, compris cadres de 18 | - | - | - | - | - | - | - | - |
| G. | 46 | De 60x60 | U | 31680 | - | Menuiseries | - | Cadre | 1 | 25400 | - | 25400 | - | - | - | - |
| G. | 47 | De 60x190 | U | 77610 | - | Menuiseries | - | Porte | 2 | 27140 | - | 54280 | - | - | - | - |
| - | - | Meubles d'évier en CP de 15 m/m, | - | - | - | - | - | Paumelles | 4 | 765 | - | 3060 | - | - | - | - |
| - | - | - | - | - | - | - | - | Verrous encastré | 2 | 1340 | - | 2680 | - | - | - | - |
| - | - | avec placage en formica | - | - | - | - | - | Vis de 4x25 | 30 | 15 | - | 450 | - | - | - | - |
| G. | 50 | Pour évier 1 bac | U | 127895 | - | Menuiseries | - | M.O | 8 | 1100 | - | 8800 | - | - | - | - |
| G. | 51 | Pour évier 2 bacs | U | 118810 | - | Menuiseries | - | - | - | - | U | - | 94670 | 151472 | - | - |
| - | - | Meubles pour vasques, en CP de 15 m/m, | - | - | - | - | - | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| - | - | avec placage en formica | - | - | - | - | - | de 63x204, compris cadres de 13 | - | - | - | - | - | - | - | - |
| G. | 54 | Pour une vasque | U | 253000 | - | Menuiseries | - | Cadre | 1 | 20240 | - | 20240 | - | - | - | - |
| G. | 55 | Pour deux vasques | U | 324000 | - | Menuiseries | - | Porte | 1 | 25370 | - | 25370 | - | - | - | - |
| G. | 56 | CP de 5 m/m, 122x250 | U | 2850 | - | Abido | 710447 | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 57 | CP de 8 m/m, 122x250 | U | 4500 | - | Abido | 710447 | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| G. | 58 | CP de 10 m/m, 122x250 | U | 5650 | - | Abido | 710447 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 59 | CP de 15 m/m, 122x250 | U | 7000 | - | Abido | 710447 | - | - | - | U | - | 51720 | 82752 | - | - |
| G. | 60 | CP de 19 m/m, 122x250 | U | 8670 | - | Abido | 710447 | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| G. | 61 | CP ébenisterie de 5 m/m, placage | - | - | - | - | - | de 73x204, compris cadres de 13 | - | - | - | - | - | - | - | - |
| G. | 62 | 1 face, de 122x250 | m² | 10950 | - | Soga-imp | 740994 | Cadre | 1 | 20636 | - | 20636 | - | - | - | - |
| G. | 63 | CP ébenisterie de 5 m/m, placage | - | - | - | - | - | Porte | 1 | 27140 | - | 25370 | - | - | - | - |
| G. | 64 | 2 faces, de 122x250 | m² | 27200 | - | Soga-imp | 740994 | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 65 | Colle SADER | kg | 4970 | - | Soga-imp | 740994 | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| G. | 66 | Colle AGOPLAC | kg | 3500 | - | Soga-imp | 740994 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 67 | Couvre-joints | ml | 450 | - | Menuiseries | - | - | - | - | U | - | 53886 | 86217.6 | - | - |
| G. | 68 | Liteaux 1/4 de rond | ml | 550 | - | Menuiseries | - | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| G. | 69 | Liteaux de 15x15 | ml | 450 | - | Menuiseries | - | de 83x204, compris cadres de 13 | - | - | - | - | - | - | - | - |
| G. | 70 | Liteaux de 20x20 | ml | 480 | - | Menuiseries | - | Cadre | 1 | 21034 | - | 21034 | - | - | - | - |
| G. | 71 | Plinthes bois de 11 | ml | 1800 | - | Menuiseries | - | Porte | 1 | 28910 | - | 28910 | - | - | - | - |
| G. | 72 | Baguettes d'angles | ml | 1320 | - | Menuiseries | - | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 73 | Formica brillant  7/10 | m² | 4400 | - | Soga-imp | 740994 | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| G. | 74 | Formica brillant  9/10 | m² | 5870 | - | Soga-imp | 740994 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 75 | Formica brillant  11/10 | m² | 9360 | - | Soga-imp | 740994 | - | - | - | U | - | 56054 | 89686.4 | - | - |
| G. | 76 | Formica mat  9/10 | m² | 10700 | - | Soga-imp | 740994 | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| G. | 77 | Placage de chants | m² | 1900 | - | Abido | 710447 | de 93x204, compris cadres de 13 | - | - | - | - | - | - | - | - |
| G. | 78 | Coffres à rideaux 200 | ml | 27100 | - | Menuiseries | - | Cadre | 1 | 21430 | - | 21430 | - | - | - | - |
| G. | 79 | Coffres à rideaux 300 | ml | 40800 | - | Menuiseries | - | Porte | 1 | 32450 | - | 32450 | - | - | - | - |
| G. | 80 | Coffres à rideaux 400 | ml | 51750 | - | Menuiseries | - | Paumelles | 2 | 765 | - | 1530 | - | - | - | - |
| G. | 81 | Coffres à rideaux 500 | ml | 64200 | - | Menuiseries | - | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - | - | 71660 |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 59990 | 95984 | 85992 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de portes isoplanes, | - | - | - | - | - | - | - | - |
| - | - | Quincallerie | - | - | - | - | - | de 146x204, compris cadres de 13 | - | - | - | - | - | - | - | - |
| G. | 86 | Paumelles de 140 | U | 765 | - | Tecnobat | 772222 | Cadre | 1 | 22704 | - | 22704 | - | - | - | - |
| G. | 87 | Paumelles de 110 | U | 600 | - | Tecnobat | 772222 | Porte | 2 | 27140 | - | 54280 | - | - | - | - |
| G. | 88 | Paumelles à encastrer | U | 1270 | - | Tecnobat | 772222 | Paumelles | 4 | 765 | - | 3060 | - | - | - | - |
| - | - | - | - | - | - | - | - | Verrous encastré | 2 | 1340 | - | 2680 | - | - | - | - |
| G. | 89 | Paumelles universelles | U | 1150 | - | Tecnobat | 772222 | Vis de 4x25 | 30 | 15 | - | 450 | - | - | - | - |
| G. | 90 | Serrure à canon | U | 16470 | - | Tecnobat | 772222 | M.O | 8 | 1100 | - | 8800 | - | - | - | - |
| G. | 91 | Serrure à condamnation | U | 11500 | - | Tecnobat | 772222 | - | - | - | U | - | 91974 | 147158.4 | - | - |
| G. | 92 | Serrures 1/2 tour | U | 7540 | - | Tecnobat | 772222 | Fourniture et pose de portes intérieures, | - | - | - | - | - | - | - | - |
| G. | 93 | Serrure de placards | U | 2730 | - | Tecnobat | 772222 | en bois dur, àpetits carreaux, de 73x204 | - | - | - | - | - | - | - | - |
| G. | 94 | Verrous  G M 2 entrées | U | 40680 | - | Tecnobat | 772222 | Cadre | 1 | 24605 | - | 24605 | - | - | - | - |
| G. | 95 | Verrous  P M 1 entrée | U | 7750 | - | Tecnobat | 772222 | Porte | 1 | 57000 | - | 57000 | - | - | - | - |
| G. | 96 | Verrous bayonette | U | 1980 | - | Tecnobat | 772222 | Paumelles | 3 | 765 | - | 2295 | - | - | - | - |
| G. | 97 | Verrous de box | U | 2130 | - | Tecnobat | 772222 | Vis de 4x25 | 18 | 15 | - | 270 | - | - | - | - |
| G. | 98 | Verrous à encastrer | U | 1340 | - | Tecnobat | 772222 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 99 | Targettes cromées | U | 8540 | - | Tecnobat | 772222 | - | - | - | U | - | 88570 | 141712 | - | - |
| G. | 100 | Loqueteaux magnétiques | U | 1300 | - | Tecnobat | 772222 | Fourniture et pose de portes intérieures, | - | - | - | - | - | - | - | - |
| G. | 101 | Poignées de placards | U | 1150 | - | Tecnobat | 772222 | en bois dur, àpetits carreaux, de 83x204 | - | - | - | - | - | - | - | - |
| G. | 102 | Vis T F de 4x25 | U | 15 | - | Tecnobat | 772222 | Cadre | 1 | 25000 | - | 25000 | - | - | - | - |
| G. | 103 | Vis T F de 3x20 | U | 10 | - | Tecnobat | 772222 | Porte | 1 | 59310 | - | 59310 | - | - | - | - |
| G. | 104 | Vis T F de 4x40 | U | 20 | - | Tecnobat | 772222 | Paumelles | 3 | 765 | - | 2295 | - | - | - | - |
| G. | 105 | Tringles à rideaux de 200 | U | 17900 | - | CK 2 | 743358 | Vis de 4x25 | 18 | 15 | - | 270 | - | - | - | - |
| G. | 106 | Tringles à rideaux de 250 | U | 21900 | - | CK 2 | 743358 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 107 | Tringles à rideaux de 300 | U | 25900 | - | CK 2 | 743358 | - | - | - | U | - | 91275 | 146040 | - | - |
| G. | 108 | Suspentes doubles | U | 2300 | - | CK 2 | 743358 | Fourniture et pose de portes intérieures, | - | - | - | - | - | - | - | - |
| G. | 109 | Equerres de fixations | U | 600 | - | CK 2 | 743358 | en bois dur, àpetits carreaux, de 93x204 | - | - | - | - | - | - | - | - |
| G. | 110 | Tringles de penderies | ml | 1900 | - | CK 2 | 743358 | Cadre | 1 | 25400 | - | 25400 | - | - | - | - |
| G. | 111 | Fixations | U | 1300 | - | CK 2 | 743358 | Porte | 1 | 61620 | - | 61620 | - | - | - | - |
| G. | 112 | Pointes tetês plates | kg | 1000 | - | Abido | 710447 | Paumelles | 3 | 765 | - | 2295 | - | - | - | - |
| G. | 113 | Pointes TOC | kg | 4500 | - | Abido | 710447 | Vis de 4x25 | 18 | 15 | - | 270 | - | - | - | - |
| G. | 114 | Chevilles de 8 | U | 20 | - | CK 2 | 743358 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 93985 | 150376 | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | Fourniture et pose de portes intérieures, | - | - | - | - | - | - | - | - |
| G. | 117 | Menuisier poseur | h | 1400 | - | - | - | en bois dur, àpetits carreaux, de 146x204 | - | - | - | - | - | - | - | - |
| G. | 118 | Manœuvre | h | 800 | - | - | - | Cadre | 1 | 29065 | - | 29065 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte | 2 | 57000 | - | 114000 | - | - | - | - |
| G. | 120 | Taux horaire moyen | h | 1100 | - | - | - | Paumelles | 6 | 765 | - | 4590 | - | - | - | - |
| - | - | - | - | - | - | - | - | Verrous encastré | 2 | 1340 | - | 2680 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 42 | 15 | - | 630 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 8 | 1100 | - | 8800 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 159765 | 255624 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, en CP de 15 m/m, avec placages | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | des chants, de 60x255, en 2 parties, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 15040 | - | 15040 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | 1.5 | 7000 | - | 10500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | 0.2 | 1900 | - | 380 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.01 | 3500 | - | 35 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 5 | 1270 | - | 6350 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 20 | 15 | - | 300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 2 | 1150 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 34905 | 55848 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, en CP de 15 m/m, avec placages | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | des chants, de 120x255, en 2 parties, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 24530 | - | 24530 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | 3 | 7000 | - | 21000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | 0.4 | 1900 | - | 760 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.02 | 3500 | - | 70 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 10 | 1270 | - | 12700 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 40 | 15 | - | 600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 4 | 1150 | - | 4600 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 6 | 1100 | - | 6600 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 64260 | 102816 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, en CP de 15 m/m, avec placages | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | des chants, de 180x255, en 2 parties, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 34100 | - | 34100 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | 4.5 | 7000 | - | 31500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | 0.3 | 1900 | - | 570 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.06 | 3500 | - | 210 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 15 | 1270 | - | 19050 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 60 | 15 | - | 900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 6 | 1150 | - | 6900 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 9 | 1100 | - | 9900 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 93230 | 149168 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, en CP de 15 m/m, avec placages | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | des chants, de 240x255, en 2 parties, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 43500 | - | 34100 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | 6 | 15 | - | 90 | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.08 | 600 | - | 48 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 20 | 1270 | - | 25400 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 80 | 15 | - | 1200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 8 | 1150 | - | 9200 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 12 | 1100 | - | 13200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 79878 | 127804.8 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, en CP de 15 m/m, avec placages | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | des chants, de 120x60, sous evier, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 8500 | - | 8500 | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 15 | 1.5 | 7000 | - | 10500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | 0.2 | 1900 | - | 380 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.01 | 3500 | - | 35 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 4 | 1270 | - | 5080 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 16 | 15 | - | 240 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 2 | 1150 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 27035 | 43256 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, avec portes persiennées en 2 parties | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 60x255, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 15040 | - | 15040 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 60 | 1 | 31680 | - | 31680 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 190 | 1 | 77610 | - | 77610 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 5 | 1270 | - | 6350 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 20 | 15 | - | 300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 2 | 1150 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 136580 | 218528 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, avec portes persiennées en 2 parties | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 120x255, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 24530 | - | 24530 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 60 | 2 | 31680 | - | 63360 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 190 | 2 | 77610 | - | 155220 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 10 | 1270 | - | 12700 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 40 | 15 | - | 600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 4 | 1150 | - | 4600 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 6 | 1100 | - | 6600 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 267610 | 428176 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, avec portes persiennées en 2 parties | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 180x255, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 34100 | - | 34100 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 60 | 3 | 31680 | - | 95040 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 190 | 3 | 77610 | - | 232830 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 15 | 1270 | - | 19050 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 60 | 15 | - | 900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 6 | 1150 | - | 6900 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 9 | 1100 | - | 9900 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 398720 | 637952 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, avec portes persiennées en 2 parties | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 240x255, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 43500 | - | 43500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 60 | 4 | 31680 | - | 126720 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 190 | 4 | 77610 | - | 310440 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 20 | 1270 | - | 25400 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 80 | 15 | - | 1200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 8 | 1150 | - | 9200 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 12 | 1100 | - | 13200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 529660 | 847456 | - | - |
| - | - | - | - | - | - | - | - | Façades de placards, avec portes persiennées en 2 parties | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 120x60,sous evier, compris cadres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cadre | 1 | 8500 | - | 8500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 60 | 2 | 31680 | - | 63360 | - | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 15 | 1270 | - | 19050 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 60 | 15 | - | 900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Poignées | 6 | 1150 | - | 6900 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 9 | 1100 | - | 9900 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 108610 | 173776 | - | - |
| - | - | - | - | - | - | - | - | Fournituer et pose de serrures à canon | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 16470 | - | 16470 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 6 | 15 | - | 90 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 17880 | 28608 | - | - |
| - | - | - | - | - | - | - | - | Fournituer et pose de serrures demi tour | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 7540 | - | 7540 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 6 | 15 | - | 90 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 8950 | 14320 | - | - |
| - | - | - | - | - | - | - | - | Fournituer et pose de serrures à condamnation | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 11500 | - | 11500 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 6 | 15 | - | 90 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 12910 | 20656 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de couvre-joints à bords ronds | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Couvre-joints | 1.1 | 450 | - | 495 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.02 | 1000 | - | 20 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 955 | 1528 | - | - |
| - | - | - | - | - | - | - | - | Founiture et pose de plinthes de 11 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Plinthes | 1.1 | 1800 | - | 1980 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes Toc | 0.03 | 4500 | - | 135 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.6 | 1100 | - | 660 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2775 | 4440 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de coffres à rideaux,en CP de 15 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | avec placage, double tringle type chemin de fer, compris | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | quincaillerie, coffre de 2 mètres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffre | 1 | 27100 | - | 27100 | - | - | - | - |
| - | - | - | - | - | - | - | - | Equerres | 2 | 600 | - | 1200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 8 | 15 | - | 120 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 8 | 20 | - | 160 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tringles | 2 | 17900 | - | 35800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Suspentes | 2 | 2300 | - | 4600 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 71730 | 114768 | - | - |
| - | - | - | - | - | - | - | - | Coffre de 3 mètres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffre | 1 | 40800 | - | 40800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Equerres | 2 | 600 | - | 1200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 8 | 15 | - | 120 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 8 | 20 | - | 160 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tringles | 2 | 25900 | - | 51800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Suspentes | 2 | 2300 | - | 4600 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 101980 | 163168 | - | - |
| - | - | - | - | - | - | - | - | Coffre de 4 mètres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffre | 1 | 51750 | - | 51750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Equerres | 3 | 600 | - | 1800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 12 | 20 | - | 240 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tringles | 4 | 17900 | - | 71600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Suspentes | 8 | 2300 | - | 18400 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 148370 | 237392 | - | - |
| - | - | - | - | - | - | - | - | Coffre de 5 mètres | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coffre | 1 | 64200 | - | 64200 | - | - | - | - |
| - | - | - | - | - | - | - | - | Equerres | 3 | 600 | - | 1800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis de 4x25 | 12 | 15 | - | 180 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 12 | 20 | - | 240 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tringles | 4 | 21900 | - | 87600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Suspentes | 12 | 2300 | - | 27600 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 186020 | 297632 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de tringles de penderie de 1.50 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tringle | 1.5 | 1900 | - | 2850 | - | - | - | - |
| - | - | - | - | - | - | - | - | Suspentes | 2 | 1300 | - | 2600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 4 | 15 | - | 60 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.1 | 1100 | - | 1210 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 6720 | 10752 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de tringles de penderie de 2.00 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tringle | 2 | 1900 | - | 3800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Suspentes | 3 | 1300 | - | 3900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 6 | 15 | - | 90 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 9110 | 14576 | - | - |
| - | - | - | - | - | - | - | - | Etagères de placards en CP de 19m/m avec placage | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | sur les chants | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CP de 19 | 1.1 | 8670 | - | 9537 | - | - | - | - |
| - | - | - | - | - | - | - | - | Liteaux de 15 | 3 | 450 | - | 1350 | - | - | - | - |
| - | - | - | - | - | - | - | - | Pointes Toc | 0.1 | 4500 | - | 450 | - | - | - | - |
| - | - | - | - | - | - | - | - | Placage | 0.2 | 1900 | - | 380 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.01 | 3500 | - | 35 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 13952 | 22323.2 | - | - |

---

## 12 — Plomberie

*Lignes : 223 | Colonnes : 18*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 | Col16 | Col17 | Col18 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | Fourniture et pose d'appareil sanitaire | - | - | - | - | - | - | - | - | - |
| - | - | Tuyaux galvanisés | - | - | - | - | - | Blanc, compris robinetterie, tout accessoirs de pose | - | - | - | - | - | - | - | - | - |
| G. | 14 | 12/17 | ml | 1030 | - | Bernabé | 743432 | Lave-mains | 1 | 19500 | - | 19500 | - | - | - | - | - |
| G. | 15 | 15/21 | ml | 1100 | - | Bernabé | 743432 | Console | 2 | 16640 | - | 33280 | - | - | - | - | - |
| G. | 16 | 20/27 | ml | 1380 | - | Bernabé | 743432 | Siphon | 1 | 1800 | - | 1800 | - | - | - | - | - |
| G. | 17 | 26/34 | ml | 2400 | - | Bernabé | 743432 | Vidage à bonde | 1 | 3500 | - | 3500 | - | - | - | - | - |
| G. | 18 | 33/42 | ml | 3200 | - | Bernabé | 743432 | Robinet EF | 1 | 7500 | - | 7500 | - | - | - | - | - |
| G. | 19 | 40/49 | ml | 3460 | - | Bernabé | 743432 | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 20 | 50/60 | ml | 4380 | - | Bernabé | 743432 | Tuyau de 32 | 0.3 | 650 | - | 195 | - | - | - | - | - |
| - | - | Coudes galvanisés | - | - | - | - | - | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 22 | 12/17 | U | 780 | - | Bernabé | 743432 | M.O | 9 | 1100 | - | 9900 | - | - | - | - | - |
| G. | 23 | 15/21 | U | 570 | - | Bernabé | 743432 | - | - | - | U | - | 77175 | 123480 | - | - | - |
| G. | 24 | 20/27 | U | 780 | - | Bernabé | 743432 | Lavabo sur colonne avec robinet EF | - | - | - | - | - | - | - | - | - |
| G. | 25 | 26/34 | U | 1170 | - | Bernabé | 743432 | Lavabo | 1 | 23000 | - | 23000 | - | - | - | - | - |
| - | - | Tés galvanisés | - | - | - | - | - | Colonne | 1 | 17000 | - | 17000 | - | - | - | - | - |
| G. | 27 | 12/17 | U | 730 | - | Bernabé | 743432 | Fixations | 1 | 2600 | - | 2600 | - | - | - | - | - |
| G. | 28 | 15/21 | U | 790 | - | Bernabé | 743432 | Siphon | 1 | 1800 | - | 1800 | - | - | - | - | - |
| G. | 29 | 20/27 | U | 1070 | - | Bernabé | 743432 | Vidage à bonde | 1 | 3500 | - | 3500 | - | - | - | - | - |
| G. | 30 | 26/34 | U | 1650 | - | Bernabé | 743432 | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| - | - | Manchons galvanisés | - | - | - | - | - | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 32 | 12/17 | U | 600 | - | Bernabé | 743432 | Tuyau de 32 | 0.3 | 650 | - | 195 | - | - | - | - | - |
| G. | 33 | 15/21 | U | 700 | - | Bernabé | 743432 | Robinet EF | 1 | 7500 | - | 7500 | - | - | - | - | - |
| G. | 34 | 20/27 | U | 620 | - | Bernabé | 743432 | M.O | 11 | 1100 | - | 12100 | - | - | - | - | - |
| G. | 35 | 26/34 | U | 1080 | - | Bernabé | 743432 | - | - | - | U | - | 69195 | 110712 | 116667 | 140000.4 | - |
| - | - | Mamellons galvanisés | - | - | - | - | - | Lavabo sur colonne avec mélangeur | - | - | - | - | - | - | - | - | - |
| G. | 37 | 43070 | U | 950 | - | Bernabé | 743432 | Lavabo | 1 | 23000 | - | 23000 | - | - | - | - | - |
| G. | 38 | 15/21 | U | 610 | - | Bernabé | 743432 | Colonne | 1 | 17000 | - | 17000 | - | - | - | - | - |
| G. | 39 | 20/27 | U | 740 | - | Bernabé | 743432 | Fixations | 1 | 2600 | - | 2600 | - | - | - | - | - |
| G. | 40 | 26/34 | U | 940 | - | Bernabé | 743432 | Siphon | 1 | 1800 | - | 1800 | - | - | - | - | - |
| - | - | Réductions  M . F . | - | - | - | - | - | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 42 | 42339 | U | 500 | - | Bernabé | 743432 | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 43 | 15/20 | U | 610 | - | Bernabé | 743432 | Tuyau de 32 | 1 | 650 | - | 650 | - | - | - | - | - |
| G. | 44 | 20/26 | U | 830 | - | Bernabé | 743432 | Mélangeur | 1 | 22500 | - | 22500 | - | - | - | - | - |
| - | - | Réductions  F . F . | - | - | - | - | - | M.O | 11 | 1100 | - | 12100 | - | - | - | - | - |
| G. | 46 | 42339 | U | 840 | - | Bernabé | 743432 | - | - | - | U | - | 81150 | 129840 | - | - | - |
| G. | 47 | 15/20 | U | 1050 | - | Bernabé | 743432 | Bidet avec Mélangeur | - | - | - | - | - | - | - | - | - |
| G. | 48 | 20/26 | U | 1210 | - | Bernabé | 743432 | Bidet | 1 | 35000 | - | 35000 | - | - | - | - | - |
| - | - | Bouchons  F . | - | - | - | - | - | Fixations | 2 | 1350 | - | 2700 | - | - | - | - | - |
| G. | 50 | 43070 | U | 480 | - | Bernabé | 743432 | Siphon | 1 | 1800 | - | 1800 | - | - | - | - | - |
| G. | 51 | 15/21 | U | 660 | - | Bernabé | 743432 | Mélangeur | 1 | 22500 | - | 22500 | - | - | - | - | - |
| G. | 52 | 20/27 | U | 810 | - | Bernabé | 743432 | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 53 | 26/34 | U | 840 | - | Bernabé | 743432 | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| - | - | Bouchons  M . | - | - | - | - | - | Tuyau de 32 | 0.3 | 650 | - | 195 | - | - | - | - | - |
| G. | 50 | 43070 | U | 320 | - | Bernabé | 743432 | M.O | 11 | 1100 | - | 12100 | - | - | - | - | - |
| G. | 51 | 15/21 | U | 390 | - | Bernabé | 743432 | - | - | - | U | - | 75795 | 121272 | - | - | - |
| G. | 52 | 20/27 | U | 610 | - | Bernabé | 743432 | Colonne de douche avec robinet EF | - | - | - | - | - | - | - | - | - |
| G. | 53 | 26/34 | U | 610 | - | Bernabé | 743432 | Colonne | 1 | 9000 | - | 9000 | - | - | - | - | - |
| - | - | Vannes laiton | - | - | - | - | - | Robinet EF | 1 | 7500 | - | 7500 | - | - | - | - | - |
| G. | 60 | 15/21 | U | 3200 | - | Tecnobat | 772222 | Siphon de sol | 1 | 6900 | - | 6900 | - | - | - | - | - |
| G. | 61 | 20/27 | U | 3700 | - | Tecnobat | 772222 | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 62 | 26/34 | U | 4920 | - | Tecnobat | 772222 | M.O | 5 | 1100 | - | 5500 | - | - | - | - | - |
| - | - | Robinet reccord au nez | - | - | - | - | - | - | - | - | U | - | 29650 | 47440 | - | - | - |
| G. | 64 | 15/21 | U | 4120 | - | Tecnobat | 772222 | Colonne de douche avec mélangeur | - | - | - | - | - | - | - | - | - |
| G. | 65 | 20/27 | U | 3700 | - | Tecnobat | 772222 | Colonne | 1 | 9000 | - | 9000 | - | - | - | - | - |
| - | - | Tube cuivre gainés | - | - | - | - | - | Robinet EF | 1 | 32500 | - | 32500 | - | - | - | - | - |
| G. | 67 | 10/12 | ml | 3510 | - | Bernabé | 743432 | Siphon de sol | 1 | 6900 | - | 6900 | - | - | - | - | - |
| G. | 68 | 12/14 | ml | 4160 | - | Bernabé | 743432 | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 69 | 14/16 | ml | 4760 | - | Bernabé | 743432 | M.O | 5 | 1100 | - | 5500 | - | - | - | - | - |
| - | - | Tube cuivre nu | - | - | - | - | - | - | - | - | U | - | 54650 | 87440 | - | - | - |
| G. | 71 | 10/12 | ml | 1940 | - | Mat.  du | 741087 | Baignoire en acier de 170, vidange automatique | - | - | - | - | - | - | - | - | - |
| G. | 72 | 12/14 | ml | 2230 | - | Mat.  du | 741087 | et mélangeur bain douche | - | - | - | - | - | - | - | - | - |
| G. | 73 | 14/16 | ml | 3060 | - | Mat.  du | 741087 | Baignoire | 1 | 110000 | - | 110000 | - | - | - | - | - |
| - | - | Gaine Annelée | - | - | - | - | - | Vidan,ge auto. | 1 | 18000 | - | 18000 | - | - | - | - | - |
| G. | 75 | De 13 | ml | 410 | - | Mat.  du | 741087 | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 76 | De 16 | ml | 440 | - | Mat.  du | 741087 | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 77 | De 19 | ml | 460 | - | Mat.  du | 741087 | Tuyau de 32 | 0.3 | 650 | - | 195 | - | - | - | - | - |
| - | - | Nourrices cuivres | - | - | - | - | - | Mélangeur BD | 1 | 33500 | - | 33500 | - | - | - | - | - |
| G. | 79 | 3 Sorties | U | 9500 | - | Bernabé | 743432 | Douchette | 1 | 11500 | - | 11500 | - | - | - | - | - |
| G. | 80 | 4 Sorties | U | 10530 | - | Bernabé | 743432 | M.O | 12 | 1100 | - | 13200 | - | - | - | - | - |
| G. | 81 | 5 Sorties | U | 13030 | - | Bernabé | 743432 | - | - | - | U | - | 187895 | 300632 | - | - | - |
| G. | 82 | 6 Sorties | U | 15560 | - | Bernabé | 743432 | WC avec chasse basse | - | - | - | - | - | - | - | - | - |
| G. | 83 | Ecrous cuivres 1/2 | U | 310 | - | Tecnobat | 772222 | WC | 1 | 39000 | - | 39000 | - | - | 50000 | - | - |
| G. | 84 | Coudes cuivres 1/2 | U | 945 | - | Tecnobat | 772222 | Réservoir | 1 | 37000 | - | 37000 | - | - | - | - | - |
| G. | 85 | Bouchon cuivres  F . 1/2 | U | 360 | - | Tecnobat | 772222 | Mécanisme | 1 | 10500 | - | 10500 | - | - | - | - | - |
| G. | 86 | Joints fibre 1/2 | U | 15 | - | Tecnobat | 772222 | Robinet d'Equerre | 1 | 2350 | - | 2350 | - | - | - | - | - |
| G. | 87 | Pattes a vis | U | 115 | - | Tecnobat | 772222 | Fixations | 2 | 1350 | - | 2700 | - | - | - | - | - |
| - | - | Colliers cuivrés | - | - | - | - | - | Abattant | 1 | 11000 | - | 11000 | - | - | - | - | - |
| G. | 89 | De 14 | U | 115 | - | Tecnobat | 772222 | M.O | 23 | 1100 | - | 25300 | - | - | - | - | - |
| G. | 90 | De 22 | U | 180 | - | Tecnobat | 772222 | - | - | - | U | - | 127850 | 204560 | 138850 | 166620 | - |
| G. | 91 | De 28 | U | 190 | - | Tecnobat | 772222 | WC avec chasse haute | - | - | - | - | - | - | - | - | - |
| G. | 92 | Chevilles de 8 | U | 20 | - | Tecnobat | 772222 | WC | 1 | 39000 | - | 39000 | - | - | - | - | - |
| G. | 93 | Garniture de patte à vis | U | 40 | - | Tecnobat | 772222 | Fixations | 2 | 1350 | - | 2700 | - | - | - | - | - |
| G. | 94 | Tuyau polyhétilène 32 | ml | 1200 | - | Tecnobat | 772222 | Chasse haute | 1 | 28000 | - | 28000 | - | - | - | - | - |
| G. | 95 | Tuyau polyhétilène 25 | ml | 910 | - | Tecnobat | 772222 | Fixations | 2 | 1450 | - | 2900 | - | - | - | - | - |
| G. | 96 | Tuyau polyhétilène 20 | ml | 770 | - | Tecnobat | 772222 | Robinet d'equerre | 1 | 2700 | - | 2700 | - | - | - | - | - |
| G. | 97 | Coudes de 32 | U | 4350 | - | Tecnobat | 772222 | Tube | 1 | 2500 | - | 2500 | - | - | - | - | - |
| G. | 98 | Coudes de 25 | U | 2775 | - | Tecnobat | 772222 | Cône | 1 | 1450 | - | 1450 | - | - | - | - | - |
| G. | 99 | Coudes de 20 | U | 2230 | - | Tecnobat | 772222 | Abattant | 1 | 11000 | - | 11000 | - | - | - | - | - |
| G. | 100 | Coudes de 32 avec filettage | U | 2280 | - | Tecnobat | 772222 | M.O | 13 | 1100 | - | 14300 | - | - | - | - | - |
| G. | 101 | Coudes de 25 avec filettage | U | 1680 | - | Tecnobat | 772222 | - | - | - | U | - | 104550 | 167280 | - | - | - |
| G. | 102 | Coudes de 20 avec filettage | U | 1210 | - | Tecnobat | 772222 | WC à la Turque chasse haute | - | - | - | - | - | - | - | - | - |
| G. | 103 | Tés de 32 | U | 9250 | - | Tecnobat | 772222 | WC | 1 | 22260 | - | 22260 | - | - | - | - | - |
| G. | 104 | Tés de 25 | U | 4350 | - | Tecnobat | 772222 | Siphon | 1 | 7820 | - | 7820 | - | - | - | - | - |
| G. | 105 | Tés de 20 | U | 3450 | - | Tecnobat | 772222 | Chasse | 1 | 33650 | - | 33650 | - | - | - | - | - |
| G. | 106 | Manchons de 32 | U | 3145 | - | Tecnobat | 772222 | Fixations | 4 | 2600 | - | 10400 | - | - | - | - | - |
| G. | 107 | Manchons de 25 | U | 2200 | - | Tecnobat | 772222 | Tube | 1 | 7300 | - | 7300 | - | - | - | - | - |
| G. | 108 | Manchons de 20 | U | 1870 | - | Tecnobat | 772222 | Fixations | 1 | 1300 | - | 1300 | - | - | - | - | - |
| G. | 109 | Grillage avertisseur Bleu | ml | 330 | - | Bernabé | 743432 | M.O | 13 | 1100 | - | 14300 | - | - | - | - | - |
| G. | 110 | PVC de 40 | ml | 850 | - | Abido | 710447 | - | - | - | U | - | 97030 | 155248 | - | - | - |
| G. | 111 | Coude de 40 | U | 1000 | - | Abido | 710447 | Urinoir | - | - | - | - | - | - | - | - | - |
| G. | 112 | Colle PVC | Kg | 8500 | - | Abido | 710447 | Urinoir | 1 | 74300 | - | 74300 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fixations | 2 | 2600 | - | 5200 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Siphon | 1 | 37030 | - | 37030 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 117 | Plombier | h | 1400 | - | - | - | Tuyau de 32 | 0.3 | 650 | - | 195 | - | - | - | - | - |
| G. | 118 | Manœuvre | h | 800 | - | - | - | Poussoir | 1 | 35200 | - | 35200 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tubulure | 1 | 19500 | - | 19500 | - | - | - | - | - |
| G. | 120 | Taux horaire moyen | h | 1100 | - | - | - | M.O | 13 | 1100 | - | 14300 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 187225 | 299560 | - | - | - |
| - | - | - | - | - | - | - | - | Lavabo collectif de 100 avec 2 robinets poussoirs | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Lavabo | 1 | 259600 | - | 259600 | - | - | - | - | - |
| - | - | APPAREILS SANITAIRE | - | - | - | - | - | Siphon | 1 | 2890 | - | 2890 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fixations | 2 | 2600 | - | 5200 | - | - | - | - | - |
| G. | 15 | Lave- mains | U | 19500 | - | Sogam E | 760554 | Reduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 16 | Lavabo | U | 23000 | - | Sogam E | 760554 | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 17 | Colonne de lavabo | U | 17000 | - | Sogam E | 760554 | Tuyau de 32 | 0.5 | 650 | - | 325 | - | - | - | - | - |
| G. | 18 | Fixations(Paire) | U | 2600 | - | Sogam E | 760554 | Poussoirs | 2 | 45080 | - | 90160 | - | - | - | - | - |
| G. | 19 | Consoles de lavabo | U | 16640 | - | Socimat | 701513 | M.O | 15 | 1100 | - | 16500 | - | - | - | - | - |
| G. | 20 | Siphon de lavabo | U | 1800 | - | Sogam E | 760554 | - | - | - | U | - | 376175 | 601880 | - | - | - |
| G. | 21 | Mélangeur de lavabo | U | 22500 | - | Sogam E | 760554 | Evier inox 1 bac avec robinet EF col de cygne | - | - | - | - | - | - | - | - | - |
| G. | 22 | Robinet EF ou EC | U | 7500 | - | Sogam E | 760554 | Evier 1 bac | 1 | 61500 | - | 61500 | - | - | - | - | - |
| G. | 23 | Vidage à chaînette | U | 3500 | - | Sogam E | 760554 | Reduction | 1 | 750 | - | 750 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 25 | Bidet | U | 35000 | - | Sogam E | 760554 | Tuyau de 32 | 0.3 | 650 | - | 195 | - | - | - | - | - |
| G. | 26 | Fixations | U | 1350 | - | Sogam E | 760554 | Robinet | 1 | 9500 | - | 9500 | - | - | - | - | - |
| G. | 27 | Siphon | U | 1800 | - | Sogam E | 760554 | M.O | 11 | 1100 | - | 12100 | - | - | - | - | - |
| G. | 28 | Mélangeur | U | 22500 | - | Sogam E | 760554 | - | - | - | U | - | 84795 | 135672 | - | - | - |
| G. | 29 | Robinet EF | U | 7500 | - | Sogam E | 760554 | Evier inox 2 bacs avec robinet EF col de cygne | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Evier 2 bacs | 1 | 82000 | - | 82000 | - | - | - | - | - |
| G. | 31 | Bac à Douches de 70 | U | 83000 | - | Sogam E | 760554 | Reduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 32 | Colonne de Douches | U | 9000 | - | Sogam E | 760554 | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 33 | Mélangeur de Douches | U | 32500 | - | Sogam E | 760554 | Tuyau de 32 | 0.3 | 650 | - | 195 | - | - | - | - | - |
| G. | 34 | Siphon de bac à Douches | U | 4500 | - | Sogam E | 760554 | Robinet | 1 | 9500 | - | 9500 | - | - | - | - | - |
| G. | 35 | Siphon de sol sortie 40 | U | 6900 | - | Sogam E | 760554 | M.O | 12 | 1100 | - | 13200 | - | - | - | - | - |
| G. | 36 | Bac à Douches de 80 encastré | U | 39000 | - | Sogam E | 760554 | - | - | - | U | - | 106395 | 170232 | - | - | - |
| G. | 37 | Robinet de Douche | U | 7500 | - | Sogam E | 760554 | Timbre d'Office avec Robinet EF col de cygne | - | - | - | - | - | - | - | - | - |
| G. | 38 | Baignoire acier | U | 110000 | - | Sogam E | 760554 | Timbre | 1 | 179900 | - | 179900 | - | - | - | - | - |
| G. | 39 | Vidage automatique | U | 18000 | - | Sogam E | 760554 | Siphon | 1 | 2950 | - | 2950 | - | - | - | - | - |
| G. | 40 | Vidage à chainette | U | 11000 | - | Sogam E | 760554 | Réduction | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 41 | Mélangeur B.D | U | 33500 | - | Sogam E | 760554 | Coude de 32 | 1 | 750 | - | 750 | - | - | - | - | - |
| G. | 42 | Douchette | U | 11500 | - | Sogam E | 760554 | Tuyau de 32 | 1 | 650 | - | 650 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Vivage à bonde | 1 | 10390 | - | 10390 | - | - | - | - | - |
| G. | 44 | WC chasse basse | U | 39000 | - | Sogam E | 760554 | Robinet | 1 | 24510 | - | 24510 | - | - | - | - | - |
| G. | 45 | Réservoir | U | 37000 | - | Sogam E | 760554 | M.O | 14 | 1100 | - | 15400 | - | - | - | - | - |
| G. | 46 | Mécanisme | U | 10500 | - | Sogam E | 760554 | - | - | - | U | - | 235300 | 376480 | - | - | - |
| G. | 47 | Robinet d'équerre | U | 2350 | - | Sogam E | 760554 | Chauffe-Eau de 50 Litres avec groupe de sécurité | - | - | - | - | - | - | - | - | - |
| G. | 48 | Fixations | U | 1350 | - | Sogam E | 760554 | Compris raccordements et réglages | - | - | - | - | - | - | - | - | - |
| G. | 49 | Abattants | U | 11000 | - | Sogam E | 760554 | Chauffe-eau | 1 | 112100 | - | 112100 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fixations | 1 | 3210 | - | 3210 | - | - | - | - | - |
| G. | 51 | Chauffe-Eau 50 litres | U | 112100 | - | Socimat | 701513 | Groupe | 1 | 15930 | - | 15930 | - | - | - | - | - |
| - | 52 | Chauffe-Eau 80 litres | U | 129210 | - | Socimat | 701513 | Ecrous cuivre | 3 | 310 | - | 930 | - | - | - | - | - |
| - | 53 | Chauffe-Eau 100 litres | U | 147500 | - | Socimat | 701513 | Tube cuivre | 1 | 2230 | - | 2230 | - | - | - | - | - |
| - | 54 | Chauffe-Eau 150 litres | U | 283200 | - | Socimat | 701513 | M.O | 15 | 1100 | - | 16500 | - | - | - | - | - |
| - | 55 | Groupe de sécurité | U | 15930 | - | Socimat | 701513 | - | - | - | - | - | 150900 | 241440 | - | - | - |
| - | 56 | Fixations(paires) | U | 3210 | - | Socimat | 701513 | Chauffe-Eau de 80 Litres avec groupe de sécurité | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Compris raccordements et réglages | - | - | - | - | - | - | - | - | - |
| G. | 58 | Evier 1 bac | U | 61500 | - | Sogam E | 760554 | Chauffe-eau | 1 | 129210 | - | 129210 | - | - | - | - | - |
| G. | 59 | Evier 2 bacs | U | 82000 | - | Sogam E | 760554 | Fixations | 1 | 3210 | - | 3210 | - | - | - | - | - |
| G. | 60 | Robinet col de cygne | U | 9500 | - | Sogam E | 760554 | Groupe | 1 | 15930 | - | 15930 | - | - | - | - | - |
| G. | 61 | Robinet Mélangeur | U | 34500 | - | Sogam E | 760554 | Ecrous cuivre | 3 | 310 | - | 930 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tube cuivre | 1 | 2230 | - | 2230 | - | - | - | - | - |
| G. | 63 | WC chasse haute | U | 39000 | - | Bernabé | 743432 | M.O | 15 | 1100 | - | 16500 | - | - | - | - | - |
| G. | 64 | Fixations | U | 1350 | - | Bernabé | 743432 | - | - | - | - | - | 168010 | 268816 | - | - | - |
| G. | 65 | Chasse avec mécanisme | U | 28000 | - | Bernabé | 743432 | Chauffe-Eau de 100 Litres avec groupe de sécurité | - | - | - | - | - | - | - | - | - |
| G. | 66 | Fixations de chasse | U | 1450 | - | Bernabé | 743432 | Compris raccordements et réglages | - | - | - | - | - | - | - | - | - |
| G. | 67 | Tube en PVC | U | 2500 | - | Bernabé | 743432 | Chauffe-eau | 1 | 147500 | - | 147500 | - | - | - | - | - |
| G. | 68 | Robinet d'équerre | U | 2700 | - | Bernabé | 743432 | Fixations | 1 | 3210 | - | 3210 | - | - | - | - | - |
| G. | 69 | Cône cahoutcouc | U | 1450 | - | Bernabé | 743432 | Groupe | 1 | 15930 | - | 15930 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Ecrous cuivre | 3 | 310 | - | 930 | - | - | - | - | - |
| G. | 71 | Lavabo collectif | U | 259600 | - | Brossette | 762200 | Tube cuivre | 1 | 2230 | - | 2230 | - | - | - | - | - |
| G. | 72 | Siphon | U | 2890 | - | Brossette | 762200 | M.O | 15 | 1100 | - | 16500 | - | - | - | - | - |
| G. | 73 | fixations | U | 2600 | - | Brossette | 762200 | - | - | - | - | - | 186300 | 298080 | - | - | - |
| G. | 74 | Robinet poussoir | U | 45080 | - | Brossette | 762200 | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 76 | Tembre d'Office | U | 179900 | - | Brossette | 762200 | FOURNITURE ET POSE D'ACCESSOIRES DE TOILETTES | - | - | - | - | - | - | - | - | - |
| G. | 77 | Robinet cône de cygne | U | 18400 | - | Brossette | 762200 | Miroir de lavabo de 60x48 | - | - | - | - | - | - | - | - | - |
| G. | 78 | Robinet mélangeur | U | 24510 | - | Brossette | 762200 | Miroir | 1 | 0 | - | 0 | - | - | 21000 | - | - |
| G. | 79 | Siphon | U | 2950 | - | Brossette | 762200 | Pattes | 2 | 8900 | - | 17800 | - | - | - | - | - |
| G. | 80 | Bonde trop plein | U | 10390 | - | Brossette | 762200 | Chevilles | 4 | 15 | - | 60 | - | - | - | - | 1.6 |
| G. | 81 | Vidage à bonde | U | 7790 | - | Brossette | 762200 | Vis | 4 | 15 | - | 60 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.3 | 1100 | - | 1430 | - | - | 8167 | - | - |
| G. | 83 | WC à la Turque | U | 22260 | - | Tecnobat | 772222 | - | - | - | - | - | 19350 | 30960 | 29167 | 35000.4 | - |
| G. | 84 | Siphon | U | 7820 | - | Tecnobat | 772222 | Tablette de lavabo en verre | - | - | - | - | - | - | - | - | - |
| G. | 85 | Chasse bouton poussoir | U | 33650 | - | Tecnobat | 772222 | Tablette | 1 | 15080 | - | 15080 | - | - | - | - | - |
| G. | 86 | Tube | U | 7300 | - | Tecnobat | 772222 | Chevilles | 4 | 20 | - | 80 | - | - | - | - | - |
| G. | 87 | Fixations | U | 1300 | - | Tecnobat | 772222 | Vis | 4 | 15 | - | 60 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - | - |
| G. | 89 | Urinoir | U | 74300 | - | Brossette | 762200 | - | - | - | - | - | 16540 | 26464 | - | - | - |
| G. | 90 | Siphon | U | 37030 | - | Brossette | 762200 | Porte-seviette fixe simple chromé | - | - | - | - | - | - | - | - | - |
| G. | 91 | Fixations | U | 2600 | - | Brossette | 762200 | Porte-serviette | 1 | 15080 | - | 15080 | - | - | - | - | - |
| G. | 92 | Robinet poussoir | U | 35200 | - | Brossette | 762200 | Chevilles | 4 | 20 | - | 80 | - | - | - | - | - |
| G. | 93 | Tubulure | U | 19500 | - | Brossette | 762200 | Vis | 4 | 15 | - | 60 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - | - |
| G. | 95 | Tuyau PVC de 32 | ml | 650 | - | Abido | 710447 | - | - | - | - | - | 16540 | 26464 | - | - | - |
| G. | 96 | Coude PVC de 32 | U | 750 | - | Abido | 710447 | Porte-seviette fixe Double chromé | - | - | - | - | - | - | - | - | - |
| G. | 97 | Réduction 40/32 | U | 750 | - | Abido | 710447 | Porte-serviette | 1 | 9760 | - | 9760 | - | - | - | - | - |
| G. | 98 | Ecrou cuivre | U | 310 | - | Technobat | 772222 | Chevilles | 4 | 20 | - | 80 | - | - | - | - | - |
| G. | 99 | Tube cuivre 12/14 | ml | 2230 | - | Mat Gab | 741087 | Vis | 4 | 15 | - | 60 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 11220 | 17952 | - | - | - |
| - | - | ACCESSOIRES DE TOILETTE | - | - | - | - | - | Porte-savon chromé | - | - | - | - | - | - | - | - | - |
| G. | 103 | Miroir 60/48 | U | 18900 | - | CK2 | 743358 | Porte-savon | 1 | 14420 | - | 14420 | - | - | - | - | - |
| G. | 104 | Pattes de fixations | U | 8900 | - | CK2 | 743358 | Chevilles | 4 | 20 | - | 80 | - | - | - | - | - |
| G. | 105 | Tablettes | U | 15080 | - | Technobat | 772222 | Vis | 4 | 15 | - | 60 | - | - | - | - | - |
| G. | 106 | Portes serviettes FS | U | 9760 | - | Technobat | 772222 | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - | - |
| G. | 107 | Portes serviettes FD | U | 14420 | - | Technobat | 772222 | - | - | - | - | - | 15880 | 25408 | - | - | - |
| G. | 108 | Porte-savon | U | 8650 | - | Technobat | 772222 | Porte-papier chromé à rouleau | - | - | - | - | - | - | - | - | - |
| G. | 109 | Porte-papier | U | 6210 | - | Technobat | 772222 | Porte-papier | 1 | 8650 | - | 8650 | - | - | - | - | - |
| G. | 110 | Paters doubles | U | 8900 | - | CK2 | 743358 | Chevilles | 4 | 20 | - | 80 | - | - | - | - | - |
| G. | 111 | Chevilles de 8 | U | 20 | - | Technobat | 772222 | Vis | 4 | 15 | - | 60 | - | - | - | - | - |
| G. | 112 | Chevilles de 6 | U | 15 | - | Technobat | 772222 | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - | - |
| G. | 113 | Vis de 4x25 | U | 15 | - | Technobat | 772222 | - | - | - | - | - | 10110 | 16176 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | Main-d'œuvre | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 117 | Plombier | h | 1400 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 118 | Manœuvre | h | 800 | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| G. | 120 | Taux horaire moyen | h | 1100 | - | - | - | - | - | - | - | - | - | - | - | - | - |

---

## 13 — Electricité

*Lignes : 330 | Colonnes : 17*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 | Col16 | Col17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G. | 13 | Câble torsadé 4x16 | ml | 2010 | - | Matelec | 762201 | Tableau 2x13 modules avec coupe-circuit | - | - | - | - | - | - | - | - |
| G. | 14 | Tableau 13 posi. | U | 17940 | - | Matelec | 762202 | compris barre d'alimentation | - | - | - | - | - | - | - | - |
| G. | 15 | Tableau 2x13 posi. | U | 28320 | - | Matelec | 762203 | Tableau | 1 | 28320 | - | 28320 | - | - | - | - |
| G. | 16 | Armoires 13 modules | U | 38590 | - | Matelec | 762204 | Coupe-circuit | 13 | 6030 | - | 78390 | - | - | - | - |
| G. | 17 | Armoires 2x13 modules | U | 54170 | - | Matelec | 762205 | Neutre | 1 | 5550 | - | 5550 | - | - | - | - |
| G. | 18 | Disjoncteur 15A bi-polaire | U | 29390 | - | Matelec | 762206 | Fusibles | 13 | 410 | - | 5330 | - | - | - | - |
| G. | 19 | Disjoncteur tétra 60A | U | 155290 | - | Matelec | 762207 | 13AP DX | 1 | 2030 | - | 2030 | - | - | - | - |
| G. | 20 | Platine disjoncteur | U | 11640 | - | Matelec | 762208 | Chevilles | 4 | 20 | - | 80 | - | - | - | - |
| G. | 21 | Borne arrivée de 35 m/ m² | U | 1540 | - | Matelec | 762209 | Vis | 4 | 20 | - | 80 | - | - | - | - |
| G. | 22 | Barre alimentation 13AP DX | U | 2030 | - | Matelec | 762210 | M.O | 25 | 1100 | - | 27500 | - | - | - | - |
| G. | 23 | Coupe circuit 10 à 32 A+N | U | 6030 | - | Matelec | 762211 | - | - | - | U | - | 147280 | 235648 | - | - |
| G. | 24 | Coupe circuit Neutre | U | 5550 | - | Matelec | 762212 | Tableau 13 modules avec coupe-circuit | - | - | - | - | - | - | - | - |
| G. | 25 | Fusibles 10A | U | 410 | - | Matelec | 762213 | compris barre d'alimentation | - | - | - | - | - | - | - | - |
| G. | 26 | Fusibles 16A | U | 530 | - | Matelec | 762214 | Tableau | 1 | 17940 | - | 17940 | - | - | - | - |
| G. | 27 | Fusibles 20A | U | 530 | - | Matelec | 762215 | Coupe-circuit | 7 | 6030 | - | 42210 | - | - | - | - |
| G. | 28 | Fusibles 25A | U | 530 | - | Matelec | 762216 | Neutre | 1 | 5550 | - | 5550 | - | - | - | - |
| G. | 29 | Fusibles 32A | U | 1170 | - | Matelec | 762217 | Fusibles | 7 | 410 | - | 2870 | - | - | - | - |
| G. | 30 | Piquet de terre | U | 16640 | - | Matelec | 762218 | 13AP DX | 1 | 2030 | - | 2030 | - | - | - | - |
| G. | 31 | Barrette de coupure | U | 11530 | - | Matelec | 762219 | Chevilles | 4 | 20 | - | 80 | - | - | - | - |
| G. | 32 | Câble nu de 29 | ml | 2400 | - | Matelec | 762220 | Vis | 4 | 20 | - | 80 | - | - | - | - |
| G. | 33 | Boites 105x105 | U | 3310 | - | Matelec | 762221 | M.O | 25 | 1100 | - | 27500 | - | - | - | - |
| G. | 34 | Boites 135x135 | U | 5180 | - | Matelec | 762222 | - | - | - | U | - | 98260 | 157216 | - | - |
| G. | 35 | Boites 165x165 | U | 5730 | - | Matelec | 762223 | Armoire encastrée 2x13 module, | - | - | - | - | - | - | - | - |
| G. | 36 | Boites rondes | U | 250 | - | Matelec | 762224 | compris coupe-circuit et barre d'alimentation | - | - | - | - | - | - | - | - |
| G. | 37 | Gaines de 9 | ml | 160 | - | Abido | 710447 | Armoire | 1 | 54170 | - | 54170 | - | - | - | - |
| G. | 38 | Gaines de 11 | ml | 160 | - | Abido | 710448 | Coupe-circuit | 13 | 9800 | - | 127400 | - | - | - | - |
| G. | 39 | Gaines de 13 | ml | 160 | - | Abido | 710449 | Neutre | 1 | 5550 | - | 5550 | - | - | - | - |
| G. | 40 | Gaines de 16 | ml | 180 | - | Abido | 710450 | Fusibles | 13 | 410 | - | 5330 | - | - | - | - |
| G. | 41 | Gaines de 21 | ml | 210 | - | Abido | 710451 | 13AP DX | 1 | 2030 | - | 2030 | - | - | - | - |
| G. | 42 | Fil TH de 1,5 | ml | 110 | - | Abido | 710452 | Chevilles | 4 | 20 | - | 80 | - | - | - | - |
| G. | 43 | Fil TH de 2,5 | ml | 190 | - | Abido | 710453 | Vis | 4 | 20 | - | 80 | - | - | - | - |
| G. | 44 | Fil TH de 4 | ml | 360 | - | Matelec | 762224 | M.O | 30 | 2200 | - | 66000 | - | - | - | - |
| G. | 45 | Fil TH de 6 | ml | 560 | - | Matelec | 762225 | - | - | - | U | - | 260640 | 417024 | - | - |
| G. | 46 | Fil TH de 10 | ml | 790 | - | Matelec | 762226 | Armoire encastrée 13 module, | - | - | - | - | - | - | - | - |
| G. | 47 | Câble GVG 2x1,5 | ml | 390 | - | Matelec | 762227 | compris coupe-circuit et barre d'alimentation | - | - | - | - | - | - | - | - |
| G. | 48 | Câble GVG 3x1,5 | ml | 500 | - | Matelec | 762228 | Armoire | 1 | 38590 | - | 38590 | - | - | - | - |
| G. | 49 | Câble GVG 3x2,5 | ml | 710 | - | Matelec | 762229 | Coupe-circuit | 13 | 6030 | - | 78390 | - | - | - | - |
| G. | 50 | Câble GVG 2x4 | ml | 1100 | - | Matelec | 762230 | Neutre | 1 | 5550 | - | 5550 | - | - | - | - |
| G. | 51 | Câble GVG 4x4 | ml | 1300 | - | Matelec | 762231 | Fusibles | 13 | 410 | - | 5330 | - | - | - | - |
| G. | 52 | Câble GVG 4x6 | ml | 1700 | - | Matelec | 762232 | 13AP DX | 1 | 2030 | - | 2030 | - | - | - | - |
| G. | 53 | Câble Télévision | ml | 540 | - | Matelec | 762233 | Chevilles | 4 | 20 | - | 80 | - | - | - | - |
| G. | 54 | Câble 3 paires téléphones | U | 320 | - | Matelec | 762234 | Vis | 4 | 20 | - | 80 | - | - | - | - |
| G. | 55 | Cavaliers de 6 | U | 20 | - | Matelec | 762235 | M.O | 30 | 1100 | - | 33000 | - | - | - | - |
| G. | 56 | Cavaliers de 8 | U | 30 | - | Matelec | 762236 | - | - | - | U | - | 163050 | 260880 | - | - |
| G. | 57 | cavaliers de 10 | U | 40 | - | Matelec | 762237 | Disjoncteur bi-polaires 15A | - | - | - | - | - | - | - | - |
| G. | 58 | Interrupteur SA | U | 1930 | - | Matelec | 762238 | Disjoncteur module | 1 | 29390 | - | 29390 | - | - | - | - |
| G. | 59 | Interrupteur V et V | U | 2190 | - | Matelec | 762239 | Platine | 1 | 11640 | - | 11640 | - | - | - | - |
| G. | 60 | Interrupteur Duo | U | 4780 | - | Matelec | 762240 | Borne de 35 | 2 | 1540 | - | 3080 | - | - | - | - |
| G. | 61 | Bouton poussoir simple | U | 3900 | - | Matelec | 762241 | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| G. | 62 | Bouton poussoir Lumineux | U | 4800 | - | Matelec | 762242 | - | - | - | U | - | 47410 | 75856 | - | - |
| G. | 63 | Bouton poussoir étiquette | U | 4100 | - | Matelec | 762243 | Disjoncteur Tétrapolaire 15A | - | - | - | - | - | - | - | - |
| G. | 64 | Prises 2P | U | 1950 | - | Matelec | 762244 | Disjoncteur module | 1 | 155290 | - | 155290 | - | - | - | - |
| G. | 65 | Prises 2P+T | U | 2300 | - | Matelec | 762245 | Platine | 1 | 11640 | - | 11640 | - | - | - | - |
| G. | 66 | Télérupteur | U | 30330 | - | Matelec | 762246 | Borne de 35 | 4 | 1540 | - | 6160 | - | - | - | - |
| G. | 67 | Dismatic | U | 22520 | - | Matelec | 762247 | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| G. | 68 | Règlette fluo de 120 ou 60 | U | 9440 | - | Matelec | 762248 | - | - | - | U | - | 177490 | 283984 | - | - |
| G. | 69 | Règlette fluo Duo de 120 ou 60 | U | 38000 | - | Matelec | 762249 | Mise à la terre avec piquet et barrette de coupure, | - | - | - | - | - | - | - | - |
| G. | 70 | Hublot rond HMI de 200 | U | 14520 | - | Matelec | 762250 | câble cuivre nu de 29 | - | - | - | - | - | - | - | - |
| G. | 71 | Hublot verre clair strié | U | 7800 | - | Matelec | 762251 | Piquet | 1 | 16640 | - | 16640 | - | - | - | - |
| G. | 72 | Hublot étanche | U | 9010 | - | Matelec | 762252 | Barrette | 1 | 11530 | - | 11530 | - | - | - | - |
| G. | 73 | Applique sanitaire | U | 22520 | - | Matelec | 762253 | Câble | 5 | 2400 | - | 12000 | - | - | - | - |
| G. | 74 | Tube fluo de 120 ou 60 | U | 1550 | - | Matelec | 762254 | M.O | 15 | 2200 | - | 33000 | - | - | - | - |
| G. | 75 | Vasque fluo de 120 | U | 1550 | - | Matelec | 762255 | - | - | - | U | - | 73170 | 117072 | - | - |
| G. | 76 | Ampoule de 60Watt | U | 650 | - | Matelec | 762256 | Raccodement au tableau SEEG | - | - | - | - | - | - | - | - |
| G. | 77 | Douille cuivre | U | 830 | - | Matelec | 762257 | Câble | 5 | 2010 | - | 10050 | - | - | - | - |
| - | - | - | - | - | - | - | - | Colliers | 3 | 50 | - | 150 | - | - | - | - |
| G. | 79 | Prise Téléphone | U | 5230 | - | Sogame | 760554 | Chevilles | 3 | 20 | - | 60 | - | - | - | - |
| G. | 80 | Prise Télévision | U | 4060 | - | Sogame | 760555 | Pattes à vis | 3 | 30 | - | 90 | - | - | - | - |
| G. | 81 | Inter. SA en applique | U | 700 | - | Sogame | 760556 | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| G. | 82 | Inter. V et V en applique | U | 750 | - | Sogame | 760557 | - | - | - | U | - | 13650 | 21840 | - | - |
| G. | 83 | Prise en applique 2P | U | 750 | - | Sogame | 760558 | Fourniture et pose en encastré de gaines | - | - | - | - | - | - | - | - |
| G. | 84 | Prise en applique 2P+T | U | 900 | - | Sogame | 760559 | de 11 ou 13, compris saignées et rebouchages | - | - | - | - | - | - | - | - |
| G. | 85 | Chevilles | U | 20 | - | Sogame | 760560 | Gaines de 11 ou 13 | - | - | - | - | - | - | - | - |
| G. | 86 | vis | U | 20 | - | Sogame | 760561 | Gaine | 1 | 160 | - | 160 | - | - | - | - |
| G. | 87 | colliers | U | 50 | - | Sogame | 760562 | Sable | 0.004 | 12500 | - | 50 | - | - | - | - |
| G. | 88 | pattes à vis | U | 30 | - | Sogame | 760563 | Ciment | 0.5 | 94 | - | 47 | - | - | - | - |
| G. | 89 | Sable | m3 | 12500 | - | - | - | M.O | 0.3 | 1100 | - | 330 | - | - | - | - |
| G. | 90 | Ciment | kg | 94 | - | Abido | 710554 | - | - | - | ml | - | 587 | 939.2 | - | - |
| G. | 91 | Dominos de 4 barres de 12 | U | 60 | - | Abido | 710555 | Gaines de 16 | - | - | - | - | - | - | - | - |
| G. | 92 | Dominos de 6 barres de 12 | U | 80 | - | Abido | 710556 | Gaine | 1 | 180 | - | 180 | - | - | - | - |
| G. | 93 | Dominos de 15 barres de 12 | U | 110 | - | Abido | 710557 | Sable | 0.004 | 12500 | - | 50 | - | - | - | - |
| G. | 94 | Dominos de 17 barres de 12 | U | 190 | - | Abido | 710558 | Ciment | 0.5 | 94 | - | 47 | - | - | - | - |
| G. | 95 | Dominos de 25 barres de 12 | U | 450 | - | Abido | 710559 | M.O | 0.3 | 1100 | - | 330 | - | - | - | - |
| G. | 96 | Prise Téléphone en applique | U | 2600 | - | Sogame | 760562 | - | - | - | ml | - | 607 | 971.2 | - | - |
| G. | 97 | Prise Télévision en applique | U | 2300 | - | Sogame | 760563 | Gaines de 21 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Gaine | 1 | 210 | - | 210 | - | - | 250 | - |
| - | - | - | - | - | - | - | - | Sable | 0.004 | 12500 | - | 50 | - | - | 50 | - |
| - | - | - | - | - | - | - | - | Ciment | 0.5 | 94 | - | 47 | - | - | 47 | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | 440 | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 747 | 1195.2 | 787 | 1259.2 |
| - | - | CLIMATISATION | - | - | - | - | - | Fourniture et pose de boites de dérivations | - | - | - | - | - | - | - | - |
| G. | 104 | Climatiseur 1Cv | U | 386450 | - | Brosset | 762200 | compris scellements | - | - | - | - | - | - | - | - |
| G. | 105 | Climatiseur 1,25Cv | U | 409200 | - | Brosset | 762201 | Boites de 135x135 | - | - | - | - | - | - | - | - |
| G. | 106 | Climatiseur 1,5Cv | U | 460000 | - | Brosset | 762202 | Boites | 1 | 5180 | - | 5180 | - | - | - | - |
| G. | 107 | Split 1Cv | U | 1307200 | - | Brosset | 762203 | Dominos | 4 | 60 | - | 240 | - | - | - | - |
| G. | 108 | Split 2Cv | U | 2712000 | - | Brosset | 762204 | Sable | 0.004 | 12500 | - | 50 | - | - | - | - |
| G. | 109 | Brasseur d'air avec variateur | U | 64550 | - | Matelec | 762257 | Ciment | 0.5 | 94 | - | 47 | - | - | - | - |
| G. | 110 | Extracteur de buée FV 25 | U | 109150 | - | Matelec | 762258 | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| G. | 111 | Extracteur de buée FV 30 | U | 140100 | - | Matelec | 762259 | - | - | - | U | - | 8817 | 14107.2 | - | - |
| G. | 112 | Extracteur de buée FV 35 | U | 181130 | - | Matelec | 762260 | Boites de 165x165 | - | - | - | - | - | - | - | - |
| G. | 113 | Extracteur de buée FV 40 | U | 250520 | - | Matelec | 762261 | Boites | 1 | 5730 | - | 5730 | - | - | - | - |
| - | - | - | - | - | - | - | - | Dominos | 4 | 60 | - | 240 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.004 | 12500 | - | 50 | - | - | - | - |
| - | - | MAIN D'ŒUVRE | - | - | - | - | - | Ciment | 0.5 | 94 | - | 47 | - | - | - | - |
| G. | 117 | Electricien | h | 1400 | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - | - |
| G. | 118 | Manœuvre | h | 800 | - | - | - | - | - | - | U | - | 9367 | 14987.2 | - | - |
| - | - | - | - | - | - | - | - | Fourniture pose et scellements de | - | - | - | - | - | - | - | - |
| G. | 120 | Taux Horaire moyen | h | 1100 | - | - | - | boites rondes | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Boites | 1 | 250 | - | 250 | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.002 | 12500 | - | 25 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 0.2 | 94 | - | 18.8 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.3 | 1100 | - | 330 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 623.8 | 998.08 | - | - |
| - | - | - | - | - | - | - | - | Tirage de fil TH de 1.5 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 1.1 | 110 | - | 121.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.2 | 1100 | - | 220 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 341 | 545.6 | - | - |
| - | - | - | - | - | - | - | - | Tirage de fil TH de 2.5 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 1.1 | 190 | - | 209.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.2 | 1100 | - | 220 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 429 | 686.4 | - | - |
| - | - | - | - | - | - | - | - | Tirage de fil TH de 4 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 1.1 | 360 | - | 396.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.2 | 1100 | - | 220 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 616 | 985.6 | - | - |
| - | - | - | - | - | - | - | - | Tirage de fil TH de 6 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 1 | 560 | - | 560 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.2 | 1100 | - | 220 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 780 | 1248 | - | - |
| - | - | - | - | - | - | - | - | Tirage de fil TH de 10 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 1.1 | 790 | - | 869.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.2 | 1100 | - | 220 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1089 | 1742.4 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de câble GVG pour | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | installation en apparent | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble 2x1.5 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble | 1.1 | 390 | - | 429.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | Cavaliers | 2 | 540 | - | 1080 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1949 | 3118.4 | - | - |
| - | - | - | - | - | - | - | - | Câble 3x1.5 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble | 1.1 | 500 | - | 550 | - | - | - | - |
| - | - | - | - | - | - | - | - | Cavaliers | 2 | 320 | - | 640 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1630 | 2608 | - | - |
| - | - | - | - | - | - | - | - | Câble 3x2.5 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble | 1.1 | 710 | - | 781.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | Cavaliers | 2 | 320 | - | 640 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1861 | 2977.6 | - | - |
| - | - | - | - | - | - | - | - | Câble 3x4 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble | 1.1 | 1100 | - | 1210 | - | - | - | - |
| - | - | - | - | - | - | - | - | Cavaliers | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1690 | 2704 | - | - |
| - | - | - | - | - | - | - | - | Câble 4x4 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble | 1.1 | 1300 | - | 1430.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | Cavaliers | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 1910.0 | 3056.0 | - | - |
| - | - | - | - | - | - | - | - | Câble 4x6 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble | 1.1 | 1700 | - | 1870.0 | - | - | - | - |
| - | - | - | - | - | - | - | - | Cavaliers | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 2350 | 3760 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose d'appareillage à griffe | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Interrpteur simple allumage | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Interrpteur | 1 | 1930 | - | 1930 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 3250 | 5200 | - | - |
| - | - | - | - | - | - | - | - | Interrpteur va et vient | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Interrpteur | 1 | 2190 | - | 2190 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 3510 | 5616 | - | - |
| - | - | - | - | - | - | - | - | Interrpteur double allumage | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Interrpteur | 1 | 4780 | - | 4780 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 6100 | 9760 | - | - |
| - | - | - | - | - | - | - | - | Bouton poussoir simple | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bouton | 1 | 3900 | - | 3900 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 5220 | 8352 | - | - |
| - | - | - | - | - | - | - | - | Bouton poussoir porte-etiquette | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bouton | 1 | 4100 | - | 4100 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 5420 | 8672 | - | - |
| - | - | - | - | - | - | - | - | Bouton poussoir lumineux | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Bouton | 1 | 4800 | - | 4800 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 6120 | 9792 | - | - |
| - | - | - | - | - | - | - | - | Prise de courant 2P | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 1950 | - | 1950 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 3270 | 5232 | - | - |
| - | - | - | - | - | - | - | - | Prise de courant 2P + T | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 2300 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 3620 | 5792 | - | - |
| - | - | - | - | - | - | - | - | Prise téléphone | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 5230 | - | 5230 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 6550 | 10480 | - | - |
| - | - | - | - | - | - | - | - | Prise télévision | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 4060 | - | 4060 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 5380 | 8608 | - | - |
| - | - | - | - | - | - | - | - | Dismatic | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Dismatic | 1 | 22520 | - | 22520 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 23840 | 38144 | - | - |
| - | - | - | - | - | - | - | - | Télérupteur modulaire uni-polaire | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Télérupteur | 1 | 30330 | - | 30330 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 31650 | 50640 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose d'appareillage en | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | applique | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Interrupteur simple allumage | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Interrupteur | 1 | 700 | - | 700 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2100 | 3360 | - | - |
| - | - | - | - | - | - | - | - | Interrupteur va et vient | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Interrupteur | 1 | 750 | - | 750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2150 | 3440 | - | - |
| - | - | - | - | - | - | - | - | Prise de courant 2P | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 750 | - | 750 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2150 | 3440 | - | - |
| - | - | - | - | - | - | - | - | Prise de courant 2P + P | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 900 | - | 900 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2300 | 3680 | - | - |
| - | - | - | - | - | - | - | - | Prise téléphone | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 2600 | - | 2600 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 4000 | 6400 | - | - |
| - | - | - | - | - | - | - | - | Prise télévision | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Prise | 1 | 2300 | - | 2300 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 3700 | 5920 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de luminaires | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Réglette fluo mono de 120 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | réglette | 1 | 9440 | - | 9440 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tube | 1 | 1550 | - | 1550 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 13230 | 21168 | - | - |
| - | - | - | - | - | - | - | - | Réglette fluo mono de 60 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | réglette | 1 | 9440 | - | 9440 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tube | 1 | 1550 | - | 1550 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 13230 | 21168 | - | - |
| - | - | - | - | - | - | - | - | Réglette fluo duo de 120 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | réglette | 1 | 38000 | - | 38000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tube | 2 | 1550 | - | 3100 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 43340 | 69344 | - | - |
| - | - | - | - | - | - | - | - | Réglette fluo duo de 60 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | réglette | 1 | 38000 | - | 38000 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tube | 2 | 1550 | - | 3100 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 43340 | 69344 | - | - |
| - | - | - | - | - | - | - | - | Vasque fluo duo de 120 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Vasque | 1 | 1550 | - | 1550 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Tube | 2 | 1550 | - | 3100 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 6890 | 11024 | - | - |
| - | - | - | - | - | - | - | - | Hublot rond HMI de 200 | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Hublot | 1 | 14520 | - | 14520 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ampoule | 1 | 650 | - | 650 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 16530 | 26448 | - | - |
| - | - | - | - | - | - | - | - | Hublot verre clair strié | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Hublot | 1 | 7800 | - | 7800 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ampoule | 1 | 650 | - | 650 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 9810 | 15696 | - | - |
| - | - | - | - | - | - | - | - | Hublot étanche | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Hublot | 1 | 9010 | - | 9010 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ampoule | 1 | 650 | - | 650 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.2 | 1100 | - | 1320 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 11060 | 17696 | - | - |
| - | - | - | - | - | - | - | - | Applique sanitaire avec prise incorporée | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Linolithe | 1 | 22520 | - | 22520 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 24250 | 38800 | - | - |
| - | - | - | - | - | - | - | - | Douille à bout de fils avec ampoule | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Douille | 1 | 830 | - | 830 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ampoule | 1 | 650 | - | 650 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2580 | 4128 | - | - |
| - | - | - | - | - | - | - | - | Appliques murales | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Appliques | 1 | 0 | - | 0 | - | - | - | - |
| - | - | - | - | - | - | - | - | Vis | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 2 | 20 | - | 40 | - | - | - | - |
| - | - | - | - | - | - | - | - | Ampoule | 1 | 650 | - | 650 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2380 | 3808 | - | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de brasseurs d'air | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | avec variateur, compris alimentation | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Brasseur | 1 | 64550 | - | 64550 | - | - | - | - |
| - | - | - | - | - | - | - | - | Câble 3x2.5 | 15 | 710 | - | 10650 | - | - | - | - |
| - | - | - | - | - | - | - | - | Cavaliers | 2 | 30 | - | 60 | - | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 4 | 1100 | - | 4400 | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 79660 | 127456 | - | - |

---

## 14 — Carrelages-Faiences-Moquettes

*Lignes : 107 | Colonnes : 15*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | CARRELAGES - FAIENCES | - | - | - | - | - | - |
| - | - | CARRELAGES - FAIENCES | - | - | - | - | - | Carrelage en grès émaillé, posé au mortier | - | - | - | - | - | - |
| G. | 15 | Carrelages grès | m² | 6850 | - | Socimat | 701513 | de ciment, fourniture à 6850F au m² | - | - | - | - | - | - |
| G. | 16 | Carrelages grès | m² | 12300 | - | SAMCE | 764505 | Carrelage | 1 | 6850 | - | 6850 | - | - |
| G. | 17 | Faience 15x15 | m² | 6000 | - | SAMCE | 764505 | Sable | 0.06 | 12500 | - | 750 | - | - |
| G. | 18 | Carrelade sol/mur | m² | 10200 | - | SAMCE | 764505 | Ciment | 20 | 100 | - | 2000 | - | - |
| G. | 19 | Carrelage décor | U | 4500 | - | SAMCE | 764505 | M.O | 1.9 | 1100 | - | 2090 | - | - |
| G. | 20 | Ciment colle (25kg) | kg | 2200 | - | SAMCE | 764505 | - | - | - | m² | - | 11690 | 18704 |
| G. | 21 | Fermajoint (5kg) | kg | 900 | - | SAMCE | 764505 | Carrelage en grès émaillé, posé au mortier | - | - | - | - | - | - |
| G. | 22 | Dalettes ciment 20x20 | m² | 7600 | - | Cimentiers | - | de ciment, fourniture à 12300F au m² | - | - | - | - | - | - |
| G. | 23 | Dalettes ciment Octogonale | m² | 9000 | - | Cimentiers | - | Carrelage | 1 | 12300 | - | 12300 | - | - |
| G. | 24 | Ciment colle (25kg) | kg | 93 | - | Owendo | - | Sable | 0.06 | 12500 | - | 750 | - | - |
| G. | 25 | Sable | m3 | 12500 | - | - | - | Ciment  (17kgX100) | 20 | 100 | - | 2000 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.9 | 1100 | - | 2090 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 17140 | 24853 |
| - | - | - | - | - | - | - | - | Plinthes en carrelage à 6850F au m², | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pose à la colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Carrelage | 0.1 | 6850 | - | 685 | - | - |
| - | - | SOLS SOUPLES | - | - | - | - | - | Colle | 1 | 2200 | - | 2200 | - | - |
| G. | 32 | Moquette | m² | 3600 | - | SAMCE | 764505 | M.O | 1 | 1100 | - | 1100 | - | - |
| G. | 33 | Moquette | m² | 8500 | - | SAMCE | 764505 | - | - | - | ml | - | 3985 | 6376 |
| G. | 34 | Moquette | m² | 13500 | - | SAMCE | 764505 | Plinthes en carrelage à 12300F au m², | - | - | - | - | - | - |
| G. | 35 | Colle (5kg) | U | 16150 | - | SAMCE | 764505 | pose à la colle | - | - | - | - | - | - |
| G. | 36 | Barres de seuils de 73 | U | 4500 | - | SAMCE | 764505 | Carrelage | 0.1 | 12300 | - | 1230 | - | - |
| G. | 37 | Barres de seuils de 83 | U | 5000 | - | SAMCE | 764505 | Colle | 1 | 2200 | - | 2200 | - | - |
| G. | 38 | Barres de seuils de 146 | U | 10200 | - | SAMCE | 764505 | M.O | 1 | 1100 | - | 1100 | - | - |
| G. | 39 | Dalles vinyl de 33/33 | m² | 4290 | - | Sogame | 760554 | - | - | - | ml | - | 4530 | 6568.5 |
| G. | 40 | Dalles vinyl grande larg. | m² | 3200 | - | - | - | Faience blanche 15x15, posée à la colle | - | - | - | - | - | - |
| G. | 41 | Vis | U | 20 | - | - | - | sur enduit ciment | - | - | - | - | - | - |
| G. | 42 | Chevilles | U | 20 | - | - | - | Faience | 1 | 6000 | - | 6000 | - | - |
| - | - | - | - | - | - | - | - | Colle | 2.5 | 2200 | - | 5500 | - | - |
| - | - | - | - | - | - | - | - | Fermajoint | 0.25 | 900 | - | 225 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.8 | 1100 | - | 1980 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 13705 | 21928 |
| - | - | - | - | - | - | - | - | Faience décorée 15x15, posée à la colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | sur enduit ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faience unie | 1 | 10200 | - | 10200 | - | - |
| - | - | - | - | - | - | - | - | Décors | 1 | 4500 | - | 4500 | - | - |
| - | - | - | - | - | - | - | - | Colle | 2.5 | 2200 | - | 5500 | - | - |
| - | - | - | - | - | - | - | - | Fermajoint | 0.25 | 900 | - | 225 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.8 | 1100 | - | 1980 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 22405 | 32487.25 |
| - | - | - | - | - | - | - | - | Carrelage de bac à douches | - | - | - | - | - | - |
| - | - | MAIN - D'ŒUVRE | - | - | - | - | - | Carrelage | 1.2 | 12300 | - | 14760 | - | - |
| G. | 56 | Carreleur | h. | 1400 | - | - | - | Sable | 0.07 | 12500 | - | 875.0 | - | - |
| G. | 57 | Manœuvre | h. | 800 | - | - | - | Ciment | 20 | 93 | - | 1860 | - | - |
| - | - | - | - | - | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - |
| G. | 59 | Taux horaire moyen | h. | 1100 | - | - | - | - | - | - | m² | - | 20795 | 33272 |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | MOQUETTE | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Moquette posée à la colle sur sol ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | fourniture à 3600F au m² | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Moquette | 1.1 | 3600 | - | 3960.0 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.4 | 16150 | - | 6460 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.8 | 1100 | - | 1980 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 12400 | 19840 |
| - | - | - | - | - | - | - | - | Moquette posée à la colle sur sol ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | fourniture à 8500F au m² | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Moquette | 1.1 | 8500 | - | 9350 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.4 | 16150 | - | 6460 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.8 | 1100 | - | 1980 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 17790 | 28464 |
| - | - | - | - | - | - | - | - | Moquette posée à la colle sur sol ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | fourniture à 13500F au m² | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Moquette | 1.1 | 13500 | - | 14850.0 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.4 | 16150 | - | 6460 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.8 | 1100 | - | 1980 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 23290 | 37264 |
| - | - | - | - | - | - | - | - | Pose de barres de seuils en laiton de 73 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Barres de seuil | 1 | 4500 | - | 4500 | - | - |
| - | - | - | - | - | - | - | - | Vis | 5 | 20 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 5 | 20 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 5800 | 9280 |
| - | - | - | - | - | - | - | - | Pose de barres de seuils en laiton de 83 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Barres de seuil | 1 | 5000 | - | 5000 | - | - |
| - | - | - | - | - | - | - | - | Vis | 5 | 20 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 5 | 20 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 6300 | 10080 |
| - | - | - | - | - | - | - | - | Pose de barres de seuils en laiton de 146 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Barres de seuil | 1 | 10200 | - | 10200 | - | - |
| - | - | - | - | - | - | - | - | Vis | 5 | 20 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | Chevilles | 5 | 20 | - | 100 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 11500 | 18400 |
| - | - | - | - | - | - | - | - | Pose de dlles thermoplastique de 33x33 | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | collées sur chape ciment | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Dalles | 1 | 4290 | - | 4290 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.4 | 16150 | - | 6460 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 12400 | 19840 |
| - | - | - | - | - | - | - | - | Revêtement de sol en vinyl grande largeur | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | posé à la colle | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Vinyl | 1 | 3200 | - | 3200 | - | - |
| - | - | - | - | - | - | - | - | Colle | 0.4 | 16150 | - | 6460 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 11310 | 18096 |
| - | - | - | - | - | - | - | - | Chapes ciment talochée, pour revêtements | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de sols collés, épaisseur 5 cm | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.06 | 12500 | - | 750 | - | - |
| - | - | - | - | - | - | - | - | Ciment | 20 | 93 | - | 1860 | - | - |
| - | - | - | - | - | - | - | - | M.O | 1 | 1100 | - | 1100 | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 3710 | 5379.5 |

---

## 15 — Ferronnerie-ConstructionMétalli

*Lignes : 440 | Colonnes : 16*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 | Col16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| - | - | - | - | - | - | - | - | Fabrication de grille de protection en tube fer carré de 20x20, | - | - | - | - | - | - | - |
| - | - | FERRONNERIE | - | - | - | - | - | avec pattes à scellement, compris dégraissage et peinture antirouille | - | - | - | - | - | - | - |
| G. | 15 | Tube de 80x80 | ml | 3850 | - | 5852 | 8485.4 | Grille de 150x130 | - | - | - | - | - | - | - |
| G. | 16 | Tube de 60x30 | ml | 2620 | - | 3982.4 | 5774.48 | Tubes | 24 | 800 | - | 19200 | - | - | - |
| G. | 17 | Tube de 40x40 | ml | 2230 | - | 3389.6 | 4914.92 | Electrodes | 5 | 60 | - | 300 | - | - | - |
| G. | 18 | Tube de 35x35 | ml | 1950 | - | 2964 | 4297.8 | Antirouille | 0.5 | 3900 | - | 1950 | - | - | - |
| G. | 19 | Tube de 30x30 | ml | 1580 | - | 2401.6 | 3482.32 | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 20 | Tube de 25x25 | ml | 1000 | - | 1520 | 2204 | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 21 | Tube de 20x20 | ml | 800 | - | 1216 | 1763.2 | M.O | 8 | 1100 | - | 8800 | - | - | - |
| G. | 22 | Tube de 16x16 | ml | 450 | - | 684 | 991.8 | - | - | - | U | - | 30570 | 48912 | - |
| G. | 23 | Tube fer rond de 20/27 | ml | 470 | - | 714.4 | 1035.88 | Grille de 130x130 | - | - | - | - | - | - | - |
| G. | 24 | Tube fer rond de 26/34 | ml | 720 | - | 1094.4 | 1586.88 | Tubes | 22 | 800 | - | 17600 | - | - | - |
| G. | 25 | Tube fer rond de 40/40 | ml | 1100 | - | 1672 | 2424.4 | Electrodes | 5 | 60 | - | 300 | - | - | - |
| G. | 26 | Fer rond de 6 (6ml) | ml | 140 | - | 212.8 | 308.56 | Antirouille | 0.5 | 3900 | - | 1950 | - | - | - |
| G. | 27 | Fer rond de 10 (6ml) | ml | 370 | - | 562.4 | 815.48 | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 28 | Fer rond de 16 (6ml) | ml | 1100 | - | 1672 | 2424.4 | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 29 | IPE de 80 en 12,00M | ml | 4350 | - | 6612 | 9587.4 | M.O | 7 | 1100 | - | 7700 | - | - | - |
| G. | 30 | IPE de 120 en 12,00M | ml | 7800 | - | 11856 | 17191.2 | - | - | - | U | - | 27870 | 44592 | - |
| G. | 31 | IPE de 160 en 12,00M | ml | 12100 | - | 18392 | 26668.4 | Grille de 150x90 | - | - | - | - | - | - | - |
| G. | 32 | IPE de 180 en 12,00M | ml | 15200 | - | 23104 | 33500.8 | Tubes | 18 | 800 | - | 14400 | - | - | - |
| G. | 33 | IPE de 200 en 12,00M | ml | 17700 | - | 26904 | 39010.8 | Electrodes | 5 | 60 | - | 300 | - | - | - |
| G. | 34 | IPE de 220 en 12,00M | ml | 20700 | - | 31464 | 45622.8 | Antirouille | 0.4 | 3900 | - | 1560 | - | - | - |
| G. | 35 | IPE de 270 en 12,00M | ml | 29300 | - | 44536 | 64577.2 | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 36 | IPE de 300 en 12,00M | ml | 33300 | - | 50616 | 73393.2 | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 37 | Stop-bloc de 24 en 4,OOM | ml | 22500 | - | 34200 | 49590 | M.O | 7 | 1100 | - | 7700 | - | - | - |
| G. | 38 | Stop-bloc de 47.5 en 4,OOM | ml | 37600 | - | 57152 | 82870.4 | - | - | - | U | - | 24280 | 38848 | - |
| G. | 39 | Cornière de 30 | ml | 860 | - | 1307.2 | 1895.44 | Grille de 130x90 | - | - | - | - | - | - | - |
| G. | 40 | Cornière de 35 | ml | 1360 | - | 2067.2 | 2997.44 | Tubes | 17 | 800 | - | 13600 | - | - | - |
| G. | 41 | Cornière de 40 | ml | 1720 | - | 2614.4 | 3790.88 | Electrodes | 4 | 60 | - | 240 | - | - | - |
| G. | 42 | Cornière de 45 | ml | 2480 | - | 3769.6 | 5465.92 | Antirouille | 0.4 | 3900 | - | 1560 | - | - | - |
| G. | 43 | Cornière de 60 | ml | 3980 | - | 6049.6 | 8771.92 | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 44 | Tés de 35 | ml | 1920 | - | 2918.4 | 4231.68 | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 45 | Tés de 40 | ml | 2150 | - | 3268 | 4738.6 | M.O | 6 | 1100 | - | 6600 | - | - | - |
| G. | 46 | Tés de 50 | ml | 3250 | - | 4940 | 7163 | - | - | - | U | - | 22320 | 35712 | - |
| G. | 47 | Tôle noire 8/10 | m² | 6350 | - | 9652 | 13995.4 | Grille de 150x110 | - | - | - | - | - | - | - |
| G. | 48 | Tôle noire 10/10 | m² | 7770 | - | 11810.4 | 17125.08 | Tubes | 21 | 800 | - | 16800 | - | - | - |
| G. | 49 | Tôle noire 15/10 | m² | 10450 | - | 15884 | 23031.8 | Electrodes | 5 | 60 | - | 300 | - | - | - |
| G. | 50 | Tôle noire 20/10 | m² | 13350 | - | 20292 | 29423.4 | Antirouille | 0.5 | 3900 | - | 1950 | - | - | - |
| G. | 51 | Tôle noire 30/10 | m² | 19250 | - | 29260 | 42427 | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 52 | Tôle noire 60/10 | m² | 38550 | - | 58596 | 84964.2 | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 53 | Tôle noire de 1 | m² | 64300 | - | 97736 | 141717.2 | M.O | 7 | 1100 | - | 7700 | - | - | - |
| G. | 54 | Tôle galvanisée de 10/10 | m² | 11550 | - | 17556 | 25456.2 | - | - | - | U | - | 27070 | 43312 | - |
| G. | 55 | Tôle galvanisée de 20/10 | ²m | 21100 | - | 32072 | 46504.4 | Grille de 90x90 | - | - | - | - | - | - | - |
| G. | 56 | Plat de 20x4 | ml | 510 | - | 775.2 | 1124.04 | Tubes | 12 | 800 | - | 9600 | - | - | - |
| G. | 57 | Plat de 30x10 | ml | 1740 | - | 2644.8 | 3834.96 | Electrodes | 3 | 60 | - | 180 | - | - | - |
| G. | 58 | Plat de 30x4 | ml | 700 | - | 1064 | 1542.8 | Antirouille | 0.3 | 3900 | - | 1170 | - | - | - |
| G. | 59 | Plat de 40x4 | ml | 950 | - | 1444 | 2093.8 | Sable | 0.005 | 13000 | - | 65 | - | - | - |
| G. | 60 | Plat de 40x10 | ml | 2520 | - | 3830.4 | 5554.08 | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 61 | Plat de 50x6 | ml | 1790 | - | 2720.8 | 3945.16 | M.O | 4 | 1100 | - | 4400 | - | - | - |
| G. | 62 | Plat de 60x6 | ml | 2140 | - | 3252.8 | 4716.56 | - | - | - | U | - | 15605 | 24968 | - |
| G. | 63 | Plat de 100x6 | ml | 3560 | - | 5411.2 | 7846.24 | Grille de Climatiseur | - | - | - | - | - | - | - |
| G. | 64 | UPN de 80 | ml | 5900 | - | - | - | Tubes | 9 | 800 | - | 7200 | - | - | - |
| G. | 65 | UPN de 140 | ml | 11700 | - | - | - | Electrodes | 2 | 60 | - | 120 | - | - | - |
| G. | 66 | Paumelles "Maroc" de 70 | U | 850 | - | - | - | Antirouille | 0.2 | 3900 | - | 780 | - | - | - |
| G. | 67 | Paumelles "Maroc" de 100 | U | 900 | - | - | - | Sable | 0.005 | 13000 | - | 65 | - | - | - |
| G. | 68 | Paumelles "Maroc" de 140 | U | 1250 | - | - | - | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 69 | Roues de portails | U | 12980 | - | - | - | M.O | 3 | 1100 | - | 3300 | - | - | - |
| G. | 70 | Serrures à crochet | U | 13030 | - | - | - | - | - | - | U | - | 11655 | 18648 | - |
| G. | 71 | Guides portails | U | 3500 | - | - | - | Fabrication de Grille pour portes 1 ou 2 ouvrants, en tube fer carré, | - | - | - | - | - | - | - |
| G. | 72 | Rails de portails suspendus | ml | 9800 | - | - | - | compris paumelles "Maroc" de 70 et verrou deux entrées, dégraissage et peinture antirouille | - | - | - | - | - | - | - |
| G. | 73 | Chariots portails suspendus | U | 17500 | - | - | - | Porte de 85x225 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 40 | 6 | 2230 | - | 13380 | - | - | - |
| G. | 75 | Roues de portails suspendus | U | 14500 | - | - | - | Tubes de 25 | 8 | 20 | - | 160 | - | - | - |
| G. | 76 | Electrodes 3.15 | U | 60 | - | - | - | Tubes de 20 | 12 | 800 | - | 9600 | - | - | - |
| G. | 77 | Verrou 2 entrées | U | 40680 | - | - | - | Paumelles | 3 | 850 | - | 2550 | - | - | - |
| G. | 78 | Verrou encastrés | U | 3400 | - | - | - | Vérrou | 1 | 40680 | - | 40680 | - | - | - |
| G. | 79 | Bacs alu 6/10 | m² | 5870 | - | - | - | Electrode | 10 | 60 | - | 600 | - | - | - |
| G. | 80 | Faitières alu | ml | 3940 | - | - | - | Antirouille | 1 | 3900 | - | 3900 | - | - | - |
| G. | 81 | Fixations tiges filetées | U | 585 | - | - | - | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 82 | Paxalu de 40 | m² | 4860 | - | - | - | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 83 | Flinkote | kg | 1550 | - | - | - | M.O | 12 | 1100 | - | 13200 | - | - | - |
| G. | 84 | Antirouille | kg | 3900 | - | - | - | - | - | - | U | - | 84390 | 135024 | - |
| G. | 85 | Sable | m3 | 13000 | - | - | - | Porte de 95x225 | - | - | - | - | - | - | - |
| G. | 86 | Gravier | m3 | 38000 | - | - | - | Tubes de 40 | 6 | 2230 | - | 13380 | - | - | - |
| G. | 87 | Ciment | kg | 95 | - | - | - | Tubes de 25 | 9 | 1000 | - | 9000 | - | - | - |
| G. | 88 | Gaz "cartouche" | U | 850 | - | - | - | Tubes de 20 | 14 | 800 | - | 11200 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 850 | - | 2550 | - | - | - |
| - | - | - | - | - | - | - | - | Vérrou | 1 | 40680 | - | 40680 | - | - | - |
| - | - | BOULONNERIE | - | - | - | - | - | Electrode | 12 | 60 | - | 720 | - | - | - |
| G. | 92 | Boulons de 14x40 | U | 230 | - | - | - | Antirouille | 1.2 | 3900 | - | 4680 | - | - | - |
| G. | 93 | Boulons de 8x80 | U | 60 | - | - | - | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 94 | Tiges filettées de 22 | U | 5300 | - | - | - | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 95 | Tiges filettées de 20 | U | 5300 | - | - | - | M.O | 13 | 1100 | - | 14300 | - | - | - |
| G. | 96 | Tiges filettées de 16 | U | 5300 | - | - | - | - | - | - | U | - | 96830 | 154928 | - |
| G. | 97 | Tiges filettées de 14 | U | 5300 | - | - | - | Porte de 105x225 | - | - | - | - | - | - | - |
| G. | 98 | Tiges filettées de 12 | U | 5300 | - | - | - | Tubes de 40 | 7 | 2230 | - | 15610 | - | - | - |
| G. | 99 | Tiges filettées de 10 | U | 5300 | - | - | - | Tubes de 25 | 10 | 1000 | - | 10000 | - | - | - |
| G. | 100 | Ecrous de 22 | U | 670 | - | - | - | Tubes de 20 | 16 | 800 | - | 12800 | - | - | - |
| G. | 101 | Ecrous de 20 | U | 670 | - | - | - | Paumelles | 3 | 850 | - | 2550 | - | - | - |
| G. | 102 | Ecrous de 16 | U | 670 | - | - | - | Vérrou | 1 | 40680 | - | 40680 | - | - | - |
| G. | 103 | Ecrous de 14 | U | 670 | - | - | - | Electrode | 15 | 60 | - | 900 | - | - | - |
| G. | 104 | Ecrous de 12 | U | 670 | - | - | - | Antirouille | 1.5 | 3900 | - | 5850 | - | - | - |
| G. | 105 | Ecrous de 10 | U | 670 | - | - | - | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| G. | 106 | Rondelles de 14 | U | 115 | - | - | - | Ciment | 2 | 95 | - | 190 | - | - | - |
| G. | 107 | Rondelles de 12 | U | 60 | - | - | - | M.O | 15 | 1100 | - | 16500 | - | - | - |
| G. | 108 | Rondelles de 10 | U | 50 | - | - | - | - | - | - | U | - | 105210 | 168336 | - |
| G. | 109 | Rondelles de 8 | U | 30 | - | - | - | Porte de 146x225 | - | - | - | - | - | - | - |
| G. | 110 | Rondelles de 22 | U | 150 | - | - | - | Tubes de 40 | 7 | 2230 | - | 15610 | - | - | 3345 |
| - | - | - | - | - | - | - | - | Tubes de 25 | 15 | 1000 | - | 15000 | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 20 | 24 | 800 | - | 19200 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 6 | 850 | - | 5100 | - | - | - |
| - | - | - | - | - | - | - | - | Vérrou encastré | 1 | 3400 | - | 3400 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 40680 | - | 40680 | - | - | - |
| - | - | MAIN-D'ŒUVRE | - | - | - | - | - | Electrode | 20 | 60 | - | 1200 | - | - | - |
| G. | 117 | Ferronier | h. | 1400 | - | - | - | Antirouille | 2 | 3900 | - | 7800 | - | - | - |
| G. | 118 | Manœuvre | h. | 800 | - | - | - | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 3 | 95 | - | 285 | - | - | - |
| G. | 120 | Taux horaire moyen | h. | 1100 | - | - | - | M.O | 20 | 1100 | - | 22000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 130405 | 208648 | - |
| - | - | - | - | - | - | - | - | Fabrication de portillon de clôture, tôlé, compris | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | verrou à deux entrées, dégraissage, peinture antirouille | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 40 | 8 | 3389.6 | - | 27116.8 | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 20 | 2 | 1216 | - | 2432 | - | - | - |
| - | - | - | - | - | - | - | - | Tôles 8/10 | 2 | 7770 | - | 15540 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 40x4 | 0.5 | 1444 | - | 722 | - | - | - |
| - | - | - | - | - | - | - | - | Fer rond de 16 | 0.2 | 1672 | - | 334.4 | - | - | - |
| - | - | - | - | - | - | - | - | Tube rond | 0.1 | 714.4 | - | 71.44 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 12500 | - | 12500 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 10 | 60 | - | 600 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 2 | 4800 | - | 9600 | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.005 | 15000 | - | 75 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 2 | 100 | - | 200 | - | - | - |
| - | - | - | - | - | - | - | - | M.O fabric | 10 | 1100 | - | 11000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O pose | 6 | 1100 | - | 6600 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 86791.64 | rre | - |
| - | - | - | - | - | - | - | - | Fabrication et pose de portails de 400x200 à 2 ouvrants, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | en tube carrés de 40x40 et tôles de 10/10 verrous bayonette | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | encastrés porte cadenas, compris dégraissage et peinture antirouille | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 40 | 24 | 2230 | - | 53520 | - | - | - |
| - | - | - | - | - | - | - | - | Tôles 15/10 | 8 | 7770 | - | 62160 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 40x4 | 1 | 950 | - | 950 | - | - | - |
| - | - | - | - | - | - | - | - | Fer rond de 16 | 1 | 1100 | - | 1100 | - | - | - |
| - | - | - | - | - | - | - | - | Tube rond | 1 | 470 | - | 470 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 30x4 | 4 | 700 | - | 2800 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 50 | 60 | - | 3000 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 6 | 3900 | - | 23400 | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.01 | 13000 | - | 130 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 3 | 95 | - | 285 | - | - | - |
| - | - | - | - | - | - | - | - | M.O fabric | 35 | 1100 | - | 38500 | - | - | - |
| - | - | - | - | - | - | - | - | M.O pose | 16 | 1100 | - | 17600 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 203915 | 326264 | - |
| - | - | - | - | - | - | - | - | Fabrication et pose de portails de 400x200 à déplacement latéral | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | sur rail, en tubes carrés de 40x40, tôles de 10/10, serrure à crochet, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | rail scellé au sol, roues acier, compris dégraissage et peinture antirouille | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tube de 40 | 18 | 2230 | - | 40140 | - | - | - |
| - | - | - | - | - | - | - | - | Tube de 80x40 | 4 | 3850 | - | 15400 | - | - | - |
| - | - | - | - | - | - | - | - | Tôles de 10/10 | 8 | 7770 | - | 62160 | - | - | - |
| - | - | - | - | - | - | - | - | Cornières de 40 | 3 | 1720 | - | 5160 | - | - | - |
| - | - | - | - | - | - | - | - | Tés de 40 | 8 | 2150 | - | 17200 | - | - | - |
| - | - | - | - | - | - | - | - | Roulettes | 2 | 12980 | - | 25960 | - | - | - |
| - | - | - | - | - | - | - | - | Guides | 2 | 3500 | - | 7000 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 13030 | - | 13030 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 50 | 60 | - | 3000 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 6 | 3900 | - | 23400 | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.1 | 13000 | - | 1300 | - | - | - |
| - | - | - | - | - | - | - | - | Gravier | 0.2 | 38000 | - | 7600 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 170 | 95 | - | 16150 | - | - | - |
| - | - | - | - | - | - | - | - | M.O fabric | 40 | 1100 | - | 44000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O pose | 25 | 1100 | - | 27500 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 309000 | 494400 | - |
| - | - | - | - | - | - | - | - | Fabrication et pose de grilles pour clôture de 1 mètre de haut, lisses hautes | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | et basses en tubes carrés de 40x40, barreaux verticaux en cornières de 30 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | avec pointes sur le haut, compris dégraissage et peinture antirouille | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 40 | 2.2 | 2230 | - | 4906 | - | - | - |
| - | - | - | - | - | - | - | - | Cornières | 7 | 1360 | - | 9520 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 6 | 60 | - | 360 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 1 | 3900 | - | 3900 | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.005 | 13000 | - | 65 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1 | 95 | - | 95 | - | - | - |
| - | - | - | - | - | - | - | - | M.O fabric | 5 | 1100 | - | 5500 | - | - | - |
| - | - | - | - | - | - | - | - | M.O pose | 2 | 1100 | - | 2200 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 26546 | 42473.6 | - |
| - | - | - | - | - | - | - | - | Fabrication et pose de grilles décoratives pour clôture, de 1 mètre de haut, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | lisses hautes et basses en tubes carrés de 40x40, barreaux en tubes de 20x20 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | avec pointes sur le haut, voluptes entre barreaux en fer plat de 20, compris | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | dégraissage et peinture antirouille | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 40 | 3 | 2230 | - | 6690 | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 20 | 7 | 800 | - | 5600 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 20 | 9 | 510 | - | 4590 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 20 | 60 | - | 1200 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 2 | 3900 | - | 7800 | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.005 | 13000 | - | 65 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1 | 95 | - | 95 | - | - | - |
| - | - | - | - | - | - | - | - | M.O fabric | 10 | 1100 | - | 11000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O pose | 2 | 1100 | - | 2200 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 39240 | 62784 | - |
| - | - | - | - | - | - | - | - | Fabrication de portes métalliques en tôles sur tubes carrés | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 40x40, cadres en cornières de 45, serrures en canon, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | paumelles "Maroc", compris dégraissage et peinture antirouille | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Porte de 80x220 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cornières | 6 | 2480 | - | 14880 | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 40 | 8 | 2230 | - | 17840 | - | - | - |
| - | - | - | - | - | - | - | - | Tôles | 2 | 7770 | - | 15540 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 3 | 850 | - | 2550 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 3400 | - | 3400 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 15 | 60 | - | 900 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 5 | 3900 | - | 19500 | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.005 | 13000 | - | 65 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1 | 95 | - | 95 | - | - | - |
| - | - | - | - | - | - | - | - | M.O fabric | 45 | 1100 | - | 49500 | - | - | - |
| - | - | - | - | - | - | - | - | M.O pose | 14 | 1100 | - | 15400 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 139670 | 223472 | - |
| - | - | - | - | - | - | - | - | Porte de 140x220 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cornières | 6 | 2480 | - | 14880 | - | - | - |
| - | - | - | - | - | - | - | - | Tubes de 40 | 6 | 2230 | - | 13380 | - | - | - |
| - | - | - | - | - | - | - | - | Tôles | 4 | 7770 | - | 31080 | - | - | - |
| - | - | - | - | - | - | - | - | Paumelles | 6 | 850 | - | 5100 | - | - | - |
| - | - | - | - | - | - | - | - | Serrure | 1 | 40680 | - | 40680 | - | - | - |
| - | - | - | - | - | - | - | - | Verrous | 2 | 3400 | - | 6800 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 15 | 60 | - | 900 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 5 | 3900 | - | 19500 | - | - | - |
| - | - | - | - | - | - | - | - | Sable | 0.005 | 13000 | - | 65 | - | - | - |
| - | - | - | - | - | - | - | - | Ciment | 1 | 95 | - | 95 | - | - | - |
| - | - | - | - | - | - | - | - | M.O fabric | 45 | 1100 | - | 49500 | - | - | - |
| - | - | - | - | - | - | - | - | M.O pose | 14 | 1100 | - | 15400 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 197380 | 315808 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CONSTRUCTION  METALLIQUE | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Construction de charpentes métalliques en IPE pour poteaux et poutres, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | compris platines et goussets en fer plat, crochets de fixations aux socles | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de fondations, travées de 5 mètres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pour portée de 8 mètres IPE de 120 pour poteaux et poutres, platines en plat | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 10m/m, goussets en plat de 6m/m, tiges filetées de 16 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour ancrage aux fondations compris peinture antirouille, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | hauteur de poteaux 6 mètres, pente 25%, débords de 1mètre | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poteaux | 12 | 7800 | - | 93600 | - | - | - |
| - | - | - | - | - | - | - | - | Poutres | 11 | 7800 | - | 85800 | - | - | - |
| - | - | - | - | - | - | - | - | Platines | 0.2 | 64300 | - | 12860 | - | - | - |
| - | - | - | - | - | - | - | - | Goussets | 0.1 | 64300 | - | 6430 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 100x6 | 2.5 | 3560 | - | 8900 | - | - | - |
| - | - | - | - | - | - | - | - | Tiges de 16 | 2 | 5300 | - | 10600 | - | - | - |
| - | - | - | - | - | - | - | - | Ecrous de 16 | 2 | 670 | - | 1340 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 16 | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 14 | 14 | 230 | - | 3220 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 14 | 14 | 115 | - | 1610 | - | - | - |
| - | - | - | - | - | - | - | - | Cornière de 35 | 1 | 1360 | - | 1360 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 30 | 1 | 700 | - | 700 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 25 | 60 | - | 1500 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 7 | 3900 | - | 27300 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 70 | 1100 | - | 77000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Montage | 35 | 1100 | - | 38500 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 371180 | 593888 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pour portée de 10 mètres IPE de 120 pour poteaux et poutres, platines en plat | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 10m/m, goussets en plat de 6m/m, tiges filetées de 16 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour ancrage aux fondations compris peinture antirouille, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | hauteur de poteaux 6 mètres, pente 25%, débords de 1mètre | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poteaux | 12 | 7800 | - | 93600 | - | - | - |
| - | - | - | - | - | - | - | - | Poutres | 13 | 7800 | - | 101400 | - | - | - |
| - | - | - | - | - | - | - | - | Platines | 0.2 | 64300 | - | 12860 | - | - | - |
| - | - | - | - | - | - | - | - | Goussets | 0.2 | 64300 | - | 12860 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 100x6 | 3 | 3560 | - | 10680 | - | - | - |
| - | - | - | - | - | - | - | - | Tiges de 18 | 2 | 5300 | - | 10600 | - | - | - |
| - | - | - | - | - | - | - | - | Ecrous de 18 | 2 | 670 | - | 1340 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 18 | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 14 | 14 | 230 | - | 3220 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 14 | 14 | 115 | - | 1610 | - | - | - |
| - | - | - | - | - | - | - | - | Cornière de 35 | 1 | 1360 | - | 1360 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 30 | 1 | 700 | - | 700 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 25 | 60 | - | 1500 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 8 | 3900 | - | 31200 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 70 | 1100 | - | 77000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Montage | 35 | 1100 | - | 38500 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 398890 | 638224 | - |
| - | - | - | - | - | - | - | - | Pour portée de 12 mètres IPE de 120 pour poteaux et poutres, platines en plat | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 10m/m, goussets en plat de 6m/m, tiges filetées de 16 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour ancrage aux fondations compris peinture antirouille, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | hauteur de poteaux 6 mètres, pente 25%, débords de 1mètre | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poteaux | 12 | 12100 | - | 145200 | - | - | - |
| - | - | - | - | - | - | - | - | Poutres | 15 | 12100 | - | 181500 | - | - | - |
| - | - | - | - | - | - | - | - | Platines | 0.3 | 64300 | - | 19290 | - | - | - |
| - | - | - | - | - | - | - | - | Goussets | 0.2 | 64300 | - | 12860 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 100x6 | 3.5 | 3560 | - | 12460 | - | - | - |
| - | - | - | - | - | - | - | - | Tiges de 20 | 2 | 5300 | - | 10600 | - | - | - |
| - | - | - | - | - | - | - | - | Ecrous de 20 | 2 | 670 | - | 1340 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 20 | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 14 | 14 | 230 | - | 3220 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 14 | 14 | 115 | - | 1610 | - | - | - |
| - | - | - | - | - | - | - | - | Cornière de 35 | 1 | 1360 | - | 1360 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 30 | 1 | 700 | - | 700 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 35 | 60 | - | 2100 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 9 | 3900 | - | 35100 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 80 | 1100 | - | 88000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Montage | 50 | 1100 | - | 55000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 570800 | 913280 | - |
| - | - | - | - | - | - | - | - | Pour portée de 16 mètres IPE de 120 pour poteaux et poutres, platines en plat | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de 10m/m, goussets en plat de 6m/m, tiges filetées de 16 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour ancrage aux fondations compris peinture antirouille, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | hauteur de poteaux 6 mètres, pente 25%, débords de 1mètre | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poteaux | 12 | 20700 | - | 248400 | - | - | - |
| - | - | - | - | - | - | - | - | Poutres | 19 | 20700 | - | 393300 | - | - | - |
| - | - | - | - | - | - | - | - | Platines | 4 | 64300 | - | 257200 | - | - | - |
| - | - | - | - | - | - | - | - | Goussets | 0.6 | 64300 | - | 38580 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 100x6 | 4 | 3560 | - | 14240 | - | - | - |
| - | - | - | - | - | - | - | - | Tiges de 22 | 2 | 5300 | - | 10600 | - | - | - |
| - | - | - | - | - | - | - | - | Ecrous de 22 | 2 | 670 | - | 1340 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 22 | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 14 | 14 | 230 | - | 3220 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 14 | 14 | 115 | - | 1610 | - | - | - |
| - | - | - | - | - | - | - | - | Cornière de 35 | 1 | 1360 | - | 1360 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 30 | 1 | 700 | - | 700 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 40 | 60 | - | 2400 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 12 | 3900 | - | 46800 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 90 | 1100 | - | 99000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Montage | 70 | 1100 | - | 77000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 1196210 | 1913936 | - |
| - | - | - | - | - | - | - | - | Pour portée de 16 mètres IPE de 120 pour poteaux et poutres, platines en plat | 270 | pour poteaux | et poutres,placinesen plat | - | - | - | - |
| - | - | - | - | - | - | - | - | de 10m/m, goussets en plat de 6m/m, tiges filetées de 16 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour ancrage aux fondations compris peinture antirouille, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | hauteur de poteaux 6 mètres, pente 25%, débords de 1mètre | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poteaux | 12 | 29300 | - | 351600 | - | - | - |
| - | - | - | - | - | - | - | - | Poutres | 24 | 29300 | - | 703200 | - | - | - |
| - | - | - | - | - | - | - | - | Platines | 0.4 | 64300 | - | 25720 | - | - | - |
| - | - | - | - | - | - | - | - | Goussets | 0.3 | 64300 | - | 19290 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 100x6 | 4.5 | 3560 | - | 16020 | - | - | - |
| - | - | - | - | - | - | - | - | Tiges de 22 | 2 | 5300 | - | 10600 | - | - | - |
| - | - | - | - | - | - | - | - | Ecrous de 22 | 2 | 670 | - | 1340 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 22 | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 14 | 20 | 230 | - | 4600 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 14 | 20 | 115 | - | 2300 | - | - | - |
| - | - | - | - | - | - | - | - | Cornière de 35 | 1 | 1360 | - | 1360 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 30 | 1 | 700 | - | 700 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 45 | 60 | - | 2700 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 16 | 3900 | - | 62400 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 100 | 1100 | - | 110000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Montage | 80 | 1100 | - | 88000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 1400290 | 2240464 | - |
| - | - | - | - | - | - | - | - | Pour portée de 25 mètres IPE de 300 pour poteaux et poutres, platines en plat 300 pour poteaux et | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | poutres,placinesen plat de 10m/m, goussets en plat de 6m/m, tiges filetées de 16 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour ancrage aux fondations compris peinture antirouille, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | hauteur de poteaux 6 mètres, pente 25%, débords de 1mètre | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Poteaux | 12 | 33300 | - | 399600 | - | - | - |
| - | - | - | - | - | - | - | - | Poutres | 26 | 33300 | - | 865800 | - | - | - |
| - | - | - | - | - | - | - | - | Platines | 0.6 | 64300 | - | 38580 | - | - | - |
| - | - | - | - | - | - | - | - | Goussets | 0.3 | 64300 | - | 19290 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 100x6 | 5 | 3560 | - | 17800 | - | - | - |
| - | - | - | - | - | - | - | - | Tiges de 22 | 2 | 5300 | - | 10600 | - | - | - |
| - | - | - | - | - | - | - | - | Ecrous de 22 | 2 | 670 | - | 1340 | - | - | - |
| - | - | - | - | - | - | - | - | Paxalu | 0.3 | 4860 | - | 1458 | - | - | - |
| - | - | - | - | - | - | - | - | Gaz | 0.1 | 850 | - | 85 | - | - | - |
| - | - | - | - | - | - | - | - | Fixation | 2 | 585 | - | 1170 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 1357373 | 2171796.8 | - |
| - | - | - | - | - | - | - | - | Fabrication de portail mètallique suspendu, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | à déplacement latéral, compris sabots | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de quidage et porte cadenas, dimensions 400x400 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cornières 40 | 18 | 1720 | - | 30960 | - | - | - |
| - | - | - | - | - | - | - | - | Tès 40 | 24 | 2150 | - | 51600 | - | - | - |
| - | - | - | - | - | - | - | - | Tôles 15/10 | 16 | 10450 | - | 167200 | - | - | - |
| - | - | - | - | - | - | - | - | Plat 60x6 | 12 | 3560 | - | 42720 | - | - | - |
| - | - | - | - | - | - | - | - | Guiges | 4 | 3500 | - | 14000 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles | 2 | 17500 | - | 35000 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons 14 | 8 | 230 | - | 1840 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles 14 | 8 | 115 | - | 920 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 100 | 60 | - | 6000 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 16 | 3900 | - | 62400 | - | - | - |
| - | - | - | - | - | - | - | - | M.O.frabricat. | 120 | 1100 | - | 132000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 60 | 1100 | - | 66000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 610640 | 977024 | - |
| - | - | - | - | - | - | - | - | Fabrication de portail mètallique suspendu, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | à déplacement latéral, compris sabots | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | de quidage et porte cadenas, dimensions 500x500 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cornières 40 | 24 | 1720 | - | 41280 | - | - | - |
| - | - | - | - | - | - | - | - | Tès 40 | 36 | 2150 | - | 77400 | - | - | - |
| - | - | - | - | - | - | - | - | Tôles 15/10 | 25 | 10450 | - | 261250 | - | - | - |
| - | - | - | - | - | - | - | - | Plat 60x6 | 12 | 3560 | - | 42720 | - | - | - |
| - | - | - | - | - | - | - | - | Guiges | 4 | 3500 | - | 14000 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles | 2 | 17500 | - | 35000 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons 14 | 8 | 230 | - | 1840 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles 14 | 8 | 115 | - | 920 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 110 | 60 | - | 6600 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 25 | 3900 | - | 97500 | - | - | - |
| - | - | - | - | - | - | - | - | M.O.frabricat. | 100 | 1100 | - | 110000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 40 | 1100 | - | 44000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 732510 | 1172016 | - |
| - | - | - | - | - | - | - | - | Rondelles de 22 | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons de 14 | 22 | 230 | - | 5060 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles de 14 | 22 | 106 | - | 2332 | - | - | - |
| - | - | - | - | - | - | - | - | Cornière de 35 | 1 | 1360 | - | 1360 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 30 | 1 | 700 | - | 700 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 50 | 60 | - | 3000 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 20 | 3900 | - | 78000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 130 | 1100 | - | 143000 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Montage | 120 | 1100 | - | 132000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 365912 | 585459.2 | - |
| - | - | - | - | - | - | - | - | Fourniture et pose de pannes en IPE de | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | 80,compris percements pour fixation par | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | boulons de 8x30 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | IPE | 1 | 4350 | - | 4350 | - | - | - |
| - | - | - | - | - | - | - | - | Boulons | 1 | 60 | - | 60 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelles | 1 | 30 | - | 30 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 0.2 | 3900 | - | 780 | - | - | - |
| - | - | - | - | - | - | - | - | Bitume | 0.1 | 1550 | - | 155 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabricat | 2 | 1100 | - | 2200 | - | - | - |
| - | - | - | - | - | - | - | - | M.O. pose | 2 | 1100 | - | 2200 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 9775 | 15640 | - |
| - | - | - | - | - | - | - | - | Contreventement de travée en fer cornière de 40 posée en croix, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour portée jusqu'à 16mètres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cornière | 16 | 1720 | - | 27520 | - | - | - |
| - | - | - | - | - | - | - | - | Boulon de 12 | 4 | 230 | - | 920 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelle | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 50x4 | 0.5 | 1790 | - | 895 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 10 | 60 | - | 600 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 2 | 3900 | - | 7800 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 3 | 1100 | - | 3300 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Pose | 5 | 1100 | - | 5500 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | 46995 | 75192 | - |
| - | - | - | - | - | - | - | - | Contreventement de travée en fer cornière de 60 posée en croix, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | pour portée de 16 à 20mètres | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Cornière | 16 | 3980 | - | 63680 | - | - | - |
| - | - | - | - | - | - | - | - | Boulon de 12 | 4 | 230 | - | 920 | - | - | - |
| - | - | - | - | - | - | - | - | Rondelle | 4 | 115 | - | 460 | - | - | - |
| - | - | - | - | - | - | - | - | Plat de 50x4 | 0.5 | 1790 | - | 895 | - | - | - |
| - | - | - | - | - | - | - | - | Electrodes | 10 | 60 | - | 600 | - | - | - |
| - | - | - | - | - | - | - | - | Antirouille | 2 | 3900 | - | 7800 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Fabrication | 3 | 1100 | - | 3300 | - | - | - |
| - | - | - | - | - | - | - | - | M.O Pose | 5 | 1100 | - | 5500 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 83155 | 133048 | - |
| - | - | - | - | - | - | - | - | Couverture en BAC Alu 6/10ème fixation par tige filletées, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | compris façonnage des tiges | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | BAC Alu | 1 | 5870 | - | 5870 | - | - | - |
| - | - | - | - | - | - | - | - | Tige | 3 | 585 | - | 1755 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.4 | 1100 | - | 1540 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 9165 | 14664 | - |
| - | - | - | - | - | - | - | - | Faitage en Alu type "Nervural", compris fixation, | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Etanchéité complémentatire en Paxalu de 30 collée à chaud | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Faitière | 1 | 3940 | - | 3940 | - | - | - |
| - | - | - | - | - | - | - | - | Paxalu | 0.3 | 4860 | - | 1458 | - | - | - |
| - | - | - | - | - | - | - | - | Gaz | 0.1 | 850 | - | 85 | - | - | - |
| - | - | - | - | - | - | - | - | Fixations | 2 | 585 | - | 1170 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 1.5 | 1100 | - | 1650 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | ml | - | 8303 | 13284.8 | - |

---

## 16 — Peinture-Vitrerie-Tenture-Nétoy

*Lignes : 179 | Colonnes : 16*

| Col1 | N° | Matériaux | U | P.TTC | Date | Fournisseurs | Contacts | Libellé | Qté | P.U | U | Sommes | Déboursé | P.V Coéf 1.6 | Col16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G. | 15 | Enduit C | Kg | 1100 | Juil. 99 | Sogame | 760554 | PEINTURES | - | - | - | - | - | - | - |
| G. | 16 | Tropix | Kg | 980 | Juil. 99 | Sogame | 760554 | Préparation des murs en ciment: égrenage, Rebouchage à l'enduit de peintre, Ponçage | - | - | - | - | - | - | - |
| G. | 17 | Equatex | Kg | 1450 | Juil. 99 | Sogame | 760554 | Enduit | 0.3 | 1500 | - | 450 | - | - | - |
| G. | 18 | Pantex(30Kg) | Kg | 1880 | Juil. 99 | Sogame | 760554 | M.O | 0.5 | 1100 | - | 550 | - | - | - |
| G. | 19 | Pancryl(30Kg) | Kg | 2950 | Juil. 99 | Sogame | 760554 | - | - | - | m² | - | 1000 | 1600 | - |
| G. | 20 | Pantinox(20Kg) | Kg | 4750 | Juil. 99 | Sogame | 760554 | Préparation des supports bois: Rebouchage et Ponçage | - | - | - | - | - | - | - |
| G. | 21 | Pantimat(30Kg) | Kg | 2250 | Juil. 99 | Sogame | 760554 | Néo-Garnilox | 0.2 | 2800 | - | 560 | - | - | - |
| G. | 22 | Crépitex(30Kg=2Kg/m²) | Kg | 2000 | Juil. 99 | Sogame | 760554 | M.O | 0.4 | 1100 | - | 440 | - | - | - |
| G. | 23 | Pantigrés(30Kg=2,5Kg/m²) | Kg | 1600 | Juil. 99 | Sogame | 760554 | - | - | - | m² | - | 1000 | 1600 | - |
| G. | 24 | Pantexsol(30Kg) | Kg | 3980 | Juil. 99 | Sogame | 760554 | Peinture sur murs Extérieurs: Impression et 2 Couches de peinture Acrylique | - | - | - | - | - | - | - |
| G. | 25 | Vogor SR(30Kg) | Kg | 4630 | Juil. 99 | Sogame | 760554 | Peinture | 0.4 | 3000 | - | 1200 | - | - | - |
| G. | 26 | Antirouille SR(30Kg) | Kg | 2180 | Juil. 99 | Sogame | 760554 | M.O | 0.3 | 1100 | - | 330 | - | - | - |
| G. | 27 | Néo-Granilox(5Kg) | Kg | 2800 | Juil. 99 | Sogame | 760554 | - | - | - | m² | - | 1530 | 2448 | - |
| G. | 28 | Celdécor(5litres) | L | 9900 | Juil. 99 | Sogame | 760554 | Peinture sur murs Intérieurs: Impression et 2 Couches de peinture Vinylique | - | - | - | - | - | - | - |
| G. | 29 | Xyladécor(5Kg) | L | 7820 | Juil. 99 | Soga-Imp | 760554 | Peinture | 0.4 | 3000 | - | 1200 | - | - | - |
| G. | 30 | Top-Wood(5Kg) | L | 4570 | Juil. 99 | Soga-Imp | 760554 | M.O | 0.3 | 1100 | - | 330 | - | - | - |
| G. | 31 | Vernis Céllulosique | L | 3610 | Juil. 99 | Sogame | 760554 | - | - | - | m² | - | 1530 | 2448 | 3400 |
| G. | 32 | Diluant Cellulosique | L | 2485 | Juil. 99 | Sogame | 760554 | Peinture sur Plafonds Ciment: Impression et 2 Couches de peinture Vinylique | - | - | - | - | - | - | - |
| G. | 33 | Vernis Synthétique | L | 4400 | Juil. 99 | Sogame | 760554 | Peinture | 0.4 | 3000 | - | 1200 | - | - | - |
| G. | 34 | Diluant Synthétique | L | 2500 | Juil. 99 | Sogame | 760554 | M.O | 0.4 | 1100 | - | 440 | - | - | - |
| G. | 35 | Withe-Spirit | L | 1820 | Juil. 99 | Sogame | 760554 | - | - | - | m² | - | 1640 | 2624 | 3624 |
| G. | 36 | Colorants | U | 3070 | Juil. 99 | Sogame | 760554 | Peinture sur débords de toits: Impression et 2 couches de peinture à huile Mate | - | - | - | - | - | - | - |
| G. | 37 | Peinture BAC Alu | Kg | 3950 | Juil. 99 | - | - | Peinture | 0.4 | 2250 | - | 900 | - | - | - |
| G. | 38 | Pantexroute | Kg | 4100 | Juil. 99 | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - |
| G. | 39 | Nettoyant | L | 1900 | Juil. 99 | - | - | - | - | - | m² | - | 1340 | 2144 | - |
| G. | 40 | Réfléchissant | Kg | 4500 | Juil. 99 | - | - | Peinture sur Plafonds bois: Impression et 2 Couches de peinture Vinylique | - | - | - | - | - | - | - |
| G. | 41 | Ajax | L | 1400 | Juil. 99 | CK2 | - | Peinture | 0.4 | 2250 | - | 900 | - | - | - |
| G. | 42 | Vogor-Sol | L | 2900 | Juil. 99 | CK2 | - | M.O | 0.4 | 1100 | - | 440 | - | - | - |
| G. | 43 | Sèrpillière | U | 1200 | Juil. 99 | CK2 | - | - | - | - | m² | - | 1340 | 2144 | - |
| G. | 44 | Vitrex | L | 1200 | Juil. 99 | CK2 | - | Peinture sur Menuiserie bois: Impression et 2 couches de peinture Glycérophtalique | - | - | - | - | - | - | - |
| G. | 45 | Camion | H | 12500 | Juil. 99 | - | - | Peinture | 0.36 | 5200 | - | 1872 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.5 | 1100 | - | 550 | - | - | - |
| - | - | VITRERIE | - | - | - | - | - | - | - | - | m² | - | 2422 | 3875.2 | - |
| - | - | Lames naco de 70 | - | - | - | - | - | Peinture sur Ferronerie: Impression et 2 couches de peinture Glycérophtalique | - | - | - | - | - | - | - |
| G. | 50 | Verre Clair | U | 1180 | Juil. 99 | Brossette | 762200 | Peinture | 0.3 | 5200 | - | 1560 | - | - | - |
| G. | 51 | Verre Fumé | U | 1540 | Juil. 99 | Brossette | 762200 | M.O | 0.5 | 1100 | - | 550 | - | - | - |
| G. | 52 | Verre Imprimé | U | 1300 | Juil. 99 | Brossette | 762200 | - | - | - | m² | - | 2110 | 3376 | - |
| - | - | Vitrage | - | - | - | - | - | Peinture sur BAC Alu: Lessivage et 1 couche de peinture Spéciale | - | - | - | - | - | - | - |
| G. | 54 | Verre Clair 4m/m | m² | 14750 | Juil. 99 | Brossette | 762200 | Peinture | 0.4 | 3950 | - | 1580 | - | - | - |
| G. | 55 | Verre Clair 5m/m | m² | 17110 | Juil. 99 | Brossette | 762200 | M.O | 0.5 | 1100 | - | 550 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 2130 | 3408 | - |
| G. | 57 | Verre imprimé 4m/m | m² | 19000 | Juil.99 | Brossette | 762200 | Peinture sur Sols ciment: Epoussettage et 1 couche de peinture Sol | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Pantexsol | 0.5 | 3980 | - | 1990 | - | - | - |
| G. | 59 | Verre Fumé 4m/m | m² | 17000 | Juil. 99 | Brossette | 762200 | M.O | 0.5 | 1100 | - | 550 | - | - | - |
| G. | 60 | Verre Fumé 5m/m | m² | 19000 | Juil. 99 | Brossette | 762200 | - | - | - | m² | - | 2540 | 4064 | 5064 |
| - | - | - | - | - | - | - | - | Marquage de route à la peinture Blanche | - | - | - | - | - | - | - |
| G. | 62 | Colle d'étanchéité | U | 1800 | Juil. 99 | - | - | Peinture | 1 | 4100 | - | 4100 | - | - | - |
| - | - | - | - | - | - | - | - | Nettoyant | 0.4 | 1900 | - | 760 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 2 | 1100 | - | 2200 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 7060 | 11296 | - |
| - | - | TEINTURE - TISSUS D'AMEUBLEMENT | - | - | - | - | - | Marquage de route à la peinture Blanche Réfléchissante | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Peinture | 1 | 4100 | - | 4100 | - | - | - |
| G. | 73 | Tissus muraux | m² | 3800 | Juil. 99 | SAMCE | - | Nettoyant | 0.4 | 1900 | - | 760 | - | - | - |
| G. | 74 | Colle "Polymurale" (15Kg) | Kg | 2560 | Juil. 99 | SAMCE | - | Réfléchissante | 0.2 | 4500 | - | 900 | - | - | - |
| G. | 75 | Colle "Polymurale" (5Kg) | Kg | 3540 | Juil. 99 | SAMCE | - | M.O | 2.5 | 1100 | - | 2750 | - | - | - |
| G. | 76 | Tissus pour Rideaux | m² | 4500 | Juil. 99 | - | - | - | - | - | m² | - | 8510 | 13616 | - |
| G. | 77 | Tissus pour Rideaux | m² | 6500 | Juil. 99 | - | - | - | - | - | - | - | - | - | - |
| G. | 78 | Tissus pour Rideaux | m² | 7500 | Juil. 99 | - | - | - | - | - | - | - | - | - | - |
| G. | 79 | Voillages | m² | 6500 | Juil. 99 | - | - | VITRAGE POUR CHASSIS NACO ET OUVERTURES A LA FRANCAISE | - | - | - | - | - | - | - |
| G. | 80 | Ruflette | ml | 2000 | Juil. 99 | - | - | - | - | - | - | - | - | - | - |
| G. | 81 | Skaï | m² | 3000 | Juil. 99 | - | - | Fourniture et pose de lames naco en verre clair | - | - | - | - | - | - | - |
| G. | 82 | Mousse | m² | 3000 | Juil. 99 | - | - | Lame | 1 | 1180 | - | 1180 | - | - | - |
| G. | 83 | Boutons | U | 110 | Juil. 99 | - | - | M.O | 0.1 | 1100 | - | 110 | - | - | - |
| G. | 84 | Fil | ml | 5 | Juil. 99 | - | - | - | - | - | m² | - | 1290 | 2064 | - |
| G. | 85 | CP de 4m/m | m² | 2000 | Juil. 99 | - | - | Fourniture et pose de Lames naco en verre Fumé | - | - | - | - | - | - | - |
| G. | 86 | Colle Agoplac | Kg | 3300 | Juil. 99 | - | - | Lame | 1 | 1540 | - | 1540 | - | - | - |
| G. | 87 | Pointes | Kg | 1000 | Juil. 99 | - | - | M.O | 0.1 | 1100 | - | 110 | - | - | - |
| G. | 88 | Crochets | U | 100 | Juil. 99 | - | - | - | - | - | m² | - | 1650 | 2640 | - |
| G. | 89 | Papier peint(5,30m²) | m² | 1100 | Juil. 99 | - | - | Fourniture et pose de Lames naco en verre Imprimé | - | - | - | - | - | - | - |
| G. | 90 | Colle | Kg | 1100 | Juil. 99 | - | - | Lame | 1 | 1300 | - | 1300 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.1 | 1100 | - | 110 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | m² | - | 1410 | 2256 | - |
| - | - | - | - | - | - | - | - | Vitrage pour petits carreaux de fenêtres et portes-Fenêtres, verre clair | - | - | - | - | - | - | - |
| - | - | MAIN D'ŒUVRE | - | - | - | - | - | Carreaux | 0.08 | 14750 | - | 1180 | - | - | - |
| G. | 117 | Peinture - Tapissier | h. | 1400 | - | - | - | colle | 0.1 | 1800 | - | 180 | - | - | - |
| G. | 118 | Manœuvre | h. | 800 | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 1800 | 2880 | - |
| G. | 120 | Taux Horaire Moyen | h. | 1100 | - | - | - | Vitrage pour petits carreaux de fenêtres et portes-Fenêtres, verre Fumé | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Carreaux | 0.08 | 17000 | - | 1360 | - | - | - |
| - | - | - | - | - | - | - | - | colle | 0.1 | 1800 | - | 180 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 1980 | 3168 | - |
| - | - | - | - | - | - | - | - | Vitrage pour petits carreaux de fenêtres et portes-Fenêtres, verre Imprimé | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Carreaux | 0.08 | 19000 | - | 1520 | - | - | - |
| - | - | - | - | - | - | - | - | colle | 0.1 | 1800 | - | 180 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 0.4 | 1100 | - | 440 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 2140 | 3424 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | CAPITONNAGE - TEINTURES - REVÊTEMENTS MURAUX | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Capitonnage de portes sur les deux faces, en skaï, compris mousse et boutons | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Capitonnage de porte de 73 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Skaï | 3.6 | 3000 | - | 10800 | - | - | - |
| - | - | - | - | - | - | - | - | Mousse | 3.6 | 3000 | - | 10800 | - | - | - |
| - | - | - | - | - | - | - | - | CP de 4mm | 3.6 | 2000 | - | 7200 | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 1 | 3300 | - | 3300 | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1000 | - | 100 | - | - | - |
| - | - | - | - | - | - | - | - | Boutons | 20 | 110 | - | 2200 | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 10 | 5 | - | 50 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 40 | 1100 | - | 44000 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 78450 | 125520 | - |
| - | - | - | - | - | - | - | - | Capitonnage de porte de 83 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Skaï | 4 | 3000 | - | 12000 | - | - | - |
| - | - | - | - | - | - | - | - | Mousse | 4 | 3000 | - | 12000 | - | - | - |
| - | - | - | - | - | - | - | - | CP de 4mm | 4 | 2000 | - | 8000 | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 1 | 3300 | - | 3300 | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1000 | - | 100 | - | - | - |
| - | - | - | - | - | - | - | - | Boutons | 22 | 110 | - | 2420 | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 10 | 5 | - | 50 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 41 | 1100 | - | 45100 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 82970 | 132752 | - |
| - | - | - | - | - | - | - | - | Capitonnage de porte de 93 | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | Skaï | 4.4 | 3000 | - | 13200.0 | - | - | - |
| - | - | - | - | - | - | - | - | Mousse | 4.4 | 3000 | - | 13200.0 | - | - | - |
| - | - | - | - | - | - | - | - | CP de 4mm | 4.4 | 2000 | - | 8800 | - | - | - |
| - | - | - | - | - | - | - | - | Colle | 1 | 3300 | - | 3300 | - | - | - |
| - | - | - | - | - | - | - | - | Pointes | 0.1 | 1000 | - | 100 | - | - | - |
| - | - | - | - | - | - | - | - | Boutons | 24 | 110 | - | 2640 | - | - | - |
| - | - | - | - | - | - | - | - | Fil | 10 | 5 | - | 50 | - | - | - |
| - | - | - | - | - | - | - | - | M.O | 42 | 1100 | - | 46200 | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | U | - | 87490 | 139984 | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |

---

## 17 — Sheet1

*Lignes : 0 | Colonnes : 0*

*Feuille vide.*
