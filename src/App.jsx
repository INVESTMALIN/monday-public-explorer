import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthGuard from './components/AuthGuard.jsx';
import Layout from './components/Layout.jsx';
import Annuaire from './pages/Annuaire.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/annuaire" element={<Annuaire />} />
            <Route
              path="/matching"
              element={
                <ComingSoon
                  title="Matching"
                  description="Croisement automatique entre boards (clients ↔ livraisons, prospects ↔ ventes, etc.)."
                />
              }
            />
            <Route
              path="/api-docs"
              element={
                <ComingSoon
                  title="API Docs"
                  description="Documentation des endpoints exposés pour les automatisations internes (Make, n8n)."
                />
              }
            />
            <Route
              path="/section-3"
              element={<ComingSoon title="Section 3" description="Section à définir." />}
            />
            <Route
              path="/section-4"
              element={<ComingSoon title="Section 4" description="Section à définir." />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthGuard>
    </BrowserRouter>
  );
}
