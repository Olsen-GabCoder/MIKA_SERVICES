# V2 — Audit Sidebar MIKA Services

> Source : `src/components/layout/sidebarConfig.tsx` + `Sidebar.tsx`
> Date : 2026-05-25

## Sections principales (SIDEBAR_ITEMS)

| # | Route | Label i18n | Icone | Admin only | Badge |
|---|-------|-----------|-------|------------|-------|
| 1 | `/` | sidebar.dashboard | DashboardIcon (grid 4 carres) | Non | — |
| 2 | `/projets` | sidebar.projets | FolderIcon | Non | — |
| 3 | `/salle-mika` | salleReunion:sidebar.salleReunion | SalleIcon (ondes radio) | Non | — |
| 4 | `/equipes` | sidebar.equipes | EquipeIcon (3 personnes) | Non | — |
| 5 | `/engins` | sidebar.engins | EnginIcon (fleches echange) | Non | — |
| 6 | `/materiaux` | sidebar.materiaux | CubeIcon (cube 3D) | Non | — |
| 7 | `/budget` | sidebar.budget | BudgetIcon (cercle dollar) | Non | — |
| 8 | `/planning` | sidebar.planning | CalendarIcon | Non | — |
| 9 | `/messagerie` | sidebar.messagerie | MailIcon | Non | messages |
| 10 | `/notifications` | sidebar.notifications | BellIcon | Non | notifications |
| 11 | `/documents` | sidebar.documents | DocumentIcon | Non | — |
| 12 | `/fournisseurs` | sidebar.fournisseurs | TruckIcon | Non | — |
| 13 | `/bareme` | sidebar.bareme | BaremeIcon (calculatrice) | Non | — |
| 14 | `/suivi-activite` | sidebar.suiviActivite | ActivityIcon (barres) | **Oui** | — |

## Groupe Qualite (depliable)

| # | Route | Label i18n | Icone |
|---|-------|-----------|-------|
| Q1 | `/qualite/synthese` | qualite:sidebar.synthese | DashboardIcon |
| Q2 | `/qualite/receptions` | qualite:sidebar.receptions | ChecklistIcon |
| Q3 | `/qualite/essais-labo` | qualite:sidebar.essaisLabo | BeakerIcon |
| Q4 | `/qualite/levees-topo` | qualite:sidebar.leveeTopo | TopoIcon |
| Q5 | `/qualite/agrements` | qualite:sidebar.agrements | DocumentIcon |
| Q6 | `/qualite/evenements` | qualite:sidebar.ncRcPpi | IncidentIcon |
| Q7 | `/qualite/documents` | qualite:sidebar.documents | DocumentIcon |

## Groupe SHE (depliable)

| # | Route | Label i18n | Icone |
|---|-------|-----------|-------|
| S1 | `/qshe/dashboard` | qshe:sidebar.dashboard | DashboardIcon |
| S2 | `/qshe/incidents` | qshe:sidebar.incidents | IncidentIcon |
| S3 | `/qshe/inspections` | qshe:sidebar.inspections | ChecklistIcon |
| S4 | `/qshe/risques` | qshe:sidebar.risques | ShieldIcon |
| S5 | `/qshe/formations` | qshe:sidebar.formations | CertIcon |
| S6 | `/qshe/epi` | qshe:sidebar.epi | ShieldIcon |
| S7 | `/qshe/causeries` | qshe:sidebar.causeries | ReunionIcon |
| S8 | `/qshe/permis` | qshe:sidebar.permis | DocumentIcon |
| S9 | `/qshe/environnement` | qshe:sidebar.environnement | EnvIcon |
| S10 | `/qshe/produits-chimiques` | qshe:sidebar.fds | CubeIcon |

## Section Parametres (bas du sidebar)

- Parametres (`/parametres`)
- Mon Profil (`/profile`)
- Mode sombre (toggle)
- Langue (FR / EN)
- Menu utilisateur : Profil, Gestion utilisateurs (admin), Deconnexion

---

## Sections retenues pour l'overlay "Naviguer" (Mockup 7)

Selection des sections les plus utiles pendant une reunion BTP :

| # | Label | Route | Icone | Justification |
|---|-------|-------|-------|---------------|
| 1 | Tableau de bord | `/` | Grid | Vue d'ensemble rapide |
| 2 | Projets | `/projets` | Folder | Consultation chantiers en cours |
| 3 | Equipes | `/equipes` | People | Verifier effectifs |
| 4 | Equipements | `/engins` | Arrows | Disponibilite engins |
| 5 | Materiaux | `/materiaux` | Cube | Stocks |
| 6 | Budget | `/budget` | Dollar | Suivi financier |
| 7 | Planning | `/planning` | Calendar | Calendrier chantier |
| 8 | Qualite | `/qualite/synthese` | Checkmark | Synthese qualite |
| 9 | QSHE | `/qshe/dashboard` | Shield | Dashboard securite |
| 10 | PV de reunions | `/salle-mika/pv` | Document | Consulter/creer un PV |
| 11 | Documents | `/documents` | Document | Acces GED |
| 12 | Bareme | `/bareme` | Calculator | Reference prix |

**Exclus** : Messagerie, Notifications, Fournisseurs (peu utiles pendant une reunion), Suivi activite (admin only).
