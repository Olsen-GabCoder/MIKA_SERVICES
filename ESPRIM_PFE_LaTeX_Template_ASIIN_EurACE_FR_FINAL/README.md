# Template LaTeX PFE - ESPRIM - ASIIN / EUR-ACE

Ce dossier contient un modele LaTeX de rapport de PFE pour eleves ingenieurs, compatible avec Overleaf et structure selon une logique de lecture attendue dans une evaluation academique exigeante.

## Objectif

Le template vise a aider l'etudiant a produire un rapport :
- structure,
- scientifiquement argumente,
- conforme au referentiel institutionnel,
- lisible pour un jury academique et professionnel,
- coherent avec les attentes d'un audit de type ASIIN / EUR-ACE.

## Contenu du template

- `main.tex` : fichier principal.
- `config.tex` : toutes les informations modifiables (nom, titre, discipline, encadrants, etc.).
- `sections/` : pages liminaires, guide institutionnel integre, introduction, conclusion.
- `chapters/` : 5 chapitres obligatoires.
- `annexes/` : matrices types, guide IA/reproductibilite, checklist finale.
- `references.bib` : base bibliographique exemple, avec modeles a recopier et adapter.
- `assets/logo-esprim.png` : logo officiel integre a la couverture.

## Mode guide et version finale

Dans `config.tex` :
- `\showguidetrue` : affiche les encadres de consignes.
- `\showguidefalse` : masque les encadres pour la version finale.

## Disciplines cibles

Le template est prevu pour trois familles de sujets :
- Data Science / IA
- EET (Electronique embarquee et telecommunications)
- Mecatronique

Dans `config.tex`, ajuster :
- `\DisciplineName`
- `\disciplinecode` avec l'une des valeurs suivantes :
  - `ds`
  - `eet`
  - `meca`

## Utilisation sur Overleaf

1. Creez un nouveau projet Overleaf.
2. Importez tout le contenu du dossier ZIP.
3. Ouvrez `main.tex`.
4. Compilez avec **pdfLaTeX**.
5. Modifiez `config.tex` puis remplacez progressivement tous les `\todo{...}`.

## Partie guide integree

Le template contient un guide institutionnel visible en mode guide. Il comprend notamment :
- les objectifs du stage PFE,
- les modalites d'evaluation recommandees,
- les attentes de tracabilite,
- les consignes bibliographiques,
- des exemples IEEE,
- des exemples BibTeX directement reutilisables,
- le minimum recommande pour le niveau master / cycle ingenieur : **25 references**, avec une majorite de sources indexees.

## Bonnes pratiques

- Garder un style sobre et professionnel.
- Privilegier les figures lisibles et les tableaux de synthese.
- Eviter les longs blocs de code non commentes.
- Justifier les choix techniques.
- Discuter les limites et non seulement les succes.
- Declarer l'usage de l'IA generative si applicable.

## Remarque importante

Ce template est volontairement pedagogique. Il combine :
- une structure de rapport,
- des consignes integrees pour l'etudiant,
- un guide institutionnel integre,
- des tableaux types de tracabilite,
- une checklist de controle final.

Pour le depot officiel, pensez a desactiver le mode guide.
