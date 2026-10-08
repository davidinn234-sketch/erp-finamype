import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:3005', headless: true, screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev', url: 'http://127.0.0.1:3005/api/health', reuseExistingServer: false,
    env: { PORT: '3005', GEMINI_API_KEY: '', VITE_USE_FIREBASE_EMULATORS: 'true', FIREBASE_PROJECT_ID: 'demo-fina-pyme', FIRESTORE_DATABASE_ID: '(default)', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' },
  },
});
