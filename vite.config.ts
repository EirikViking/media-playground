import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { execSync } from 'child_process'

const getVersion = () => {
  try {
    return process.env.CF_PAGES_COMMIT_SHA?.substring(0, 7) ||
      process.env.GITHUB_SHA?.substring(0, 7) ||
      execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
};

export default defineConfig({
  plugins: [react()],
  define: {
    '__APP_VERSION__': JSON.stringify(getVersion()),
  },
})
