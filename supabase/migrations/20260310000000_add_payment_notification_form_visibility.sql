-- Add payment-notification to form_visibility table
INSERT INTO form_visibility (form_type, is_visible, allowed_roles)
VALUES ('payment-notification', true, '{}')
ON CONFLICT (form_type) DO NOTHING;
