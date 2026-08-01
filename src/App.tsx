import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LangProvider } from './context/LangContext';
import { MenuProvider } from './context/MenuContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome from './components/Welcome';
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

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <MenuProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </MenuProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

