# Salle MIKA V2 — Rapport Final

> Picture-in-Picture Mini-Player Draggable
> Commit : `366a235` sur master | Date : 2026-05-25

---

## Vue d'ensemble

**Objectif** : Permettre a l'utilisateur de suivre une reunion video tout en naviguant sur la plateforme MIKA Services, via un mini-player flottant draggable (pattern in-app PiP style Teams).

**Methodologie** : 7 sous-vagues (V2.A a V2.G), chaque sous-vague validee par l'utilisateur avant la suivante. Commits granulaires squash-merged en un seul commit sur master.

**Resultat** : 14 fichiers touches, 1094 lignes ajoutees, 75 retirees. Aucune dependance npm ajoutee.

---

## Architecture finale

```
App.tsx
  Layout.tsx
    RoomSessionProvider (Context + useReducer)
      Header / Sidebar / main (pages) / Footer
      FloatingRoomBadge (cache si session active)
      MikaAssistantButton (repositionne si mini en bas-droite)
      MikaAssistantDrawer
      RoomSessionLayer
        RoomVideoContainer (PERSISTANT — jamais demonte)
          JitsiRoom (iframe persistante, width:100% height:100%)
          participantsJoin/Leave (mount/unmount)
          heartbeat (setInterval 2min)
          Jitsi mute event listeners
        ImmersiveRoom (toolbar: Reduire | Naviguer | Sortir)
          NavigateOverlay (grid 12 sections MIKA)
          ConfirmModal (quitter)
        MiniPlayer (overlay controles: mute badge, hover, drag)
          useDraggable (pointer events, RAF, snap 4 coins)
          ConfirmModal (quitter)
```

**Principe cle** : RoomVideoContainer heberge l'iframe Jitsi et n'est jamais demonte tant que la session est active. Seul son style CSS change entre immersif (fixed inset-0) et mini (fixed position + dimensions). L'animation FLIP (350ms cubic-bezier) assure la transition fluide.

---

## 7 sous-vagues detaillees

### V2.A — RoomSessionContext + Provider (fondation)
- Context React avec useReducer (phase, jaasToken, mediaPrefs, miniPosition, salleOuverte)
- 10 actions couvrant tout le lifecycle de session
- Provider integre dans Layout.tsx
- SalleReunionPage migre vers le contexte (joined -> state.phase)

### V2.B — RoomSessionLayer dans Layout
- ImmersiveRoom monte depuis Layout (pas depuis SalleReunionPage)
- L'iframe Jitsi survit aux changements de route
- createPortal retire de SalleReunionPage

### V2.C — MiniPlayer structure + bouton Reduire
- MiniPlayer composant avec controles hover (micro, camera, agrandir, quitter)
- Bouton "Reduire" ajoute dans ImmersiveRoom (toolbar)
- RoomSessionLayer rend Immersive OU Mini selon phase
- ConfirmModal reutilisee pour quitter depuis le mini
- i18n FR/EN pour actions et libelles mini

### V2.D — Drag + snap aux 4 coins
- useDraggable hook reutilisable (pointer events natifs, RAF, bounds)
- Snap magnetique aux 4 coins au release (300ms cubic-bezier)
- Persistance localStorage via SET_MINI_POSITION
- Reset automatique si position hors viewport apres resize
- PointerCapture pour ne pas perdre le drag hors element

### V2.E — Iframe Jitsi persistante (FLIP)
- RoomVideoContainer composant persistant qui heberge JitsiRoom
- L'iframe Jitsi n'est jamais demontee pendant la bascule immersif/mini
- Animation FLIP : transition CSS sur container (350ms cubic-bezier)
- ImmersiveRoom devient une toolbar pure
- MiniPlayer devient un overlay de controles
- Heartbeat et participantsJoin/Leave deplaces dans RoomVideoContainer

### V2.F — Polish (micro/camera, mobile, collisions)
- Boutons micro/camera cables a l'iframe Jitsi (executeCommand)
- Sync etat mute via events Jitsi (audioMuteStatusChanged/videoMuteStatusChanged)
- JitsiRoom etendu de 3 lignes (callback onApiReady, export type)
- Mode mobile (< 768px) : mini 340x213 fixe bas-centre, drag desactive, controles permanents
- FloatingRoomBadge cache quand session active
- MikaAssistantButton decale quand mini en bas-droite
- useDraggable : option disabled pour mobile

### V2.G — Bouton Naviguer + overlay raccourcis
- NavigateOverlay avec grid 12 sections MIKA
- Clic section = auto-switch mini + navigate vers la route
- Bouton "Naviguer" ajoute dans la toolbar immersive
- Badge vert pulse "Reunion en cours — passage auto en mini-player"
- Escape ferme l'overlay avant la confirmation de sortie
- Mini ajuste a 560x350 horizontal (ratio 16:10, style lobby)

---

## Decisions structurantes retenues

| # | Decision | Choix |
|---|----------|-------|
| 1 | Pattern UX | In-app PiP (style Teams) |
| 2 | Placement composant | Layout.tsx (survit a toute navigation) |
| 3 | Store d'etat | React Context + useReducer |
| 4 | Persistance iframe | RoomVideoContainer jamais demonte |
| 5 | URL en mode immersif | Surimpression sans changement d'URL |
| 6 | Taille mini | 560 x 350 px (16:10 horizontal, style lobby) |
| 7 | Position par defaut | Coin bas-droite, 16px du bord |
| 8 | Drag | Snap magnetique aux 4 coins |
| 9 | Controles mini | Micro, camera, agrandir, quitter — visibles au hover |
| 10 | Transition FLIP | 350ms cubic-bezier(0.32, 0.72, 0, 1) |
| 11 | Declenchement | Manuel (bouton "Reduire") + bouton "Naviguer" |
| 12 | Mobile | 340x213 fixe bas-centre, drag desactive, controles permanents |
| 13 | Z-index mini | z-[55] (video), z-[56] (controles) |
| 14 | Navigation depuis immersif | Overlay "Naviguer" avec 12 sections |
| 15 | Dependances | Aucune ajoutee (implementation native) |

---

## Dette technique notee pour V3+

1. **Boutons micro/camera mini** : l'icone reflète l'etat Jitsi mais pas d'animation a la transition (pas de micro-interaction)
2. **Mini sur mobile** : pas de minimisation gestuelle (swipe pour agrandir), uniquement tap
3. **NavigateOverlay labels** : labels FR/EN en dur dans le composant au lieu de cles i18n (hot reload ne detectait pas les nouvelles cles — a investiguer)
4. **useAudioLevel** : 2 streams audio potentiellement actifs en mode lobby (dette V1, pas aggravee par V2)
5. **Zoom portrait** : tentative de mini portrait abandonnee (crop trop agressif sur le visage), reste en horizontal
6. **useSalleWebSocket** : toujours scopé a SalleReunionPage, pas deplace dans le provider global (fonctionne car le polling TanStack compense)

---

## Metriques

| Metrique | Valeur |
|---|---|
| Commits granulaires | 7 (V2.A a V2.G) |
| Commit squash final | `366a235` |
| Fichiers nouveaux | 7 (RoomSessionContext, RoomSessionLayer, RoomVideoContainer, MiniPlayer, NavigateOverlay, MikaAssistantButton, useDraggable) |
| Fichiers modifies | 7 (Layout, SalleReunionPage, ImmersiveRoom, JitsiRoom, FloatingRoomBadge, salleReunion.json FR/EN) |
| Lignes ajoutees | 1094 |
| Lignes retirees | 75 |
| Dependances npm ajoutees | 0 |
| Modules hors whitelist touches | 0 |
