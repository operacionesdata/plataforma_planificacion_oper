export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      area_tareas: {
        Row: {
          area: string
          centro_id: number
          comentario: string | null
          created_at: string
          id: string
          nombre_tarea: string
          updated_at: string
        }
        Insert: {
          area: string
          centro_id: number
          comentario?: string | null
          created_at?: string
          id?: string
          nombre_tarea: string
          updated_at?: string
        }
        Update: {
          area?: string
          centro_id?: number
          comentario?: string | null
          created_at?: string
          id?: string
          nombre_tarea?: string
          updated_at?: string
        }
        Relationships: []
      }
      centro_fechas_siembra: {
        Row: {
          centro_id: number
          centro_nombre: string
          created_at: string
          fecha_siembra: string
          id: string
          updated_at: string
        }
        Insert: {
          centro_id: number
          centro_nombre: string
          created_at?: string
          fecha_siembra: string
          id?: string
          updated_at?: string
        }
        Update: {
          centro_id?: number
          centro_nombre?: string
          created_at?: string
          fecha_siembra?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      centro_materiales: {
        Row: {
          almacen: string | null
          cantidad: number | null
          centro: string
          codigo_material: string | null
          created_at: string
          en_traslado: boolean
          gcp: string | null
          grupo_articulos: string | null
          id: string
          material: string
          orgc: string | null
          p: string | null
          pedido: boolean
          recepcionado: boolean
          solicitante: string | null
          um: string | null
          updated_at: string
        }
        Insert: {
          almacen?: string | null
          cantidad?: number | null
          centro: string
          codigo_material?: string | null
          created_at?: string
          en_traslado?: boolean
          gcp?: string | null
          grupo_articulos?: string | null
          id?: string
          material: string
          orgc?: string | null
          p?: string | null
          pedido?: boolean
          recepcionado?: boolean
          solicitante?: string | null
          um?: string | null
          updated_at?: string
        }
        Update: {
          almacen?: string | null
          cantidad?: number | null
          centro?: string
          codigo_material?: string | null
          created_at?: string
          en_traslado?: boolean
          gcp?: string | null
          grupo_articulos?: string | null
          id?: string
          material?: string
          orgc?: string | null
          p?: string | null
          pedido?: boolean
          recepcionado?: boolean
          solicitante?: string | null
          um?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fecha: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      flota_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      gantt_calendars: {
        Row: {
          barco_names: Json | null
          cell_data: Json
          centro_instances: Json
          centro_names: Json
          created_at: string | null
          id: string
          selected_centros: number[]
          shared_fines: Json
          sheet_name: string
          updated_at: string | null
        }
        Insert: {
          barco_names?: Json | null
          cell_data?: Json
          centro_instances?: Json
          centro_names?: Json
          created_at?: string | null
          id?: string
          selected_centros?: number[]
          shared_fines?: Json
          sheet_name: string
          updated_at?: string | null
        }
        Update: {
          barco_names?: Json | null
          cell_data?: Json
          centro_instances?: Json
          centro_names?: Json
          created_at?: string | null
          id?: string
          selected_centros?: number[]
          shared_fines?: Json
          sheet_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lis_programaciones: {
        Row: {
          centro: string
          created_at: string
          embarcacion: string
          fecha_inicio: string
          fecha_termino: string
          id: string
          updated_at: string
        }
        Insert: {
          centro: string
          created_at?: string
          embarcacion: string
          fecha_inicio: string
          fecha_termino: string
          id?: string
          updated_at?: string
        }
        Update: {
          centro?: string
          created_at?: string
          embarcacion?: string
          fecha_inicio?: string
          fecha_termino?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      redes_programaciones: {
        Row: {
          centro: string
          created_at: string
          embarcacion: string
          fecha_inicio: string
          fecha_termino: string
          id: string
          updated_at: string
        }
        Insert: {
          centro: string
          created_at?: string
          embarcacion: string
          fecha_inicio: string
          fecha_termino: string
          id?: string
          updated_at?: string
        }
        Update: {
          centro?: string
          created_at?: string
          embarcacion?: string
          fecha_inicio?: string
          fecha_termino?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          clave: string | null
          created_at: string | null
          email: string
          id: string
          nombre: string
          permisos: Json
          rol: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
          usuario: string | null
        }
        Insert: {
          clave?: string | null
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          permisos?: Json
          rol?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
          usuario?: string | null
        }
        Update: {
          clave?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          permisos?: Json
          rol?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
          usuario?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "coordinador" | "operador" | "visualizador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "coordinador", "operador", "visualizador"],
    },
  },
} as const
