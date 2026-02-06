import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useGanttPermissions = (areaName: string) => {
  const { canView, canEditProyectado, canEditRealizado, profile, isAdmin } = useAuth();

  // Safe checks for permissions
  const safeCanView = profile ? canView(areaName) : false;
  const safeCanEditProyectado = profile ? canEditProyectado(areaName) : false;
  const safeCanEditRealizado = profile ? canEditRealizado(areaName) : false;

  const checkEditPermission = (rowType: string): boolean => {
    if (!profile) return false;
    
    const isProyectado = rowType.includes('proyectado');
    const isRealizado = rowType.includes('realizado');
    const isRecursos = rowType.includes('recursos') || rowType === 'B1';

    // Recursos siempre se pueden editar si tienes algún permiso de edición
    if (isRecursos) {
      return safeCanEditProyectado || safeCanEditRealizado;
    }

    if (isProyectado && !safeCanEditProyectado) {
      toast({
        title: "❌ Sin permisos",
        description: `No tienes permisos para editar "Proyectado" en esta área.\n\nUsuario: ${profile?.nombre}`,
        variant: "destructive",
      });
      return false;
    }

    if (isRealizado && !safeCanEditRealizado) {
      toast({
        title: "❌ Sin permisos",
        description: `No tienes permisos para editar "Realizado" en esta área.\n\nUsuario: ${profile?.nombre}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const getAuthorName = (): string => {
    return profile?.nombre || 'Usuario Anónimo';
  };

  const hasAnyEditPermission = (): boolean => {
    return safeCanEditProyectado || safeCanEditRealizado;
  };

  return {
    canView: safeCanView,
    canEditProyectado: safeCanEditProyectado,
    canEditRealizado: safeCanEditRealizado,
    checkEditPermission,
    getAuthorName,
    hasAnyEditPermission,
    profile,
    isAdmin: profile ? isAdmin() : false,
  };
};
