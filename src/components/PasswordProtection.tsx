import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const CORRECT_PASSWORD = "Salmon2025";
const STORAGE_KEY = "app_authenticated";

export const PasswordProtection: React.FC<PasswordProtectionProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Verificar si ya está autenticado en sessionStorage
    const authenticated = sessionStorage.getItem(STORAGE_KEY);
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      setError("");
    } else {
      setError("Contraseña incorrecta");
      setPassword("");
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Verificando acceso...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-500/20 p-4 rounded-full mb-4">
              <Lock size={48} className="text-blue-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Acceso Protegido</h1>
            <p className="text-slate-300 text-center">
              Ingrese la contraseña para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese contraseña"
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Ingresar
            </button>
          </form>

          <div className="mt-6 text-center text-slate-400 text-sm">
            <p>🔒 Sistema de Gestión de Centros Acuícolas</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PasswordProtection;
