# CoursFacile V15 — serveur IA prêt à déployer

Cette archive contient le front web et un serveur Node.js sécurisé qui appelle l’OpenAI Responses API.

## Démarrage local
1. Node.js 20+
2. `npm install`
3. Copier `.env.example` vers `.env`
4. Renseigner `OPENAI_API_KEY`
5. `npm start`
6. Ouvrir `http://localhost:3000`

## Production
Déployer le dossier comme service Node/Docker et définir `OPENAI_API_KEY` dans les variables d’environnement de l’hébergeur. Ne mets jamais cette clé dans le navigateur, l’APK, GitHub public ou le ZIP distribué aux élèves.

Le serveur accepte une question, une image ou un PDF, applique le contexte pays/formation/niveau/matière et renvoie l’explication pédagogique.

Avant une publication publique : ajouter authentification, contrôle des coûts, journalisation minimale, politique de confidentialité, suppression/gestion des fichiers, tests et règles adaptées aux mineurs.
