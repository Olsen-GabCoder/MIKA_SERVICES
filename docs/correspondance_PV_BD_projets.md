# Correspondance PV S09-2026 ↔ Projets en base

Tous les projets du PV doivent être en BD et s'afficher (partie 4 – semaine en cours).

## Projets du PV présents en base (avec id)

| PV (N° Marché / Nom)           | id BD | Nom en base (court)        | Déjà des prévisions S9 ?     |
|--------------------------------|-------|----------------------------|------------------------------|
| 144 & 92 – Akémidjogoni        | 12, 16| TRAVAUX... AKEMIDJONGONI / EXTENTION... | 12 oui (15 tâches), 16 non |
| 004 – Lycée Charles            | 26    | REHANILITATION... LYCEE CHARLES        | non |
| 34 – USTM                      | 21    | USTM-TRAVAUX...                        | non |
| 95 – LALALA (5e Arr.)          | 27    | TRAVAUX... CINQUIEME ARR. LALALA       | oui (11 tâches, conforme PV Réalisé S8) |
| 91 – Bel-Air                   | 13    | AMENAGEMENT VOIE BEL AIR               | non |
| Maurel & Prom                  | 25    | MAUREL & PROM                          | non |
| GABOIL                         | 28    | GABOIL EXTENTION DEPOT                 | non |
| 52 – Berge LOWE                | 14    | BERGE DE LA LOWE                       | oui (9 tâches) |
| 148 – Pont Camp De Gaulle      | 8     | CONSTRUCTION PONT... CAMP DE GAULLE    | non |
| 147 – Camp De Gaulle / JB      | 7     | PROJET AMENAGEMENT... JARDIN BOTANIQUE | non |
| 53 – JB, Camp Gaulle, BDM      | 18    | NOUVELLES VOIES JB... BORD DE MER      | oui (32 tâches) |
| 001 – Gué-Gué Aval             | 29    | Aménagement Bassin... Gué-Gué          | non |
| 93 – Marché Owendo             | 17    | MARCHER MUNICIPAL D'OWENDO             | non |
| 146 – Salle polyvalente Kango  | 33    | CONSTRUCTION SALLE POLYVALENTE KANGO   | non |
| 01/MMPEB – Donguila CAPA       | 15    | DONGUILA-CONSTRUCTION D'UN CAPA        | oui (11 tâches) |
| 145 – ENA                      | 9     | TRAVAUX... ENA                         | non |
| 150 – EPCA                     | 10    | TRAVAUX... EPCA                        | non |
| Carrefour Charbonnages         | 30    | Travaux aménagement carrefour Charbonnages | non |
| 09 – Nkoltang                  | 3     | CONSTRUCTION... NKOLTANG               | non |
| 26 – Kango                     | 20    | TRAVAUX... VOIRIES DE KANGO            | non |
| Louetsi Bongolo-Idembe         | 32    | Construction 2 ponts... LOUETSI         | non |
| 02 – Voie Express Owendo (Carrefour Pompier/Razel) | 34 | Travaux... Voie Express Owendo           | oui (1 ligne Suivi S9) |

## Actions réalisées

Pour que **tout ce qui est dans le PV s’affiche** en partie 4 (semaine en cours), une ligne de prévision S9 à 0 % a été ajoutée pour chaque projet du PV présent en base qui n’avait encore aucune prévision S9 (pour les autres, les données détaillées déjà en base sont conservées).
- **LALALA (27)** : placeholder S9 supprimé ; insertion des tâches **Réalisé** du PV (TRAVAUX PREPARATOIRES, DORSALE, PENETRANTES) — 11 lignes, NR → 0 % — script `sql/insert_realisations_s9_lalala.sql`.
