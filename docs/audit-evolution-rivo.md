# Audit et architecture cible pour Rivo

État du dépôt inspecté le 18 novembre 2026, branche `main` au commit `d93737e`.

## 1. État actuel

| Domaine | Constat |
| --- | --- |
| Interface | HTML, CSS et JavaScript natifs, sans framework. L’interface Atelier/Rebond est assemblée depuis `rivo/src/` par `rivo/src/build.py` dans un HTML autonome. |
| Autre prototype | `rivo/app.js` et les feuilles de style à la racine de `rivo/` forment une ancienne maquette séparée, avec une navigation et des règles de ligue différentes. La racine du dépôt redirige vers `rivo/`. |
| Jeux | Aiguillage est jouable. Les autres mini-jeux présentés dans l’atelier sont des pistes visuelles ou des exemples. `games/_template/` documente le format autonome envisagé pour les prochains jeux. |
| État local | Quelques réglages, ligues personnalisées et messages sont conservés dans `localStorage`. Ce stockage n’est ni synchronisé ni fiable pour une compétition. |
| Backend et base de données | Aucun serveur applicatif, API, schéma de base de données, fournisseur d’identité ou règle d’accès n’est présent dans le dépôt. GitHub Pages ne sert que les fichiers statiques. |
| Publicité, paiement, natif | Aucun SDK publicitaire ou de paiement, ni wrapper iOS/Android n’est configuré. Une publicité ou un achat ne peut donc pas encore valider une récompense. |
| Tests | `tests/rivo-entry.test.mjs` vérifie l’entrée du site et la présence des ressources embarquées. Le workflow GitHub lance `npm run check` avec Node 22. |
| Dépendances | Pas de dépendances applicatives listées dans `package.json`. Les commandes de vérification du dépôt demandent Node.js; l’environnement local utilisé pour cet audit ne fournit pas Node. |

### Composants visuels à conserver

- Le système Rebond : bleu électrique, cartes en relief, accent jaune, typographie Nunito et grenouille existante.
- La navigation et les écrans actuels comme base à faire évoluer : ligues, jeu, résultat, classement, chat, profil.
- Les assets de jeu et la convention d’intégration autonome dans `games/`.

La grenouille est fournie en trois poses (`focus`, `win`, `lose`) et sert de mascotte. Le dépôt ne contient pas encore de collection d’avatars ni de données de profil partagées.

## 2. Écart avec le brief

Les profils, ligues, membres, historiques, classements, scores mondiaux et conversations visibles aujourd’hui sont des données de démonstration ou de navigateur. Le prototype l’indique dans ses guides et certains écrans. Ils ne prouvent pas une compétition entre appareils.

Les exigences qui dépendent d’une autorité serveur ne peuvent pas être validées côté navigateur : création d’identité persistante, calendrier commun, votes, limites d’essais, preuve publicitaire, bonus, points, classements, statistiques, streaks et chat partagé. Le navigateur ne doit jamais pouvoir décider seul de ces résultats.

Le catalogue actuellement présenté ne suffit pas à garantir les jeux distincts requis par les deux votes (12 mini-jeux : 8 calendaires et 4 candidats réservés). Le brief interdit de répéter les jeux; il faut donc atteindre au moins douze jeux jouables avant de pouvoir démarrer une saison complète. Les jeux manquants ne doivent pas être remplacés par des résultats ou joueurs fictifs.

## 3. Architecture recommandée

Garder l’interface statique et le format des jeux existants. Ajouter un client API versionné derrière des services métier pour que les écrans ne manipulent jamais directement les règles de classement ni les données de démonstration.

Le serveur devient l’autorité pour :

1. l’identité anonyme, les profils et l’appartenance aux ligues ;
2. la création des saisons, leur fuseau IANA et les dix fenêtres exactes de 24 heures ;
3. la sélection sans doublon des jeux et la programmation des deux votes ;
4. les tentatives, les résultats signés/validés et les récompenses ;
5. le calcul transactionnel des égalités, points, classements et statistiques ;
6. les streaks, récapitulatifs, stickers possédés et messages.

