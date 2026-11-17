# Convention des mini-jeux — V1

Chaque futur jeu est autonome dans `games/<slug>/` et peut être testé en ouvrant directement sa page `index.html`. Son entrée sera ensuite reliée à un jeu du jour dans une ligue Rivo. L’accueil principal reste « Mes ligues ». Chaque jeu possède une consigne courte, un bouton Jouer, une partie, une pause et un résultat. Il doit rester jouable en portrait dès 360 px.

Le code d’un jeu sépare :

- les **règles** (état, score, chrono, génération, graine), vérifiables sans navigateur ;
- l’**affichage** (DOM, animations, son et entrées tactiles) ;
- les **réglages** de rythme et de durée à un seul endroit.

La convention d’intégration envisagée pour le socle suivant est `start({ seed })`, `pause()`, `resume()`, `destroy()` et un résultat `{ gameId, score, durationMs, seed, details }`. Elle décrit la cible : les futurs jeux auront besoin d’un adaptateur pour être chargés dans le parcours partagé. Les énigmes et classements actuels de Rivo sont des démonstrations locales, sans serveur ni compétition entre appareils.

Lorsqu’un jeu est quitté, il doit annuler ses timers/animations, arrêter le son et ne plus enregistrer d’entrées. Rejouer réinitialise la même séquence lorsque le défi est défini par une graine.
