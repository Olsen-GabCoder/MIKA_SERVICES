# AUDIT MODULE — SALLE DE REUNION (Salle MIKA)

> **Date** : 2026-05-24
> **Auteur** : Audit automatise Claude
> **Perimetre** : Module `sallereunion` — frontend + backend
> **Environnement** : Production sur Render
> **Statut client** : Satisfait — NE RIEN CASSER

---

## SECTION 1 — Identification du module

### 1A. Inventaire complet des fichiers

#### Backend (Spring Boot / Kotlin) — 15 fichiers

| Categorie | Fichier |
|-----------|---------|
| Entity | `backend/.../sallereunion/entity/SalleReunion.kt` |
| Entity | `backend/.../sallereunion/entity/SalleParticipant.kt` |
| Repository | `backend/.../sallereunion/repository/SalleReunionRepository.kt` |
| Repository | `backend/.../sallereunion/repository/SalleParticipantRepository.kt` |
| Service | `backend/.../sallereunion/service/SalleReunionService.kt` |
| Service | `backend/.../sallereunion/service/SalleParticipantService.kt` |
| Service | `backend/.../sallereunion/service/JaaSTokenService.kt` |
| Controller | `backend/.../sallereunion/controller/SalleReunionController.kt` |
| Scheduler | `backend/.../sallereunion/scheduler/SalleParticipantCleanupScheduler.kt` |
| Config | `backend/.../sallereunion/config/SalleReunionInitializer.kt` |
| DTO | `backend/.../sallereunion/dto/SalleReunionResponse.kt` |
| DTO | `backend/.../sallereunion/dto/SalleParticipantResponse.kt` |
| DTO | `backend/.../sallereunion/dto/JitsiConfigResponse.kt` |
| DTO | `backend/.../sallereunion/dto/JaaSTokenResponse.kt` |
| DTO | `backend/.../sallereunion/dto/UserSummary.kt` |
| Enum | `backend/.../common/enums/StatutReunion.kt` (partage avec reunionhebdo) |
| WebSocket | `backend/.../config/websocket/WebSocketConfig.kt` (partage) |

#### Frontend (React / TypeScript) — 26 fichiers

| Categorie | Fichier |
|-----------|---------|
| Page | `features/sallereunion/pages/SalleReunionPage.tsx` |
| Layout | `features/sallereunion/layouts/SalleMikaLayout.tsx` |
| Component | `features/sallereunion/components/LobbyView.tsx` |
| Component | `features/sallereunion/components/ImmersiveRoom.tsx` |
| Component | `features/sallereunion/components/ClosedView.tsx` |
| Component | `features/sallereunion/components/AdminPanel.tsx` |
| Component | `features/sallereunion/components/JitsiRoom.tsx` |
| Component | `features/sallereunion/components/FloatingRoomBadge.tsx` |
| Component | `features/sallereunion/components/PostMeetingModal.tsx` |
| Component | `features/sallereunion/components/ConfirmModal.tsx` |
| Component | `features/sallereunion/components/ParticipantToasts.tsx` |
| Component | `features/sallereunion/components/KeyboardShortcutsOverlay.tsx` |
| Component | `features/sallereunion/components/StatCard.tsx` |
| Component | `features/sallereunion/components/Primitives.tsx` (Avatar, Pill) |
| Component | `features/sallereunion/components/RedirectWithId.tsx` |
| Hook | `features/sallereunion/hooks/useSalleReunion.ts` |
| Hook | `features/sallereunion/hooks/useSalleMutations.ts` |
| Hook | `features/sallereunion/hooks/useSalleWebSocket.ts` |
| Hook | `features/sallereunion/hooks/useSalleNotifications.ts` |
| Hook | `features/sallereunion/hooks/useSalleParticipants.ts` |
| Hook | `features/sallereunion/hooks/useJaaSToken.ts` |
| Hook | `features/sallereunion/hooks/useJitsiConfig.ts` |
| Hook | `features/sallereunion/hooks/useMediaDevices.ts` |
| Hook | `features/sallereunion/hooks/useNetworkQuality.ts` |
| Hook | `features/sallereunion/hooks/useAudioLevel.ts` |
| Hook | `features/sallereunion/hooks/useKeyboardShortcuts.ts` |
| API | `api/salleReunionApi.ts` |
| Types | `types/salleReunion.ts` |
| i18n FR | `locales/fr/salleReunion.json` (185 cles) |
| i18n EN | `locales/en/salleReunion.json` (185 cles) |
| CSS | `index.css` (lignes 23-103 : animations salle-* + lobby-*) |

