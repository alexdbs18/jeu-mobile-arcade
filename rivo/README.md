# Rivo — prototype mobile

Prototype statique en français, composé à 390 px, direction Arcade électrique, palette A validée : bleu, crème et mandarine. Le code de ce prototype est dans ce dossier `rivo/`. Aucune dépendance ni compilation.

## Démarrer sur son ordinateur

Depuis la racine du dépôt `jeu-mobile-arcade` :

```sh
python -m http.server 8000
```

Ouvrir **http://localhost:8000/rivo/**. Sous Windows, remplacer `python` par `py` si nécessaire. Aucune installation de dépendances, aucun compte et aucune clé API ne sont nécessaires.

Sur téléphone, utiliser le même Wi-Fi et ouvrir `http://ADRESSE_IP_DU_PC:8000/rivo/`. La copie des liens peut dépendre des permissions du navigateur ; un champ permet aussi de sélectionner la valeur.

Pour repartir du début : roue dentée de l’accueil → **Réinitialiser la démo**.

## Continuer à deux

Suivre le guide `CONTRIBUTING.md` à la racine du dépôt. Chacun crée sa branche `interface/<sujet>` pour l’interface ou `jeu/<nom>` pour un jeu, puis propose une Pull Request.

- `index.html` : structure de la page.
- `app.js` : données fictives, navigation, interactions et énigmes.
- `style.css` : composants et animations.
- `palette.css` : couleurs et fondu bleu-crème de la palette A validée.
- `palette.js` : palette A par défaut et mode aperçu isolé.
- `assets/` : trois réactions de la grenouille et polices Nunito locales.
- `couleurs.html` : comparaison des anciennes pistes de couleurs.
- `docs/accueil-palette-a.jpg` : référence visuelle validée.

Le prototype reste autonome ; les mini-jeux de `games/` et le catalogue existant restent disponibles. Le raccordement des vrais mini-jeux au parcours Rivo reste à faire selon `docs/game-contract.md` à la racine du dépôt. Les énigmes de démonstration servent à essayer le parcours.

La copie livrée correspond à la version du 16 novembre 2026 : palette A validée, accueil simplifié et bleu fondu dans le crème. Source du prototype : commit `c2f813106b1f1ece477784d6259414d688676dc1`.

## Parcours

- Mes ligues : nom et état du jour uniquement, avec une alerte de dépassement directement sous la ligue concernée. Les jeux, membres, scores et messages restent accessibles dans la ligue. Le bouton Ajouter ouvre les trois options existantes. La remise à zéro est accessible dans les réglages de l’accueil.
- Ligue : Aujourd’hui, Semaine, La bande ; liste des membres et invitations fictives copiables.
- Jeux : consigne, décompte, énigme chronométrée, deux essais réservés au lancement et meilleur temps conservé. Scores cachés avant le premier essai.
- La bande : messages locaux, activités de score, réactions et stickers ; une pique modifiable peut être envoyée depuis un résultat ou le classement.
- Profil : pseudo et couleur, statistiques du jour et accès aux classements de chaque ligue.
- Créer/rejoindre : ligue privée en attente d’un second joueur, simulation de son arrivée, code RIVO42 et ligues publiques de démonstration.

## État et limites

L’état est enregistré dans localStorage sous `rivo-prototype-v1`. Les états de la première version sont enrichis sans effacer leurs essais. La réinitialisation revient aux trois ligues d’origine et au profil Alex.

Tout est simulé sur un seul appareil. Il n’y a ni compte, ni serveur, ni conversation avec de vrais joueurs. Les heures de clôture, classements historiques et messages des amis sont des données de présentation : aucun tirage ni renouvellement automatique à minuit. Aucun message ou invitation n’est envoyé à un service externe.

## Validation de cette version

Parcours vérifiés dans le navigateur à la largeur de composition de 390 px : premier essai, bonne réponse, révélation du rang, second essai incorrect conservant le meilleur score, état terminé à l’accueil, pique depuis le classement, conversation et stickers, profil et persistance après rechargement, création de ligue, copie du code, arrivée d’un second membre, réinitialisation. Syntaxe vérifiée avec `node --check rivo/app.js`.

L’aperçu validé de l’accueil est dans `docs/accueil-palette-a.jpg`. Les anciennes captures servent d’historique.

## Explorations de couleurs

`couleurs.html` compare trois palettes sur le même contenu. La palette A est validée et appliquée par défaut à la version principale. Son bleu se fond progressivement dans le fond crème, sans bloc arrondi distinct.

- A / azur : fond crème, en-tête bleu, actions mandarine.
- B / lilas : fond lilas clair, en-tête lilas, accent prune et actions citron.
- C / menthe : fond vert très clair, en-tête menthe, accent sapin et actions abricot.

Les rôles communs (canvas, surface, ink, muted, brand, head, action, selected, line) sont définis dans `palette.css`. `palette.js` applique A par défaut ; il active le mode aperçu isolé uniquement pour les paramètres autorisés `?palette=azur`, `?palette=lilas` ou `?palette=menthe`. `view=league` ouvre La Promo et `embed=1` présente la vue à 390 px dans le comparateur. Les aperçus repartent des mêmes données et utilisent un état en mémoire, sans écraser la progression du prototype principal.

Le comparateur affiche trois colonnes sur grand écran, puis une palette à la fois sous 1050 px. Les contrôles Accueil/Dans une ligue réinitialisent les trois aperçus pour une comparaison équitable. Chaque variante peut être ouverte en plein écran.

Validation : comparaison visuelle des accueils et ligues, discussion en palette B, essai joué en palette A et vérification que l’état du prototype principal est conservé. Captures dans `docs/palettes-accueil.jpg` et `docs/palettes-ligue.jpg`.


## Palette A validée

Le prototype principal garde sa progression locale. Le mode aperçu (`data-palette-preview`) est distinct de la palette active pour que l’application d’A par défaut ne remette pas l’état à zéro. Le fondu bleu-crème de l’accueil appartient au fond de la page, avec une déclinaison pour les écrans de moins de 740 px de haut. Les ligues, jeux et profil utilisent les fonds clairs de la palette A.
