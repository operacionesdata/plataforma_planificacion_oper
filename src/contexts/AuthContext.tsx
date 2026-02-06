// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AreaPermission {
  view: boolean;
  editProyectado: boolean;
  editRealizado: boolean;
}

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  usuario: string;
  clave: string;
  permisos: {
    redes: AreaPermission;
    fondeo: AreaPermission;
    rental: AreaPermission;
    habitabilidad: AreaPermission;
    sso: AreaPermission;
    ingenieria: AreaPermission;
    resumen: AreaPermission;
    informe: AreaPermission;
    flota: AreaPermission;
  };
}

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  login: (usuario: string, clave: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  availableUsers: UserProfile[];
  canView: (tab: string) => boolean;
  canEditProyectado: (tab: string) => boolean;
  canEditRealizado: (tab: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar todos los usuarios disponibles
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('nombre');

        if (error) {
          console.error('Error loading users:', error);
          setAvailableUsers([]);
        } else {
          setAvailableUsers(profiles || []);
          console.log('📋 Usuarios disponibles:', profiles);

          // Cargar usuario guardado en localStorage
          const savedUserId = localStorage.getItem('current_user_id');
          if (savedUserId && profiles) {
            const savedProfile = profiles.find((p: UserProfile) => p.id === savedUserId);
            if (savedProfile) {
              setProfile(savedProfile);
              console.log('👤 Usuario restaurado:', savedProfile);
            }
          }
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setAvailableUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const login = async (usuario: string, clave: string): Promise<{ success: boolean; error?: string }> => {
    const user = availableUsers.find((u) => u.usuario === usuario && u.clave === clave);
    if (user) {
      setProfile(user);
      localStorage.setItem('current_user_id', user.id);
      console.log('👤 Usuario autenticado:', user.nombre, '- Rol:', user.rol);
      return { success: true };
    } else {
      return { success: false, error: 'Usuario o clave incorrectos' };
    }
  };

  const logout = () => {
    setProfile(null);
    localStorage.removeItem('current_user_id');
    console.log('👋 Sesión cerrada');
  };

  const canView = (tab: string): boolean => {
    if (!profile) return false;
    const permission = profile.permisos?.[tab as keyof typeof profile.permisos];
    return permission?.view || false;
  };

  const canEditProyectado = (tab: string): boolean => {
    if (!profile) return false;
    if (profile.rol === 'admin') return true;
    const permission = profile.permisos?.[tab as keyof typeof profile.permisos];
    return permission?.editProyectado || false;
  };

  const canEditRealizado = (tab: string): boolean => {
    if (!profile) return false;
    if (profile.rol === 'admin') return true;
    const permission = profile.permisos?.[tab as keyof typeof profile.permisos];
    return permission?.editRealizado || false;
  };

  const isAdmin = (): boolean => {
    return profile?.rol === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        login,
        logout,
        availableUsers,
        canView,
        canEditProyectado,
        canEditRealizado,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
