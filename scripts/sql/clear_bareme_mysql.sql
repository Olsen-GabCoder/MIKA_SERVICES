-- Vide toutes les données du module « barème bâtiment » (MySQL 8).
-- Tables : bareme_lignes_prix, bareme_fournisseurs, bareme_corps_etat (schéma conservé).
--
-- Références projet (ne pas deviner : aligner sur TON .env / installation) :
--   • Backend local sans override : application.yml → datasource par défaut
--     jdbc:mysql://localhost:3306/mika_services_dev?createDatabaseIfNotExist=true ...
--     → base MySQL : mika_services_dev
--   • Docker Compose (docker-compose.yml) : MYSQL_DATABASE par défaut mika_services
--     conteneur : mika-mysql, utilisateur root, mot de passe = MYSQL_ROOT_PASSWORD (défaut mika_test_root)
--   • scripts/mysql_bareme.ps1 utilise aussi la base mika_services_dev (chemin mysql.exe local).

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE bareme_lignes_prix;
TRUNCATE TABLE bareme_fournisseurs;
TRUNCATE TABLE bareme_corps_etat;

SET FOREIGN_KEY_CHECKS = 1;
