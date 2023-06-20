### Scenario

#### Features

TODO
- Recupération des différentes pharmacies 
- Récuperation des pharmacies de garde
- Cron Job pour mettre à jour la tableaux des pharmacies de garde(toute les 1 semaines)
- Parcours la liste des pharmacies sur de la zone et verifier si on retrouve une pharmacie de garde(liste) à l'intérieur des pharmacies parcourues
- Par defaut le champ 'onDuty':'no'
- Mettre à jour le champ de 'onDuty':'no' à 'onDuty':'yes'
- Faire clignoter les marqueurs ou les points sur la carte ou le 'onDuty':'yes'


* Cronjob pour aller fetch la data tout les 10 jours
```bash
0 0 */10 * * /usr/bin/python3 /path/to/your/script.py >> /path/to/your/logfile.log 2>&1
```
