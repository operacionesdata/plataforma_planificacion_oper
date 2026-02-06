-- Agregar columnas usuario y clave a user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS usuario TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS clave TEXT;

-- Crear índice para usuario
CREATE INDEX IF NOT EXISTS idx_user_profiles_usuario ON public.user_profiles(usuario);

-- Actualizar usuarios existentes con usuario y clave
UPDATE public.user_profiles 
SET usuario = 'cesar', clave = '12345'
WHERE email = 'cesar.mansilla@empresa.com';

UPDATE public.user_profiles 
SET usuario = 'pedro', clave = '54321'
WHERE email = 'pedro.oyarzun@empresa.com';