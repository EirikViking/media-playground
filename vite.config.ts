import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const getBuildTime = () => {
  const now = new Date();
  return now.toLocaleString('no-NB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '.');
};

export default defineConfig({
  plugins: [react()],
  define: {
    '__BUILD_TIME__': JSON.stringify(getBuildTime()),
  },
})
