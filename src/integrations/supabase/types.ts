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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anonymization_config: {
        Row: {
          company_id: string
          created_at: string
          id: string
          max_deviation_percent: number
          min_group_size: number
          rounding_precision: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          max_deviation_percent?: number
          min_group_size?: number
          rounding_precision?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          max_deviation_percent?: number
          min_group_size?: number
          rounding_precision?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymization_config_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          company_id: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: Database["public"]["Enums"]["audit_entity"]
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_hash: string
          user_agent: string | null
          user_email: string
          user_id: string
          user_role: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: Database["public"]["Enums"]["audit_entity"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_hash?: string
          user_agent?: string | null
          user_email: string
          user_id: string
          user_role: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: Database["public"]["Enums"]["audit_entity"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_hash?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      auditor_access: {
        Row: {
          access_reason: string
          company_id: string
          created_at: string
          granted_by: string
          id: string
          is_revoked: boolean | null
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          access_reason: string
          company_id: string
          created_at?: string
          granted_by: string
          id?: string
          is_revoked?: boolean | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          access_reason?: string
          company_id?: string
          created_at?: string
          granted_by?: string
          id?: string
          is_revoked?: boolean | null
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditor_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          employee_count_range: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          legal_name: string | null
          name: string
          settings: Json | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          employee_count_range?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          name: string
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          employee_count_range?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          legal_name?: string | null
          name?: string
          settings?: Json | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      data_change_history: {
        Row: {
          action: string
          change_reason: string | null
          changed_at: string
          changed_by: string
          company_id: string
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_hash: string
          version_number: number | null
        }
        Insert: {
          action: string
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          company_id: string
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_hash?: string
          version_number?: number | null
        }
        Update: {
          action?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          company_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_hash?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_change_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_assignments: {
        Row: {
          assigned_by: string
          assignment_reason: string | null
          created_at: string
          effective_from: string
          effective_until: string | null
          employee_id: string
          id: string
          job_level_id: string
          job_profile_version_id: string
          notes: string | null
          pay_band_version_id: string
        }
        Insert: {
          assigned_by: string
          assignment_reason?: string | null
          created_at?: string
          effective_from: string
          effective_until?: string | null
          employee_id: string
          id?: string
          job_level_id: string
          job_profile_version_id: string
          notes?: string | null
          pay_band_version_id: string
        }
        Update: {
          assigned_by?: string
          assignment_reason?: string | null
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          employee_id?: string
          id?: string
          job_level_id?: string
          job_profile_version_id?: string
          notes?: string | null
          pay_band_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assignments_job_level_id_fkey"
            columns: ["job_level_id"]
            isOneToOne: false
            referencedRelation: "job_levels_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assignments_job_profile_version_id_fkey"
            columns: ["job_profile_version_id"]
            isOneToOne: false
            referencedRelation: "job_profile_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assignments_pay_band_version_id_fkey"
            columns: ["pay_band_version_id"]
            isOneToOne: false
            referencedRelation: "pay_band_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          birth_date: string | null
          company_id: string
          created_at: string
          created_by: string
          department: string | null
          email: string | null
          employee_number: string | null
          first_name: string
          gender: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          job_level: Database["public"]["Enums"]["job_level"] | null
          job_profile_id: string | null
          last_name: string
          location: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          company_id: string
          created_at?: string
          created_by: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          first_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_level?: Database["public"]["Enums"]["job_level"] | null
          job_profile_id?: string | null
          last_name: string
          location?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          first_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          job_level?: Database["public"]["Enums"]["job_level"] | null
          job_profile_id?: string | null
          last_name?: string
          location?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_job_profile_id_fkey"
            columns: ["job_profile_id"]
            isOneToOne: false
            referencedRelation: "job_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      info_requests: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string | null
          id: string
          notes: string | null
          processed_by: string | null
          request_date: string
          request_type: string
          requester_id: string
          response_data: Json | null
          response_date: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          request_date?: string
          request_type: string
          requester_id: string
          response_data?: Json | null
          response_date?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          request_date?: string
          request_type?: string
          requester_id?: string
          response_data?: Json | null
          response_date?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "info_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "info_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_families: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_families_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_levels_normalized: {
        Row: {
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_experience_years: number | null
          min_experience_years: number | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_experience_years?: number | null
          min_experience_years?: number | null
          name: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_experience_years?: number | null
          min_experience_years?: number | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_levels_normalized_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_profile_versions: {
        Row: {
          change_reason: string | null
          created_at: string
          created_by: string
          description: string | null
          education_level: string | null
          id: string
          job_profile_id: string
          min_experience_years: number | null
          required_qualifications: string | null
          responsibilities: string | null
          title: string
          valid_from: string
          valid_until: string | null
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          education_level?: string | null
          id?: string
          job_profile_id: string
          min_experience_years?: number | null
          required_qualifications?: string | null
          responsibilities?: string | null
          title: string
          valid_from?: string
          valid_until?: string | null
          version_number: number
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          education_level?: string | null
          id?: string
          job_profile_id?: string
          min_experience_years?: number | null
          required_qualifications?: string | null
          responsibilities?: string | null
          title?: string
          valid_from?: string
          valid_until?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_profile_versions_job_profile_id_fkey"
            columns: ["job_profile_id"]
            isOneToOne: false
            referencedRelation: "job_profiles_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      job_profiles: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          id: string
          is_active: boolean | null
          min_experience_years: number | null
          required_qualifications: string | null
          responsibilities: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          required_qualifications?: string | null
          responsibilities?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          is_active?: boolean | null
          min_experience_years?: number | null
          required_qualifications?: string | null
          responsibilities?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_profiles_normalized: {
        Row: {
          code: string
          company_id: string
          created_at: string
          current_version_id: string | null
          id: string
          is_active: boolean | null
          job_family_id: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_active?: boolean | null
          job_family_id?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_active?: boolean | null
          job_family_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "job_profile_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_profiles_normalized_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_profiles_normalized_job_family_id_fkey"
            columns: ["job_family_id"]
            isOneToOne: false
            referencedRelation: "job_families"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      pay_band_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_reason: string | null
          created_at: string
          created_by: string
          currency: string
          id: string
          max_annual: number
          min_annual: number
          pay_band_id: string
          reference_point: number | null
          valid_from: string
          valid_until: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          max_annual: number
          min_annual: number
          pay_band_id: string
          reference_point?: number | null
          valid_from: string
          valid_until?: string | null
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          max_annual?: number
          min_annual?: number
          pay_band_id?: string
          reference_point?: number | null
          valid_from?: string
          valid_until?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "pay_band_versions_pay_band_id_fkey"
            columns: ["pay_band_id"]
            isOneToOne: false
            referencedRelation: "pay_bands_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_bands: {
        Row: {
          created_at: string
          created_by: string
          currency: string | null
          id: string
          job_level: Database["public"]["Enums"]["job_level"]
          job_profile_id: string
          max_salary: number
          median_salary: number | null
          min_salary: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string | null
          id?: string
          job_level: Database["public"]["Enums"]["job_level"]
          job_profile_id: string
          max_salary: number
          median_salary?: number | null
          min_salary: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string | null
          id?: string
          job_level?: Database["public"]["Enums"]["job_level"]
          job_profile_id?: string
          max_salary?: number
          median_salary?: number | null
          min_salary?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pay_bands_job_profile_id_fkey"
            columns: ["job_profile_id"]
            isOneToOne: false
            referencedRelation: "job_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_bands_normalized: {
        Row: {
          company_id: string
          created_at: string
          current_version_id: string | null
          id: string
          is_active: boolean | null
          job_level_id: string
          job_profile_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_active?: boolean | null
          job_level_id: string
          job_profile_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_active?: boolean | null
          job_level_id?: string
          job_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pb_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "pay_band_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_bands_normalized_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_bands_normalized_job_level_id_fkey"
            columns: ["job_level_id"]
            isOneToOne: false
            referencedRelation: "job_levels_normalized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_bands_normalized_job_profile_id_fkey"
            columns: ["job_profile_id"]
            isOneToOne: false
            referencedRelation: "job_profiles_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_code: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_code: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_code?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["code"]
          },
        ]
      }
      salary_component_types: {
        Row: {
          category: string
          code: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_monetary: boolean | null
          is_recurring: boolean | null
          is_taxable: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_monetary?: boolean | null
          is_recurring?: boolean | null
          is_taxable?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_monetary?: boolean | null
          is_recurring?: boolean | null
          is_taxable?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_component_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_components: {
        Row: {
          component_name: string
          component_type: string
          created_at: string
          description: string | null
          id: string
          is_percentage: boolean | null
          max_value: number | null
          min_value: number | null
          pay_band_id: string
          updated_at: string
        }
        Insert: {
          component_name: string
          component_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_percentage?: boolean | null
          max_value?: number | null
          min_value?: number | null
          pay_band_id: string
          updated_at?: string
        }
        Update: {
          component_name?: string
          component_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_percentage?: boolean | null
          max_value?: number | null
          min_value?: number | null
          pay_band_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_components_pay_band_id_fkey"
            columns: ["pay_band_id"]
            isOneToOne: false
            referencedRelation: "pay_bands"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_components_normalized: {
        Row: {
          component_type_id: string
          conditions: string | null
          created_at: string
          frequency: string | null
          id: string
          is_percentage: boolean | null
          max_value: number | null
          min_value: number
          pay_band_version_id: string
          percentage_of: string | null
          typical_value: number | null
        }
        Insert: {
          component_type_id: string
          conditions?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          is_percentage?: boolean | null
          max_value?: number | null
          min_value?: number
          pay_band_version_id: string
          percentage_of?: string | null
          typical_value?: number | null
        }
        Update: {
          component_type_id?: string
          conditions?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          is_percentage?: boolean | null
          max_value?: number | null
          min_value?: number
          pay_band_version_id?: string
          percentage_of?: string | null
          typical_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_components_normalized_component_type_id_fkey"
            columns: ["component_type_id"]
            isOneToOne: false
            referencedRelation: "salary_component_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_components_normalized_pay_band_version_id_fkey"
            columns: ["pay_band_version_id"]
            isOneToOne: false
            referencedRelation: "pay_band_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_info: {
        Row: {
          base_salary_encrypted: string
          created_at: string
          created_by: string
          currency: string | null
          effective_date: string
          employee_id: string
          id: string
          salary_components: Json | null
          total_compensation_encrypted: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          base_salary_encrypted: string
          created_at?: string
          created_by: string
          currency?: string | null
          effective_date: string
          employee_id: string
          id?: string
          salary_components?: Json | null
          total_compensation_encrypted?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          base_salary_encrypted?: string
          created_at?: string
          created_by?: string
          currency?: string | null
          effective_date?: string
          employee_id?: string
          id?: string
          salary_components?: Json | null
          total_compensation_encrypted?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_info_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_configurations: {
        Row: {
          attribute_mapping: Json | null
          certificate_encrypted: string | null
          company_id: string
          created_at: string
          entity_id: string | null
          id: string
          is_enabled: boolean | null
          metadata_url: string | null
          provider: string
          sso_url: string | null
          updated_at: string
        }
        Insert: {
          attribute_mapping?: Json | null
          certificate_encrypted?: string | null
          company_id: string
          created_at?: string
          entity_id?: string | null
          id?: string
          is_enabled?: boolean | null
          metadata_url?: string | null
          provider: string
          sso_url?: string | null
          updated_at?: string
        }
        Update: {
          attribute_mapping?: Json | null
          certificate_encrypted?: string | null
          company_id?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          is_enabled?: boolean | null
          metadata_url?: string | null
          provider?: string
          sso_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes_encrypted: string | null
          created_at: string
          id: string
          last_verified_at: string | null
          mfa_enabled: boolean | null
          mfa_method: string | null
          phone_number_encrypted: string | null
          totp_secret_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes_encrypted?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          phone_number_encrypted?: string | null
          totp_secret_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes_encrypted?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          phone_number_encrypted?: string | null
          totp_secret_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string
          logout_reason: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string
          logout_reason?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string
          logout_reason?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_salary_deviations: {
        Args: { _threshold_percent?: number }
        Returns: {
          affected_count: number
          deviation_percent: number
          deviation_type: string
          is_critical: boolean
          job_level_id: string
          job_level_name: string
          job_profile_id: string
          job_profile_title: string
          recommendation: string
        }[]
      }
      calculate_gender_pay_gap: {
        Args: {
          _department?: string
          _job_level_id?: string
          _job_profile_id?: string
        }
        Returns: {
          category: string
          female_count: number
          female_median: number
          gap_percent: number
          is_reportable: boolean
          male_count: number
          male_median: number
          suppression_reason: string
        }[]
      }
      create_audit_log: {
        Args: {
          _action: Database["public"]["Enums"]["audit_action"]
          _company_id: string
          _entity_id?: string
          _entity_name?: string
          _entity_type: Database["public"]["Enums"]["audit_entity"]
          _metadata?: Json
          _new_values?: Json
          _old_values?: Json
        }
        Returns: string
      }
      create_job_profile_version: {
        Args: {
          _change_reason: string
          _description: string
          _education_level: string
          _job_profile_id: string
          _min_experience_years: number
          _required_qualifications: string
          _responsibilities: string
          _title: string
        }
        Returns: string
      }
      create_pay_band_version: {
        Args: {
          _change_reason: string
          _max_annual: number
          _min_annual: number
          _pay_band_id: string
          _reference_point: number
          _valid_from: string
        }
        Returns: string
      }
      generate_pay_equity_report: { Args: never; Returns: Json }
      get_department_statistics: {
        Args: never
        Returns: {
          avg_tenure_years: number
          department: string
          gender_distribution: Json
          is_suppressed: boolean
          total_employees: number
        }[]
      }
      get_employee_current_pay_band: {
        Args: { _employee_id: string }
        Returns: {
          currency: string
          job_level_name: string
          job_profile_title: string
          max_annual: number
          min_annual: number
          reference_point: number
        }[]
      }
      get_next_job_profile_version: {
        Args: { _job_profile_id: string }
        Returns: number
      }
      get_next_pay_band_version: {
        Args: { _pay_band_id: string }
        Returns: number
      }
      get_pay_band_statistics: {
        Args: { _pay_band_id: string }
        Returns: {
          employee_count: number
          gender_ratio: Json
          median_in_band: number
        }[]
      }
      get_safe_salary_statistics: {
        Args: { _job_level_id?: string; _job_profile_id: string }
        Returns: {
          group_size: number
          is_suppressed: boolean
          statistic_type: string
          suppression_reason: string
          value: number
        }[]
      }
      get_user_company_id: { Args: never; Returns: string }
      get_user_permissions: {
        Args: never
        Returns: {
          category: string
          permission_code: string
          permission_name: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_all_permissions: {
        Args: { _permission_codes: string[] }
        Returns: boolean
      }
      has_any_permission: {
        Args: { _permission_codes: string[] }
        Returns: boolean
      }
      has_permission: { Args: { _permission_code: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_login_attempt: {
        Args: {
          _email: string
          _failure_reason?: string
          _ip_address?: unknown
          _success: boolean
          _user_agent?: string
        }
        Returns: string
      }
      user_belongs_to_company: {
        Args: { _company_id: string }
        Returns: boolean
      }
      validate_session: { Args: never; Returns: boolean }
      verify_tenant_access: { Args: { _company_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "hr_manager" | "employee" | "legal" | "auditor"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "view"
        | "export"
        | "login"
        | "logout"
        | "request_info"
      audit_entity:
        | "job_profile"
        | "pay_band"
        | "salary_component"
        | "employee"
        | "salary_info"
        | "info_request"
        | "user"
        | "company"
        | "report"
      employment_type: "full_time" | "part_time" | "contract" | "intern"
      job_level: "junior" | "mid" | "senior" | "lead" | "principal" | "director"
      request_status: "pending" | "processing" | "completed" | "rejected"
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
      app_role: ["admin", "hr_manager", "employee", "legal", "auditor"],
      audit_action: [
        "create",
        "update",
        "delete",
        "view",
        "export",
        "login",
        "logout",
        "request_info",
      ],
      audit_entity: [
        "job_profile",
        "pay_band",
        "salary_component",
        "employee",
        "salary_info",
        "info_request",
        "user",
        "company",
        "report",
      ],
      employment_type: ["full_time", "part_time", "contract", "intern"],
      job_level: ["junior", "mid", "senior", "lead", "principal", "director"],
      request_status: ["pending", "processing", "completed", "rejected"],
    },
  },
} as const
