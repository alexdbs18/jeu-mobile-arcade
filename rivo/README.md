# Rivo · prototype Rebond

Rebond utilise le bleu électrique `#3046DF`, le blanc, l’encre foncée et le jaune solaire `#FFDA35`. Le prototype Rivo/Supabase conserve son parcours Aiguillage pendant l’intégration du backend.

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

## Arcade Lab — 15 nouveaux prototypes

Ouvrir `http://localhost:8000/rivo/?jeux=1` pour tester les nouveaux mini-jeux dans un onglet séparé. Le catalogue comprend 11 jeux d’arcade et 4 jeux de logique, chacun avec une arène WebGL 3D et une direction visuelle dédiée. Les secteurs, combos, impulsions spéciales et mini-boss donnent une progression à chaque run, plafonné à 60 secondes. Pause, son, vibrations mobiles, records locaux et rendu de secours 2D sont inclus. Le mode d’essai n’envoie aucun résultat vers Supabase. Voir [`docs/arcade-lab.md`](../docs/arcade-lab.md) pour les commandes et règles.

Ces prototypes remplacent l’ancien catalogue de test dans l’Arcade Lab. Ils ne sont pas encore des jeux compétitifs du parcours Rivo : il faudra relier chaque moteur à ses résultats et à son vérificateur serveur avant d’activer ces jeux pour les ligues.

## Anciennes maquettes

L’[interface Arcade électrique](arcade-electrique.html) et son [comparatif de palettes](couleurs.html) restent consultables. Les captures des versions précédentes sont dans [docs/](docs/). La capture [Rebond sur fond bleu](docs/rebond-fond-bleu.jpg) montre la version de ce dossier.
