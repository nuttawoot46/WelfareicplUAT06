import { WelfareRequest, User } from '@/types';
import { supabase } from '@/lib/supabase';

// Import specialized PDF managers
import {
  createInitialExternalTrainingPDF,
  addSignatureToExternalTrainingPDF
} from './externalTrainingPdfManager';
import {
  createInitialInternalTrainingPDF,
  addSignatureToInternalTrainingPDF
} from './internalTrainingPdfManager';
import {
  createInitialWelfarePDF,
  addSignatureToWelfarePDF
} from './welfarePdfManager';

/**
 * Create initial PDF when request is submitted
 * Routes to appropriate specialized PDF manager based on request type
 */
export const createInitialPDF = async (
  request: WelfareRequest,
  user: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string }
): Promise<string | null> => {
  try {
    console.log('Creating initial PDF for request:', request.id, 'type:', request.type);

    // Route to appropriate PDF manager based on request type
    if (request.type === 'internal_training') {
      return await createInitialInternalTrainingPDF(request, user, employeeData);
    } else if (request.type === 'training') {
      return await createInitialExternalTrainingPDF(request, user, employeeData);
    } else {
      // General welfare requests (fitness, medical, etc.)
      return await createInitialWelfarePDF(request, user, employeeData);
    }
  } catch (error) {
    console.error('Error creating initial PDF:', error);
    return null;
  }
};

/**
 * Add signature to existing PDF
 * Routes to appropriate specialized PDF manager based on request type
 */
