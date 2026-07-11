import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached independently across deploys
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Portal pages — each user role only ever loads one of these
          'portal-vendor':    ['./src/pages/TrainingVendorPortal.jsx'],
          'portal-candidate': ['./src/pages/CandidatePortal.jsx'],
          'portal-trainer':   ['./src/pages/TrainerPortal.jsx'],
          'portal-placement': ['./src/pages/PlacementPartnerPortal.jsx'],
          'portal-csr':       ['./src/pages/CsrOrganizationPortal.jsx'],
          'portal-employer':  ['./src/pages/EmployerPortal.jsx'],
          'portal-state':     ['./src/pages/StateGovtPortal.jsx'],
          'portal-superadmin':['./src/pages/SuperadminDashboard.jsx'],
        }
      }
    }
  }
});
