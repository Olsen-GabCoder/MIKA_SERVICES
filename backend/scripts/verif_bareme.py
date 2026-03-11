#!/usr/bin/env python3
"""Vérification que toutes les données barème sont bien en base."""
import pymysql

DB = {"host": "localhost", "user": "root", "password": "olsenk2000#2000", "database": "mika_services_dev", "charset": "utf8mb4"}

# Attendu d'après ANALYSE_BAREME_PRIX_BATIMENT.md :
# Feuille 0: ~38-42 lignes (coefficients) — en-têtes lignes 0-2, données à partir 3
# Feuilles 2-16: Gros-Oeuvre 385, Assainissement 316, Charpente 300, Plafonds 116, Clôture 224, Jardins 95,
#   Voirie 231, Lot Menuiserie 493, Pose Menuis Ext 287, Pose Menuis Int 306, Plomberie 223, Electricité 330,
#   Carrelages 107, Ferronnerie 440, Peinture 179
# Total lignes Excel (données, hors en-têtes): environ 385+316+...+179 = 4208 lignes de données brutes par feuille.
# En base on a des LIGNES dénormalisées (une ligne Excel peut donner 1 ou 2 enregistrements: matériau + prestation).
ATTENDU_COEF = 38  # ou 39 selon où s'arrête la note
ATTENDU_CORPS = 15
# Lignes Excel total (feuilles 2-16, en enlevant ~3 lignes en-tête par feuille): somme des "Lignes" - 3*15
LIGNES_EXCEL_PAR_FEUILLE = [385, 316, 300, 116, 224, 95, 231, 493, 287, 306, 223, 330, 107, 440, 179]
TOTAL_LIGNES_EXCEL = sum(LIGNES_EXCEL_PAR_FEUILLE)  # 4208
# En base on a souvent plus d'enregistrements car une ligne Excel = 1 ou 2 lignes (matériau + prestation)
# Donc on s'attend à au moins ~4000 lignes, pas exactement 4208.

def main():
    c = pymysql.connect(**DB)
    cur = c.cursor()

    cur.execute("SELECT COUNT(*) FROM bareme_coefficients_eloignement")
    nb_coef = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM bareme_corps_etat")
    nb_corps = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM bareme_fournisseurs")
    nb_fourn = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM bareme_lignes_prix")
    nb_lignes = cur.fetchone()[0]

    cur.execute("SELECT type, COUNT(*) FROM bareme_lignes_prix GROUP BY type ORDER BY type")
    par_type = dict(cur.fetchall())

    cur.execute("""
        SELECT ce.code, ce.ordre_affichage, COUNT(l.id) AS nb
        FROM bareme_corps_etat ce
        LEFT JOIN bareme_lignes_prix l ON l.corps_etat_id = ce.id
        GROUP BY ce.id, ce.code, ce.ordre_affichage
        ORDER BY ce.ordre_affichage
    """)
    par_corps = cur.fetchall()

    cur.execute("SELECT COUNT(*) FROM bareme_lignes_prix WHERE corps_etat_id IS NULL")
    null_corps = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM bareme_lignes_prix WHERE type = 'MATERIAU' AND fournisseur_bareme_id IS NULL")
    mat_sans_fourn = cur.fetchone()[0]

    cur.execute("SELECT COUNT(DISTINCT parent_id) FROM bareme_lignes_prix WHERE parent_id IS NOT NULL")
    nb_parents = cur.fetchone()[0]

    # Échantillon coefficients
    cur.execute("SELECT nom, pourcentage, coefficient FROM bareme_coefficients_eloignement ORDER BY ordre_affichage")
    coef_sample = cur.fetchall()

    # Échantillon matériaux avec prix
    cur.execute("""
        SELECT l.reference, LEFT(l.libelle, 35), l.prix_ttc, f.nom
        FROM bareme_lignes_prix l
        LEFT JOIN bareme_fournisseurs f ON f.id = l.fournisseur_bareme_id
        WHERE l.type = 'MATERIAU' AND l.prix_ttc IS NOT NULL
        LIMIT 5
    """)
    mat_sample = cur.fetchall()

    c.close()

    # Rapport
    ok = True
    print("=" * 60)
    print("VÉRIFICATION DES DONNÉES BARÈME EN BASE")
    print("=" * 60)
    print()
    print("1) COEFFICIENTS D'ÉLOIGNEMENT")
    print(f"   Attendu: ~{ATTENDU_COEF}  |  En base: {nb_coef}")
    if nb_coef < 35:
        print("   >>> MANQUANT")
        ok = False
    else:
        print("   OK")
    print("   Exemples:", coef_sample[:5])
    print()

    print("2) CORPS D'ÉTAT")
    print(f"   Attendu: {ATTENDU_CORPS}  |  En base: {nb_corps}")
    if nb_corps != 15:
        print("   >>> ANOMALIE")
        ok = False
    else:
        print("   OK")
    print()

    print("3) LIGNES PAR CORPS D'ÉTAT (attendu ~lignes Excel - en-têtes)")
    for i, (code, ordre, nb) in enumerate(par_corps):
        attendu = LIGNES_EXCEL_PAR_FEUILLE[i] - 3 if i < len(LIGNES_EXCEL_PAR_FEUILLE) else "?"
        print(f"   {code}: {nb} lignes (feuille Excel ~{LIGNES_EXCEL_PAR_FEUILLE[i] if i < len(LIGNES_EXCEL_PAR_FEUILLE) else '?'} lignes)")
    print()

    print("4) TYPES DE LIGNES")
    print("   ", par_type)
    print()

    print("5) INTÉGRITÉ")
    print(f"   Lignes sans corps_etat_id: {null_corps} (attendu 0)")
    if null_corps > 0:
        ok = False
    print(f"   MATERIAU sans fournisseur: {mat_sans_fourn} (acceptable pour location/M.O)")
    print(f"   Prestations avec sous-détails (parent_id utilisé): {nb_parents} entêtes")
    print()

    print("6) FOURNISSEURS")
    print(f"   Total: {nb_fourn}")
    print()

    print("7) TOTAL LIGNES PRIX")
    print(f"   En base: {nb_lignes}  |  Lignes données Excel (total feuilles): {TOTAL_LIGNES_EXCEL}")
    print("   (En base on peut avoir plus car 1 ligne Excel = 1 ou 2 enregistrements)")
    if nb_lignes < 3000:
        print("   >>> Vérifier import si beaucoup moins que 4000")
        ok = False
    else:
        print("   OK")
    print()

    print("8) ÉCHANTILLON MATÉRIAUX (réf, libellé, P.TTC, fournisseur)")
    for row in mat_sample:
        print("   ", row)
    print()

    print("=" * 60)
    if ok:
        print("RÉSULTAT: Toutes les données attendues sont présentes.")
    else:
        print("RÉSULTAT: Vérifier les points signalés ci-dessus.")
    print("=" * 60)

if __name__ == "__main__":
    main()
