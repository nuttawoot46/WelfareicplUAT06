import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PaymentNotificationForm } from '@/components/forms/PaymentNotificationForm';

export function PaymentNotificationPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <PaymentNotificationForm onBack={() => navigate('/payment-notification-list')} />
    </Layout>
  );
}
