# Connexion MySQL — Barème (depuis le terminal)

Le client MySQL n’est pas dans le PATH Windows. Utiliser le **chemin complet** :

## Chemin du client MySQL (trouvé sur cette machine)

- **MySQL Server 8.0** : `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`
- Alternative (Workbench) : `C:\Program Files\MySQL\MySQL Workbench 8.0\mysql.exe`
- Autre installation : `C:\mysql-9.5.0-winx64\bin\mysql.exe`

## Exemples de commandes (PowerShell, à lancer depuis la racine du projet)

```powershell
# Variable pour ne pas retaper le chemin
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

# Connexion simple (ouvre une session interactive)
& $mysql -u root -p mika_services_dev

# Exécuter une requête
& $mysql -u root -p mika_services_dev -e "SELECT COUNT(*) FROM bareme_lignes_prix;"

# Exécuter le script complet (analyse + espaces vides)
Get-Content "docs\bareme_dump_complet_et_espaces_vides.sql" -Raw | & $mysql -u root -p mika_services_dev

# Exécuter le script simple (dump listes + échantillon)
Get-Content "docs\bareme_dump.sql" -Raw | & $mysql -u root -p mika_services_dev
```

*(Remplacer `-p` par `-pVOTRE_MOT_DE_PASSE` pour éviter la demande interactive ; le mot de passe est dans `backend/src/main/resources/application-dev.yml`.)*

## Option : ajouter MySQL au PATH (une fois pour toutes)

1. Ouvrir **Paramètres Windows** → **Système** → **À propos** → **Paramètres système avancés** → **Variables d’environnement**.
2. Dans **Variables système**, éditer **Path** et ajouter :  
   `C:\Program Files\MySQL\MySQL Server 8.0\bin`
3. Redémarrer le terminal. Ensuite `mysql -u root -p mika_services_dev` suffira.
