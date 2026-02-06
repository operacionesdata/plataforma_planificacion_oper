// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Shield, Lock, LogOut, Eye, EyeOff } from 'lucide-react';
import loginBackground from '@/assets/login-background.jpg';

export const UserSelector: React.FC = () => {
  const { profile, login, loading } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    const result = await login(usuario, clave);
    
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }
    setIsLoggingIn(false);
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%), url(${loginBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">⏳</div>
          <div className="text-2xl font-bold text-white">Cargando Sistema...</div>
        </div>
      </div>
    );
  }

  // Si no hay usuario seleccionado, mostrar pantalla de login
  if (!profile) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%), url(${loginBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="ocean-card p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <img 
              src="https://media.licdn.com/dms/image/v2/C5603AQFnpOvt4lf22Q/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1582134556904?e=2147483647&v=beta&t=uwb12WYRRj6P-EuiE9xSiFgDtWCMGJtrqJGxMOLUAiE"
              alt="Camanchaca Logo"
              className="h-20 w-20 mx-auto mb-4 rounded-full object-cover shadow-lg border-2 border-blue-400"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Plataforma de Planificación</h1>
            <p className="text-slate-300">Gerencia Operaciones Salmones Camanchaca</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-2">
                <User size={18} />
                Usuario
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-4 py-3 bg-white text-slate-900 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-lg"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-white font-semibold mb-2">
                <Lock size={18} />
                Clave
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="w-full px-4 py-3 bg-white text-slate-900 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-lg pr-12"
                  placeholder="Ingresa tu clave"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isLoggingIn ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

// Componente para mostrar la barra de usuario en el dashboard
export const UserBar: React.FC = () => {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  const areaLabels: Record<string, string> = {
    redes: '📡 Redes',
    fondeo: '⚓ Fondeo',
    rental: '🔧 Rental',
    habitabilidad: '🏠 Habitabilidad',
    sso: '🦺 SSO',
    ingenieria: '🔬 Ingeniería',
    resumen: '📊 Resumen',
    informe: '📄 Informe',
    flota: '🚢 Flota',
  };

  return (
    <div className="ocean-card p-4 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Info del usuario */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-lg">
          <User size={16} className="text-blue-200" />
          <span className="text-white font-semibold">{profile.nombre}</span>
          <span className="text-blue-200 text-sm uppercase">({profile.rol})</span>
        </div>

        {/* Badges de permisos */}
        <div className="flex flex-wrap gap-2">
          {profile.permisos && Object.entries(profile.permisos).slice(0, 6).map(([area, perms]) => {
            if (!perms?.view) return null;

            const canEditP = perms?.editProyectado;
            const canEditR = perms?.editRealizado;

            let badgeColor = 'bg-gray-500';
            if (canEditP && canEditR) {
              badgeColor = 'bg-green-600';
            } else if (canEditR) {
              badgeColor = 'bg-blue-600';
            } else if (canEditP) {
              badgeColor = 'bg-yellow-600';
            }

            return (
              <span
                key={area}
                className={`${badgeColor} text-white px-2 py-1 rounded text-xs font-semibold`}
                title={`Proyectado: ${canEditP ? 'Sí' : 'No'} | Realizado: ${canEditR ? 'Sí' : 'No'}`}
              >
                {areaLabels[area]?.split(' ')[0] || area}
              </span>
            );
          })}
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={logout}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};
