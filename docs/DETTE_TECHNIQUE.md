# Dette technique — MIKA Services

## Tests bareme cassés
- **Date de détection** : 2026-04-21
- **Fichiers** :
  - `backend/src/test/kotlin/com/mikaservices/platform/modules/bareme/BaremeDataDumpTest.kt`
  - `backend/src/test/kotlin/com/mikaservices/platform/modules/bareme/BaremeImportServiceIntegrationTest.kt`
  - `backend/src/test/kotlin/com/mikaservices/platform/modules/bareme/BaremeLectureServiceTest.kt`
- **Symptôme** : `Unresolved reference 'CoefficientEloignementRepository'` et autres références manquantes
- **Impact** : empêche `mvn test`, ne bloque pas le compile main (`mvnw compile` et `mvnw package -Dmaven.test.skip=true` passent)
- **Pré-existant** à l'ouverture du module QSHE — non introduit par les livrables #0 ou #1
- **À traiter** dans un cycle dédié hors QSHE

## CAPA : validation existence de la source polymorphe
- **Date de détection** : 2026-04-21
- **Fichier** : `backend/src/main/kotlin/com/mikaservices/platform/modules/qshe/service/ActionCorrectiveService.kt`
- **Symptôme** : `create()` accepte n'importe quel `sourceType + sourceId` sans vérifier que l'enregistrement source existe en base
- **Impact** : un appelant pourrait créer une CAPA pointant vers un incident inexistant
- **À traiter** quand on câblera la création d'actions depuis les vues Incident/Inspection/NC (livrables #3+)
