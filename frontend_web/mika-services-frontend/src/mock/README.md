# Données mock

- **`VITE_USE_MOCK=true`** : les appels API sont remplacés par les données factices (aucun appel backend).
- **`VITE_USE_MOCK=false` ou absent** : le backend est appelé ; en cas d’échec (réseau, 404, 500), les données mock sont utilisées en **secours** pour que l’app affiche toujours des données (avec ou sans backend).

Pour désactiver le secours : `VITE_USE_MOCK_FALLBACK=false`.

Données factices définies dans `data/` :

- **reporting** : dashboard global + rapport par projet (ids 1, 2)
- **projets** : 5 projets (listes, sélecteur Reporting/Budget/Planning/Qualité/Sécurité)
- **chantiers** : 6 chantiers
- **budget** : résumé budget pour projets 1 et 2
- **planning** : tâches par projet 1 et 2 + tâches en retard
- **qualite** : contrôles qualité par projet + summary + NC en retard
- **securite** : incidents et risques par projet + summary
- **fournisseur** : fournisseurs et commandes
- **engins** : 5 engins
- **materiaux** : 5 matériaux
- **equipes** : 3 équipes
- **communication** : messages reçus/envoyés, notifications, compteurs non lus

Les données sont cohérentes entre elles (mêmes noms de projets, ids, etc.) pour permettre de tester l’ensemble des pages sans backend.
