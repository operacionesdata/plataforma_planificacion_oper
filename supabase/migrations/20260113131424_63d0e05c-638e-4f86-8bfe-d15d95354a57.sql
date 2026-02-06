-- Crear tabla para tareas por área y centro
CREATE TABLE public.area_tareas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  centro_id INTEGER NOT NULL,
  area TEXT NOT NULL,
  nombre_tarea TEXT NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.area_tareas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir lectura pública de tareas" 
ON public.area_tareas 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción pública de tareas" 
ON public.area_tareas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de tareas" 
ON public.area_tareas 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir eliminación pública de tareas" 
ON public.area_tareas 
FOR DELETE 
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_area_tareas_updated_at
BEFORE UPDATE ON public.area_tareas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();