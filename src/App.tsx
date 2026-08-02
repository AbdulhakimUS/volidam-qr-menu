import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { MenuProvider, useMenu } from './context/MenuContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome from './components/Welcome';
import Preloader from './components/Preloader';
import MenuPage from './pages/MenuPage';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

function AdminRoute() {
  const { currentUser } = useAuth();
  return currentUser ? <AdminPanel /> : <AdminLogin />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const MIN_PRELOADER_MS = 500;
const SAFETY_TIMEOUT_MS = 4000;

function BootGate({ children }: { children: React.ReactNode }) {
  const { items } = useMenu();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    const photoUrls = items.map((i) => i.photo).filter(Boolean) as string[];
    const imagePromises = photoUrls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    );
    const fontsReady = (document as any).fonts?.ready?.catch?.(() => undefined) ?? Promise.resolve();
    const everything = Promise.all([...imagePromises, fontsReady]);
    const safety = new Promise<void>((resolve) => setTimeout(resolve, SAFETY_TIMEOUT_MS));

    Promise.race([everything, safety]).then(() => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_PRELOADER_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, wait);
    });

    return () => {
      cancelled = true;
    };
    // Only run once on boot — item photos already present at mount are what we preload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Preloader />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <MenuProvider>
            <BootGate>
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            </BootGate>
          </MenuProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