export const addSignatureToPDF = async (
  requestId: number,
  signatureType: 'manager' | 'hr',
  signature: string,
  approverName: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Starting addSignatureToPDF for ${signatureType} signature, request:`, requestId);

    // Get request type to route to appropriate manager
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('request_type')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      console.error('❌ Error fetching request type:', fetchError);
      return false;
    }

    console.log('✅ Request type:', requestData.request_type);

    // Route to appropriate PDF manager based on request type
    if (requestData.request_type === 'internal_training') {
      return await addSignatureToInternalTrainingPDF(requestId, signatureType, signature, approverName);
    } else if (requestData.request_type === 'training') {
      return await addSignatureToExternalTrainingPDF(requestId, signatureType, signature, approverName);
    } else {
      // General welfare requests (fitness, medical, etc.)
      return await addSignatureToWelfarePDF(requestId, signatureType, signature, approverName);
    }
  } catch (error) {
    console.error(`Error adding ${signatureType} signature to PDF:`, error);
    return false;
  }
};

/**
 * Get actual employee name from Employee table
 * Shared utility function used by all PDF managers
 */
export const getActualEmployeeName = async (employeeId?: string): Promise<string | null> => {
  if (!employeeId) return null;

  try {
    const numericId = parseInt(employeeId, 10);
    if (!isNaN(numericId)) {
      const { data: employeeById, error: errorById } = await supabase
        .from('Employee')
        .select('Name')
        .eq('id', numericId)
        .single();

      if (!errorById && employeeById) {
        return employeeById.Name;
      }
    }

    const { data, error } = await supabase
      .from('Employee')
      .select('Name')
      .eq('"email_user"', employeeId)
      .single();

    if (error || !data) return null;
    return data.Name;
  } catch (error) {
    console.error('Error fetching employee name:', error);
    return null;
  }
};

/**
 * Download PDF from database
 * Shared utility function for all PDF types
 */
export const downloadPDFFromDatabase = async (requestId: number): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('pdf_request_manager, pdf_request_hr, employee_name, employee_id, request_type, status')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      console.error('Error fetching PDF or PDF not found:', error);
      return;
    }

    // Use appropriate PDF URL based on status
    const pdfUrl = data.pdf_request_hr || data.pdf_request_manager;
    const pdfType = data.pdf_request_hr ? 'hr_approved' : 'manager_approved';

    if (!pdfUrl) {
      console.error('No PDF found for request:', requestId);
      alert('ไม่พบไฟล์ PDF');
      return;
    }

    // Check if it's a URL or base64 data
    if (pdfUrl.startsWith('http')) {
      // It's a URL, download directly
      const link = document.createElement('a');
      link.href = pdfUrl;
      const actualEmployeeName = await getActualEmployeeName(data.employee_id?.toString());
      const employeeName = actualEmployeeName || data.employee_name || 'user';
      const safeEmployeeName = employeeName
        .replace(/\s+/g, '_')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .substring(0, 50) || 'employee';
      link.download = `welfare_request_${safeEmployeeName}_${data.request_type}_${pdfType}_${requestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // It's base64 data (legacy), convert to blob and download
      const byteCharacters = atob(pdfUrl);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const actualEmployeeName = await getActualEmployeeName(data.employee_id?.toString());
      const employeeName = actualEmployeeName || data.employee_name || 'user';
      const safeEmployeeName = employeeName
        .replace(/\s+/g, '_')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .substring(0, 50) || 'employee';
      link.download = `welfare_request_${safeEmployeeName}_${data.request_type}_${pdfType}_${requestId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
};

/**
 * Preview PDF from database in new tab
 * Shared utility function for all PDF types
 */
export const previewPDFFromDatabase = async (requestId: number): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('pdf_request_manager, pdf_request_hr, manager_signature, hr_signature')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      console.error('Error fetching PDF data or request not found:', error);
      alert('ไม่พบข้อมูลคำขอ หรือเกิดข้อผิดพลาดในการโหลด');
      return;
    }

    if (!data.manager_signature && !data.hr_signature) {
      alert('ยังไม่มีลายเซ็นในเอกสารให้ตรวจสอบ');
      return;
    }

    // Use appropriate PDF (HR first, then Manager)
    const pdfData = data.pdf_request_hr || data.pdf_request_manager;

    if (pdfData) {
      if (pdfData.startsWith('http')) {
        // It's a URL, open directly
        const newWindow = window.open(pdfData, '_blank');
        if (!newWindow) {
          alert('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาตรวจสอบการตั้งค่า Pop-up Blocker ของเบราว์เซอร์');
        }
      } else {
        // It's base64 data (legacy), convert to blob
        const byteCharacters = atob(pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
          alert('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาตรวจสอบการตั้งค่า Pop-up Blocker ของเบราว์เซอร์');
        }

        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } else {
      console.error('No PDF data found for request:', requestId);
      alert('ไม่พบข้อมูล PDF สำหรับคำขอนี้');
    }

  } catch (error) {
    console.error('Error previewing PDF:', error);
    alert('เกิดข้อผิดพลาดในการแสดงตัวอย่าง PDF');
  }
};

/**
 * Debug function to check PDF columns
 * Shared utility function for all PDF types
 */
export const debugPDFColumns = async (requestId: number): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('pdf_request_manager, pdf_request_hr, status, employee_name, request_type')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      console.error('Error fetching PDF columns:', error);
      return;
    }

    console.log(`PDF Columns Debug for Request ${requestId} (${data.employee_name}) - Type: ${data.request_type}:`, {
      status: data.status,
      pdf_request_manager: data.pdf_request_manager ? `${data.pdf_request_manager.length} chars` : 'null',
      pdf_request_hr: data.pdf_request_hr ? `${data.pdf_request_hr.length} chars` : 'null'
    });
  } catch (error) {
    console.error('Error in debugPDFColumns:', error);
  }
};

/**
 * Store PDF in database - Legacy function, now routes to appropriate manager
 * @deprecated Use specific PDF managers instead
 */
export const storePDFInDatabase = async (
  requestId: number,
  pdfBlob: Blob,
  signature: string,
  signatureType: 'manager' | 'hr',
  approverName: string
): Promise<boolean> => {
  console.warn('storePDFInDatabase is deprecated. Use specific PDF managers instead.');

  // Get request type and route to appropriate manager
  const { data: requestData, error: fetchError } = await supabase
    .from('welfare_requests')
    .select('request_type')
    .eq('id', requestId)
    .single();

  if (fetchError || !requestData) {
    console.error('❌ Error fetching request type:', fetchError);
    return false;
  }

  if (requestData.request_type === 'internal_training') {
    const { storeInternalTrainingPDFInDatabase } = await import('./internalTrainingPdfManager');
    return await storeInternalTrainingPDFInDatabase(requestId, pdfBlob, signature, signatureType, approverName);
  }

  // For other types, return false as they should use their specific managers
  console.error('storePDFInDatabase called for unsupported request type:', requestData.request_type);
  return false;
};
