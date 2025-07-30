import { useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

export const usePDFOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const downloadPDF = async (requestId: number) => {
    try {
      setIsLoading(true);
      const { downloadPDFFromDatabase } = await import('@/utils/pdfManager');
      await downloadPDFFromDatabase(requestId);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      addNotification({
        userId: user?.id || 'system',
        title: 'Error',
        message: 'Failed to download PDF. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewPDF = async (requestId: number) => {
    try {
      setIsLoading(true);
      const { previewPDFFromDatabase } = await import('@/utils/pdfManager');
      await previewPDFFromDatabase(requestId);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      addNotification({
        userId: user?.id || 'system',
        title: 'Error',
        message: 'Failed to preview PDF. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    downloadPDF,
    previewPDF,
    isLoading
  };
};