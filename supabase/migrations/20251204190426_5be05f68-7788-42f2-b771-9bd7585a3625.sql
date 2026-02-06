-- Eliminar la FK constraint para poder insertar usuarios sin auth.users
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Ahora insertar los 2 usuarios
INSERT INTO user_profiles (user_id, nombre, email, rol, permisos)
VALUES (
  gen_random_uuid(),
  'Cesar Mansilla',
  'cesar.mansilla@empresa.com',
  'admin',
  '{"redes": {"view": true, "editProyectado": true, "editRealizado": true}, "fondeo": {"view": true, "editProyectado": true, "editRealizado": true}, "rental": {"view": true, "editProyectado": true, "editRealizado": true}, "habitabilidad": {"view": true, "editProyectado": true, "editRealizado": true}, "sso": {"view": true, "editProyectado": true, "editRealizado": true}, "ingenieria": {"view": true, "editProyectado": true, "editRealizado": true}, "resumen": {"view": true, "editProyectado": true, "editRealizado": true}, "informe": {"view": true, "editProyectado": true, "editRealizado": true}, "flota": {"view": true, "editProyectado": true, "editRealizado": true}}'::jsonb
) ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, rol = EXCLUDED.rol, permisos = EXCLUDED.permisos;

INSERT INTO user_profiles (user_id, nombre, email, rol, permisos)
VALUES (
  gen_random_uuid(),
  'Pedro Oyarzún',
  'pedro.oyarzun@empresa.com',
  'operador',
  '{"redes": {"view": true, "editProyectado": false, "editRealizado": true}, "fondeo": {"view": true, "editProyectado": false, "editRealizado": false}, "rental": {"view": true, "editProyectado": false, "editRealizado": false}, "habitabilidad": {"view": true, "editProyectado": false, "editRealizado": false}, "sso": {"view": true, "editProyectado": false, "editRealizado": false}, "ingenieria": {"view": true, "editProyectado": false, "editRealizado": false}, "resumen": {"view": true, "editProyectado": true, "editRealizado": true}, "informe": {"view": true, "editProyectado": true, "editRealizado": true}, "flota": {"view": true, "editProyectado": true, "editRealizado": true}}'::jsonb
) ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, rol = EXCLUDED.rol, permisos = EXCLUDED.permisos;

-- Actualizar RLS para permitir lectura pública de user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Allow public read of user_profiles" ON user_profiles FOR SELECT USING (true);