// @ts-nocheck
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Edit, Eye, User, Lock } from 'lucide-react';

interface PermissionBadgesProps {
  areaName: string;
}

export const PermissionBadges: React.FC<PermissionBadgesProps> = ({ areaName }) => {
  const { canEditProyectado, canEditRealizado, profile, isAdmin } = useAuth();

  const canEditProy = canEditProyectado(areaName);
  const canEditReal = canEditRealizado(areaName);

  return (
    <div className="flex items-center gap-4">
      {/* Info del usuario */}
      <div className="flex items-center gap-2 text-white/80 text-sm">
        <User size={14} />
        <span className="font-medium">{profile?.nombre || 'Usuario'}</span>
        {isAdmin() && (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs font-semibold flex items-center gap-1">
            <Shield size={10} />
            Admin
          </span>
        )}
      </div>

      {/* Badges de permisos */}
      <div className="flex gap-2">
        {canEditProy && (
          <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold flex items-center gap-1">
            <Edit size={10} />
            Proyectado
          </span>
        )}
        {canEditReal && (
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold flex items-center gap-1">
            <Edit size={10} />
            Realizado
          </span>
        )}
        {!canEditProy && !canEditReal && (
          <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
            <Eye size={10} />
            Solo Lectura
          </span>
        )}
      </div>
    </div>
  );
};

interface AccessDeniedProps {
  areaName?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ areaName }) => {
  const { profile } = useAuth();

  return (
    <div className="ocean-card p-8 text-center max-w-md mx-auto mt-8">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-red-400 mb-4">🚫 Acceso Denegado</h2>
      <p className="text-white/70 mb-4">
        No tienes permisos para ver esta pestaña.
      </p>
      <p className="text-white/50 text-sm">
        Usuario: <strong>{profile?.nombre || 'No seleccionado'}</strong> ({profile?.rol || 'Sin rol'})
      </p>
    </div>
  );
};
