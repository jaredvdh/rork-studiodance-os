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
          billing_frequency: string | null
          included_label: string | null
          name: string
          price_cents: number | null
          pricing_mode: string | null
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
          billing_frequency?: string | null
          included_label?: string | null
          name: string
          price_cents?: number | null
          pricing_mode?: string | null
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
          billing_frequency?: string | null
          included_label?: string | null
          name?: string
          price_cents?: number | null
          pricing_mode?: string | null
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
      waiver_templates: {
        Row: {
          applies_to: Json | null
          created_at: string
          current_version_id: string | null
          description: string | null
          id: string
          renewal_period: string
          required: boolean
          status: string
          studio_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          applies_to?: Json | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          id?: string
          renewal_period?: string
          required?: boolean
          status?: string
          studio_id: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          applies_to?: Json | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          id?: string
          renewal_period?: string
          required?: boolean
          status?: string
          studio_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      waiver_versions: {
        Row: {
          archived_at: string | null
          body_html: string | null
          body_markdown: string | null
          created_at: string
          created_by: string | null
          id: string
          published_at: string | null
          studio_id: string
          version_number: number
          waiver_template_id: string
        }
        Insert: {
          archived_at?: string | null
          body_html?: string | null
          body_markdown?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          studio_id: string
          version_number?: number
          waiver_template_id: string
        }
        Update: {
          archived_at?: string | null
          body_html?: string | null
          body_markdown?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          studio_id?: string
          version_number?: number
          waiver_template_id?: string
        }
        Relationships: []
      }
      waiver_signatures: {
        Row: {
          caregiver_id: string | null
          created_at: string
          e_sign_consent: boolean
          guardian_authority_confirmed: boolean
          id: string
          ip_address: string | null
          metadata: Json | null
          pdf_url: string | null
          signature_data: string | null
          signature_type: string
          signed_at: string
          signer_name: string
          signer_relationship: string | null
          status: string
          student_id: string | null
          studio_id: string
          user_agent: string | null
          waiver_template_id: string
          waiver_version_id: string
        }
        Insert: {
          caregiver_id?: string | null
          created_at?: string
          e_sign_consent?: boolean
          guardian_authority_confirmed?: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          signature_data?: string | null
          signature_type?: string
          signed_at?: string
          signer_name: string
          signer_relationship?: string | null
          status?: string
          student_id?: string | null
          studio_id: string
          user_agent?: string | null
          waiver_template_id: string
          waiver_version_id: string
        }
        Update: {
          caregiver_id?: string | null
          created_at?: string
          e_sign_consent?: boolean
          guardian_authority_confirmed?: boolean
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          signature_data?: string | null
          signature_type?: string
          signed_at?: string
          signer_name?: string
          signer_relationship?: string | null
          status?: string
          student_id?: string | null
          studio_id?: string
          user_agent?: string | null
          waiver_template_id?: string
          waiver_version_id?: string
        }
        Relationships: []
      }
      uploaded_documents: {
        Row: {
          class_id: string | null
          created_at: string
          document_type: string
          event_id: string | null
          expiry_date: string | null
          family_id: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          notes: string | null
          student_id: string | null
          studio_id: string
          title: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          visibility: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          document_type: string
          event_id?: string | null
          expiry_date?: string | null
          family_id?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          student_id?: string | null
          studio_id: string
          title: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          visibility?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          document_type?: string
          event_id?: string | null
          expiry_date?: string | null
          family_id?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          student_id?: string | null
          studio_id?: string
          title?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          visibility?: string
        }
        Relationships: []
      }
      costumes: {
        Row: {
          care_instructions: string | null
          category: string
          colour: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          markup_pct: number
          name: string
          retail_cost_cents: number | null
          season: string | null
          shipping_allocation_cents: number
          sizing_chart_pdf_url: string | null
          sku: string | null
          studio_id: string
          updated_at: string
          vendor: string | null
          vendor_pdf_url: string | null
          wholesale_cost_cents: number
        }
        Insert: {
          care_instructions?: string | null
          category?: string
          colour?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          markup_pct?: number
          name: string
          retail_cost_cents?: number | null
          season?: string | null
          shipping_allocation_cents?: number
          sizing_chart_pdf_url?: string | null
          sku?: string | null
          studio_id: string
          updated_at?: string
          vendor?: string | null
          vendor_pdf_url?: string | null
          wholesale_cost_cents?: number
        }
        Update: {
          care_instructions?: string | null
          category?: string
          colour?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          markup_pct?: number
          name?: string
          retail_cost_cents?: number | null
          season?: string | null
          shipping_allocation_cents?: number
          sizing_chart_pdf_url?: string | null
          sku?: string | null
          studio_id?: string
          updated_at?: string
          vendor?: string | null
          vendor_pdf_url?: string | null
          wholesale_cost_cents?: number
        }
        Relationships: []
      }
      costume_assignments: {
        Row: {
          assigned_count: number
          class_id: string | null
          costume_id: string
          created_at: string
          id: string
          recital_performance_id: string | null
          routine_name: string | null
          student_id: string | null
          studio_id: string
        }
        Insert: {
          assigned_count?: number
          class_id?: string | null
          costume_id: string
          created_at?: string
          id?: string
          recital_performance_id?: string | null
          routine_name?: string | null
          student_id?: string | null
          studio_id: string
        }
        Update: {
          assigned_count?: number
          class_id?: string | null
          costume_id?: string
          created_at?: string
          id?: string
          recital_performance_id?: string | null
          routine_name?: string | null
          student_id?: string | null
          studio_id?: string
        }
        Relationships: []
      }
      student_measurements: {
        Row: {
          chest_cm: number | null
          created_at: string
          girth_cm: number | null
          height_cm: number | null
          hips_cm: number | null
          id: string
          inseam_cm: number | null
          measured_at: string | null
          measured_by: string | null
          notes: string | null
          shoe_size: string | null
          status: string
          student_id: string
          studio_id: string
          submitted_by: string | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          chest_cm?: number | null
          created_at?: string
          girth_cm?: number | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          inseam_cm?: number | null
          measured_at?: string | null
          measured_by?: string | null
          notes?: string | null
          shoe_size?: string | null
          status?: string
          student_id: string
          studio_id: string
          submitted_by?: string | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          chest_cm?: number | null
          created_at?: string
          girth_cm?: number | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          inseam_cm?: number | null
          measured_at?: string | null
          measured_by?: string | null
          notes?: string | null
          shoe_size?: string | null
          status?: string
          student_id?: string
          studio_id?: string
          submitted_by?: string | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      sizing_charts: {
        Row: {
          chart_data: Json
          chart_name: string
          costume_id: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          studio_id: string
          vendor: string
        }
        Insert: {
          chart_data?: Json
          chart_name: string
          costume_id?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          studio_id: string
          vendor: string
        }
        Update: {
          chart_data?: Json
          chart_name?: string
          costume_id?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          studio_id?: string
          vendor?: string
        }
        Relationships: []
      }
      size_recommendations: {
        Row: {
          alternative_size: string | null
          approved_at: string | null
          approved_by: string | null
          confidence_pct: number | null
          costume_id: string
          created_at: string
          flags: string[] | null
          id: string
          parent_approved: boolean
          parent_notes: string | null
          reason: string | null
          recommended_size: string | null
          sizing_chart_id: string | null
          student_id: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          alternative_size?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence_pct?: number | null
          costume_id: string
          created_at?: string
          flags?: string[] | null
          id?: string
          parent_approved?: boolean
          parent_notes?: string | null
          reason?: string | null
          recommended_size?: string | null
          sizing_chart_id?: string | null
          student_id: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          alternative_size?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence_pct?: number | null
          costume_id?: string
          created_at?: string
          flags?: string[] | null
          id?: string
          parent_approved?: boolean
          parent_notes?: string | null
          reason?: string | null
          recommended_size?: string | null
          sizing_chart_id?: string | null
          student_id?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      costume_fees: {
        Row: {
          costume_id: string
          created_at: string
          due_date: string | null
          fee_type: string
          id: string
          invoice_id: string | null
          paid_cents: number
          status: string
          student_id: string
          studio_id: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          costume_id: string
          created_at?: string
          due_date?: string | null
          fee_type?: string
          id?: string
          invoice_id?: string | null
          paid_cents?: number
          status?: string
          student_id: string
          studio_id: string
          total_cents: number
          updated_at?: string
        }
        Update: {
          costume_id?: string
          created_at?: string
          due_date?: string | null
          fee_type?: string
          id?: string
          invoice_id?: string | null
          paid_cents?: number
          status?: string
          student_id?: string
          studio_id?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      vendor_orders: {
        Row: {
          actual_delivery: string | null
          created_at: string
          expected_delivery: string | null
          id: string
          order_date: string | null
          po_number: string | null
          shipping_cost_cents: number
          status: string
          studio_id: string
          updated_at: string
          vendor: string
          vendor_notes: string | null
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          order_date?: string | null
          po_number?: string | null
          shipping_cost_cents?: number
          status?: string
          studio_id: string
          updated_at?: string
          vendor: string
          vendor_notes?: string | null
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          order_date?: string | null
          po_number?: string | null
          shipping_cost_cents?: number
          status?: string
          studio_id?: string
          updated_at?: string
          vendor?: string
          vendor_notes?: string | null
        }
        Relationships: []
      }
      vendor_order_items: {
        Row: {
          costume_id: string
          created_at: string
          id: string
          quantity: number
          size: string
          unit_cost_cents: number
          vendor_order_id: string
        }
        Insert: {
          costume_id: string
          created_at?: string
          id?: string
          quantity?: number
          size: string
          unit_cost_cents: number
          vendor_order_id: string
        }
        Update: {
          costume_id?: string
          created_at?: string
          id?: string
          quantity?: number
          size?: string
          unit_cost_cents?: number
          vendor_order_id?: string
        }
        Relationships: []
      }
      alterations: {
        Row: {
          alteration_type: string
          assigned_to: string | null
          costume_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          photos: string[] | null
          status: string
          student_id: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          alteration_type: string
          assigned_to?: string | null
          costume_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          status?: string
          student_id: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          alteration_type?: string
          assigned_to?: string | null
          costume_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          status?: string
          student_id?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      costume_distributions: {
        Row: {
          costume_id: string
          created_at: string
          distributed_by: string | null
          id: string
          items_checklist: Json
          missing_items: string[] | null
          notes: string | null
          receipt_pdf_url: string | null
          signature_data: string | null
          signed_at: string | null
          signed_by: string | null
          student_id: string
          studio_id: string
        }
        Insert: {
          costume_id: string
          created_at?: string
          distributed_by?: string | null
          id?: string
          items_checklist?: Json
          missing_items?: string[] | null
          notes?: string | null
          receipt_pdf_url?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          student_id: string
          studio_id: string
        }
        Update: {
          costume_id?: string
          created_at?: string
          distributed_by?: string | null
          id?: string
          items_checklist?: Json
          missing_items?: string[] | null
          notes?: string | null
          receipt_pdf_url?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          student_id?: string
          studio_id?: string
        }
        Relationships: []
      }
      reusable_costumes: {
        Row: {
          condition: string
          costume_id: string
          created_at: string
          id: string
          last_used: string | null
          notes: string | null
          purchase_date: string | null
          rack_number: string | null
          size: string
          status: string
          storage_bin: string | null
          studio_id: string
          updated_at: string
        }
        Insert: {
          condition?: string
          costume_id: string
          created_at?: string
          id?: string
          last_used?: string | null
          notes?: string | null
          purchase_date?: string | null
          rack_number?: string | null
          size: string
          status?: string
          storage_bin?: string | null
          studio_id: string
          updated_at?: string
        }
        Update: {
          condition?: string
          costume_id?: string
          created_at?: string
          id?: string
          last_used?: string | null
          notes?: string | null
          purchase_date?: string | null
          rack_number?: string | null
          size?: string
          status?: string
          storage_bin?: string | null
          studio_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      costume_rentals: {
        Row: {
          costume_id: string
          created_at: string
          damage_fee_cents: number | null
          deposit_cents: number
          id: string
          inventory_id: string | null
          notes: string | null
          rental_fee_cents: number
          return_date: string | null
          returned_at: string | null
          status: string
          student_id: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          costume_id: string
          created_at?: string
          damage_fee_cents?: number | null
          deposit_cents?: number
          id?: string
          inventory_id?: string | null
          notes?: string | null
          rental_fee_cents?: number
          return_date?: string | null
          returned_at?: string | null
          status?: string
          student_id: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          costume_id?: string
          created_at?: string
          damage_fee_cents?: number | null
          deposit_cents?: number
          id?: string
          inventory_id?: string | null
          notes?: string | null
          rental_fee_cents?: number
          return_date?: string | null
          returned_at?: string | null
          status?: string
          student_id?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quick_change_analyses: {
        Row: {
          conflict_detected: boolean
          created_at: string
          estimated_change_minutes: number | null
          id: string
          recital_event_id: string | null
          recommendation: string | null
          resolved: boolean
          routine_a: string | null
          routine_a_end_time: string | null
          routine_b: string | null
          routine_b_start_time: string | null
          student_id: string
          studio_id: string
        }
        Insert: {
          conflict_detected?: boolean
          created_at?: string
          estimated_change_minutes?: number | null
          id?: string
          recital_event_id?: string | null
          recommendation?: string | null
          resolved?: boolean
          routine_a?: string | null
          routine_a_end_time?: string | null
          routine_b?: string | null
          routine_b_start_time?: string | null
          student_id: string
          studio_id: string
        }
        Update: {
          conflict_detected?: boolean
          created_at?: string
          estimated_change_minutes?: number | null
          id?: string
          recital_event_id?: string | null
          recommendation?: string | null
          resolved?: boolean
          routine_a?: string | null
          routine_a_end_time?: string | null
          routine_b?: string | null
          routine_b_start_time?: string | null
          student_id?: string
          studio_id?: string
        }
        Relationships: []
      }
      caregiver_audit_log: {
        Row: {
          caregiver_id: string
          created_at: string
          details: string | null
          event: string
          id: string
          performed_by: string | null
          studio_id: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          details?: string | null
          event: string
          id?: string
          performed_by?: string | null
          studio_id: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          details?: string | null
          event?: string
          id?: string
          performed_by?: string | null
          studio_id?: string
        }
        Relationships: []
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
