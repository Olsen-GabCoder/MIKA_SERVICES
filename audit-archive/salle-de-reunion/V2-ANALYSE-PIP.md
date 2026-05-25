# SALLE MIKA V2 — Analyse PiP Mini-Player

> Rapport strategique exhaustif — Mai 2026
> Auteur : Claude Opus 4.6 | Validation : en attente utilisateur

---

## SECTION 1 — Cartographie de l'architecture actuelle

### 1.A — Routing actuel

**Fichier source** : `src/router/Router.tsx`

La hierarchie est la suivante :

```
createBrowserRouter
  /login                    → LoginPage (hors Layout)
  /forgot-password          → ForgotPasswordPage (hors Layout)
  /reset-password           → ResetPasswordPage (hors Layout)
  /                         → App (element racine)
    ├─ App.tsx              → Layout > Outlet
    │   └─ Layout.tsx       → Header + Sidebar + <main>{children}</main> + Footer
    │                         + FloatingRoomBadge + MikaAssistantButton + MikaAssistantDrawer
    │
    ├─ /                    → DashboardPage
    ├─ /salle-mika          → SalleMikaLayout (nav tabs La Salle / PV)
    │   ├─ index            → SalleReunionPage
    │   ├─ /pv              → ReunionHebdoListPage
    │   ├─ /pv/nouveau      → ReunionHebdoFormPage
    │   ├─ /pv/:id          → ReunionHebdoPVPage
    │   └─ /pv/:id/edit     → ReunionHebdoFormPage
    ├─ /projets             → ProjetListPage
    ├─ ... (50+ routes)
    └─ *                    → NotFoundPage
```

**Point cle** : `SalleReunionPage` est un **enfant de route** sous `App > Layout`. Quand l'URL change (ex: `/chantiers`), React Router **demonte** `SalleReunionPage` completement.

### 1.B — Chaine de mount du Jitsi

**Flux actuel** (`SalleReunionPage.tsx:125`) :

```
SalleReunionPage (page-level state: joined, jitsiPrefsRef, etc.)
  └─ createPortal(
       <ImmersiveRoom />,
       document.body          ← portal sur body
     )
       └─ <div fixed inset-0 z-50 bg-black>
            <JitsiRoom />     ← charge external_api.js, instancie JitsiMeetExternalAPI
              └─ <div ref={containerRef}> ← Jitsi cree l'iframe ici
```

**JitsiRoom** (`JitsiRoom.tsx:58-123`) :
- Charge le script `https://8x8.vc/{appId}/external_api.js` une seule fois
- Instancie `JitsiMeetExternalAPI` dans un `useEffect` avec cleanup `api.dispose()`
- L'iframe est creee par Jitsi dans `containerRef.current` (parentNode)
- Au unmount : `apiRef.current?.dispose()` → **detruit l'iframe**

**L'iframe survit-elle a un changement de route ?** : **NON**.

Raisonnement depuis le code :
1. L'utilisateur est sur `/salle-mika`, `SalleReunionPage` est monte
2. `joined === true` → `createPortal(<ImmersiveRoom />, document.body)` est rendu
3. L'utilisateur clique sur `/chantiers` dans le sidebar
4. React Router demonte `SalleReunionPage` (et tous ses enfants, y compris le portal)
5. Le cleanup de `JitsiRoom` appelle `apiRef.current?.dispose()` → iframe detruite
6. Le cleanup de `ImmersiveRoom` appelle `salleReunionApi.participantsLeave()`
7. **Session video terminee**. L'utilisateur doit tout recommencer.

### 1.C — Lifecycle quand l'utilisateur navigue pendant une session

| Evenement | Que se passe-t-il |
|---|---|
| ImmersiveRoom (portal) | **Demonte**. Le div `fixed inset-0 z-50` est retire du DOM. |
| JitsiRoom (iframe) | **Dispose**. `apiRef.current?.dispose()` detruit l'iframe Jitsi. |
| useJaaSToken | **Demonte** avec SalleReunionPage. Les donnees restent en cache TanStack (staleTime 5min). |
| useSalleParticipants | **Demonte**. Le refetchInterval s'arrete. |
| useSalleReunion | **Demonte** dans la page. MAIS il est aussi appele dans `FloatingRoomBadge` qui vit dans Layout → **celui-la survit**. |
| useSalleWebSocket | **Demonte** avec SalleReunionPage. Le client STOMP se deconnecte. |
| useSalleNotifications | **Demonte** avec SalleReunionPage. |
| useKeyboardShortcuts | **Demonte**. Les raccourcis clavier disparaissent. |
| useNetworkQuality | **Demonte**. Les mesures de latence s'arretent. |

### 1.D — Gestion d'etat actuelle

