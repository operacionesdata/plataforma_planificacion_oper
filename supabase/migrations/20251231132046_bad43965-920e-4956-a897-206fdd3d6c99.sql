-- Crear tabla para programaciones de Redes (similar a lis_programaciones)
CREATE TABLE public.redes_programaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  centro TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  embarcacion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.redes_programaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acceso público
CREATE POLICY "Permitir lectura pública de programaciones Redes"
ON public.redes_programaciones
FOR SELECT
USING (true);

CREATE POLICY "Permitir inserción pública de programaciones Redes"
ON public.redes_programaciones
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de programaciones Redes"
ON public.redes_programaciones
FOR UPDATE
USING (true);

CREATE POLICY "Permitir eliminación pública de programaciones Redes"
ON public.redes_programaciones
FOR DELETE
USING (true);

-- Agregar configuración para filtro de centros de Redes
INSERT INTO public.flota_config (config_key, config_value)
VALUES ('redes_centros_filter', '[]'::jsonb)
ON CONFLICT (config_key) DO NOTHING;