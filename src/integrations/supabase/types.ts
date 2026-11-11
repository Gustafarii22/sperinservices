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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number
          rates: Json
          retention_days: number
          updated_at: string
        }
        Insert: {
          id?: number
          rates?: Json
          retention_days?: number
          updated_at?: string
        }
        Update: {
          id?: number
          rates?: Json
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor: string
          at: string
          detail: Json
          id: number
          lead_id: string | null
        }
        Insert: {
          action: string
          actor: string
          at?: string
          detail?: Json
          id?: never
          lead_id?: string | null
        }
        Update: {
          action?: string
          actor?: string
          at?: string
          detail?: Json
          id?: never
          lead_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          category: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          estimate: Json
          id: string
          is_sample: boolean
          job_title: string
          postcode: string | null
          raw_excerpt: string | null
          reply_body: string
          reply_subject: string
          retain_until: string
          scope: string
          source: string
          source_message_id: string | null
          status: string
          suitability: string
          travel_note: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimate?: Json
          id?: string
          is_sample?: boolean
          job_title?: string
          postcode?: string | null
          raw_excerpt?: string | null
          reply_body?: string
          reply_subject?: string
          retain_until?: string
          scope?: string
          source?: string
          source_message_id?: string | null
          status?: string
          suitability?: string
          travel_note?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimate?: Json
          id?: string
          is_sample?: boolean
          job_title?: string
          postcode?: string | null
          raw_excerpt?: string | null
          reply_body?: string
          reply_subject?: string
          retain_until?: string
          scope?: string
          source?: string
          source_message_id?: string | null
          status?: string
          suitability?: string
          travel_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      outbound_channels: {
        Row: {
          attempt_token: string | null
          attempts: number
          body: string
          channel: string
          error: string | null
          id: string
          outbound_id: string
          provider_id: string | null
          recipient: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_token?: string | null
          attempts?: number
          body: string
          channel: string
          error?: string | null
          id?: string
          outbound_id: string
          provider_id?: string | null
          recipient?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_token?: string | null
          attempts?: number
          body?: string
          channel?: string
          error?: string | null
          id?: string
          outbound_id?: string
          provider_id?: string | null
          recipient?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_channels_outbound_id_fkey"
            columns: ["outbound_id"]
            isOneToOne: false
            referencedRelation: "outbound_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_messages: {
        Row: {
          approved_by: string
          body: string
          created_at: string
          email_channel: string | null
          email_delivery_status: string | null
          error: string | null
          gmail_message_id: string | null
          id: string
          idempotency_key: string
          lead_id: string
          price_summary: string | null
          provider_id: string | null
          sent_at: string | null
          sms_body: string | null
          sms_error: string | null
          sms_provider_id: string | null
          sms_status: string | null
          sms_to: string | null
          sms_updated_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          approved_by: string
          body: string
          created_at?: string
          email_channel?: string | null
          email_delivery_status?: string | null
          error?: string | null
          gmail_message_id?: string | null
          id?: string
          idempotency_key: string
          lead_id: string
          price_summary?: string | null
          provider_id?: string | null
          sent_at?: string | null
          sms_body?: string | null
          sms_error?: string | null
          sms_provider_id?: string | null
          sms_status?: string | null
          sms_to?: string | null
          sms_updated_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          approved_by?: string
          body?: string
          created_at?: string
          email_channel?: string | null
          email_delivery_status?: string | null
          error?: string | null
          gmail_message_id?: string | null
          id?: string
          idempotency_key?: string
          lead_id?: string
          price_summary?: string | null
          provider_id?: string | null
          sent_at?: string | null
          sms_body?: string | null
          sms_error?: string | null
          sms_provider_id?: string | null
          sms_status?: string | null
          sms_to?: string | null
          sms_updated_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          event_type: string
          id: string
          lead_id: string | null
          outcome: string
          received_at: string
        }
        Insert: {
          event_type: string
          id: string
          lead_id?: string | null
          outcome: string
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          lead_id?: string | null
          outcome?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_sms_delivery: {
        Args: {
          p_attempt: string
          p_channel: string
          p_error: string
          p_sid: string
          p_status: string
        }
        Returns: boolean
      }
      approve_quote: {
        Args: {
          p_body: string
          p_confirmed: boolean
          p_key: string
          p_lead: string
          p_mobile: string
          p_sms: string
          p_subject: string
          p_to: string
        }
        Returns: string
      }
      is_owner: { Args: never; Returns: boolean }
      purge_expired_leads: { Args: never; Returns: number }
      receive_hamuch_verified: {
        Args: { p_data: Json; p_secret: string }
        Returns: string
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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