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
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
          caregiver_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          enrolment_id: string | null
          id: string
          paid_at: string | null
          parent_email: string | null
          parent_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          student_name: string
          studio_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          caregiver_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          enrolment_id?: string | null
          id?: string
          paid_at?: string | null
          parent_email?: string | null
          parent_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          student_name: string
          studio_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          caregiver_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          enrolment_id?: string | null
          id?: string
          paid_at?: string | null
          parent_email?: string | null
          parent_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
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
      caregivers: {
        Row: {
          accepted_at: string | null
          address: string | null
          authorized_pickup: boolean | null
          can_manage_enrolments: boolean | null
          can_pay_invoices: boolean | null
          can_sign_waivers: boolean | null
          can_view_billing: boolean | null
          can_view_medical_notes: boolean | null
          can_view_schedule: boolean | null
          child_ids: string[] | null
          city: string | null
          communication_only: boolean | null
          court_order_on_file: boolean | null
          created_at: string | null
          custody_restriction: boolean | null
          email: string
          emergency_contact: boolean | null
          first_name: string | null
          household_label: string | null
          id: string
          invited_at: string | null
          is_authorized_pickup: boolean | null
          is_billing_contact: boolean | null
          is_primary_contact: boolean | null
          last_name: string | null
          name: string
          phone: string | null
          receives_announcements: boolean | null
          receives_emergency_messages: boolean | null
          relationship_to_student: string | null
          role: string
          state: string | null
          status: string
          stripe_customer_id: string | null
          structured_address: Json | null
          studio_id: string
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          accepted_at?: string | null
          address?: string | null
          authorized_pickup?: boolean | null
          can_manage_enrolments?: boolean | null
          can_pay_invoices?: boolean | null
          can_sign_waivers?: boolean | null
          can_view_billing?: boolean | null
          can_view_medical_notes?: boolean | null
          can_view_schedule?: boolean | null
          child_ids?: string[] | null
          city?: string | null
          communication_only?: boolean | null
          court_order_on_file?: boolean | null
          created_at?: string | null
          custody_restriction?: boolean | null
          email: string
          emergency_contact?: boolean | null
          first_name?: string | null
          household_label?: string | null
          id?: string
          invited_at?: string | null
          is_authorized_pickup?: boolean | null
          is_billing_contact?: boolean | null
          is_primary_contact?: boolean | null
          last_name?: string | null
          name: string
          phone?: string | null
          receives_announcements?: boolean | null
          receives_emergency_messages?: boolean | null
          relationship_to_student?: string | null
          role?: string
          state?: string | null
          status?: string
          stripe_customer_id?: string | null
          structured_address?: Json | null
          studio_id: string
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          accepted_at?: string | null
          address?: string | null
          authorized_pickup?: boolean | null
          can_manage_enrolments?: boolean | null
          can_pay_invoices?: boolean | null
          can_sign_waivers?: boolean | null
          can_view_billing?: boolean | null
          can_view_medical_notes?: boolean | null
          can_view_schedule?: boolean | null
          child_ids?: string[] | null
          city?: string | null
          communication_only?: boolean | null
          court_order_on_file?: boolean | null
          created_at?: string | null
          custody_restriction?: boolean | null
          email?: string
          emergency_contact?: boolean | null
          first_name?: string | null
          household_label?: string | null
          id?: string
          invited_at?: string | null
          is_authorized_pickup?: boolean | null
          is_billing_contact?: boolean | null
          is_primary_contact?: boolean | null
          last_name?: string | null
          name?: string
          phone?: string | null
          receives_announcements?: boolean | null
          receives_emergency_messages?: boolean | null
          relationship_to_student?: string | null
          role?: string
          state?: string | null
          status?: string
          stripe_customer_id?: string | null
          structured_address?: Json | null
          studio_id?: string
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caregivers_studio_id_fkey"
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
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
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
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
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
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
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
          caregiver_email: string | null
          caregiver_id: string | null
          caregiver_name: string | null
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
            foreignKeyName: "students_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "caregivers"
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
          banner_url: string | null
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
          banner_url?: string | null
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
          banner_url?: string | null
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
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          end_time: string | null
          id: string
          marked_by: string | null
          notes: string | null
          session_date: string
          start_time: string | null
          studio_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          marked_by?: string | null
          notes?: string | null
          session_date: string
          start_time?: string | null
          studio_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          marked_by?: string | null
          notes?: string | null
          session_date?: string
          start_time?: string | null
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          id: string
          marked_by: string | null
          notes: string | null
          session_id: string
          status: string
          student_id: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          session_id: string
          status?: string
          student_id: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          session_id?: string
          status?: string
          student_id?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      recital_performances: {
        Row: {
          class_ids: string[]
          costume_note: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          "order": number
          recital_event_id: string | null
          start_time: string | null
          studio_id: string
          updated_at: string
        }
        Insert: {
          class_ids?: string[]
          costume_note?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          "order"?: number
          recital_event_id?: string | null
          start_time?: string | null
          studio_id: string
          updated_at?: string
        }
        Update: {
          class_ids?: string[]
          costume_note?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          "order"?: number
          recital_event_id?: string | null
          start_time?: string | null
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recital_performances_recital_event_id_fkey"
            columns: ["recital_event_id"]
            isOneToOne: false
            referencedRelation: "recital_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recital_performances_studio_id_fkey"
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
