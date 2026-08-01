import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Auto-create a .env on first run so the app works out of the box.
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  const example = path.resolve(__dirname, '../.env.example');
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, envPath);
    // eslint-disable-next-line no-console
    console.log('[env] Created server/.env from .env.example');
  }
}

dotenv.config({ path: envPath });

export const env = {
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  SIMULATED_FLEET: (process.env.SIMULATED_FLEET || 'true') !== 'false',
};
