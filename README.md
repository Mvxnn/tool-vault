# 🛠️ Tool Vault - Guide de Synchronisation & Déploiement

Ce dépôt contient l'application **Tool Vault**, conçue pour organiser vos outils et sites web de développement. 
Ce guide explique comment configurer l'application pour que votre PC (via le Web) et votre téléphone (via Capacitor) partagent la **même base de données distante** sans risque de doublons.

---

## 🚀 1. Déploiement Côté Serveur (Vercel)

Pour centraliser vos données, l'application doit être hébergée sur un serveur cloud. La plateforme recommandée est **Vercel**.

1. Créez un projet sur [Vercel](https://vercel.com/) lié à votre dépôt Git.
2. Configurez les **Environment Variables** suivantes dans l'interface de Vercel :
   - `BLOB_READ_WRITE_TOKEN` : Votre token Vercel Blob (pour le stockage de la base `data.json`).
   - `PASSWORD` : Le mot de passe requis pour vous connecter à votre interface (Basic Auth).
3. Déployez l'application. Vous obtiendrez une URL de production (ex: `https://mon-tool-vault.vercel.app`).

---

## 📱 2. Configuration et Build de l'Application Mobile (Capacitor)

Pour que l'application mobile affiche les mêmes données que votre PC, elle doit charger directement votre instance Vercel :

1. Ouvrez le fichier [capacitor.config.ts](file:///c:/Users/maxen/Documents/tool-vault/capacitor.config.ts) dans votre éditeur.
2. Décommentez la ligne `url` et remplacez la valeur par l'URL de votre application Vercel :
   ```typescript
   server: {
       androidScheme: 'https',
       url: 'https://mon-tool-vault.vercel.app', // <-- Votre URL Vercel ici
       cleartext: true
   }
   ```
3. Exécutez les commandes suivantes pour compiler et synchroniser l'application avec Android Studio :
   ```bash
   npm run build
   npx cap sync android
   ```
4. Ouvrez le projet dans Android Studio pour lancer l'application sur votre téléphone :
   ```bash
   npx cap open android
   ```

---

## 📥 3. Importation intelligente (Anti-doublons)

L'importation de fichiers JSON a été améliorée pour fusionner intelligemment vos données :
- **Détection des doublons :** L'application vérifie si un site existe déjà en comparant les URLs nettoyées et les noms des outils.
- **Fusion des données :** Si un doublon est détecté, l'application fusionne les tags, les collections associées, met à jour la note la plus élevée et conserve vos notes textuelles existantes, évitant ainsi toute perte de données.
- **Sécurité :** Vous pouvez importer des fichiers depuis votre PC ou votre téléphone, les modifications se répercuteront immédiatement sur les deux appareils grâce à la base de données partagée.
