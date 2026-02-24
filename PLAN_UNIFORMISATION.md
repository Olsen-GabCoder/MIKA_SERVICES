# Plan d’uniformisation et de tests — MIKA Services

## 1. Analyse de l’existant

### 1.1 Référence visuelle : page Profil
- **Conteneur** : `PageContainer size="full"` + `className="w-full space-y-6"`.
- **Structure** : deux colonnes (`grid-cols-1 lg:grid-cols-2`), cartes à hauteur égale (`flex-1 min-h-0`), espacements `gap-6` / `gap-8`.
- **Responsive** : pleine largeur, padding géré par `Layout` (`p-4 sm:p-6 lg:p-8`).

### 1.2 Pages déjà alignées (avec PageContainer)
| Page | size | Usage |
|------|------|--------|
| ProfilePage | full | Profil, 2 colonnes |
| DocumentPage | wide | Liste documents |
| ProjetListPage, ChantierListPage, UserManagementPage | wide | Listes / tableaux |
| ProjetDetailPage, ChantierDetailPage, EquipeDetailPage | default | Fiches détail |
| ProjetFormPage, ChantierFormPage | default | Formulaires |
| EquipeFormPage | narrow | Formulaire équipe |

### 1.3 Pages sans PageContainer (à uniformiser)
| Page | Conteneur actuel | Cible |
|------|------------------|--------|
| DashboardPage | `<div className="space-y-6">` | PageContainer **full** |
| ReportingPage | `<div className="space-y-6">` | PageContainer **wide** |
| BudgetPage | `<div className="p-6">` | PageContainer **wide** |
| PlanningPage | `<div className="space-y-6">` | PageContainer **wide** |
| QualitePage | `<div className="space-y-6">` | PageContainer **wide** |
| SecuritePage | `<div className="space-y-6">` (à confirmer) | PageContainer **wide** |
| MessageriePage | div racine | PageContainer **wide** |
| NotificationsPage | div racine | PageContainer **wide** |
| FournisseurPage | `<div className="space-y-6">` | PageContainer **wide** |
| EnginListPage | `<div className="p-6">` | PageContainer **wide** |
| MateriauListPage | `<div className="p-6">` | PageContainer **wide** |
| EquipeListPage | `<div className="p-6">` | PageContainer **wide** |

### 1.4 Règles d’uniformisation retenues
- **Espacements** : `space-y-6` au niveau page ; cartes/sections en `gap-4` ou `gap-6` selon densité.
- **Cartes** : `bg-white rounded-xl shadow-sm border p-4` ou `p-6` selon contenu.
- **Titres de section** : `text-2xl font-bold text-gray-900` + sous-titre `text-gray-500 mt-1`.
- **Conteneur** : une seule racine `PageContainer` par page, avec `className="space-y-6"` (ou `w-full space-y-6` pour full).
- **Listes/tableaux** : `size="wide"` ; **dashboard / vue globale** : `size="full"` ; **formulaires étroits** : `narrow` ; **fiches détail** : `default`.

### 1.5 Modules et données (slices / API)
- **Reporting** : `reportingSlice` → `fetchGlobalDashboard`, `fetchProjetReport` ; types `GlobalDashboard`, `ProjetReport`. API réelle ; mock possible côté front si backend absent.
- **Autres slices** : auth, budget, chantier, communication, document, engin, equipe, fournisseur, materiau, planning, projet, qualite, reporting, securite, user.
- Données mock : à centraliser (fichier `mock/` ou initial state dans les slices) pour projets, chantiers, équipes, rapports, budget, planning, qualité, sécurité, fournisseurs, engins, matériaux, messages, notifications.

---

## 2. Plan d’action en 4 étapes

### Étape 1 — Uniformiser l’interface
1. **Wrapper PageContainer**  
   Pour chaque page listée en 1.3 : importer `PageContainer`, envelopper le contenu existant dans `<PageContainer size="…" className="space-y-6">` (sans doubler le padding : le Layout fournit déjà `p-4 sm:p-6 lg:p-8`).
2. **Taille par type de page**  
   - Dashboard : `size="full"`.  
   - Reporting, Budget, Planning, Qualité, Sécurité, Messagerie, Notifications, Fournisseurs, Engins, Matériaux, Équipes (liste) : `size="wide"`.