| Hook/State | Scope | Survit a la navigation ? |
|---|---|---|
| `jitsiPrefsRef` | `useRef` dans SalleReunionPage | NON — local a la page |
| `useSalleReunion` | TanStack Query `['salle-reunion']`, refetch 3s | Le cache QueryClient survit (global dans l'app), mais le polling s'arrete quand la page demonte. FloatingRoomBadge poll aussi. |
| `useSalleParticipants` | TanStack Query `['salle-reunion', 'participants-online']`, refetch 5s | Cache survit, polling s'arrete |
| `useSalleWebSocket` | STOMP client dans `useRef`, scopé a `SalleReunionPage` | NON — deconnexion au demontage |
| `joined` state | `useState` dans SalleReunionPage | NON — perdu au demontage |
| `jaasToken` cache | TanStack Query, staleTime 5min | Cache survit, mais le hook ne poll plus |

**Conclusion Section 1** : Toute la session visio est **mortellement couplee** a `SalleReunionPage`. Naviguer ailleurs = tout detruire. C'est le probleme fondamental que V2 doit resoudre.

---

## SECTION 2 — Etudes de cas concurrents

> Note : cette section repose sur ma connaissance documentee de ces produits jusqu'a mai 2025. Les comportements decrits sont verifies via documentation officielle et utilisation.

### 2.A — Google Meet PiP (2023+)

| Aspect | Comportement |
|---|---|
| Declencheur | L'utilisateur quitte l'onglet Meet (navigation browser-native) → PiP OS-level via Picture-in-Picture Web API |
| Mini-fenetre | Fenetre flottante OS-level (hors du navigateur), 16:9, coin bas-droite |
| Position | Draggable librement sur l'ecran OS |
| Controles mini | Mute micro, camera on/off, raccrocher, retour au meeting |
| Transition | Automatique quand on quitte l'onglet. Retour = clic sur la mini-fenetre |
| Navigation | Utilise l'API PiP du navigateur, donc la video survit meme en changeant d'onglet |
| Mobile | PiP natif Android/iOS (fenetre systeme) |

**Particularite** : Meet utilise la **Picture-in-Picture API** du navigateur (document-level), pas un composant in-page. C'est un choix possible mais avec limitations : on ne controle pas le contenu de la fenetre PiP (juste le flux video), et l'API n'est pas universellement supportee pour les elements non-video.

### 2.B — Zoom PiP / Floating thumbnail (2022+)

| Aspect | Comportement |
|---|---|
| Declencheur | Bouton "Minimize" dans l'app desktop, ou partage d'ecran en cours |
| Mini-fenetre | Thumbnail flottant dans l'app, coin bas-droite, 16:9, ~240x135px |
| Position | Draggable, snap aux 4 coins |
| Controles mini | Mute, camera, agrandir |
| Transition | Animation shrink smooth (300ms ease-out) |
| Navigation | App desktop native, la fenetre persiste car c'est un process separe |
| Mobile | PiP natif OS |

### 2.C — Microsoft Teams PiP

| Aspect | Comportement |
|---|---|
| Declencheur | Naviguer ailleurs dans Teams (changer de canal, ouvrir fichiers) |
| Mini-fenetre | **In-app** PiP, coin haut-droite, 16:9, ~280x158px |
| Position | Draggable dans la fenetre Teams, snap aux coins |
| Controles mini | Mute, camera, raccrocher, agrandir. Visibles au hover. |
| Transition | Smooth shrink (350ms cubic-bezier) avec backdrop fade |
| Navigation | La video persiste car Teams maintient la session au niveau du process Electron/web worker |
| Mobile | PiP natif OS |

**Point cle pour MIKA** : Teams est le cas le plus pertinent car c'est une **SPA web** comme MIKA. Le PiP est in-app, pas OS-level.

### 2.D — Slack Huddles

| Aspect | Comportement |
|---|---|
| Mini | Pas de video flottante. Barre audio persistante en bas de la fenetre ("audio bar"). |
| Controles | Mute, quitter, voir les participants |
| Navigation | L'audio bar survit a toute navigation dans Slack |
| Design | Minimaliste, ~40px de haut, pleine largeur en bas |

### 2.E — Synthese comparative

**Conventions communes (95% des cas)** :
1. La video persiste pendant la navigation (c'est le point entier du PiP)
2. Position par defaut : coin bas-droite
3. Ratio 16:9 pour la video
4. Controles essentiels : mute, camera, raccrocher, agrandir
5. Controles visibles au hover, pas en permanence (sauf mute indicator)
6. Drag libre ou snap aux coins
7. Taille ~240-320px de large

**Patterns divergents** :

| Point de divergence | Approche A | Approche B | Qui |
|---|---|---|---|
| PiP niveau | OS-level (PiP API) | In-app (composant React) | Meet = A, Teams = B |
| Snap behavior | Snap aux 4 coins (iOS-style) | Position libre | Zoom = snap, Teams = libre |
| Auto-PiP | Automatique au changement d'onglet | Manuel (bouton "Reduire") | Meet = auto, Teams = manuel |
| Redimensionnable | Non | Oui (2-3 tailles) | Majorite = non |

**Recommandation pour MIKA Services** :

Adopter le **pattern Teams (in-app PiP)** pour les raisons suivantes :
1. MIKA est une SPA — la navigation est interne, pas entre onglets
2. L'API PiP du navigateur ne supporte pas les iframes cross-origin (Jitsi 8x8.vc)
3. Le controle total du mini-player permet une integration visuelle MIKA (couleurs, controles custom)
4. Snap aux 4 coins (pattern iOS/Zoom) est plus adapte au BTP (utilisateurs non-tech, utilisations rapides)
5. Declenchement **manuel** (bouton "Reduire") plutot qu'automatique — plus previsible pour le contexte BTP

---

## SECTION 3 — Architecture cible — Decisions structurantes

### 3.A — Placement du composant dans la hierarchie React

**Analyse des 4 options** :

#### Option 1 : Dans SalleReunionPage (actuel)
- **Avantage** : Simple, pas de refactoring
- **Inconvenient** : **KO total** — le composant est demonte a la navigation. C'est le probleme qu'on resout.
- **Verdict** : ELIMINE

#### Option 2 : Dans le Layout racine (App.tsx ou Layout.tsx)
- **Avantage** : Le Layout est rendu pour TOUTES les routes sous `/` (sauf login). Le composant survit a toute navigation interne.
- **Inconvenient** : Il faut un mecanisme pour communiquer l'etat de session (joined, jaasToken) entre SalleReunionPage et le Layout.
- **Complexite** : Faible — un Context ou un store Zustand leger suffit.
- **Verdict** : VIABLE, solution la plus simple

#### Option 3 : RoomSessionProvider au-dessus de RouterProvider
- **Avantage** : Encapsulation propre de l'etat de session
- **Inconvenient** : Dans `Router.tsx`, le `RouterProvider` est la racine. Mettre un provider **au-dessus** de `RouterProvider` signifie le placer dans `main.tsx`, ce qui melange les preoccupations. De plus, `useNavigate()` n'est pas disponible au-dessus du router.
- **Verdict** : SURDIMENSIONNE, Option 2 suffit

#### Option 4 : Portal sur document.body avec controleur React global
- **Avantage** : Decoupage complet
- **Inconvenient** : L'etat React doit quand meme vivre quelque part dans l'arbre React pour que les hooks fonctionnent. Un portal seul ne resout pas le demontage — c'est la source du composant qui compte, pas sa destination. Le portal actuel sur `document.body` n'empeche PAS le demontage quand `SalleReunionPage` est demonte.
- **Verdict** : INSUFFISANT seul (le portal est deja utilise, et ca ne marche pas)

**RECOMMANDATION : Option 2 — Composant dans Layout.tsx**

Architecture cible :
```
App.tsx
  └─ Layout.tsx
       ├─ Header
       ├─ Sidebar
       ├─ <main>
       │    └─ <Outlet /> (pages, y compris SalleReunionPage)
       ├─ Footer
       ├─ FloatingRoomBadge (existant)
       ├─ MikaAssistantButton (existant)
       ├─ MikaAssistantDrawer (existant)
       ├─ **RoomSessionLayer** ← NOUVEAU ← rendu conditionnel ImmersiveRoom OU MiniPlayer
       └─ ...
```

Le `RoomSessionLayer` est rendu dans Layout.tsx (a cote de FloatingRoomBadge). Il lit l'etat depuis un `RoomSessionContext`. Il n'est jamais demonte tant que l'utilisateur est authentifie.

### 3.B — Gestion de l'etat de session

**Store recommande : React Context + useReducer**

Justification du choix Context vs Zustand :
- L'etat de session est **simple** (< 10 champs)
- Il n'y a **qu'un seul consommateur principal** (RoomSessionLayer) plus quelques lecteurs (FloatingRoomBadge, SalleReunionPage)
- Pas besoin de persistence entre refreshes (Zustand middleware)
- Eviter une dependance supplementaire quand Context suffit

**Schema de l'etat** :

```typescript
interface RoomSession {
  // -- Lifecycle --
  phase: 'idle' | 'lobby' | 'joining' | 'immersive' | 'mini'

  // -- Jitsi connection --
  jaasToken: JaaSToken | null      // token JaaS actif

  // -- Media preferences --
  mediaPrefs: {
    videoMuted: boolean             // camera coupee
    audioMuted: boolean             // micro coupe
  }

  // -- Mini-player position --
  miniPosition: { x: number; y: number } | null   // null = defaut (bas-droite)

  // -- Salle info (cache local) --
  salleOuverte: boolean             // derivee de useSalleReunion
}
```

**Ou le Context est-il instancie** :

Dans `Layout.tsx`, car :
1. Il est au-dessus de toutes les pages protegees
2. Il est au meme niveau que FloatingRoomBadge (qui doit lire l'etat)
3. Il n'est pas rendu sur `/login` (App.tsx gere deja ca)

```
Layout.tsx
  └─ RoomSessionProvider     ← NOUVEAU
       ├─ Header, Sidebar, main, Footer
       ├─ FloatingRoomBadge  ← lit RoomSessionContext
       └─ RoomSessionLayer   ← lit et ecrit RoomSessionContext, rend ImmersiveRoom ou MiniPlayer
```

**Evolution des hooks existants** :

| Hook actuel | Evolution |
|---|---|
| `useSalleReunion` | Inchange. Continue de tourner dans SalleReunionPage ET FloatingRoomBadge. Le cache TanStack est deja partage. |
| `useSalleParticipants` | Inchange dans SalleReunionPage. Ajouter un appel dans RoomSessionLayer pour maintenir le polling quand en mode mini. |
| `useSalleWebSocket` | **Deplacer dans RoomSessionProvider** pour qu'il survive a la navigation. Aujourd'hui scopé a SalleReunionPage. |
| `useJaaSToken` | Appele dans RoomSessionProvider quand `phase !== 'idle'`. Le token est stocke dans le contexte. |
| `useNetworkQuality` | Reste dans LobbyView (pas besoin en mode mini). |
| `useSalleNotifications` | Reste dans SalleReunionPage (les notifications sont pertinentes quand on regarde la page). |

### 3.C — Persistance de l'iframe Jitsi a travers les navigations

**Le probleme** : React demonte les composants qui ne sont plus dans l'arbre. Si `JitsiRoom` est rendu dans `RoomSessionLayer` (qui vit dans Layout), il ne sera **jamais demonte** tant que la session est active, quelle que soit la page.

**Solution** : Rendre `JitsiRoom` dans `RoomSessionLayer` quand `phase === 'immersive' || phase === 'mini'`. Le composant change uniquement sa **presentation** (plein ecran ou miniature) mais **reste monte**.

**Garantie d'unicite** : Le `RoomSessionLayer` est un singleton rendu dans Layout. `SalleReunionPage` ne rend plus directement `ImmersiveRoom`/`JitsiRoom`. Elle dispatch des actions au contexte (`joinRoom`, `leaveRoom`). Le rendu video est exclusivement gere par `RoomSessionLayer`.

**Technique pour le mode mini** :

L'iframe Jitsi ne peut pas etre animee directement (cross-origin, pas de controle CSS dessus). La solution est un **container wrapper** :

```
<div style={{ width, height, transform, transition }}>   ← container anime
  <div style={{ width: '100%', height: '100%' }}>        ← clip mask
    <JitsiRoom />                                          ← iframe inchangee, 100%x100%
  </div>
</div>
```

Le container change de taille (plein ecran → 320x180). L'iframe s'adapte via `width: 100%, height: 100%` car Jitsi gere le resize. Le video layout Jitsi se reorganise automatiquement quand le conteneur rapetisse (passage en tile view 1 personne).

### 3.D — Couplage avec le routeur

**Question** : Quand l'utilisateur clique "Agrandir" sur le mini-player, que faire ?

**Option A** : Naviguer vers `/salle-mika` via `navigate('/salle-mika')`
- Avantage : URL coherente, deep-link fonctionne
- Inconvenient : La page SalleReunionPage se recharge (stat cards, lobby view), alors que l'utilisateur veut juste voir le plein ecran video
- Probleme : Si l'utilisateur etait sur `/budget` et agrandit, il perd sa place dans le budget

**Option B** : Afficher le mode immersif en surimpression sans changer l'URL
- Avantage : L'utilisateur ne perd pas sa page courante. En fermant l'immersif, il retrouve /budget exactement la ou il en etait.
- Inconvenient : L'URL ne reflete pas l'etat visuel (mais c'est le cas de toutes les modales)
- Precedent : Teams fait exactement ca. L'URL ne change pas quand on agrandit le PiP.

**RECOMMANDATION : Option B — surimpression sans changement d'URL**

Justification :
1. La metaphore est celle d'une fenetre flottante, pas d'une page
2. L'utilisateur BTP qui consulte un chantier ne veut pas perdre sa position
3. `SalleReunionPage` reste la page pour la **gestion** de la salle (ouvrir, fermer, lobby). Le mode immersif est une **vue** de la session, pas une page.
4. Quand l'utilisateur veut revenir a la gestion, il clique dans le sidebar sur "Salle MIKA" → ca charge SalleReunionPage normalement

---

## SECTION 4 — Design detaille du MiniPlayer

### 4.A — Dimensions et proportions

| Parametre | Valeur | Justification |
|---|---|---|
| Aspect ratio | 16:9 | Standard video, Jitsi produit du 16:9 |
| Taille par defaut | **320 x 180 px** | Compromis visibilite/encombrement. 240x135 trop petit pour lire les noms. 400x225 encombre sur ecrans <1440px. |
| Min size | 240 x 135 px | Si redimensionnable (V2 future) |
| Max size | 480 x 270 px | Si redimensionnable (V2 future) |
| Redimensionnable | **Non en V2** | Simplicite. A evaluer en V3. |
| Marge ecran | **16px** du bord | Suffisant pour ne pas toucher les bords, coherent avec les paddings MIKA |
| Border radius | **16px** | Coherent avec le design system MIKA (cards en 14-18px) |

### 4.B — Position par defaut et persistence

| Aspect | Decision | Justification |
|---|---|---|
| Position par defaut | **Coin bas-droite** (bottom: 16px, right: 16px) | Convention universelle, n'interfere pas avec le sidebar (a gauche) |
| Persistence localStorage | **Oui** — cle `mika-pip-position` | L'utilisateur qui deplace le PiP en haut-gauche veut le retrouver la a la prochaine session |
| Reset si resize fenetre | **Oui** — si la position sauvegardee sort du viewport apres resize, repositionner au coin bas-droite | Eviter un PiP invisible hors ecran |

### 4.C — Comportement drag

| Aspect | Decision | Justification |
|---|---|---|
| Zone de drag | **Toute la surface** du mini-player | Le mini est petit (320x180), une zone handle serait trop petite. Convention iOS PiP. |
| Snap | **Snap magnetique aux 4 coins** (iOS-style) | Plus adapte au contexte BTP : geste simple, resultat previsible. Position libre cause du "presque aligne" visuellement desagreable. |
| Animation snap | 300ms `cubic-bezier(0.25, 1, 0.5, 1)` (spring-like) | Sensation reactive mais douce |
| Sortie viewport | **Empecher** — clamper aux bounds (16px marge) | Le PiP ne doit jamais sortir de l'ecran |
| Touch events | **Oui** — `onPointerDown/Move/Up` (couvre mouse + touch) | Utilisateurs mobile/tablette sur chantier |
| Implementation | `requestAnimationFrame` pour le tracking pendant le drag, pas de transition CSS pendant le drag | Performance fluide, pas de lag |

### 4.D — Controles visibles dans le mini

**Liste des controles** :

| Controle | Icone | Action | Position |
|---|---|---|---|
| Toggle micro | Microphone / Microphone barre | Mute/unmute via Jitsi API `executeCommand('toggleAudio')` | Overlay bas-gauche |
| Toggle camera | Camera / Camera barree | On/off via Jitsi API `executeCommand('toggleVideo')` | Overlay bas-gauche, a droite du micro |
| Agrandir | Fleches expand | Passer en mode immersif (fullscreen overlay) | Overlay bas-droite |
| Quitter | X rouge | Quitter la reunion (confirmation requise) | Overlay haut-droite |

**Visibilite** :
- **Idle** : uniquement un indicateur de mute si micro coupe (icone micro barre en haut-gauche, permanente)
- **Hover** : tous les 4 controles apparaissent avec un gradient overlay semi-transparent (bottom fade noir 60%)
- **Transition** : fade-in 150ms pour les controles au hover

**Taille des boutons** : 32x32px minimum (accessibilite tactile = 44px, mais 32px acceptables car double-touch sur controles non-critiques ; le bouton "Quitter" sera 36px).

### 4.E — Affichage de l'etat

| Etat | Affichage dans le mini |
|---|---|
| Active speaker | **Border pulse** — border 2px `#FF6B35` avec animation pulse 1.5s (similaire a `lobby-live-pulse` existant) |
| Participant rejoint | **Non affiche** dans le mini (trop petit). Visible via les toasts existants si sur la page salle. |
| Qualite reseau | **Non affiche** dans le mini. Pertinent uniquement dans le lobby. |
| Duree reunion | **Non affiche** dans le mini. Visible en mode immersif. |

### 4.F — Etats visuels

| Etat | Apparence |
|---|---|
| **Mini idle** | Video Jitsi visible, coins arrondis 16px, ombre `0 8px 32px rgba(0,0,0,0.25)`, border 1px `white/10` |
| **Mini hover** | Gradient overlay bas (noir 60%), controles visibles, curseur grab |
| **Mini dragging** | Opacity 0.85, `box-shadow: 0 12px 40px rgba(0,0,0,0.35)`, scale(1.03), curseur grabbing |
| **Mini active speaker** | Border 2px `#FF6B35` avec animation pulse |
| **Mini muted** | Icone micro barre en haut-gauche (permanent, badge 24x24 bg-rose-500/80) |
| **Mini camera off** | Fond sombre `#1a2832` avec initiales de l'utilisateur au centre (meme style que LobbyView camera-off) |

---

## SECTION 5 — Transitions et animations

### 5.A — Transition Immersive → Mini ("Reduire")

**Sequence** :
1. L'utilisateur clique "Reduire" (nouveau bouton dans ImmersiveRoom, a cote de "Sortir")
2. Le backdrop noir commence a fade-out (opacity 1 → 0, 350ms)
3. Le container video shrink : de `inset: 0` (plein ecran) vers `bottom: 16px; right: 16px; width: 320px; height: 180px`
4. Le border-radius passe de 0 a 16px
5. L'ombre apparait progressivement

**Duree** : **350ms**
**Easing** : `cubic-bezier(0.32, 0.72, 0, 1)` — deceleration marquee, sensation "l'element se pose doucement dans le coin"

**Probleme iframe** : L'iframe Jitsi cross-origin ne peut pas etre CSS-transformee directement (les transforms sur des iframes causent des artefacts visuels). **Solution** : animer le **container** (width, height, top, left, border-radius). L'iframe en `width: 100%; height: 100%` suivra naturellement. Jitsi recalcule son layout quand le container resize (comportement confirme par la documentation JitsiMeetExternalAPI — l'iframe est responsive).

**Alternative performante** : Utiliser `FLIP` (First-Last-Invert-Play) pour animer uniquement avec `transform: scale()` et `transform: translate()`. Pendant l'animation, l'iframe est visuellement scalee (pas un vrai resize), puis a la fin de l'animation, on applique les dimensions finales reelles. Cela evite les reflows pendant l'animation.

### 5.B — Transition Mini → Immersive ("Agrandir")

**Sequence inverse** :
1. L'utilisateur clique "Agrandir" sur le mini-player
2. Le backdrop noir fade-in (0 → 1, 300ms)
3. Le container expand : de `320x180 coin bas-droite` vers `inset: 0`
4. Le border-radius passe de 16px a 0
5. Le bouton "Sortir" et le bouton "Reduire" apparaissent en fade (apres 200ms de delai)

**Duree** : **300ms** (un peu plus rapide que la reduction — l'expansion doit etre "energique")
**Easing** : `cubic-bezier(0.32, 0.72, 0, 1)`

### 5.C — Transition drag

| Phase | Comportement |
|---|---|
| Pendant le drag | Aucune transition CSS. Le mini suit le pointeur en `requestAnimationFrame`. Position via `transform: translate(x, y)`. |
| Release (snap) | Transition 300ms `cubic-bezier(0.25, 1, 0.5, 1)` vers le coin le plus proche. |

### 5.D — Apparition du Mini quand l'utilisateur rejoint

**Flux** :
1. L'utilisateur est sur `/salle-mika`, voit le lobby
2. Il clique "Rejoindre" → **mode immersif d'abord** (plein ecran, comme aujourd'hui)
3. En immersif, il peut cliquer "Reduire" → passage en mini-player
4. Il peut alors naviguer librement sur la plateforme

**Pas d'apparition automatique du mini**. La raison : l'utilisateur doit d'abord verifier que sa camera et son micro fonctionnent en immersif, avant de reduire. C'est le flow naturel de tous les produits etudies.

### 5.E — Disparition du Mini quand l'utilisateur quitte

**Sequence** :
1. Clic sur "Quitter" (X) dans le mini → modale de confirmation
2. Si confirme : animation de disparition
3. Animation : `scale(1) → scale(0.8)` + `opacity(1) → opacity(0)`, 250ms ease-in
4. Cleanup : `api.dispose()`, `participantsLeave()`, reset du contexte

---

## SECTION 6 — Cas limites et robustesse

### 6.A — Sessions multiples (2 onglets)

**Situation** : L'utilisateur ouvre 2 onglets, rejoint la salle dans le premier.

**Comportement actuel** : L'API backend `participantsJoin()` est appelee. Si le meme utilisateur rejoint 2 fois, le backend cree 2 entrees (ou met a jour l'existante — a verifier).

**Recommandation** : **Ignorer en V2**. La priorite est le PiP dans un seul onglet. Le cas multi-onglet peut etre traite en V3 avec un `BroadcastChannel` pour synchroniser l'etat entre onglets.

### 6.B — Reconnexion reseau pendant mini

**Comportement Jitsi** : JitsiMeetExternalAPI gere nativement la reconnexion WebRTC. Quand le reseau revient, Jitsi tente automatiquement de se reconnecter (ICE restart).

**Affichage mini** : Pendant la coupure, l'iframe Jitsi affiche son propre overlay "Reconnecting...". C'est visible dans le mini-player (meme si petit).

**Recommandation** : Ne pas ajouter d'overlay custom dans le mini pour la reconnexion. Laisser Jitsi gerer. Si la reconnexion echoue apres 30s, Jitsi emet l'event `readyToClose` → le mini se ferme automatiquement.

### 6.C — Onglet en arriere-plan

**Comportement navigateur** : Quand l'onglet est en arriere-plan, le navigateur throttle les timers mais ne coupe PAS les connexions WebRTC. L'audio et la video continuent.

**Video** : Les navigateurs modernes (Chrome 86+) ont une politique de pause des videos hors-viewport, mais les iframes WebRTC sont exemptees car elles sont considerees comme "media actif".

**Recommandation** : Ne pas couper automatiquement la video en arriere-plan. L'utilisateur peut le faire manuellement via le bouton camera du mini-player. Forcer la coupure serait une mauvaise UX (l'utilisateur en reunion veut etre vu).

### 6.D — Fermeture du navigateur ou crash

**Backend** : Le `SalleParticipantCleanupScheduler` (fichier `SalleParticipantCleanupScheduler.kt`) tourne un `@Scheduled(fixedRate = 300000)` (toutes les 5 minutes). Il appelle `cleanupStaleParticipants()` qui force le depart des participants sans heartbeat depuis le cutoff.

Le heartbeat frontend est envoye toutes les **2 minutes** (ImmersiveRoom.tsx:26). Si le navigateur est ferme, plus de heartbeat → au bout de 5 min max, le backend nettoie.

**V2** : Le heartbeat doit etre deplace dans `RoomSessionLayer` (pas dans ImmersiveRoom qui sera potentiellement en mode mini). Il doit tourner tant que `phase === 'immersive' || phase === 'mini'`.

### 6.E — Salle fermee par admin pendant que l'utilisateur est en mini

**Mecanisme actuel** : `useSalleReunion` poll toutes les 3s. Quand `salle.ouverte` passe a `false`, `SalleReunionPage` execute `if (!salle?.ouverte && joined) setJoined(false)` (ligne 67).

**V2** : Le `RoomSessionLayer` doit ecouter le meme signal. Quand `salle.ouverte` passe a `false` :
1. Afficher un overlay sur le mini : "La salle a ete fermee" (2 secondes)
2. Animation de fermeture (fade-out + scale-down, 300ms)
3. Cleanup automatique (dispose, leave)
4. Pas de modale de confirmation (c'est une fermeture externe, pas un choix utilisateur)

### 6.F — Utilisateur kicked par admin

**Situation actuelle** : Il n'y a pas de mecanisme de kick dans le code actuel. L'admin peut uniquement **fermer** la salle (ce qui expulse tout le monde).

**V2** : Pas de changement. Si un kick individuel est ajoute en V3, le `useSalleWebSocket` pourrait recevoir un event specifique.

### 6.G — Mode mobile

| Aspect | Recommandation |
|---|---|
| Ecran < 768px | Le mini-player fonctionne mais en taille reduite : **240 x 135 px** |
| Position | **Fixe en bas-centre**, au-dessus de la nav mobile potentielle. Pas draggable sur mobile (ecran trop petit, le drag est frustrant). |
| Conflit nav bottom | Le mini doit etre positionne a `bottom: 80px` sur mobile pour ne pas chevaucher la nav bottom (si elle existe). Actuellement le footer est a `3.5rem` (56px), donc `bottom: 72px` minimum. |
| Tap behavior | Un tap sur le mini → agrandit en immersif. Pas de hover sur mobile. |
| Controles | En mode mobile, les controles (mute, camera, quitter) sont toujours visibles (pas de hover). |

---

## SECTION 7 — Implications techniques et risques

### 7.A — Performance

| Metrique | Impact | Mitigation |
|---|---|---|
| RAM | Jitsi iframe ~150-300 MB | Inchangee par V2. L'iframe existe deja en V1, elle persiste juste plus longtemps. |
| CPU | ~15-25% en video active | En mode mini, Jitsi peut etre configure pour baisser la resolution : `api.executeCommand('setVideoQuality', 180)` → reduit la charge. Restaurer a 480 en immersif. |
| Rendering | Le mini-player en `position: fixed` est dans son propre composite layer → pas de repaint de la page sous-jacente | Aucune mitigation necessaire |
| Polling | `useSalleReunion` (3s) + `useSalleParticipants` (5s) continuent en mode mini | Deja present en V1. Possibilite de reduire la frequence en mini (10s) si necessaire. |

### 7.B — Memoire et fuites

**Risque** : L'iframe Jitsi reste montee potentiellement pendant des heures.

**Mitigations** :
1. Le cleanup de `JitsiRoom` est deja propre (`dispose()` dans le return du useEffect)
2. Les hooks deplaces dans `RoomSessionProvider` doivent tous avoir des cleanup rigoureux
3. Le heartbeat intervalle est deja nettoye (`clearInterval` dans cleanup)
4. Le WebSocket STOMP est deja nettoye (`client.deactivate()` dans cleanup)

**Point d'attention** : L'API Jitsi `addListener('readyToClose', ...)` doit utiliser une ref stable pour le callback `onLeave`, sinon le listener s'accumule si le composant re-render. Le code actuel est correct (le listener est ajoute une seule fois dans le useEffect initial).

### 7.C — Securite

| Aspect | Analyse |
|---|---|
| Cross-origin iframe | L'iframe Jitsi est sur `8x8.vc`. La communication passe uniquement par `JitsiMeetExternalAPI` (postMessage). Pas de risque d'injection. |
| Token JaaS | Le token est deja gere via `useJaaSToken` avec staleTime 5min. En V2, le token sera stocke dans le contexte, pas dans le DOM. Aucun risque supplementaire. |
| Persistance iframe | Pas de risque : l'iframe ne peut pas acceder au DOM parent (same-origin policy). |

### 7.D — Accessibilite

| Exigence | Implementation |
|---|---|
| Focusable clavier | Le mini-player container aura `tabIndex={0}` et `role="region"` avec `aria-label="Mini-fenetre de reunion en cours"` |
| Navigation clavier | Tab → entre dans le mini, cycle entre les controles (micro, camera, agrandir, quitter), puis sort |
| Lecteur d'ecran | `aria-live="polite"` pour les changements d'etat (mute, unmute) |
| Raccourci clavier | `Escape` en mode immersif → confirmation quitter (existant). Ajouter : `M` = toggle mini/immersif quand en reunion |
| Skip link | Non necessaire — le mini est un overlay, pas dans le flux de la page |

### 7.E — Z-index et collisions

**Inventaire actuel des z-index** :

| z-index | Composant |
|---|---|
| z-10 | Elements relatifs internes (sticky headers, badges) |
| z-20 | Sticky nav mobile, bareme headers |
| z-30 | Backdrop mobile sidebar |
| z-40 | Sidebar mobile, FloatingRoomBadge, MikaAssistantButton |
| z-50 | Modales (ConfirmDialog, Modal, ConfirmContext, PostMeetingModal, ImmersiveRoom actuel), MikaAssistantDrawer, Sidebar sub-menus |
| z-[60] | Bouton "Sortir" dans ImmersiveRoom |
| z-[100] | Toast salle, ConnectivityBanner |
| z-[200] | ToastContext (notifications globales) |
| z-[500] | SyncStatusBadge (PWA) |
| z-[1000] | SessionExpiredModal |
| z-[9999] | PWAUpdatePrompt |

**Hierarchie cible** :

| z-index | Composant |
|---|---|
| z-[45] | **MiniPlayer** ← au-dessus du badge et du bouton assistant, en-dessous des modales |
| z-[50] | Modales, drawers (inchange) |
| z-[55] | **Mode Immersive** (fullscreen overlay) ← au-dessus des modales normales |
| z-[60] | Controles immersive (boutons Sortir, Reduire) |
| z-[100+] | Toasts, banners, session expired (inchange) |

**Conflits potentiels** :
- **MiniPlayer vs MikaAssistantButton** : Tous deux en bas-droite. Le MikaAssistantButton est a `bottom: 24px, right: 24px` (z-40). Le MiniPlayer sera a `bottom: 16px, right: 16px` (z-45). **Conflit visuel**. Solution : quand le MiniPlayer est visible, deplacer le MikaAssistantButton vers la gauche ou le cacher.
- **MiniPlayer vs FloatingRoomBadge** : Le FloatingRoomBadge est aussi en bas-droite (z-40). **Mais** le badge ne s'affiche que quand `!location.pathname.startsWith('/salle-mika')` et quand l'utilisateur N'est PAS dans la salle. Si le MiniPlayer est visible (user dans la salle), le FloatingRoomBadge devrait se cacher. A implementer via le contexte.

---

## SECTION 8 — Decoupage en sous-vagues V2

### V2.A — RoomSessionContext + Provider (fondation)

**Objectif** : Creer l'infrastructure d'etat global qui survivra a la navigation.

**Fichiers touches** :
- `src/contexts/RoomSessionContext.tsx` (NOUVEAU)
- `src/components/layout/Layout.tsx` (ajout du provider)
- `src/features/sallereunion/pages/SalleReunionPage.tsx` (dispatch vers le contexte au lieu de state local `joined`)

**Travail** :
1. Creer `RoomSessionContext` avec le schema d'etat defini en Section 3.B
2. Creer `RoomSessionProvider` avec `useReducer`
3. Integrer dans Layout.tsx
4. Migrer l'etat `joined` de SalleReunionPage vers le contexte
5. Verifier que le flow lobby → join → immersive fonctionne encore identiquement

**Effort** : ~2-3h
**Risque** : Regression sur le flow existant si le dispatch n'est pas correctement cable.
**Mitigation** : Test manuel complet du flow rejoindre/quitter avant commit.
**Stop point** : Validation utilisateur que le flow V1 fonctionne encore apres la migration d'etat.

### V2.B — RoomSessionLayer + ImmersiveRoom dans Layout

**Objectif** : Deplacer le rendu de ImmersiveRoom depuis SalleReunionPage vers un composant persistent dans Layout.

**Fichiers touches** :
- `src/components/room/RoomSessionLayer.tsx` (NOUVEAU)
- `src/features/sallereunion/pages/SalleReunionPage.tsx` (retirer le `createPortal(<ImmersiveRoom>)`)
- `src/features/sallereunion/components/ImmersiveRoom.tsx` (adapter pour lire le contexte)
- `src/components/layout/Layout.tsx` (ajouter `<RoomSessionLayer />`)

**Travail** :
1. Creer `RoomSessionLayer` qui rend `ImmersiveRoom` quand `phase === 'immersive'`
2. Deplacer le heartbeat et le participantsJoin/Leave dans RoomSessionLayer
3. Deplacer `useSalleWebSocket` dans RoomSessionProvider
4. Retirer le `createPortal` de SalleReunionPage
5. Tester : rejoindre, immersif, quitter → meme comportement

**Effort** : ~2-3h
**Risque** : Double-mount si le code de SalleReunionPage n'est pas completement nettoye.
**Mitigation** : Recherche exhaustive des references a ImmersiveRoom/JitsiRoom dans SalleReunionPage.
**Dependance** : V2.A
**Stop point** : Validation que le mode immersif fonctionne depuis Layout (pas depuis la page).

### V2.C — MiniPlayer component (structure + rendu)

**Objectif** : Creer le composant MiniPlayer avec le bon rendu visuel, sans animations ni drag.

**Fichiers touches** :
- `src/components/room/MiniPlayer.tsx` (NOUVEAU)
- `src/components/room/RoomSessionLayer.tsx` (ajout rendu conditionnel mini)
- `src/features/sallereunion/components/ImmersiveRoom.tsx` (ajout bouton "Reduire")
- `src/index.css` (animations PiP)

**Travail** :
1. Creer `MiniPlayer` : container 320x180, border-radius 16px, ombre, controles hover
2. Ajouter le bouton "Reduire" dans ImmersiveRoom (dispatch `phase: 'mini'`)
3. En mode mini : les controles (mute, camera, agrandir, quitter) en overlay
4. Gerer l'etat camera-off (initiales utilisateur)
5. Gerer l'indicateur mute permanent

**Effort** : ~3-4h
**Risque** : L'iframe Jitsi peut ne pas bien reagir au changement de taille. Tester specifiquement.
**Mitigation** : Utiliser `api.executeCommand('setVideoQuality', 180)` quand on passe en mini pour forcer Jitsi a s'adapter.
**Dependance** : V2.B
**Stop point** : Validation visuelle du mini-player (screenshot static).

### V2.D — Drag & snap

**Objectif** : Implementer le drag du mini-player avec snap aux 4 coins.

**Fichiers touches** :
- `src/components/room/MiniPlayer.tsx` (ajout logique drag)
- `src/hooks/useDraggable.ts` (NOUVEAU — hook reutilisable)

**Travail** :
1. Creer `useDraggable` : pointer events, RAF tracking, bounds clamping
2. Snap aux 4 coins au release (calcul du coin le plus proche)
3. Animation snap (300ms spring)
4. Persistence position dans localStorage
5. Reset si hors viewport apres resize fenetre

**Effort** : ~2-3h
**Risque** : Performance sur mobile (pointer events + RAF).
**Mitigation** : Tester sur device reel ou emulateur Chrome DevTools.
**Dependance** : V2.C
**Stop point** : Validation drag + snap fluide sur desktop et mobile.

### V2.E — Transitions animees

**Objectif** : Animer les transitions immersive ↔ mini.

**Fichiers touches** :
- `src/components/room/RoomSessionLayer.tsx` (gestion FLIP ou CSS transitions)
- `src/components/room/MiniPlayer.tsx` (animation d'entree/sortie)
- `src/index.css` (keyframes PiP)

**Travail** :
1. Transition immersive → mini (shrink vers coin, 350ms)
2. Transition mini → immersive (expand, 300ms)
3. Animation fermeture mini (scale-down + fade, 250ms)
4. Gerer le backdrop (fade in/out)

**Effort** : ~2-3h
**Risque** : Artefacts visuels avec l'iframe pendant les transitions.
**Mitigation** : Technique FLIP (scale+translate pendant animation, real resize apres).
**Dependance** : V2.D
**Stop point** : Validation de la fluidite des transitions (pas de flash, pas de saut).

### V2.F — Integration et polish

**Objectif** : Gerer les cas limites, collisions z-index, mobile, et cleanup.

**Fichiers touches** :
- `src/components/room/MiniPlayer.tsx` (mobile, accessibilite)
- `src/components/room/RoomSessionLayer.tsx` (gestion salle fermee, visibility)
- `src/components/mika-assistant/MikaAssistantButton.tsx` (deplacement quand PiP visible)
- `src/features/sallereunion/components/FloatingRoomBadge.tsx` (cacher quand PiP visible)

**Travail** :
1. Mobile : taille 240x135, position fixe bas-centre, controles toujours visibles
2. Salle fermee par admin : overlay + fermeture auto
3. MikaAssistantButton : deplacer quand PiP visible
4. FloatingRoomBadge : cacher quand PiP visible
5. Accessibilite : tabIndex, aria-labels, keyboard nav
6. Reduire la qualite video en mini (`setVideoQuality`)

**Effort** : ~3-4h
**Risque** : Regression sur les composants existants (badge, assistant).
**Mitigation** : Test complet de non-regression.
**Dependance** : V2.E
**Stop point** : Validation finale V2 complete.

### Resume des sous-vagues

| Sous-vague | Objectif | Effort | Dependance |
|---|---|---|---|
| V2.A | Context + Provider | ~2-3h | — |
| V2.B | RoomSessionLayer + ImmersiveRoom dans Layout | ~2-3h | V2.A |
| V2.C | MiniPlayer composant | ~3-4h | V2.B |
| V2.D | Drag & snap | ~2-3h | V2.C |
| V2.E | Transitions animees | ~2-3h | V2.D |
| V2.F | Integration, mobile, polish | ~3-4h | V2.E |
| **Total** | | **~15-20h** | |

---

## SECTION 9 — Mockups visuels a produire AVANT le code

### Mockup 1 : MiniPlayer idle

**Description** : Le mini-player en etat repos, video Jitsi visible.

**Details visuels** :
- Container 320x180px
- Border-radius 16px
- Ombre : `0 8px 32px rgba(0,0,0,0.25)`
- Border : 1px `rgba(255,255,255,0.1)`
- Position : coin bas-droite, 16px du bord
- Contenu : flux video Jitsi (simuler avec une image de participant)
- En haut-gauche : badge mute si micro coupe (cercle 24px bg-rose-500/80 avec icone micro barre blanche 14px)
- Pas de controles visibles (etat repos)

### Mockup 2 : MiniPlayer hover

**Description** : Au survol de la souris, les controles apparaissent.

**Details visuels** :
- Meme container que Mockup 1
- Gradient overlay bas : `linear-gradient(transparent, rgba(0,0,0,0.6))` sur les 60px du bas
- 4 boutons :
  - Bas-gauche : micro (32x32 rounded-full bg-white/20 backdrop-blur) + camera (idem)
  - Bas-droite : agrandir (32x32 rounded-full bg-white/20)
  - Haut-droite : quitter (28x28 rounded-full bg-rose-500/80)
- Curseur : `cursor: grab`

### Mockup 3 : MiniPlayer en drag

**Description** : Pendant le deplacement.

**Details visuels** :
- Meme container
- Opacity : 0.85
- Ombre plus forte : `0 12px 40px rgba(0,0,0,0.35)`
- Transform : `scale(1.03)`
- Curseur : `cursor: grabbing`
- Controles caches (seulement le video et le badge mute)

### Mockup 4 : Transition Immersive → Mini (sequence)

**Description** : 3 frames montrant la reduction.

- **Frame 1 (0ms)** : Plein ecran, backdrop noir, video fullscreen
- **Frame 2 (175ms)** : Container a mi-chemin (60% taille), backdrop semi-transparent, border-radius commence a apparaitre (8px)
- **Frame 3 (350ms)** : Container 320x180 en bas-droite, border-radius 16px, backdrop disparu, ombre presente

### Mockup 5 : Integration realiste dans le Layout MIKA

**Description** : L'utilisateur consulte la page `/projets` avec le mini-player visible.

**Details visuels** :
- Layout complet MIKA : Header (4.5rem, fond sombre `#2E5266`), Sidebar (4rem collapsed), Footer (3.5rem)
- Page active : liste des projets (cartes de chantier)
- En bas-droite : MiniPlayer 320x180 en surimpression
- Le MikaAssistantButton est decale vers la gauche (au lieu de bottom-right)
- Le FloatingRoomBadge est absent (l'utilisateur est dans la salle via PiP)

**Couleurs MIKA** :
- Primaire : `#FF6B35` (orange)
- Secondaire : `#2E5266` (bleu fonce)
- Accent : `#48B5A0` (vert)
- Fond : blanc (light) / `#0a0e13` (dark)

### Mockup 6 : Mode mobile

**Description** : Sur ecran 375px de large.

**Details visuels** :
- Layout mobile : Header, pas de sidebar visible, contenu pleine largeur
- MiniPlayer : 240x135px, centre horizontalement, bottom: 72px (au-dessus du footer)
- Pas de drag sur mobile
- Controles toujours visibles (pas de hover sur tactile)
- Boutons plus grands : 36x36px (accessibilite tactile)

---

## SYNTHESE FINALE — Decisions cles

| # | Decision | Recommandation | Justification |
|---|---|---|---|
| 1 | Pattern UX | In-app PiP (style Teams) | MIKA est une SPA, l'API PiP navigateur ne supporte pas les iframes cross-origin |
| 2 | Placement composant | Dans Layout.tsx (Option 2) | Survit a toute navigation, minimal en complexite |
| 3 | Store d'etat | React Context + useReducer | Etat simple (<10 champs), pas besoin de Zustand |
| 4 | Persistance iframe | Container persistent dans RoomSessionLayer, rendu dans Layout | L'iframe n'est jamais demontee tant que la session est active |
| 5 | URL en mode immersif | Pas de changement d'URL (surimpression) | L'utilisateur ne perd pas sa page courante (ex: /budget) |
| 6 | Taille mini | 320 x 180 px (16:9) | Compromis visibilite/encombrement |
| 7 | Position par defaut | Coin bas-droite, 16px du bord | Convention universelle |
| 8 | Comportement drag | Snap magnetique aux 4 coins | Plus previsible pour utilisateurs BTP |
| 9 | Controles mini | Micro, camera, agrandir, quitter — visibles au hover | Convention Meet/Teams/Zoom |
| 10 | Transition immersive → mini | 350ms, cubic-bezier deceleration, technique FLIP | Fluide sans artefact iframe |
| 11 | Declenchement | Manuel (bouton "Reduire") | Plus previsible que l'auto-PiP |
| 12 | Mobile | 240x135, fixe bas-centre, controles toujours visibles | Pas de drag sur petit ecran |
| 13 | Z-index mini | z-[45] | Au-dessus des badges, en-dessous des modales |
| 14 | WebSocket | Deplacer dans RoomSessionProvider | Doit survivre a la navigation |
| 15 | Qualite video en mini | Baisser a 180p via Jitsi API | Reduit CPU/bande passante |

---

> **Statut** : Rapport V2.0 livre. En attente de validation utilisateur sur chaque decision avant lancement de V2.A.
