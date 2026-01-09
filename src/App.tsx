import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from './utils/api';
import { Home } from './pages/Home';
import { Studio } from './pages/Studio';
import { Games } from './pages/Games';
import { Admin } from './pages/Admin';
import { AboutEirik } from './pages/AboutEirik';
import { AboutKurtEdgar } from './pages/AboutKurtEdgar';
import { BeerCalculator } from './pages/BeerCalculator';
import { AwesomeMusic } from './pages/AwesomeMusic';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { MainLayout } from './layouts/MainLayout';

function AdminStatus() {
  const [status, setStatus] = useState<{ checked: boolean; configured: boolean }>({ checked: false, configured: true });

  useEffect(() => {
    // Only check in DEV or Preview (where we might want to know). 
    // Actually, task says "show a small non intrusive dev only indicator".
    if (import.meta.env.DEV || window.location.hostname.includes('pages.dev')) {
      api.healthCheck().then(res => {
        setStatus({ checked: true, configured: !!res.adminConfigured });
      });
    }
  }, []);

  if (!status.checked || status.configured) return null;

  return (
    <div className="fixed bottom-1 left-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded opacity-50 hover:opacity-100 pointer-events-none z-[9999]" title="Admin password not configured in Worker">
      Admin Unsafe
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div data-testid="app-ready">
        <PwaInstallPrompt />
        <AdminStatus />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/games" element={<Games />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about/eirik" element={<AboutEirik />} />
            <Route path="/about/kurt-edgar" element={<AboutKurtEdgar />} />
            <Route path="/beer-calculator" element={<BeerCalculator />} />
            <Route path="/music" element={<AwesomeMusic />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
