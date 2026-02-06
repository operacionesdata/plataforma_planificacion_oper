-- Eliminar la tabla existente si hay conflictos
DROP TABLE IF EXISTS public.gantt_calendars CASCADE;

-- Crear tabla para almacenar datos de calendarios Gantt
CREATE TABLE public.gantt_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name TEXT NOT NULL UNIQUE,
  cell_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  centro_names JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_centros INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.gantt_calendars ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (ya que no hay autenticación implementada)
CREATE POLICY "Permitir lectura pública de calendarios Gantt"
  ON public.gantt_calendars
  FOR SELECT
  USING (true);

-- Política para permitir inserción pública
CREATE POLICY "Permitir inserción pública de calendarios Gantt"
  ON public.gantt_calendars
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir actualización pública
CREATE POLICY "Permitir actualización pública de calendarios Gantt"
  ON public.gantt_calendars
  FOR UPDATE
  USING (true);

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION public.update_gantt_calendars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Crear trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_gantt_calendars_updated_at_trigger
  BEFORE UPDATE ON public.gantt_calendars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gantt_calendars_updated_at();

-- Crear índice para búsquedas rápidas por sheet_name
CREATE INDEX idx_gantt_calendars_sheet_name ON public.gantt_calendars(sheet_name);