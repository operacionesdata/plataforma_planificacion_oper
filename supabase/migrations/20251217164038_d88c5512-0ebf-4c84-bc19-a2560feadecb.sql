-- Tabla para fechas de siembra por centro
CREATE TABLE public.centro_fechas_siembra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  centro_id INTEGER NOT NULL,
  centro_nombre TEXT NOT NULL,
  fecha_siembra DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(centro_id)
);

-- Tabla para programaciones LIS
CREATE TABLE public.lis_programaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  centro TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  embarcacion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.centro_fechas_siembra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lis_programaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura/escritura pública (similar a gantt_calendars)
CREATE POLICY "Permitir lectura pública de fechas siembra" 
ON public.centro_fechas_siembra 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción pública de fechas siembra" 
ON public.centro_fechas_siembra 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de fechas siembra" 
ON public.centro_fechas_siembra 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir lectura pública de programaciones LIS" 
ON public.lis_programaciones 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción pública de programaciones LIS" 
ON public.lis_programaciones 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de programaciones LIS" 
ON public.lis_programaciones 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir eliminación pública de programaciones LIS" 
ON public.lis_programaciones 
FOR DELETE 
USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_centro_fechas_siembra_updated_at
BEFORE UPDATE ON public.centro_fechas_siembra
FOR EACH ROW
EXECUTE FUNCTION public.update_gantt_calendars_updated_at();

CREATE TRIGGER update_lis_programaciones_updated_at
BEFORE UPDATE ON public.lis_programaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_gantt_calendars_updated_at();