/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string | null
          details: string | null
          event: string
          id: string
          studio_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          event: string
          id?: string
          studio_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          event?: string
          id?: string
          studio_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string | null
          body: string | null
          created_at: string | null
          id: string
          reach: number | null
          scope: string | null
          sent_at: string | null
          studio_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          audience?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          reach?: number | null
          scope?: string | null
          sent_at?: string | null
          studio_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          audience?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          reach?: number | null
          scope?: string | null
          sent_at?: string | null
          studio_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_group: string | null
          capacity: number | null
          created_at: string | null
          day: string | null
          duration_mins: number | null
          enrolled: number | null
          id: string
          in_recital: boolean | null
          name: string
          price_cents: number | null
          room: string | null
          start_time: string | null
          studio_id: string
          style: string
          teacher_id: string | null
          updated_at: string | null
          waitlist: number | null
        }
        Insert: {
          age_group?: string | null
          capacity?: number | null
          created_at?: string | null
          day?: string | null
          duration_mins?: number | null
          enrolled?: number | null
          id?: string
          in_recital?: boolean | null
          name: string
          price_cents?: number | null
          room?: string | null
          start_time?: string | null
          studio_id: string
          style: string
          teacher_id?: string | null
          updated_at?: string | null
          waitlist?: number | null
        }
        Update: {
          age_group?: string | null
          capacity?: number | null
          created_at?: string | null
          day?: string | null
          duration_mins?: number | null
          enrolled?: number | null
          id?: string
          in_recital?: boolean | null
          name?: string
          price_cents?: number | null
          room?: string | null
          start_time?: string | null
          studio_id?: string
          style?: string
          teacher_id?: string | null
          updated_at?: string | null
          waitlist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      enrolments: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          student_id: string
          studio_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          student_id: string
          studio_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          student_id?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrolments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      import_history: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          error_count: number | null
          errors: Json | null
          file_name: string | null
          file_type: string | null
          id: string
          imported_rows: number | null
          rolled_back: boolean | null
          skipped_rows: number | null
          snapshot: Json | null
          started_at: string | null
          studio_id: string
          total_rows: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          imported_rows?: number | null
          rolled_back?: boolean | null
          skipped_rows?: number | null
          snapshot?: Json | null
          started_at?: string | null
          studio_id: string
          total_rows?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          file_name?: string | null
          file_type?: string | null
          id?: string
          imported_rows?: number | null
          rolled_back?: boolean | null
          skipped_rows?: number | null
          snapshot?: Json | null
          started_at?: string | null
          studio_id?: string
          total_rows?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_history_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_name: string | null
          status: string | null
          student_name: string
          studio_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_name?: string | null
          status?: string | null
          student_name: string
          studio_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_name?: string | null
          status?: string | null
          student_name?: string
          studio_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          child_ids: string[] | null
          city: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          state: string | null
          studio_id: string
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          child_ids?: string[] | null
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          studio_id: string
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          child_ids?: string[] | null
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          studio_id?: string
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          studio_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          studio_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          studio_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recital_events: {
        Row: {
          costume_deadline: string | null
          created_at: string | null
          date: string | null
          id: string
          name: string
          studio_id: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          costume_deadline?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          name: string
          studio_id: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          costume_deadline?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          name?: string
          studio_id?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recital_events_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          allergies: string | null
          attendance_rate: number | null
          balance_cents: number | null
          class_ids: string[] | null
          created_at: string | null
          dob: string | null
          id: string
          medical_notes: string | null
          name: string
          parent_email: string | null
          parent_id: string | null
          parent_name: string | null
          payment: string | null
          studio_id: string
          updated_at: string | null
          waiver: string | null
        }
        Insert: {
          allergies?: string | null
          attendance_rate?: number | null
          balance_cents?: number | null
          class_ids?: string[] | null
          created_at?: string | null
          dob?: string | null
          id?: string
          medical_notes?: string | null
          name: string
          parent_email?: string | null
          parent_id?: string | null
          parent_name?: string | null
          payment?: string | null
          studio_id: string
          updated_at?: string | null
          waiver?: string | null
        }
        Update: {
          allergies?: string | null
          attendance_rate?: number | null
          balance_cents?: number | null
          class_ids?: string[] | null
          created_at?: string | null
          dob?: string | null
          id?: string
          medical_notes?: string | null
          name?: string
          parent_email?: string | null
          parent_id?: string | null
          parent_name?: string | null
          payment?: string | null
          studio_id?: string
          updated_at?: string | null
          waiver?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_settings: {
        Row: {
          created_at: string | null
          id: string
          settings: Json | null
          studio_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          studio_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          studio_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_settings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: true
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          brand_color: string | null
          city: string | null
          created_at: string | null
          id: string
          initials: string | null
          logo_url: string | null
          name: string
          owner_id: string
          tagline: string | null
          updated_at: string | null
          vertical: string | null
        }
        Insert: {
          brand_color?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          initials?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          tagline?: string | null
          updated_at?: string | null
          vertical?: string | null
        }
        Update: {
          brand_color?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          initials?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          tagline?: string | null
          updated_at?: string | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string | null
          email: string
          hourly_rate_cents: number | null
          id: string
          name: string
          pay_type: string | null
          studio_id: string
          styles: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          hourly_rate_cents?: number | null
          id?: string
          name: string
          pay_type?: string | null
          studio_id: string
          styles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          hourly_rate_cents?: number | null
          id?: string
          name?: string
          pay_type?: string | null
          studio_id?: string
          styles?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
