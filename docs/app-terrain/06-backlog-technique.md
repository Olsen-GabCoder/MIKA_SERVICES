# Backlog technique — App terrain / plateforme

## Sécurité — dettes connues et assumées

### Contrôleurs web matériel : rôle seul, sans périmètre (À SCOPER)

Les contrôleurs web du module matériel (`InspectionEnginController`, `ReleveCompteurController`,
`ConsommationCarburantController`, `IncidentEnginController`, `PositionEnginController`,
`EnginController`, `MouvementEnginController` hors `findById`/`getBon`, `DemandeMaterielController`
hors service scopé, etc.) sont protégés par `@PreAuthorize` **au rôle uniquement**, sans contrôle
de périmètre par affectation (contrairement à l'API `/terrain/**` qui applique la règle unique :
trio LOGISTIQUE/ADMIN/SUPER_ADMIN = tout, sinon affectations EN_COURS, 404 hors périmètre).

**Décision (2026-08-19)** : gelé tant que le web est réservé aux rôles pilotage
(verrou `WEB_ROLES` dans `SecurityConfig`). **À scoper obligatoirement lors de la refonte
des dashboards web** — ne pas laisser ce trou se rouvrir si de nouveaux rôles accèdent au web.

### Évolutions explicites (pas des trous dans la règle)

- Agir sur un engin **au dépôt** (sans affectation) depuis le terrain via scan QR :
  aujourd'hui réservé au trio. Si besoin un jour, le traiter comme une évolution
  du périmètre (preuve de présence physique par scan), pas comme une exception silencieuse.
- **Visa chef de projet optionnel par projet (DMA)** : la réforme 2026-08-20 a supprimé les
  portes chantier/projet du circuit DMA (une seule porte logistique, aligné transferts).
  Contre-parties assumées : le CP perd son veto formel (mitigé par la notification immédiate
  à la création). Si un gros chantier exige un contrôle budgétaire hiérarchique avant
  engagement, réintroduire un visa CP **en option par projet** (flag sur `projets`), pas
  imposé globalement.
