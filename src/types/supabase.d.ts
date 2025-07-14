import { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace SupabaseRPC {
    interface Database {
      public: {
        Functions: {
          verify_employee_pin: {
            Args: {
              employee_name: string;
              pin_to_verify: string;
            };
            Returns: boolean;
          };
          update_employee_pin: {
            Args: {
              employee_name: string;
              new_pin: string;
            };
            Returns: void;
          };
          verify_employee_password: {
            Args: {
              employee_name: string;
              password_to_verify: string;
            };
            Returns: boolean;
          };
          update_employee_password: {
            Args: {
              employee_name: string;
              new_password: string;
            };
            Returns: void;
          };
        };
      };
    }
  }
}

export {};
