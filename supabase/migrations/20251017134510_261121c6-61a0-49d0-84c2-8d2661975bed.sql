-- Agregar columna barco_names a la tabla gantt_calendars para guardar los nombres editables de los recursos
ALTER TABLE gantt_calendars 
ADD COLUMN IF NOT EXISTS barco_names JSONB DEFAULT '{}'::jsonb;