Les mini-jeux restent isolés sous `games/<slug>/`. Leur adaptateur transmet un résultat brut au service de partie; il ne reçoit pas d’autorité pour attribuer les points. Les secrets fournisseur restent côté serveur. La validation d’une publicité doit provenir d’un callback sécurisé du fournisseur; le client ne fait qu’ouvrir le parcours publicitaire.

### Entités minimales

`users`, `leagues`, `league_members`, `seasons`, `season_days`, `game_votes`, `game_attempts`, `daily_results`, `season_points`, `reward_claims`, `streak_events`, `stickers`, `user_stickers`, `messages`.

Chaque résultat ou récompense doit avoir une contrainte d’unicité adaptée (par exemple utilisateur/saison/jour/type de bonus), une validation côté serveur et une trace d’audit. Les opérations qui changent plusieurs tables — fin de vote, attribution de points, consommation d’un bonus — doivent être transactionnelles et idempotentes.

### Décision d’infrastructure à prendre avant les phases 2–6

Le dépôt n’impose aucun fournisseur backend. L’implémentation nécessite un choix et un projet provisionné pour l’API, la base, les sessions anonymes et les politiques d’accès. Il faut aussi le fournisseur publicitaire récompensé; les paiements de stickers et les demandes d’avis natives supposent une application iOS/Android empaquetée et ses comptes développeur. Aucun identifiant ou secret correspondant n’est présent dans ce dépôt.

Ne pas coder une intégration fournisseur arbitraire ni afficher de succès simulé avant cette décision. On peut alors ajouter une configuration d’environnement, les migrations, les politiques d’accès, les fonctions serveur et les tests d’intégration dans une branche locale sans exposer de secrets.

## 4. Ordre et dépendances

| Phase | Portée | Dépend de |
| --- | --- | --- |
| 1. Audit et architecture | Ce document, inventaire, conservation des composants, frontières de confiance. | Rien |
| 2. Profil et identité | Session anonyme, profil synchronisé, dix personnages et sélection. | Backend choisi et endpoints/migrations disponibles; création des neuf illustrations |
| 3. Saisons | Fenêtres de 24 h, fuseau IANA, calendrier de dix jeux sans répétition, votes. | Backend; catalogue d’au moins dix jeux jouables |
| 4. Compétition | Entraînement, essais officiels, preuve publicitaire, bonus, points, classements. | Backend transactionnel; SDK/provider publicitaire |
| 5. Profil et fidélisation | Statistiques, récapitulatif, streaks, récompense du jour 4 et avis natif. | Résultats fiables; wrapper natif pour avis |
| 6. Social | Classements de ligue, chat, collections et envoi de stickers, boutique. | Backend temps réel; fournisseur de paiement avant tout achat réel |
| 7. Internationalisation et finition | Six langues, formats régionaux, accessibilité, tests de bout en bout. | Libellés stabilisés; parcours complets des phases précédentes |

## 5. Critères d’acceptation à préserver

- Aucune donnée de démo ne participe aux classements réels.
- Aucune récompense n’est accordée à partir d’une simple déclaration du navigateur.
- Une saison ne démarre pas si douze jeux jouables et distincts ne sont pas disponibles pour laisser trois candidats à chacun des deux votes.
- Un fuseau IANA et les timestamps UTC du serveur déterminent les échéances; une journée reste exactement 24 heures même lors d’un changement d’heure.
- Les égalités reçoivent la moyenne des points des rangs concernés selon la formule du brief; le multiplicateur ne modifie que les points.
- L’identité graphique et le parcours mobile existants restent la base, et chaque mini-jeu reste autonome.

## Vérification de cet audit

Inspection des deux points d’entrée, des sources de l’Atelier, des écrans et du modèle, du gabarit de mini-jeu, des guides, du manifeste, des workflows CI et des assets. Aucun changement d’application ou de données utilisateur n’a été réalisé pendant cette phase. Aucun push GitHub n’a été effectué.

## Avancement du chantier dans la copie locale

