# Config Render pour le SPA (routes client)

Pour éviter un **404** sur les routes comme `/suivi-activite` quand on ouvre l’URL directement (ou qu’on rafraîchit) :

1. Dans le **Dashboard Render** : ouvrir le **Static Site** (frontend).
2. Onglet **Redirects / Rewrites**.
3. Ajouter une règle :
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** **Rewrite** (pas Redirect)

Ainsi, toute requête vers un chemin inexistant (ex. `/suivi-activite`) sert `index.html`, et le routeur React gère la route.
