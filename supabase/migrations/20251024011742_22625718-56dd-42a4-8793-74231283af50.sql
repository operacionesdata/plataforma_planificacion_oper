-- Ensure required columns exist for consistent metrics between preview and production
-- Adds centro_instances and shared_fines JSONB columns and an updated_at column + trigger

-- 1) Add missing columns if they don't exist
ALTER TABLE public.gantt_calendars
  ADD COLUMN IF NOT EXISTS centro_instances jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS shared_fines jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2) Create trigger to keep updated_at in sync on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_gantt_calendars_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_gantt_calendars_updated_at
    BEFORE UPDATE ON public.gantt_calendars
    FOR EACH ROW
    EXECUTE FUNCTION public.update_gantt_calendars_updated_at();
  END IF;
END $$;