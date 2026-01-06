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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hr_manager" | "employee"
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
      app_role: ["admin", "hr_manager", "employee"],
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
