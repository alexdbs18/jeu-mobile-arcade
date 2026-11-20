# Mise en service Supabase de Rivo

## État actuel

Le projet **Rivo** existe dans l'organisation Rivo, région Paris (West EU), référence `dcwhahnjkixoahunrjxl`. Les sessions anonymes sont activées. L'application locale contient l'URL du projet et sa clé publique de navigateur dans `rivo/supabase-config.js`; aucune clé secrète n'est stockée dans le code.

Supabase indique encore **No repository connected**. L'installation GitHub actuellement ouverte est rattachée à `rafaeldelbecq-spec`, alors que le dépôt appartient à `alexdbs18`. Rien n'a été poussé sur GitHub; les migrations et fonctions ne sont pas déployées.

## Relier le dépôt GitHub

1. Dans GitHub, se connecter au compte propriétaire **alexdbs18** (ou demander au propriétaire de faire cette étape).
2. Ouvrir **Settings → Applications → Installed GitHub Apps**, installer l'application **Supabase**, et lui donner accès au seul dépôt `jeu-mobile-arcade`.
3. Dans le tableau de bord Supabase, ouvrir le projet Rivo puis **Project Settings → Integrations → GitHub** ou **Connect to GitHub**. Choisir `alexdbs18/jeu-mobile-arcade` et vérifier que son nom apparaît ensuite comme dépôt connecté.

Relier GitHub à Supabase ne publie pas les fichiers locaux. Une personne autorisée doit aussi publier les changements dans le dépôt. Le dépôt contient une action GitHub Pages qui publie le site lors d'un push sur la branche principale; aucun push n'a été fait pendant ce travail.

## Déployer le schéma et les fonctions

Depuis un terminal ouvert dans le dossier du dépôt, exécuter :

```sh
supabase login
supabase link --project-ref dcwhahnjkixoahunrjxl
supabase db push
supabase functions deploy submit-aiguillage
supabase functions deploy resolve-vote
supabase functions deploy maintenance
supabase functions deploy scheduled-maintenance
```

`supabase login` demande un jeton personnel Supabase. Le créer dans le tableau de bord Supabase, puis le saisir uniquement dans l'invite du terminal. Ne jamais le coller dans GitHub, le code ou une conversation.

Si `supabase db push` demande le mot de passe de la base, le récupérer dans **Project Settings → Database** et le saisir uniquement dans le terminal. Les migrations de `supabase/migrations/` sont déjà numérotées; la CLI les applique dans l'ordre.

Vérifier ensuite dans **Database → Migrations** que les migrations sont présentes et dans **Edge Functions** que les quatre fonctions sont déployées. Tester l'ouverture de l'application, l'identité invitée, la création d'un profil et d'une ligue.

## Planification de maintenance

Créer un secret long et aléatoire, le définir dans le terminal :

```sh
supabase secrets set RIVO_MAINTENANCE_SECRET=COLLER_ICI_UN_SECRET_ALEATOIRE
```

Dans Supabase Cron, programmer chaque minute un POST vers `https://dcwhahnjkixoahunrjxl.supabase.co/functions/v1/scheduled-maintenance`, avec l'en-tête `x-rivo-maintenance-secret` et la même valeur. Garder ce secret seulement dans le coffre Supabase/Cron. La fonction finalise les votes, journées et saisons; l'endpoint `maintenance` demandé par l'application ne traite que les ligues du joueur.

## État des intégrations et jeux

- Le schéma comprend profils, sessions invitées, ligues, saisons de 10 défis sur des fenêtres de 24 heures, votes, tentatives, classements, statistiques, streaks, messages et collections de stickers.
- Un seul jeu est réellement jouable et vérifiable : Aiguillage. Le code de saison exige 12 jeux jouables distincts et bloque tant que le catalogue est incomplet. Les maquettes ne sont jamais comptées comme jeux.
- Les contrats d'adaptateurs de jeu, de vérificateurs serveur, de traductions et de collections/boutique sont préparés. Le branchement dynamique complet d'un second jeu au parcours de partie et les nouveaux vérificateurs serveur restent à faire en ajoutant les jeux.
- Les sessions anonymes Supabase sont activées. Les migrations ne sont pas encore appliquées.
- Les publicités récompensées restent désactivées jusqu'au choix d'un fournisseur et à l'intégration de ses callbacks signés côté serveur. L'interface navigateur ne simule aucun visionnage.
- Les achats de stickers nécessitent une application iOS/Android, les comptes de publication Apple/Google et la validation des reçus par le serveur. Le projet ne simule aucun paiement.
- Les avis natifs nécessitent le wrapper mobile; dans un navigateur, le point d'extension indique simplement que le service est indisponible.

Pour reconstruire le fichier de prévisualisation après des modifications locales :

```sh
python3 rivo/src/build.py rivo/index.html
```
