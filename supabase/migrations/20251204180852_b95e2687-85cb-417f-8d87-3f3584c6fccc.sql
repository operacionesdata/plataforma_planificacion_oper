-- 1. Crear enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coordinador', 'operador', 'visualizador');

-- 2. Crear tabla user_profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol app_role NOT NULL DEFAULT 'visualizador',
  permisos JSONB NOT NULL DEFAULT '{
    "redes": {"view": true, "editProyectado": false, "editRealizado": false},
    "fondeo": {"view": true, "editProyectado": false, "editRealizado": false},
    "rental": {"view": true, "editProyectado": false, "editRealizado": false},
    "habitabilidad": {"view": true, "editProyectado": false, "editRealizado": false},
    "sso": {"view": true, "editProyectado": false, "editRealizado": false},
    "ingenieria": {"view": true, "editProyectado": false, "editRealizado": false},
    "resumen": {"view": true, "editProyectado": true, "editRealizado": true},
    "informe": {"view": true, "editProyectado": true, "editRealizado": true},
    "flota": {"view": true, "editProyectado": true, "editRealizado": true}
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear función para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = _user_id AND rol = 'admin'
  )
$$;

-- 5. Políticas RLS para user_profiles
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Los admins pueden insertar perfiles
CREATE POLICY "Admins can insert profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- Los admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update all profiles"
ON public.user_profiles
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Los admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 6. Trigger para actualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_gantt_calendars_updated_at();

-- 7. Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email,
    'visualizador'
  );
  RETURN NEW;
END;
$$;

-- 8. Trigger para auto-crear perfil
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();