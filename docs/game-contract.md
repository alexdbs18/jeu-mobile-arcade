# Convention des mini-jeux — V1

Chaque jeu est autonome dans `games/<slug>/` et s’ouvre depuis un lien relatif de `index.html`. Il possède un écran d’accueil avec une consigne courte, un bouton Jouer, une partie, une pause et un résultat. Il doit rester jouable en portrait dès 360 px.

Le code d’un jeu sépare :

- les **règles** (état, score, chrono, génération, graine), vérifiables sans navigateur ;
- l’**affichage** (DOM, animations, son et entrées tactiles) ;
- les **réglages** de rythme et de durée à un seul endroit.

La convention d’intégration envisagée pour le socle suivant est `start({ seed })`, `pause()`, `resume()`, `destroy()` et un résultat `{ gameId, score, durationMs, seed, details }`. Elle décrit la cible : Attrape 21 fonctionne aujourd’hui comme page autonome et devra recevoir un petit adaptateur avant d’être chargé dans un écran partagé. Aucun classement en ligne n’est simulé par le record local.

Lorsqu’un jeu est quitté, il doit annuler ses timers/animations, arrêter le son et ne plus enregistrer d’entrées. Rejouer réinitialise la même séquence lorsque le défi est défini par une graine.
