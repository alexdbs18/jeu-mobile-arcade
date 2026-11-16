# Jeu mobile arcade

Collection de mini-jeux mobiles à développer à deux. Cette V1 contient un accueil commun et **Attrape 21**, déjà jouable. Le projet utilise HTML, CSS et JavaScript sans installation de dépendances pour jouer.

## Lancer le projet

```sh
python -m http.server 8000
```

Ouvrir http://localhost:8000. Sur téléphone, connecter les deux appareils au même Wi-Fi et ouvrir `http://ADRESSE_IP_DU_PC:8000` (l’adresse IPv4 se trouve avec `ipconfig` sous Windows). Si `python` n’est pas reconnu, utiliser `py -m http.server 8000`. Arrêter avec Ctrl+C. Pour vérifier le code avec Node.js : `npm test`.

## Structure

```text
index.html                 Accueil et catalogue de jeux
games/                    Jeux indépendants
  attrape-21/              Premier jeu complet et autonome
  _template/               Modèle à copier pour chaque nouveau jeu
tests/                     Tests du moteur d’Attrape 21
docs/game-contract.md      Règles communes d’intégration
CONTRIBUTING.md            Méthode de travail à deux
.github/workflows/test.yml Vérification automatique des changements
```

Chaque jeu vit dans `games/<nom>/`, avec son `index.html`, ses styles et ses scripts. Il doit fonctionner seul dans le navigateur et depuis l’accueil commun. Copier `games/_template/` pour démarrer le prochain. Mettre à jour la carte d’accueil quand un jeu est prêt.

## Collaborer

Le dépôt est privé. Le propriétaire invite le second développeur par son **pseudo GitHub** depuis *Settings → Collaborators and teams* ; une fois l’invitation acceptée, chacun clone le dépôt. Pour une fonctionnalité, créer une branche courte (`jeu/nom`, `fix/sujet`), pousser ses commits, ouvrir une Pull Request et faire relire par l’autre avant fusion dans `main`. La vérification automatique exécute les tests sur chaque Pull Request.

Les décisions de produit et les règles qui affectent tous les jeux vont dans `docs/`. Les prototypes peuvent rester indépendants pendant les essais ; les éléments communs seront extraits quand plusieurs jeux en auront réellement besoin.

## Prochaine étape

Tester deux ou trois concepts de jeux, puis ajouter au socle les fonctions réellement utiles : navigation partagée, réglages, profils, défis quotidiens et classement. Les comptes et données partagés demanderont ensuite un service côté serveur ; le record actuel d’Attrape 21 reste local au navigateur.
