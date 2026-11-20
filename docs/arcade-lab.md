# Arcade Lab — prévisualisation locale

Ouvrir `http://127.0.0.1:8002/rivo/?jeux=1`, ou cliquer sur **Tester les 15 mini-jeux** dans l'Atelier. Le lien **Retour à Rivo** revient au prototype principal.

Chaque jeu se joue dans une arène WebGL 3D construite à la volée, avec décor, palette, terrain et avatar adaptés au titre. Les commandes tactiles et clavier ont été vérifiées jeu par jeu ; leur état de départ et leurs raccourcis sont propres à leur mécanique. La difficulté commence à monter dès le début puis accélère après 20 secondes : vagues plus denses, fenêtres de timing plus courtes, suites plus longues et épreuves de logique sous délai. Les mini-boss gagnent aussi des points de vie selon le secteur ; les ignorer coûte un cœur. Circuit Rush et Gravity Grid ont un compte à rebours par grille, tandis que Rocket Rescue pénalise les balises manquées. Les combos améliorent le score et rechargent l'impulsion spéciale, qui protège quelques secondes. Les manches se terminent à zéro cœur ou après 60 secondes. Pause/reprise, effets sonores, vibrations compatibles mobile, rang, record et meilleur combo complètent le mode solo. Un rendu Canvas 2D de secours s'active si WebGL est indisponible. Le mode d'essai n'utilise pas Supabase et ne modifie ni le profil ni un classement.

## Les jeux

| Jeu | Commande | Objectif |
| --- | --- | --- |
| Rift Runner | Gauche / droite | Maintenir une série sans collision, ramasser les éclats et viser le meilleur multiplicateur. |
| Drift Minute | Gauche / droite, dérapage | Se placer sur cinq voies, lancer un dérapage au bon moment et conserver sa chaîne de score. |
| Pulse Parry | Flèche de direction ou espace | Identifier le côté de la vague et parer pendant sa fenêtre d'impact. |
| Magnet Mayhem | Gauche / droite, polarité | Changer de voie et inverser le champ pour ne récolter que les noyaux assortis. |
| Crate Catapult | Angle − / angle +, lancer | Choisir un des quatre angles et tirer quand l'anneau mobile est dans l'axe. |
| Skyhook | Gauche / droite, accrocher | Sauter de voie et saisir les crochets dans une fenêtre qui se resserre. Rater un cycle coûte un cœur. |
| Rocket Rescue | Gauche / droite, poussée | Piloter sur cinq voies, économiser la poussée, attraper les balises et éviter les météores. |
| Bumper Blitz | Flipper gauche / droite, flipper automatique | Lire la position de la bille, choisir le bon flipper et enchaîner les rebonds. |
| Beat Courier | Flèches | Rejouer la suite directionnelle dans le temps imparti ; les séquences et le tempo se durcissent. |
| Flood Climb | Gauche / droite, sauter | Chercher une voie sûre, sauter sur le rythme disponible et gagner du temps sur la crue montante. |
| Mini Mech Arena | Gauche / droite, tirer | Viser les drones avant qu'ils touchent le bas ; les vagues tardives demandent plus de tirs. |
| Circuit Rush | Toucher une tuile | Tourner les conduits d'une grille croissante pour connecter source et sortie. |
| Gravity Grid | Choisir une colonne, tourner la gravité, lancer | Éviter les murs, aligner la sortie avec le trou lumineux et résoudre des grilles de plus en plus grandes. |
| Echo Vault | Symboles / flèches | Retenir des motifs qui s'allongent, puis les reproduire avant la fin du compte à rebours. |
| Lockpick Logic | Choisir une molette, régler, tester | Déduire le code avec l'indice des chiffres présents et bien placés ; les codes grandissent de trois à cinq chiffres. |

Les jeux sont des prototypes jouables à tester et à équilibrer. Leur score n'est pas encore un résultat compétitif validé par Supabase. Chaque adaptation au mode ligue devra ajouter des événements vérifiables et un calcul serveur avant d'être enregistrée comme jeu jouable. La revue critique complète, les changements appliqués et les étapes nécessaires pour une production autonome sont dans [`arcade-game-review.md`](arcade-game-review.md).
