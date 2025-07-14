export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      welfare_settings: {
        Row: {
          welfare_type: string
          max_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          welfare_type: string
          max_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          welfare_type?: string
          max_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      // Add views if any
    }
    Functions: {
      // Add functions if any
    }
    Enums: {
      // Add enums if any
    }
  }
}

export type WelfareSetting = Database['public']['Tables']['welfare_settings']['Row']