3. **Cohérence des blocs**  
   - Remplacer tout `p-6` racine par le conteneur (éviter `p-6` en plus du Layout).  
   - Vérifier titres (h1 + sous-titre) et cartes (même style `rounded-xl shadow-sm border`).
4. **Checklist**  
   - [x] DashboardPage (size="full")  
   - [x] ReportingPage (size="wide")  
   - [x] BudgetPage (size="wide")  
   - [x] PlanningPage (size="wide")  
   - [x] QualitePage (size="wide")  
   - [x] SecuritePage (size="wide")  
   - [x] MessageriePage (size="wide")  
   - [x] NotificationsPage (size="wide")  
   - [x] FournisseurPage (size="wide")  
   - [x] EnginListPage (size="wide")  
   - [x] MateriauListPage (size="wide")  
   - [x] EquipeListPage (size="wide")  

### Étape 2 — Données mock cohérentes ✅ (en place)
1. **Définir un jeu de données factices**  
   - Projets (3–5) avec statuts variés (brouillon, en cours, terminé, en retard).  
   - Chantiers liés aux projets (actifs/terminés).  
   - Équipes, utilisateurs, engins, matériaux, fournisseurs, commandes.  
   - Budget : lignes par projet avec montants et taux.  
   - Planning : tâches par projet (à faire, en cours, terminé, en retard).  
   - Qualité : contrôles et non-conformités.  
   - Sécurité : incidents et risques.  
   - Reporting : `GlobalDashboard` et `ProjetReport` cohérents avec les données ci-dessus.  
   - Communication : messages et notifications (liste avec types variés).
2. **Point d’injection**  
   - Option A : mode “mock” dans les slices (initial state ou middleware) si `VITE_USE_MOCK=true`.  
   - Option B : mock API (MSW ou override des `*Api` dans les services).  
   - Option C : backend de dev qui renvoie des fixtures (seed SQL).
3. **Priorité**  
   - Reporting (dashboard global + rapport par projet).  
   - Puis listes : Projets, Chantiers, Équipes, Engins, Matériaux, Fournisseurs.  
   - Puis Budget, Planning, Qualité, Sécurité, Messagerie, Notifications.

### Étape 3 — Tester toutes les pages
1. **Parcours par module**  
   - Tableau de bord → Projets → Chantiers → Équipes → Engins → Matériaux → Budget → Planning → Qualité → Sécurité → Messagerie → Notifications → Reporting → Documents → Fournisseurs → Profil → (Gestion utilisateurs si admin).
2. **Pour chaque page**  
   - Affichage : pas de zone vide anormale, titres et sous-titres visibles.  
   - Cohérence visuelle : mêmes espacements, mêmes styles de cartes et boutons.  
   - Responsive : breakpoints (mobile, tablette, desktop) ; tableaux scrollables ou en cartes sur petit écran.  
   - Tableaux : tri, pagination, colonnes, états vide/chargement.  
   - Formulaires : champs, validation, envoi.  
   - Filtres : projet, dates, statuts — comportement et affichage des résultats.
3. **Reporting en particulier**  
   - Vue globale : 4 KPIs + Qualité/Sécurité + sélecteur projet.  
   - Rapport par projet : indicateurs, tableaux, graphiques si présents.  
   - Données mock : chiffres cohérents entre vue globale et détail projet.

### Étape 4 — Corriger les incohérences
1. **Liste**  
   - Recenser bugs et incohérences (layout, responsive, données, libellés) pendant l’étape 3.
2. **Priorisation**  
   - Bloquants (crash, page vide) → correctifs immédiats.  
   - Visuels (alignement, espacements) → correctifs par page.  
   - Mineurs (texte, tooltips) → backlog.
3. **Application**  
   - Corrections ciblées (un fichier / une page à la fois).  
   - Re-test après chaque correction majeure.

---

## 3. Récapitulatif

| Étape | Objectif | Livrable |
|-------|----------|----------|
| 1 | Uniformiser l’interface | Toutes les pages utilisent PageContainer + mêmes espacements/proportions |
| 2 | Données mock | Jeu de données factices chargé (Reporting + listes + formulaires) |
| 3 | Tests | Checklist de parcours + notes par page (affichage, responsive, tableaux, formulaires, filtres) |
| 4 | Corrections | Liste d’anomalies traitée et re-test |

Après exécution de l’étape 1, l’application aura une mise en page uniforme. Les étapes 2 à 4 permettront de valider le comportement et les données sur toutes les pages, en particulier la section Rapports.
