import psycopg2

url = "postgresql://mika_services_dbase_user:C01KR0rWXD5bCvJcq5xnG0ZAEX7WfCqi@dpg-d6rt381j16oc73edh9eg-a.frankfurt-postgres.render.com/mika_services_dbase?sslmode=require"

sql = """
DO 
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='public'
      AND (
        (table_name='bareme_lignes_prix' AND column_name IN
          ('libelle','reference','unite','unite_prestation','famille','categorie','date_prix','code_fournisseur','ref_reception','contact_texte'))
        OR
        (table_name='bareme_fournisseurs' AND column_name IN ('nom','contact'))
      )
  LOOP
    IF r.data_type = 'bytea' THEN
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN %I TYPE text USING convert_from(%I, ''UTF8'')',
        r.table_name, r.column_name, r.column_name
      );
    END IF;
  END LOOP;
END ;
"""

conn = psycopg2.connect(url)
conn.autocommit = True
cur = conn.cursor()
cur.execute(sql)
cur.close()
conn.close()
print("OK_SCHEMA_FIXED")
