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
      announcements: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          published_at: string | null
          target_campus_id: string | null
          target_program: string | null
          target_role: Database["public"]["Enums"]["app_role"] | null
          target_year: number | null
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_campus_id?: string | null
          target_program?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          target_year?: number | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_campus_id?: string | null
          target_program?: string | null
          target_role?: Database["public"]["Enums"]["app_role"] | null
          target_year?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_target_campus_id_fkey"
            columns: ["target_campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exam_schedules: {
        Row: {
          academic_year: string | null
          campus_id: string | null
          created_at: string | null
          end_time: string
          exam_date: string
          exam_type: string | null
          id: string
          instructions: string | null
          semester: number | null
          start_time: string
          unit_id: string | null
          venue: string
        }
        Insert: {
          academic_year?: string | null
          campus_id?: string | null
          created_at?: string | null
          end_time: string
          exam_date: string
          exam_type?: string | null
          id?: string
          instructions?: string | null
          semester?: number | null
          start_time: string
          unit_id?: string | null
          venue: string
        }
        Update: {
          academic_year?: string | null
          campus_id?: string | null
          created_at?: string | null
          end_time?: string
          exam_date?: string
          exam_type?: string | null
          id?: string
          instructions?: string | null
          semester?: number | null
          start_time?: string
          unit_id?: string | null
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          activity_fee: number | null
          created_at: string | null
          facility_fee: number | null
          id: string
          program: string
          semester: number | null
          total_fee: number
          tuition_fee: number
          year: number
        }
        Insert: {
          academic_year: string
          activity_fee?: number | null
          created_at?: string | null
          facility_fee?: number | null
          id?: string
          program: string
          semester?: number | null
          total_fee: number
          tuition_fee: number
          year: number
        }
        Update: {
          academic_year?: string
          activity_fee?: number | null
          created_at?: string | null
          facility_fee?: number | null
          id?: string
          program?: string
          semester?: number | null
          total_fee?: number
          tuition_fee?: number
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          preferred_campus_id: string | null
          program: string | null
          student_id: string | null
          updated_at: string | null
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          preferred_campus_id?: string | null
          program?: string | null
          student_id?: string | null
          updated_at?: string | null
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          preferred_campus_id?: string | null
          program?: string | null
          student_id?: string | null
          updated_at?: string | null
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_campus_id_fkey"
            columns: ["preferred_campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_status: {
        Row: {
          academic_year: string
          balance: number
          created_at: string | null
          id: string
          paid_amount: number | null
          payment_deadline: string | null
          semester: number
          status: string | null
          total_fee: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          academic_year: string
          balance: number
          created_at?: string | null
          id?: string
          paid_amount?: number | null
          payment_deadline?: string | null
          semester: number
          status?: string | null
          total_fee: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          academic_year?: string
          balance?: number
          created_at?: string | null
          id?: string
          paid_amount?: number | null
          payment_deadline?: string | null
          semester?: number
          status?: string | null
          total_fee?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          academic_year: string | null
          campus_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_online: boolean | null
          lecturer_name: string | null
          program: string | null
          room: string | null
          semester: number | null
          start_time: string
          unit_id: string | null
          year: number | null
        }
        Insert: {
          academic_year?: string | null
          campus_id?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_online?: boolean | null
          lecturer_name?: string | null
          program?: string | null
          room?: string | null
          semester?: number | null
          start_time: string
          unit_id?: string | null
          year?: number | null
        }
        Update: {
          academic_year?: string | null
          campus_id?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_online?: boolean | null
          lecturer_name?: string | null
          program?: string | null
          room?: string | null
          semester?: number | null
          start_time?: string
          unit_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          code: string
          created_at: string | null
          credits: number | null
          description: string | null
          id: string
          name: string
          program: string | null
          semester: number | null
          year: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          name: string
          program?: string | null
          semester?: number | null
          year?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          name?: string
          program?: string | null
          semester?: number | null
          year?: number | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          announcement_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "lecturer" | "admin"
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
      app_role: ["student", "lecturer", "admin"],
    },
  },
} as const
