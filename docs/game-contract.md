# Contrat mini-jeu Rivo

Ce document décrit la frontière commune entre un mini-jeu, l'application Rivo et Supabase. Le premier adaptateur enregistré est `aiguillage`; les autres noms aperçus dans l'atelier sont des maquettes et ne comptent pas pour une saison.

## Responsabilités

- **Jeu** : règles déterministes, graine reçue, état de manche, pause/reprise, entrées tactiles, événements bruts et résultat d'affichage. Portrait à partir de 360 px.
- **Application Rivo** : session invitée, identifiant d'essai, calendrier, limites d'essais, données de profil, navigation et présentation des résultats serveur.
- **Vérificateur Edge** : vérifie propriétaire de tentative, jeu/jour/heure, structure et durée des événements; recalcule le score; transmet le résultat au RPC de finalisation. Il ne fait confiance ni au score ni à la durée annoncés par le client.

Un jeu ne devient jouable que si son adaptateur navigateur et son vérificateur serveur existent et ont été déployés. Le catalogue Supabase doit avoir `playable=true`, `verifier_key` et `adapter_version` corrects. `create_season` exige 12 jeux jouables distincts : 10 pour les jours, plus 2 réservés aux candidats de vote. Les essais incomplets ne démarrent pas une saison.

## Enregistrement client

`rivo/src/game-registry.js` expose `RivoGames.register({ id, version, nameKey, descriptionKey, verify, create })`. Chaque identifiant est unique et suit `^[a-z0-9-]{2,40}$`; `verify` est le nom de la fonction Edge déployée. `create` est le point d'entrée de l'adaptateur et reçoit son contexte (graine, mode, langue, racine d'affichage et callbacks).

Le premier adaptateur Aiguillage est volontairement limité à une clé de vérification. Son moteur historique est toujours rendu par le parcours existant. Pour brancher un deuxième jeu au parcours de partie, il reste à finir le montage dynamique de l'adaptateur dans l'écran jeu et le routage générique de ses commandes; l'enregistrement ne transforme pas encore une maquette en jeu complet.

## Serveur

- Créer `supabase/functions/submit-<slug>/index.ts` à partir de `submit-aiguillage`.
- L'Edge Function authentifie le joueur depuis son jeton, lit la tentative côté serveur, confirme qu'elle n'est pas déjà soumise et qu'elle correspond au défi actif.
- Valider les événements bruts, recalculer score et durée, puis appeler `set_verified_attempt_result`.
- Garder un identifiant unique de tentative et rendre les répétitions idempotentes.
- Ajouter la fonction à la liste de déploiement de `supabase/README.md` et un test des règles pures.

Le type partagé dans `supabase/functions/_shared/game-verifiers.ts` formalise la signature d'un validateur. L'exécution multi-jeux dans une unique fonction Edge reste à intégrer; actuellement chaque vérificateur a son endpoint séparé.

## Données et langues

Les noms/descriptions des jeux et stickers sont stockés avec une valeur par langue dans `name_i18n` et `description_i18n`. Les phrases d'interface sont dans `rivo/src/i18n.js` (FR, EN, ES, DE, IT, PT); toute nouvelle règle, instruction, erreur, notification, accessibilité, nom et description doit ajouter ses six traductions. Si une traduction manque, le français reste affiché, jamais une chaîne vide.

## Récompenses et fournisseurs

`rivo/src/platform.js` prévoit les interfaces `showRewardedAd`, `purchase`, `restore` et `requestReview` fournies par un wrapper natif. Elles restent explicitement indisponibles dans le navigateur. Une publicité ne pourra créditer de bonus qu'après callback fournisseur signé vérifié par le serveur. Un achat ne pourra débloquer un sticker qu'après validation d'un reçu Apple/Google. Il reste à choisir un SDK publicitaire et à intégrer les callbacks correspondants; aucun faux succès n'est prévu.
