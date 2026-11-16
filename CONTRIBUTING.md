# Travailler à deux

1. Discuter de la règle et du plaisir attendu d’un jeu avant de coder. Garder un tour jouable court.
2. Copier `games/_template/` vers `games/nom-du-jeu/`. Ne modifier les fichiers d’un autre jeu qu’en accord avec son auteur.
3. Garder les règles et la génération séparées du DOM ; prévoir une graine pour les défis reproductibles.
4. Depuis `main`, créer une branche nommée `jeu/nom`, `fix/sujet` ou `interface/sujet`.
5. Tester sur petit écran et lancer `npm test` avant de pousser. Ajouter des tests pour le score, le temps et les cas de double entrée.
6. Ouvrir une Pull Request courte avec ce qui change, comment le tester et une capture si l’interface change. L’autre relit puis fusionne. Éviter de pousser directement sur `main`.

Ne pas commettre de secrets, de clés de services, de données personnelles ou de fichiers locaux. Conserver les variantes de réglages de difficulté dans un fichier de configuration visible et documenter les ajustements après essai.