Les modifications ci-dessous sont préparées dans `jeu-mobile-arcade-latest` et n’ont pas été poussées.

| Phase | Réalisé localement | État réel |
| --- | --- | --- |
| 1. Audit | Inventaire et architecture documentés. | Terminé pour l’état du dépôt audité. |
| 2. Profil | Session anonyme Supabase, profil synchronisé, choix pays/personnage, dix illustrations. | Projet créé; URL/clé publishable configurées et sessions anonymes activées. Les tables de profil ne sont pas encore déployées, donc le parcours n’est pas validé de bout en bout. |
| 3. Saisons | Migrations pour calendrier 10 jours, périodes UTC consécutives de 24 h, deux votes, tie-break serveur. La création bloque si le catalogue a moins de 12 jeux jouables. Ajout du manifeste d’adaptateurs et des clés de vérification. | Règles écrites, migration non appliquée; catalogue réel à 1 jeu. L’exécution complète d’un second adaptateur de jeu est à finir avec le jeu lui-même. |
| 4. Compétition | Tentatives/pratique et deux essais, validation Aiguillage serveur, points normalisés, classements de ligue/jour/saison et rangs mondiaux/nationaux. | Un seul jeu validable; fournisseur publicitaire absent; durée Aiguillage mesurée au serveur mais absence d’anti-triche natif plus large. |
| 5. Profil et fidélisation | Statistiques, calendrier de streak, carrousel de récapitulatif et attribution/consommation unique du bonus du quatrième jour préparés dans le code et les migrations. | Pas encore déployé ni validé sur Supabase; demande d’avis native impossible sans wrapper mobile. |
| 6. Social | RPC de ligue/chat, polling du chat, personnages, données de collections multilingues et schéma boutique sans paiement simulé. | Pas de temps réel Supabase configuré; nouveaux assets de stickers et achats en attente de la plateforme de paiement. |
| 7. Internationalisation | Détection, préférence de langue, sélection de locale pour les dates/nombres et dictionnaire FR/EN/ES/DE/IT/PT étendu aux parcours principaux; colonnes localisées pour noms/descriptions des jeux et stickers. | Couverture des libellés encore incomplète : certains textes embarqués et messages métier restent en français. À relire langue par langue avant de dire la phase terminée. |

Mise à jour du 18 novembre 2026 : l’organisation Supabase **Rivo** (offre Free) et le projet **Rivo** existent, référence `dcwhahnjkixoahunrjxl`, région West EU (Paris), plan Nano. L’URL et la clé publishable sont configurées dans la prévisualisation locale; aucun secret serveur n’y est stocké. Les sessions anonymes ont été activées avec l’accord du propriétaire. Supabase indique encore **No repository connected**. L’installation GitHub actuellement ouverte est rattachée au compte `rafaeldelbecq-spec`, tandis que le dépôt distant appartient à `alexdbs18`; la recherche GitHub ne trouve pas le dépôt parmi les dépôts installables de cette installation. Le lien exact ne peut donc pas être terminé depuis cette session GitHub. Aucune migration SQL ni fonction Edge n’a encore été déployée.

### Vérifications locales

- Reconstruction autonome de `rivo/index.html` réussie avec `python3 rivo/src/build.py rivo/index.html`.
- `git diff --check` réussit.
- Les sources JavaScript et les scripts embarqués de l’HTML ont été compilés pour contrôler leur syntaxe avec le runtime Node fourni par l’interface.
- Vérifications ciblées réussies : points pour 2/7/15/64 personnes, égalité arrondie, dix fenêtres consécutives de 24 h, présence des six codes de langue.
- `npm run check` n’a pas pu être lancé dans le shell local : `npm`/Node CLI est absent. Les nouveaux et anciens scripts JavaScript ont été analysés avec le runtime Node intégré. Aucun test SQL ou test Supabase n’a pu être exécuté, faute d’application des migrations au projet.
- La prévisualisation locale reste disponible sur `http://127.0.0.1:8002/rivo/?da=a`; elle indique que ses données de démonstration ne sont pas synchronisées.
