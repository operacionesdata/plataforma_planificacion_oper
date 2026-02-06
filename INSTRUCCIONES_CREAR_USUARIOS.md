# 🔐 INSTRUCCIONES PARA CREAR USUARIOS EN SUPABASE

Este documento contiene las instrucciones paso a paso para crear los dos usuarios del sistema de gestión de operaciones acuícolas.

---

## 📋 TABLA RESUMEN DE USUARIOS Y PERMISOS

| Usuario | Email | Password | Rol | Redes (P/R) | Fondeo (P/R) | Rental (P/R) | Habitabilidad (P/R) | SSO (P/R) | Ingeniería (P/R) | Resumen | Informe | Flota |
|---------|-------|----------|-----|-------------|--------------|--------------|---------------------|-----------|------------------|---------|---------|-------|
| Cesar Mansilla | cesar.mansilla@empresa.com | inicio.20251 | admin | ✅/✅ | ✅/✅ | ✅/✅ | ✅/✅ | ✅/✅ | ✅/✅ | ✅ | ✅ | ✅ |
| Pedro Oyarzún | pedro.oyarzun@empresa.com | inicio.2025.2 | operador | ❌/✅ | ❌/❌ | ❌/❌ | ❌/❌ | ❌/❌ | ❌/❌ | ✅ | ✅ | ✅ |

**Leyenda**: P = Proyectado, R = Realizado

---

## 📝 PASO 1: Crear Usuarios en Supabase Dashboard

### 1.1 Acceder al Dashboard
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/ayfjrkjwbljkecqfsrxd/auth/users)
2. En el menú lateral, selecciona **Authentication** → **Users**

### 1.2 Crear Usuario 1: Cesar Mansilla (Admin)

1. Haz clic en el botón **"Add User"** → **"Create a new user"**
2. Completa los campos:
   - **Email**: `cesar.mansilla@empresa.com`
   - **Password**: `inicio.20251`
   - ✅ Marca la casilla **"Auto Confirm User"** (importante para evitar verificación de email)
