-- Update modeles_courriers to use foreign keys instead of enums
-- First add the new foreign key columns
ALTER TABLE public.modeles_courriers 
ADD COLUMN type_sinistre_id UUID,
ADD COLUMN type_courrier_id UUID;

-- Update existing data to reference the new tables
UPDATE public.modeles_courriers 
SET type_sinistre_id = (
  SELECT id FROM public.types_sinistres 
  WHERE code = modeles_courriers.type_sinistre::text
);

UPDATE public.modeles_courriers 
SET type_courrier_id = (
  SELECT id FROM public.types_courriers 
  WHERE code = modeles_courriers.type_courrier::text
);

-- Add foreign key constraints
ALTER TABLE public.modeles_courriers 
ADD CONSTRAINT fk_modeles_type_sinistre 
FOREIGN KEY (type_sinistre_id) REFERENCES public.types_sinistres(id);

ALTER TABLE public.modeles_courriers 
ADD CONSTRAINT fk_modeles_type_courrier 
FOREIGN KEY (type_courrier_id) REFERENCES public.types_courriers(id);

-- Make the new columns not null after data migration
ALTER TABLE public.modeles_courriers 
ALTER COLUMN type_sinistre_id SET NOT NULL,
ALTER COLUMN type_courrier_id SET NOT NULL;

-- Drop the old enum columns
ALTER TABLE public.modeles_courriers 
DROP COLUMN type_sinistre,
DROP COLUMN type_courrier;

-- Update courriers_projets to use string instead of enum
-- First add a new column
ALTER TABLE public.courriers_projets 
ADD COLUMN type_courrier_code VARCHAR(50);

-- Migrate existing data
UPDATE public.courriers_projets 
SET type_courrier_code = type_courrier::text;

-- Make the new column not null
ALTER TABLE public.courriers_projets 
ALTER COLUMN type_courrier_code SET NOT NULL;

-- Drop the old enum column
ALTER TABLE public.courriers_projets 
DROP COLUMN type_courrier;

-- Rename the new column
ALTER TABLE public.courriers_projets 
RENAME COLUMN type_courrier_code TO type_courrier;