import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import CadastroCliente from "./pages/CadastroCliente";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import ConfiguracaoSistema from "./pages/ConfiguracaoSistema";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Página de login - sem proteção */}
          <Route path="/login" element={<Login />} />

          {/* Página inicial - redireciona para login se não autenticado */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowAll>
                <Welcome />
              </ProtectedRoute>
            }
          />

          {/* Rotas do consultor */}
          <Route
            path="/cadastro-cliente"
            element={
              <ProtectedRoute requiredProfile="consultor">
                <CadastroCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ficha-negociacao"
            element={
              <ProtectedRoute requiredProfile="consultor">
                <Index />
              </ProtectedRoute>
            }
          />

          {/* Rota do administrador */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredProfile="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Configurações - acesso para ambos */}
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute allowAll>
                <ConfiguracaoSistema />
              </ProtectedRoute>
            }
          />

          {/* Página não encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
