-- Create payment_notifications table (แจ้งการชำระเงินจากลูกค้า)
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id BIGSERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT,
  team TEXT,
  run_number TEXT UNIQUE,

  -- Core form fields
  payment_date DATE NOT NULL,
  payment_condition TEXT NOT NULL CHECK (payment_condition IN (
    'เช็คฝากล่วงหน้า', 'เครดิต', 'เงินสด', 'โอนเงิน'
  )),
  payment_type TEXT NOT NULL CHECK (payment_type IN (
    'เช็ค', 'โอนเงิน', 'เงินสด'
  )),
  customer_name TEXT NOT NULL,
  customer_no TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Conditional date fields
  transfer_date DATE,
  check_date DATE,

  -- Document numbers (stored as JSON array)
  document_numbers JSONB DEFAULT '[]'::jsonb,

  -- Late payment
  late_payment_days INTEGER DEFAULT 0,

  -- Attachments (JSON array of URLs)
  attachment_urls JSONB DEFAULT '[]'::jsonb,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_notifications_employee_id
  ON public.payment_notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_team
  ON public.payment_notifications(team);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_payment_date
  ON public.payment_notifications(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_created_at
  ON public.payment_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_customer_name
  ON public.payment_notifications(customer_name);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_run_number
  ON public.payment_notifications(run_number);

-- Enable RLS (Row Level Security)
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view (accounting needs access to all records)
CREATE POLICY "Authenticated users can view payment notifications"
  ON public.payment_notifications
  FOR SELECT USING (true);

-- Authenticated users can create notifications
CREATE POLICY "Authenticated users can create payment notifications"
  ON public.payment_notifications
  FOR INSERT WITH CHECK (true);

-- Authenticated users can update notifications
CREATE POLICY "Authenticated users can update payment notifications"
  ON public.payment_notifications
  FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payment_notifications_updated_at
  BEFORE UPDATE ON public.payment_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_notification_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.payment_notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE payment_notifications_id_seq TO authenticated;

-- Add comments
COMMENT ON TABLE public.payment_notifications IS 'แจ้งการชำระเงินจากลูกค้า - Payment notifications from customers';
COMMENT ON COLUMN public.payment_notifications.payment_condition IS 'เงื่อนไขการชำระ: เช็คฝากล่วงหน้า, เครดิต, เงินสด, โอนเงิน';
COMMENT ON COLUMN public.payment_notifications.payment_type IS 'ประเภทการจ่ายชำระ: เช็ค, โอนเงิน, เงินสด';
COMMENT ON COLUMN public.payment_notifications.document_numbers IS 'เลขที่เอกสาร - JSON array of {value: string}';
COMMENT ON COLUMN public.payment_notifications.late_payment_days IS 'แจ้งชำระล่าช้า X วัน';