#### Integration dashboard — 3 fichiers

| Fichier | Role |
|---------|------|
| `dashboard/components/premium/MeetingCard.tsx` | Carte prochaine reunion (PV) |
| `dashboard/components/transversal/ReunionInfo.tsx` | BentoCard reunion |
| `dashboard/hooks/useReunionLatest.ts` | Fetch derniere reunion |

### 1B. Perimetre fonctionnel

**La "Salle MIKA" est une salle de visioconference virtuelle unique et persistante**, integree via Jitsi/JaaS (8x8.vc). Ce n'est PAS un module de reservation de salles physiques ni un module de gestion de reunions de chantier classique.

Concretement :
1. **Un seul room** persistant par plateforme, initialise automatiquement au demarrage (`SalleReunionInitializer`).
2. **Admin ouvre/ferme** la salle — tous les utilisateurs authentifies peuvent alors rejoindre.
3. **Visioconference embarquee** via JitsiMeetExternalAPI avec authentification JWT JaaS (RS256).
4. **Suivi des participants** : join/leave/heartbeat + cleanup automatique des sessions fantomes (5 min).
5. **Notifications navigateur** : alerte les utilisateurs quand la salle s'ouvre.
6. **FloatingRoomBadge** : badge flottant global indiquant que la salle est en direct (visible partout sauf sur la page salle elle-meme).
7. **Integration PV** : apres fermeture, l'admin peut rediger un proces-verbal (module reunionhebdo).
8. **WebSocket STOMP** pour synchronisation temps reel de l'etat de la salle.

### 1C. Modeles backend

#### `SalleReunion` (table `salles_reunion`)

| Champ | Type | Notes |
|-------|------|-------|
| id | Long (auto) | PK, herite de BaseEntity |
| roomName | String(200) | Unique, genere au seed (`mika-bsg-salle-principale-{slug}`) |
| ouverte | Boolean | Etat courant |
| dateOuverture | LocalDateTime? | Derniere ouverture |
| ouvertePar | User (FK LAZY) | Admin qui a ouvert |
| dateFermeture | LocalDateTime? | Derniere fermeture |
| fermeePar | User (FK LAZY) | Admin qui a ferme |
| libelle | String(100) | Defaut "Salle MIKA" |
| createdAt, updatedAt | LocalDateTime | Herites de BaseEntity |

#### `SalleParticipant` (table `salle_participants`)

| Champ | Type | Notes |
|-------|------|-------|
| id | Long (auto) | PK |
| salle | SalleReunion (FK LAZY) | Ref a la salle |
| user | User (FK LAZY) | Participant |
| joinedAt | LocalDateTime | Non-null |
| leftAt | LocalDateTime? | Null = en ligne |
| lastHeartbeatAt | LocalDateTime | Pour cleanup sessions fantomes |

### 1D. Composants React

**Page principale** : `SalleReunionPage.tsx`
- Orchestrateur : gere les 3 etats (closed / opening / open + joined/lobby)
- Utilise 10 hooks specialises
- 3 stat cards en haut, panel principal variable, modales

**Layout** : `SalleMikaLayout.tsx`
- Navigation onglets : "La salle" | "Proces-verbaux"
- Route parente `/salle-mika` avec `<Outlet />`

**Ecrans principaux** :
- `ClosedView` : salle fermee, animation ambiance (orbes), bouton "Ouvrir" (admin)
- `LobbyView` : preview camera/micro, selection peripheriques, infos participants, bouton "Rejoindre"
- `ImmersiveRoom` : portal plein ecran avec JitsiRoom + bouton "Quitter"

### 1E. Endpoints API

