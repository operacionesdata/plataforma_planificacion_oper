-- Tabla para guardar configuración de filtros de Flota LIS
CREATE TABLE public.flota_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key text NOT NULL UNIQUE,
    config_value jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.flota_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - acceso público para lectura y escritura
CREATE POLICY "Permitir lectura pública de flota_config"
ON public.flota_config FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción pública de flota_config"
ON public.flota_config FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de flota_config"
ON public.flota_config FOR UPDATE
USING (true);

-- Insertar registro inicial para el filtro de centros
INSERT INTO public.flota_config (config_key, config_value)
VALUES ('centros_filter', '[]'::jsonb);