# Ajouter un mini-jeu Rivo

Le contrat technique partagé est dans [`docs/game-contract.md`](../../docs/game-contract.md). Le gabarit contient les points d'extension client, serveur, tests et traductions. Un jeu ne compte comme jouable qu'une fois ces quatre éléments terminés et son vérificateur déployé.

1. Copier `_template` dans `games/<slug>/`.
2. Créer les règles déterministes du jeu et son interface mobile portrait. Donner une graine au jeu pour que tous les membres reçoivent le même défi.
3. Enregistrer l'adaptateur dans `rivo/src/game-registry.js`, ajouter ses six traductions et son asset; la clé `verify` doit nommer sa fonction Edge.
4. Créer `supabase/functions/submit-<slug>/` à partir du vérificateur Aiguillage. Le serveur recalcule toujours le score à partir des événements bruts; il n'accepte jamais un score fourni par le navigateur.
5. Ajouter la ligne de catalogue en migration, avec ses traductions, la clé de vérification et `playable=true` seulement après que les essais et le vérificateur soient prêts.
6. Ajouter les tests de règles. Vérifier aussi les essais officiels, l'entraînement, les saisons et les formats sur mobile.

Le compte du joueur, l'identifiant de tentative, le chrono serveur, le score vérifié et les points restent gérés par Rivo. Le jeu fournit les événements bruts, son affichage, sa pause/reprise et son résultat descriptif; il ne décide jamais du classement.