| Methode | URL | Permission | Description |
|---------|-----|------------|-------------|
| GET | `/salle-reunion` | Authentifie | Etat courant de la salle |
| GET | `/salle-reunion/jitsi-config` | Authentifie | Config Jitsi legacy |
| GET | `/salle-reunion/jaas-token` | Authentifie | JWT JaaS pour rejoindre |
| POST | `/salle-reunion/ouvrir` | ADMIN/SUPER_ADMIN | Ouvrir la salle |
| POST | `/salle-reunion/fermer` | ADMIN/SUPER_ADMIN | Fermer la salle |
| POST | `/salle-reunion/participants/join` | Authentifie | Signaler entree |
| POST | `/salle-reunion/participants/leave` | Authentifie | Signaler sortie |
| POST | `/salle-reunion/participants/heartbeat` | Authentifie | Heartbeat presence |
| GET | `/salle-reunion/participants/online` | Authentifie | Liste en ligne |
| GET | `/salle-reunion/participants/count-since` | Authentifie | Count distincts depuis date |

---

## SECTION 2 — Diagnostic UX/UI

### 2A. Incongruites fonctionnelles

| # | Localisation | Probleme | Severite | Effort |
|---|-------------|----------|----------|--------|
| F1 | `ParticipantToasts.tsx:65-71` | Quand un participant quitte, le toast affiche "Participant #42" au lieu du nom car les donnees ne sont plus disponibles apres le leave | IMPORTANT | S |
| F2 | `useSalleReunion.ts:13` | `refetchInterval: 3_000` — polling toutes les 3 secondes en plus du WebSocket. Charge serveur inutile quand le WS fonctionne | SOUHAITABLE | S |
| F3 | `SalleReunionPage.tsx:80` | `useEffect` avec dependance `openingProgress !== null` (boolean) au lieu de `openingProgress` — lint disable confirme le contournement | SOUHAITABLE | S |
| F4 | `useMediaDevices.ts:82` | `eslint-disable react-hooks/exhaustive-deps` sur le useEffect initial — `acquireStream` et `stopAllTracks` manquent dans les deps | SOUHAITABLE | S |
| F5 | `LobbyView.tsx:33` | `useAudioLevel` est appele mais le resultat n'est jamais utilise (pas de barre visuelle de volume dans le lobby) | SOUHAITABLE | S |
| F6 | `ImmersiveRoom.tsx:19` | `participantsJoin().catch(() => {})` — erreur silencieusement avalee. Si le join echoue, l'utilisateur ne le sait pas | SOUHAITABLE | S |
| F7 | `JitsiRoom.tsx:69-70` | `startWithAudioMuted: true, startWithVideoMuted: false` en dur au lieu d'utiliser les preferences du lobby (`jitsiPrefsRef`) | IMPORTANT | S |
| F8 | `SalleReunionPage.tsx:158` | Le texte `stats.descriptionOuverte` s'affiche meme quand la salle est fermee (la stat card etat de la salle montre toujours ce texte) | SOUHAITABLE | S |
| F9 | Controller:121-122 | Parametre `since` non valide → `BadRequestException` correcte, mais le message est en francais dur dans un contexte i18n | SOUHAITABLE | S |

### 2B. Incongruites UX

