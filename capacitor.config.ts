import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.toolvault.app',
    appName: 'Tool Vault',
    webDir: 'out',
    server: {
        androidScheme: 'https',
        // REMPLACEZ CETTE URL par l'adresse de votre site web déployé sur Vercel (ex: 'https://votre-projet.vercel.app')
        // pour que l'application mobile et le site web partagent la même base de données distante.
        url: 'https://tool-vault-kohl.vercel.app',
        cleartext: true
    }
};

export default config;
