-- Create function for updated_at timestamps if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for materials per center
CREATE TABLE public.centro_materiales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  centro TEXT NOT NULL,
  material TEXT NOT NULL,
  pedido BOOLEAN NOT NULL DEFAULT false,
  en_traslado BOOLEAN NOT NULL DEFAULT false,
  recepcionado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.centro_materiales ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Permitir lectura pública de materiales centro" 
ON public.centro_materiales 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción pública de materiales centro" 
ON public.centro_materiales 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de materiales centro" 
ON public.centro_materiales 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir eliminación pública de materiales centro" 
ON public.centro_materiales 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_centro_materiales_updated_at
BEFORE UPDATE ON public.centro_materiales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_centro_materiales_centro ON public.centro_materiales(centro);