| # | Localisation | Probleme | Severite | Effort |
|---|-------------|----------|----------|--------|
| U1 | `LobbyView.tsx` | Pas de barre de niveau audio visible bien que `useAudioLevel` soit utilise — l'utilisateur ne peut pas verifier que son micro fonctionne | IMPORTANT | S |
| U2 | `ClosedView.tsx` | L'ecran ferme est immersif (560px min) mais ne montre pas l'historique des sessions passees ni de statistiques | SOUHAITABLE | M |
| U3 | `AdminPanel.tsx:26-27` | Le bouton "Ouvrir" est desactive quand salle ouverte mais il apparait quand meme — visuellement confus, masquer serait plus clair | SOUHAITABLE | S |
| U4 | Global | Pas de breadcrumb sur la page Salle MIKA (le layout n'en affiche pas) | SOUHAITABLE | S |
| U5 | `PostMeetingModal.tsx` | La modale post-meeting ne montre pas la liste des participants (seulement le count) — manque de contexte pour rediger le PV | SOUHAITABLE | M |
| U6 | `SalleReunionPage.tsx:220-231` | Toast de succes/erreur positionne en `fixed bottom-6` — peut chevaucher le FloatingRoomBadge sur d'autres pages | SOUHAITABLE | S |
| U7 | `FloatingRoomBadge.tsx` | Le badge ne montre pas combien de participants sont en ligne (la cle i18n `floating.count` existe mais n'est pas utilisee) | SOUHAITABLE | S |
| U8 | `LobbyView.tsx` | Pas d'indicateur de nombre de participants dejavu/historique de la semaine | SOUHAITABLE | S |

### 2C. Incongruites narratives

| # | Probleme | Localisation |
|---|----------|-------------|
| N1 | Le titre dur "Reunion hebdomadaire des chefs de chantier" apparait en dur dans l'i18n (`lobby.reunionTitle`, `meeting.reunionTitle`) — ce n'est pas dynamique, c'est un titre generique en dur | `salleReunion.json:44,84` |
| N2 | Le module est la "Salle MIKA" mais le nom de domaine backend est `salle-reunion` et le feature folder est `sallereunion` — 3 noms differents pour la meme chose | Global |
| N3 | Le breadcrumb dit "Collaboration" (`breadcrumb`) mais la sidebar dit "Salle MIKA" (`sidebar.salleReunion`) | `salleReunion.json:4,183` |

### 2D. Resume : pas de probleme BLOQUANT

Aucun bug bloquant identifie. Le module est fonctionnel et bien construit. Les incongruites sont mineures ou cosmetiques.

---

## SECTION 3 — Diagnostic technique

### 3A. Architecture

**VERDICT : EXCELLENT**

- Le module est correctement isole dans son propre package backend (`modules/sallereunion`) avec entity/repository/service/controller/dto/scheduler/config
- Le frontend est dans `features/sallereunion` avec separation claire pages/components/hooks/layouts
- Les hooks sont bien decoupes par responsabilite (11 hooks specialises)
- Pas de duplication significative avec d'autres modules
- Le seul enum partage (`StatutReunion`) est dans `common/enums` — correct
- La separation layout/page avec `SalleMikaLayout` + `<Outlet>` est propre

### 3B. Performance

| # | Probleme | Severite | Details |
|---|----------|----------|---------|
| P1 | Polling agressif : `useSalleReunion` poll toutes les 3s + `useSalleParticipants` toutes les 5s + WebSocket | SOUHAITABLE | WebSocket devrait etre suffisant comme source primaire, avec polling comme fallback uniquement |
| P2 | `useNetworkQuality` fait 3 requetes `/health` toutes les 30s pour mesurer la latence | SOUHAITABLE | Charge serveur modeste mais inutile quand la salle est fermee (le hook est toujours actif) |
| P3 | `SalleReunionService.getOrThrow()` fait un `findFirstByOrderByIdAsc()` a chaque appel — pas de cache pour une entite quasi-statique | SOUHAITABLE | Acceptable pour le MVP single-salle |
| P4 | `SalleParticipantRepository.findBySalleIdAndLeftAtIsNull` — potentiel N+1 sur `user` (LAZY) | SOUHAITABLE | Impact faible vu le nombre reduit de participants simultanes |

**Indexes** : Les FK `salle_id` et `user_id` sur `salle_participants` sont probablement indexes par JPA/Hibernate. Pas de probleme evident.

**Pagination** : Non necessaire — la liste des participants en ligne est toujours petite.

### 3C. Securite

**VERDICT : SOLIDE**

| # | Point | Statut |
|---|-------|--------|
| S1 | Endpoints ouvrir/fermer proteges par `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")` | OK |
| S2 | JWT JaaS signe RS256 avec cle privee | OK |
| S3 | Token JaaS refuse si salle fermee (check dans controller L57-58) | OK |
| S4 | Participants join refuse si salle fermee (check dans service L26) | OK |
| S5 | Logging des actions admin (ouverture/fermeture) | OK |
| S6 | WebSocket config avec `setAllowedOriginPatterns("*")` | ATTENTION en prod |
| S7 | `getAccessToken()` passe en header WS STOMP | OK |
| S8 | Pas de risque multi-tenant (single salle par plateforme) | OK |
| S9 | Le heartbeat ne verifie pas que la salle est encore ouverte — un participant pourrait heartbeat indefiniment sur une salle fermee | MINEUR |
| S10 | `JaaSTokenService.loadPrivateKey` log le chemin du fichier cle privee en DEBUG | MINEUR |

### 3D. Robustesse

| # | Point | Statut |
|---|-------|--------|
| R1 | `@Transactional` sur toutes les operations service | OK |
| R2 | `ConflictException` pour double ouverture/fermeture (idempotence partielle) | OK |
| R3 | Scheduler cleanup des sessions fantomes toutes les 5 min | OK |
| R4 | WebSocket broadcast en try/catch avec fallback log | OK |
| R5 | `SalleReunionInitializer` gere le cas concurrent (`DataIntegrityViolationException`) | OK |
| R6 | Toast system pour feedback utilisateur (succes/erreur) | OK |
| R7 | Frontend : loading state, error state, empty state tous presents | OK |
| R8 | Focus trap dans les modales (ConfirmModal, PostMeetingModal) | OK |
| R9 | Escape key pour quitter le mode immersif | OK |

---

## SECTION 4 — Opportunites d'automatisation

### 4A. Notifications automatisables

| # | Automatisation | Existe | Benefice | Effort | Priorite |
|---|---------------|--------|----------|--------|----------|
| A1 | Notification navigateur a l'ouverture | OUI | -- | -- | -- |
| A2 | Rappel email/SMS 15 min avant reunion planifiee | NON | Eleve : les chefs de chantier au terrain ne consultent pas la plateforme en continu | L | P1 |
| A3 | Notification push mobile (PWA) | NON | Eleve : audience mobile BTP | M | P1 |
| A4 | Notification au-dela de X minutes sans admin : auto-close | NON | Moyen : evite sessions orphelines | S | P2 |
| A5 | Notification recap post-session (email resume + lien PV) | NON | Eleve : traçabilite automatique | M | P1 |

### 4B. Documents automatisables

| # | Automatisation | Existe | Benefice | Effort | Priorite |
|---|---------------|--------|----------|--------|----------|
| D1 | PDF recapitulatif de session (duree, participants, heures) | NON | Moyen : archivage et compliance | M | P2 |
| D2 | Lien automatique session -> PV (pre-remplir la date, lieu, participants) | PARTIEL (date uniquement via URL) | Eleve : gain de temps redaction PV | S | P0 |
| D3 | Export CSV historique des sessions (qui, quand, duree) | NON | Moyen : reporting RH/direction | S | P2 |

### 4C. Workflows automatisables

| # | Automatisation | Existe | Benefice | Effort | Priorite |
|---|---------------|--------|----------|--------|----------|
| W1 | Planification de session (admin programme ouverture a 14h mardi) | NON | Eleve : systematise les reunions hebdo | M | P1 |
| W2 | Auto-close apres X minutes d'inactivite (0 participant) | NON | Moyen : evite salle ouverte vide | S | P1 |
| W3 | Reporter automatiquement les actions ouvertes du PV precedent | NON | Eleve : pilotage continu | M | P1 |
| W4 | Invitation automatique des participants reguliers | NON | Moyen : gain de temps admin | M | P2 |
| W5 | Session recurrente (tous les mardis a 14h) | NON | Eleve : workflow standard BTP | M | P1 |

### 4D. Intelligence possible

| # | Automatisation | Existe | Benefice | Effort | Priorite |
|---|---------------|--------|----------|--------|----------|
| I1 | Statistiques d'utilisation (frequence, duree moyenne, participation) | NON | Eleve : visibilite direction | M | P1 |
| I2 | Dashboard "Salle MIKA" avec metriques (sessions/semaine, duree, tendance) | NON | Eleve : premiumisation | M | P1 |
| I3 | Alertes participants chroniquement absents | NON | Moyen : gouvernance | L | P2 |
| I4 | Resume IA du PV (via module IA existant MikaAssistant) | NON | Eleve : differenciant | M | P2 |

### 4E. Integrations souhaitables

| # | Integration | Existe | Benefice | Effort | Priorite |
|---|------------|--------|----------|--------|----------|
| E1 | Lien WhatsApp pour partage rapide convocation | NON | Eleve : canal principal au Gabon | S | P0 |
| E2 | Export Google Calendar / .ics pour sessions planifiees | NON | Moyen : standard professionnel | M | P2 |
| E3 | Synchronisation avec module Projets (lier session a un chantier) | PARTIEL (i18n mentionne "projets lies" mais pas implemente) | Eleve : tracabilite | M | P1 |
| E4 | Enregistrement session (Jitsi recording) | i18n presente mais non implemente | Moyen : archivage | L | P2 |

---

## SECTION 5 — Opportunites de premiumisation visuelle

### 5A. Design system actuel

Le module Salle MIKA utilise deja un design system premium bien etabli :

- **Couleurs signature** : `#FF6B35` (MIKA orange), `#2E5266` (bleu profond), `#48B5A0` (vert qualite)
- **Tokens CSS** : variables `--db-*` pour le dashboard, classes Tailwind pour les composants
- **Animations CSS** : 11 animations dediees (`salle-pulse-ring`, `salle-breathe`, `salle-slideUp`, `salle-fadeIn`, `salle-scaleIn`, `salle-shimmer`, `salle-immersive-enter`, `lobby-pulsebar`, `lobby-live-pulse`, `lobby-radiopulse`, `salle-breathe-slow`)
- **Composants atomiques** : `Avatar`, `Pill`, `StatCard` — primitives reutilisables
- **Dark mode** : complet sur tout le module
- **Micro-interactions** : hover elevations, scale-down au clic, transitions de couleur
- **Typography** : tracking negatif, tabular-nums, tailles granulaires

**Comparable a V4-V5 Terre Noire** — deja au-dessus du standard SaaS moyen. Le ClosedView avec orbes respirant et le lobby avec radio-pulse sont deja premium.

### 5B. Ecrans a elever en priorite

| Ecran | Etat actuel | Elevation proposee |
|-------|-------------|-------------------|
| **ClosedView** | Tres bon — orbes ambiance, bouton CTA | Ajouter historique des sessions passees, countdown si planifiee |
| **LobbyView** | Bon — preview camera, selection devices | Ajouter barre audio visuelle, indicateur qualite plus riche, avatars animes |
| **ImmersiveRoom** | Fonctionnel — portal plein ecran | Ajouter overlay discret MIKA (timer, participants count), animations sortie |
| **PostMeetingModal** | Bon — stats + CTA PV | Enrichir avec timeline des participants (qui est venu quand) |
| **Pas de dashboard module** | Absent | Creer un dashboard mini avec metriques de la semaine/mois |

### 5C. Micro-interactions souhaitables

| # | Micro-interaction | Presente | Effort |
|---|-------------------|----------|--------|
| M1 | Barre de niveau audio (VU-metre) dans le lobby | NON (hook existe, pas de rendu) | S |
| M2 | Animation de transition closed -> opening -> open (deja presente mais basique) | PARTIEL | S |
| M3 | Animation de "quelqu'un rejoint" plus riche (avatars qui apparaissent avec spring) | NON | S |
| M4 | Grain/texture dans le mode immersif (classe CSS `salle-grain` existe mais pas utilisee) | NON | S |
| M5 | Timer en direct de la session (duree depuis ouverture, visible dans le lobby) | NON | S |
| M6 | Confetti/celebration a la fermeture de session (apres le recap) | NON | S |

### 5D. Responsive / Mobile

| Point | Etat |
|-------|------|
| Layout responsive | OK — grilles `grid-cols-1 xl:grid-cols-2`, breakpoints md/lg/xl |
| Boutons tactiles | OK — min-h-[44px] ou min-h-[48px] respecte partout |
| Video preview mobile | OK — aspect-ratio 16/10 avec min-h-[240px] |
| Device selector popup | ATTENTION — position `absolute bottom-full right-0 w-[300px]` peut deborder sur petit ecran |
| Immersive mode mobile | PARTIEL — le Jitsi iframe est responsive mais le bouton "Quitter" en fixed top-left peut gêner |
| Gestes tactiles | NON — pas de swipe pour fermer, pas de pull-to-refresh |

---

## SECTION 6 — Synthese et decoupage en vagues

### V1 — Foundations (corrections IMPORTANT)

**Objectif** : Corriger les defauts fonctionnels identifies sans toucher au design.

| Item | Ref | Effort |
|------|-----|--------|
| Fix ParticipantToasts : stocker les noms avant le leave pour un toast correct | F1 | 0.5j |
| Passer les preferences camera/micro du lobby au JitsiRoom | F7 | 0.5j |
| Ajouter VU-metre audio visuel dans le lobby (hook existe, manque le rendu) | U1, M1 | 0.5j |
| Utiliser le count de participants dans le FloatingRoomBadge | U7 | 0.25j |
| Fix texte `descriptionOuverte` qui s'affiche meme salle fermee | F8 | 0.25j |

**Effort total V1** : ~2 jours
**Dependances** : Aucune

### V2 — Composants atomiques manquants

**Objectif** : Completer la boite a outils de composants reutilisables.

| Item | Effort |
|------|--------|
| Composant `SessionTimer` (duree en direct depuis ouverture) | 0.5j |
| Composant `AudioVUMeter` (barre de niveau audio) | 0.5j |
| Composant `ParticipantStack` (pile d'avatars animee) | 0.5j |
| Composant `SessionHistoryItem` (ligne d'historique compact) | 0.25j |

**Effort total V2** : ~1.5 jours
**Dependances** : V1

### V3 — Premiumisation visuelle des ecrans principaux

**Objectif** : Elever le lobby et la ClosedView au niveau signature MIKA.

| Item | Effort |
|------|--------|
| LobbyView : integrer VU-metre, timer, ParticipantStack anime | 0.5j |
| ClosedView : ajouter historique des 3 dernieres sessions (mini-timeline) | 1j |
| PostMeetingModal : ajouter timeline participants (qui/quand) | 0.5j |
| Activer le grain CSS (`salle-grain`) dans le mode immersif | 0.25j |

**Effort total V3** : ~2.5 jours
**Dependances** : V2

### V4 — Dashboard et metriques

**Objectif** : Creer un mini-dashboard de la Salle MIKA avec metriques.

| Item | Ref | Effort |
|------|-----|--------|
| Backend : endpoint `/salle-reunion/stats` (sessions/semaine, duree totale, participants moyens) | I1 | 1j |
| Frontend : section "Statistiques" sur la page salle (visible quand fermee) | I2 | 1.5j |
| Graphe sparkline de l'activite des 4 dernieres semaines | I2 | 0.5j |

**Effort total V4** : ~3 jours
**Dependances** : V3

### V5 — Etats et micro-narrations

**Objectif** : Peaufiner les empty states, transitions, et feedback.

| Item | Ref | Effort |
|------|-----|--------|
| Transition animee close -> opening -> open plus cinematique | M2 | 0.5j |
| Animation spring pour les avatars qui arrivent/partent | M3 | 0.5j |
| Celebration subtile post-session (animation de fin) | M6 | 0.25j |
| Enrichir les toasts avec noms corrects (V1 prerequis) | F1 | 0.25j |

**Effort total V5** : ~1.5 jours
**Dependances** : V1, V2

### V6 — Animations et atmosphere

**Objectif** : Touche finale d'atmosphere premium.

| Item | Effort |
|------|--------|
| Orbes respiration plus sophistiques (3 couches, couleurs dynamiques) | 0.5j |
| Overlay discret MIKA en immersive (timer + count en haut a droite) | 0.5j |
| Transition de sortie immersive (fade-out cinematique) | 0.25j |
| Responsive mobile : swipe-down pour fermer les modales | 0.5j |

**Effort total V6** : ~1.75 jours
**Dependances** : V3

### V7 — Touches signees (PDFs, exports, integrations)

**Objectif** : Integrations qui differencient MIKA Services.

| Item | Ref | Effort |
|------|-----|--------|
| Lien WhatsApp pour partager convocation de session | E1 | 0.5j |
| Pre-remplissage complet PV (date + lieu + participants de session) | D2 | 1j |
| Export CSV historique des sessions | D3 | 0.5j |
| PDF recapitulatif de session automatique | D1 | 1.5j |

**Effort total V7** : ~3.5 jours
**Dependances** : V4 (stats)

### Vague AUTO — Automatisations strategiques transverses

**Objectif** : Ce qui change fondamentalement l'experience.

| Item | Ref | Effort |
|------|-----|--------|
| Session planifiee : ouverture auto a heure programmee | W1, W5 | 2j |
| Auto-close apres 15 min sans participant | W2 | 0.5j |
| Email recap post-session automatique | A5 | 1j |
| Notification push PWA a l'ouverture | A3 | 1.5j |
| Lien automatique session <-> projet/chantier | E3 | 1.5j |

**Effort total Vague AUTO** : ~6.5 jours
**Dependances** : V1 minimum

### Resume des efforts

| Vague | Effort | Cumule |
|-------|--------|--------|
| V1 Foundations | 2j | 2j |
| V2 Composants | 1.5j | 3.5j |
| V3 Premium visuel | 2.5j | 6j |
| V4 Dashboard | 3j | 9j |
| V5 Micro-narrations | 1.5j | 10.5j |
| V6 Animations | 1.75j | 12.25j |
| V7 Touches signees | 3.5j | 15.75j |
| AUTO Automatisations | 6.5j | 22.25j |
| **TOTAL** | **~22 jours** | |

---

## SECTION 7 — Risques et points d'attention

### 7A. Precautions production

1. **JaaS token** : Toute modification au `JaaSTokenService` ou a la config Jitsi doit etre testee en staging avant prod. Un token invalide = visio cassee pour tous.
2. **WebSocket** : Le `WebSocketConfig` avec `setAllowedOriginPatterns("*")` est acceptable en dev mais devrait etre restreint en prod.
3. **SalleReunionInitializer** : Le `@PostConstruct` cree la salle au demarrage. Toute migration de schema doit etre compatible.
4. **Feature flags** : Les vagues V3+ devraient idealement etre derriere un flag pour rollback rapide cote frontend.

### 7B. Donnees critiques en BDD

| Table | Donnees | Risque migration |
|-------|---------|------------------|
| `salles_reunion` | 1 seul enregistrement | NUL — jamais modifie en schema |
| `salle_participants` | Historique de toutes les sessions | FAIBLE — ajout de colonnes OK, suppression NON |

L'historique des sessions est la seule donnee a valeur durable. Toute modification de schema sur `salle_participants` doit etre additive (ajout de colonnes nullables).

### 7C. Dependances inter-modules

| Module dependant | Lien | Risque |
|-----------------|------|--------|
| `reunionhebdo` | Partage le layout `SalleMikaLayout`, le PV est cree apres fermeture de session | FAIBLE — lien par URL, pas de couplage code |
| `dashboard` | `MeetingCard` et `ReunionInfo` affichent la derniere reunion (PV, pas la salle) | NUL |
| `Layout` (global) | `FloatingRoomBadge` importe dans le layout principal | FAIBLE — composant autonome |
| `StatutReunion` enum | Partage avec `reunionhebdo` | NUL — enum BROUILLON/VALIDE concerne les PV |

**Risque d'effet de bord** : FAIBLE. Le module est bien isole. Les seuls points de contact sont le layout et le badge flottant.

### 7D. Strategie de rollback

1. **Frontend** : Deploiement Render avec rollback en 1 clic sur le commit precedent.
2. **Backend** : Migrations additives uniquement (ajout colonnes). Rollback = redeploy commit precedent.
3. **Vagues incrementales** : Chaque vague est un commit autonome. Rollback par vague possible.
4. **Feature flags** : Pour les vagues V4+ (dashboard, auto-close), utiliser `app.features.salle-dashboard=true` dans les properties.

---

## ANNEXE — Ce qui est deja EXCELLENT

Ce module est deja d'une qualite tres superieure a la moyenne des SaaS BTP :

1. **Architecture** : Separation clean backend/frontend, hooks specialises, feature-based structure
2. **Securite** : JWT JaaS RS256, PreAuthorize sur les actions admin, logging
3. **UX** : Lobby avec preview camera, notifications navigateur, FloatingBadge global, raccourcis clavier
4. **Design** : Animations premium (11 keyframes), dark mode complet, micro-interactions soignees
5. **Robustesse** : Heartbeat + cleanup fantomes, focus trap modales, gestion erreurs WebSocket
6. **i18n** : Bilingue FR/EN complet (185 cles)
7. **Accessibilite** : `aria-modal`, `aria-label`, `role="dialog"`, focus management, min-h-[44px] tactile
8. **Integration PV** : Flux naturel session -> proces-verbal apres fermeture

**Ce module n'a pas besoin d'une refonte. Il a besoin d'une elevation.**
