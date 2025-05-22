
import { createClient } from '@supabase/supabase-js';

// Using the provided Supabase credentials
const supabaseUrl = 'https://tpqetfmwiydzsaltvyxo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcWV0Zm13aXlkenNhbHR2eXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MDA2MjksImV4cCI6MjA2MzQ3NjYyOX0.5fb9S3nbrXMdWYlgUSgsve_ym4cDNd2MaZRB_2GnBts';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
