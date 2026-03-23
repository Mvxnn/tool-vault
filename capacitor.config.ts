import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.toolvault.app',
    appName: 'Tool Vault',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    }
};

export default config;
