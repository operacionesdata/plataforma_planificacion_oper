import { supabase } from '@/integrations/supabase/client';

export interface GanttData {
  cellData: { [key: string]: string };
  centroNames: { [key: number]: string };
  barcoNames?: { [key: string]: string };
  selectedCentros: number[];
  centroInstances?: { [key: number]: number };
  timestamp: string;
  sharedFines?: { [key: string]: boolean };
  activityDurations?: { [key: string]: number };
  activityPercentages?: { [key: string]: number };
  ganttRowGroups?: any[];
  globalComment?: string;
  weekComments?: { [key: string]: any };
}

/**
 * Guarda datos en Supabase
 */
export const saveToSupabase = async (
  sheetName: string,
  data: GanttData
): Promise<{ success: boolean; message?: string }> => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('gantt_calendars')
      .select('id')
      .eq('sheet_name', sheetName)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking existing data:', fetchError);
      return { success: false, message: `Error al verificar datos: ${fetchError.message}` };
    }

    if (existing) {
      // Actualizar registro existente
      const updateData: any = {
        cell_data: data.cellData,
        centro_names: data.centroNames,
        barco_names: data.barcoNames || {},
        selected_centros: data.selectedCentros,
        centro_instances: data.centroInstances || {},
        shared_fines: data.sharedFines || {},
      };
      
      if (data.globalComment !== undefined) {
        updateData.centro_instances = {
          ...updateData.centro_instances,
          globalComment: data.globalComment
        };
      }
      
      if (data.activityDurations) {
        updateData.centro_instances = { 
          ...updateData.centro_instances, 
          activityDurations: data.activityDurations 
        };
      }
      if (data.activityPercentages) {
        updateData.centro_instances = { 
          ...updateData.centro_instances, 
          activityPercentages: data.activityPercentages 
        };
      }
      
      // Guardar ganttRowGroups en centro_instances
      if (data.ganttRowGroups) {
        updateData.centro_instances = { 
          ...updateData.centro_instances, 
          ganttRowGroups: data.ganttRowGroups 
        };
      }
      
      // Guardar weekComments en centro_instances
      if (data.weekComments) {
        updateData.centro_instances = { 
          ...updateData.centro_instances, 
          weekComments: data.weekComments 
        };
      }

      const { error: updateError } = await supabase
        .from('gantt_calendars')
        .update(updateData)
        .eq('sheet_name', sheetName);

      if (updateError) {
        console.error('Error updating data:', updateError);
        return { success: false, message: `Error al actualizar: ${updateError.message}` };
      }
    } else {
      // Insertar nuevo registro
      const insertData: any = {
        sheet_name: sheetName,
        cell_data: data.cellData,
        centro_names: data.centroNames,
        barco_names: data.barcoNames || {},
        selected_centros: data.selectedCentros,
        centro_instances: data.centroInstances || {},
        shared_fines: data.sharedFines || {},
      };
      
      if (data.globalComment !== undefined) {
        insertData.centro_instances = {
          ...insertData.centro_instances,
          globalComment: data.globalComment
        };
      }

      if (data.activityDurations) {
        insertData.centro_instances = { 
          ...insertData.centro_instances, 
          activityDurations: data.activityDurations 
        };
      }
      if (data.activityPercentages) {
        insertData.centro_instances = { 
          ...insertData.centro_instances, 
          activityPercentages: data.activityPercentages 
        };
      }
      
      // Guardar ganttRowGroups en centro_instances
      if (data.ganttRowGroups) {
        insertData.centro_instances = { 
          ...insertData.centro_instances, 
          ganttRowGroups: data.ganttRowGroups 
        };
      }
      
      // Guardar weekComments en centro_instances
      if (data.weekComments) {
        insertData.centro_instances = { 
          ...insertData.centro_instances, 
          weekComments: data.weekComments 
        };
      }

      const { error: insertError } = await supabase
        .from('gantt_calendars')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting data:', insertError);
        return { success: false, message: `Error al insertar: ${insertError.message}` };
      }
    }

    return { success: true, message: 'Datos guardados exitosamente en Supabase' };
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return { success: false, message: `Error al guardar: ${error}` };
  }
};

/**
 * Carga datos desde Supabase
 */
export const loadFromSupabase = async (
  sheetName: string
): Promise<{ success: boolean; data?: GanttData; message?: string }> => {
  try {
    const { data: result, error } = await supabase
      .from('gantt_calendars')
      .select('cell_data, centro_names, barco_names, selected_centros, centro_instances, shared_fines, created_at, updated_at')
      .eq('sheet_name', sheetName)
      .maybeSingle();

    if (error) {
      console.error('Error loading from Supabase:', error);
      return { 
        success: false, 
        message: `Error al cargar: ${error.message}` 
      };
    }
    
    if (result) {
      const centroInstances = (result.centro_instances as any) || {};
      return { 
        success: true, 
        data: {
          cellData: (result.cell_data as { [key: string]: string }) || {},
          centroNames: (result.centro_names as { [key: number]: string }) || {},
          barcoNames: (result.barco_names as { [key: string]: string }) || {},
          selectedCentros: result.selected_centros || [],
          centroInstances: centroInstances,
          timestamp: (result.updated_at || result.created_at) || new Date().toISOString(),
          sharedFines: (result.shared_fines as { [key: string]: boolean }) || {},
          activityDurations: centroInstances.activityDurations || undefined,
          activityPercentages: centroInstances.activityPercentages || undefined,
          globalComment: centroInstances.globalComment || undefined,
          ganttRowGroups: centroInstances.ganttRowGroups || undefined,
          weekComments: centroInstances.weekComments || undefined,
        },
        message: 'Datos cargados exitosamente desde Supabase' 
      };
    } else {
      return { 
        success: false, 
        message: 'No se encontraron datos' 
      };
    }
  } catch (error) {
    console.error('Error loading from Supabase:', error);
    return { 
      success: false, 
      message: `Error al cargar: ${error}` 
    };
  }
};

/**
 * Guarda en localStorage como respaldo
 */
export const saveToLocalStorage = (key: string, data: GanttData): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Carga desde localStorage como respaldo
 */
export const loadFromLocalStorage = (key: string): GanttData | null => {
  try {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Guarda fines compartidos en Supabase
 */
export const saveSharedFines = async (
  sharedFines: { [key: string]: boolean }
): Promise<{ success: boolean; message?: string }> => {
  return saveToSupabase('shared_fines', {
    cellData: {},
    centroNames: {},
    selectedCentros: [],
    timestamp: new Date().toISOString(),
    sharedFines
  });
};

/**
 * Carga fines compartidos desde Supabase
 */
export const loadSharedFines = async (): Promise<{ [key: string]: boolean }> => {
  const result = await loadFromSupabase('shared_fines');
  return result.data?.sharedFines || {};
};

/**
 * Limpia TODOS los datos de localStorage relacionados con los Gantt
 */
export const clearAllLocalStorage = (): void => {
  try {
    const keysToRemove = [
      'gantt-data',
      'gantt-rental-data',
      'gantt-habitabilidad-data',
      'gantt-sso-data',
      'gantt-ingenieria-data'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('localStorage limpiado completamente');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};
