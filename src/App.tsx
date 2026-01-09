import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Studio } from './pages/Studio';
import { Games } from './pages/Games';
import { Admin } from './pages/Admin';
import { AboutEirik } from './pages/AboutEirik';
import { AboutKurtEdgar } from './pages/AboutKurtEdgar';
import { BeerCalculator } from './pages/BeerCalculator';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

function App() {
  return (
    <BrowserRouter>
      <div data-testid="app-ready">
        <PwaInstallPrompt />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/games" element={<Games />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/about/eirik" element={<AboutEirik />} />
          <Route path="/about/kurt-edgar" element={<AboutKurtEdgar />} />
          <Route path="/beer-calculator" element={<BeerCalculator />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
