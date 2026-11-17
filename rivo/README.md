# Rivo · prototype Rebond

Rebond utilise le bleu électrique `#3046DF`, le blanc, l’encre foncée et le jaune solaire `#FFDA35`. Aiguillage est le mini-jeu jouable du prototype. Les autres jeux ont une vignette et des exemples de scores dans le classement.

Ouvrir `rivo/index.html` dans un navigateur ou lancer `python -m http.server 8000` depuis la racine du dépôt et accéder à [http://localhost:8000/rivo/](http://localhost:8000/rivo/). La démo fonctionne sur l’appareil avec des ligues, messages et classements simulés.

## Modifier le prototype

| Fichier | Rôle |
| --- | --- |
| `src/rebond.css` | Palette, relief et composants Rebond |
| `src/screens.js` | Écrans de ligue, classement, résultat, chat et profil |
| `src/rebond.js` | Accueil Rebond, plateau d’Aiguillage et animations de réponse |
| `src/app.js` | Navigation, saisies et déroulement des parties |
| `src/model.js` | Données de démo, états du joueur et règles de classement |
| `src/assets/` | Vignettes, grenouille, polices et licences |
| `src/index.template.html` et `src/build.py` | Assemblage du HTML autonome |

Après une modification, régénérer le fichier jouable depuis la racine du dépôt.

```sh
python3 rivo/src/build.py rivo/index.html
npm run check
```

Ajouter les sources modifiées et le HTML régénéré à la même Pull Request. Les paramètres `?format=320` et `?format=390` permettent de prévisualiser le rendu mobile sur ordinateur.

## Anciennes maquettes

L’[interface Arcade électrique](arcade-electrique.html) et son [comparatif de palettes](couleurs.html) restent consultables. Les captures des versions précédentes sont dans [docs/](docs/). La capture [Rebond sur fond bleu](docs/rebond-fond-bleu.jpg) montre la version de ce dossier.
