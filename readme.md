### Scenario

#### Features

TODO

- [x] Recupération des différentes pharmacies sur le territoire 

- [x] Récuperation des pharmacies de garde

- [ ] Cron Job pour mettre à jour la tableaux des pharmacies de garde(toute les 1 semaines) et la liste générale des pharmacies

- [ ] Parcours la liste des pharmacies sur de la zone et verifier si on retrouve une pharmacie de garde(liste) à l'intérieur des pharmacies parcourues

- [x]  Par defaut le champ 'onDuty': false

- [x] Mettre à jour le champ de 'onDuty': false à 'onDuty': true

- [ ] Faire clignoter les marqueurs ou les points sur la carte ou le 'onDuty': true

- [ ] Faire une recherche Autocomplete sur la liste des pharmacies existantes

- [x] Recuperer la position de l'utilisateur

- [ ] Tracer la route vert la pharmacie la plus proche \n


* Cronjob pour aller fetch la data tout les 10 jours 
```bash
0 0 */10 * * /usr/bin/python3 /path/to/your/script.py >> /path/to/your/logfile.log 2>&1
```