3. Haz clic en **"Create User"**
4. ⚠️ **IMPORTANTE**: Una vez creado, **COPIA el User UID** que aparece (es un UUID como `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 1.3 Crear Usuario 2: Pedro Oyarzún (Operador)

1. Haz clic nuevamente en **"Add User"** → **"Create a new user"**
2. Completa los campos:
   - **Email**: `pedro.oyarzun@empresa.com`
   - **Password**: `inicio.2025.2`
   - ✅ Marca la casilla **"Auto Confirm User"**
3. Haz clic en **"Create User"**
4. ⚠️ **IMPORTANTE**: **COPIA el User UID** que aparece

---

## 📝 PASO 2: Crear Perfiles con Permisos

### 2.1 Acceder al SQL Editor
1. En el menú lateral de Supabase, selecciona **SQL Editor**
2. Haz clic en **"New Query"**

### 2.2 Ejecutar el siguiente SQL

**⚠️ ANTES DE EJECUTAR**: Reemplaza `UUID_DE_CESAR` y `UUID_DE_PEDRO` con los UIDs reales que copiaste en el paso anterior.

```sql
-- ============================================
-- INSERTAR PERFILES EN user_profiles
-- ============================================
-- Ejecutar en: https://supabase.com/dashboard/project/ayfjrkjwbljkecqfsrxd/sql/new

-- IMPORTANTE: Reemplaza los UUIDs antes de ejecutar

-- Perfil 1: Cesar Mansilla (Admin - Acceso Total)
INSERT INTO public.user_profiles (
  user_id, 
  nombre, 
  email, 
  rol, 
  permisos
) VALUES (
  'UUID_DE_CESAR',  -- ⚠️ REEMPLAZAR con el UID del usuario cesar.mansilla
  'Cesar Mansilla',
  'cesar.mansilla@empresa.com',
  'admin',
  '{
    "redes": {"view": true, "editProyectado": true, "editRealizado": true},
    "fondeo": {"view": true, "editProyectado": true, "editRealizado": true},
    "rental": {"view": true, "editProyectado": true, "editRealizado": true},
    "habitabilidad": {"view": true, "editProyectado": true, "editRealizado": true},
    "sso": {"view": true, "editProyectado": true, "editRealizado": true},
    "ingenieria": {"view": true, "editProyectado": true, "editRealizado": true},
    "resumen": {"view": true, "editProyectado": true, "editRealizado": true},
    "informe": {"view": true, "editProyectado": true, "editRealizado": true},
    "flota": {"view": true, "editProyectado": true, "editRealizado": true}
  }'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  permisos = EXCLUDED.permisos,
  updated_at = NOW();

-- Perfil 2: Pedro Oyarzún (Operador - Permisos Limitados)
INSERT INTO public.user_profiles (
  user_id, 
  nombre, 
  email, 
  rol, 
  permisos
) VALUES (
  'UUID_DE_PEDRO',  -- ⚠️ REEMPLAZAR con el UID del usuario pedro.oyarzun
  'Pedro Oyarzún',
  'pedro.oyarzun@empresa.com',
  'operador',
  '{
    "redes": {"view": true, "editProyectado": false, "editRealizado": true},
    "fondeo": {"view": true, "editProyectado": false, "editRealizado": false},
    "rental": {"view": true, "editProyectado": false, "editRealizado": false},
    "habitabilidad": {"view": true, "editProyectado": false, "editRealizado": false},
    "sso": {"view": true, "editProyectado": false, "editRealizado": false},
    "ingenieria": {"view": true, "editProyectado": false, "editRealizado": false},
    "resumen": {"view": true, "editProyectado": true, "editRealizado": true},
    "informe": {"view": true, "editProyectado": true, "editRealizado": true},
    "flota": {"view": true, "editProyectado": true, "editRealizado": true}
  }'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  rol = EXCLUDED.rol,
  permisos = EXCLUDED.permisos,
  updated_at = NOW();
```

3. Haz clic en **"Run"** para ejecutar el SQL

---

## 📝 PASO 3: Verificar la Creación

Ejecuta este SQL para verificar que todo se creó correctamente:

```sql
-- ============================================
-- VERIFICACIÓN DE USUARIOS Y PERFILES
-- ============================================

-- Ver usuarios en auth.users
SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at,
  CASE WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado' ELSE '❌ Sin confirmar' END as estado
FROM auth.users 
WHERE email IN ('cesar.mansilla@empresa.com', 'pedro.oyarzun@empresa.com')
ORDER BY email;

-- Ver perfiles creados con permisos
SELECT 
  p.id,
  p.user_id,
  p.nombre,
  p.email,
  p.rol,
  p.permisos->>'redes' as permisos_redes,
  p.permisos->>'fondeo' as permisos_fondeo,
  p.created_at
FROM public.user_profiles p
WHERE p.email IN ('cesar.mansilla@empresa.com', 'pedro.oyarzun@empresa.com')
ORDER BY p.email;

-- Verificar función is_admin
SELECT 
  p.nombre,
  p.rol,
  public.is_admin(p.user_id) as es_admin
FROM public.user_profiles p
WHERE p.email IN ('cesar.mansilla@empresa.com', 'pedro.oyarzun@empresa.com');
```

---

## ✅ RESULTADO ESPERADO

Después de completar estos pasos, deberías ver:

### En Authentication → Users:
- ✅ `cesar.mansilla@empresa.com` (confirmado)
- ✅ `pedro.oyarzun@empresa.com` (confirmado)

### En la tabla user_profiles:
- ✅ Cesar Mansilla con rol `admin` y todos los permisos
- ✅ Pedro Oyarzún con rol `operador` y permisos limitados

### Al hacer login en la aplicación:
- ✅ Cesar puede editar Proyectado y Realizado en TODAS las pestañas
- ✅ Pedro solo puede editar Realizado en Redes, y tiene acceso completo a Resumen/Informe/Flota

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "duplicate key value violates unique constraint"
El perfil ya existe. Ejecuta primero:
```sql
DELETE FROM public.user_profiles WHERE email IN ('cesar.mansilla@empresa.com', 'pedro.oyarzun@empresa.com');
```
Luego vuelve a ejecutar el INSERT.

### Error: "new row violates row-level security policy"
Asegúrate de estar ejecutando el SQL como el usuario propietario del proyecto (service_role). En el SQL Editor de Supabase Dashboard esto debería funcionar automáticamente.

### El usuario no puede hacer login
1. Verifica que el email esté confirmado en Authentication → Users
2. Si no está confirmado, haz clic en el usuario → "..." → "Confirm email"

### Los permisos no se aplican correctamente
1. Verifica que el `user_id` en `user_profiles` coincida exactamente con el `id` en `auth.users`
2. Ejecuta la consulta de verificación para confirmar los datos

---

## 📞 ENLACES ÚTILES

- [Supabase Users](https://supabase.com/dashboard/project/ayfjrkjwbljkecqfsrxd/auth/users)
- [SQL Editor](https://supabase.com/dashboard/project/ayfjrkjwbljkecqfsrxd/sql/new)
- [Table Editor - user_profiles](https://supabase.com/dashboard/project/ayfjrkjwbljkecqfsrxd/editor)
