export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone_number: string | null;
          currency: string;
          timezone: string;
          monthly_income: number | null;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone_number?: string | null;
          currency?: string;
          timezone?: string;
          monthly_income?: number | null;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone_number?: string | null;
          currency?: string;
          timezone?: string;
          monthly_income?: number | null;
          onboarded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          slug: string;
          icon: string | null;
          color: string | null;
          is_income: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          slug: string;
          icon?: string | null;
          color?: string | null;
          is_income?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          slug?: string;
          icon?: string | null;
          color?: string | null;
          is_income?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          currency: string;
          description: string | null;
          merchant: string | null;
          transaction_type: string;
          source: string;
          raw_input: string | null;
          occurred_at: string;
          message_id: string | null;
          confidence: number | null;
          is_recurring: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          currency?: string;
          description?: string | null;
          merchant?: string | null;
          transaction_type?: string;
          source?: string;
          raw_input?: string | null;
          occurred_at: string;
          message_id?: string | null;
          confidence?: number | null;
          is_recurring?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          currency?: string;
          description?: string | null;
          merchant?: string | null;
          transaction_type?: string;
          source?: string;
          raw_input?: string | null;
          occurred_at?: string;
          message_id?: string | null;
          confidence?: number | null;
          is_recurring?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount_limit: number;
          period: string;
          period_start: string;
          period_end: string;
          alert_at: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount_limit: number;
          period?: string;
          period_start: string;
          period_end: string;
          alert_at?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount_limit?: number;
          period?: string;
          period_start?: string;
          period_end?: string;
          alert_at?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          icon: string | null;
          color: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          icon?: string | null;
          color?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          icon?: string | null;
          color?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          channel: string;
          phone_number: string;
          status: string;
          last_message_at: string | null;
          context_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel?: string;
          phone_number: string;
          status?: string;
          last_message_at?: string | null;
          context_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel?: string;
          phone_number?: string;
          status?: string;
          last_message_at?: string | null;
          context_summary?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          twilio_sid: string | null;
          direction: string;
          body: string;
          intent: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          twilio_sid?: string | null;
          direction: string;
          body: string;
          intent?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          twilio_sid?: string | null;
          direction?: string;
          body?: string;
          intent?: string | null;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          reminder_type: string;
          schedule_cron: string | null;
          is_active: boolean;
          last_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          reminder_type: string;
          schedule_cron?: string | null;
          is_active?: boolean;
          last_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          reminder_type?: string;
          schedule_cron?: string | null;
          is_active?: boolean;
          last_sent_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
