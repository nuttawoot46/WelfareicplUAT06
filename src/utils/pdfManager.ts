import { WelfareRequest, User } from '@/types';
import { generateWelfarePDF } from '@/components/pdf/WelfarePDFGenerator';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';

/**
 * Create initial PDF when request is submitted
 */
export const createInitialPDF = async (
  request: WelfareRequest,
  user: User,
  employeeData?: { Name: string; Position: string; Team: string }
): Promise<string | null> => {
  try {
    console.log('Creating initial PDF for request:', request.id);

    // Generate PDF Blob with user signature only
    const pdfBlob = await generateWelfarePDF(
      request,
      user,
      employeeData,
      request.userSignature // Include user signature in initial PDF
    );

    // Convert Blob to base64 for database storage
    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    if (pdfBase64) {
      // Save initial PDF to database (user signature only)
      const { error } = await supabase
        .from('welfare_requests')
        .update({ pdf_base64: pdfBase64 })
        .eq('id', request.id);

      if (error) {
        console.error('Error saving initial PDF:', error);
        return null;
      }

      console.log('Initial PDF created and saved successfully');
      return pdfBase64;
    }

    return null;
  } catch (error) {
    console.error('Error creating initial PDF:', error);
    return null;
  }
};

/**
 * Add signature to existing PDF
 */
export const addSignatureToPDF = async (
  requestId: number,
  signatureType: 'manager' | 'hr',
  signature: string,
  approverName: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Starting addSignatureToPDF for ${signatureType} signature, request:`, requestId);
    console.log(`📝 Signature length:`, signature?.length || 0);
    console.log(`👤 Approver name:`, approverName);

    // Get current request data
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      console.error('❌ Error fetching request data:', fetchError);
      return false;
    }

    console.log('✅ Request data fetched successfully:', {
      id: requestData.id,
      employee_id: requestData.employee_id,
      request_type: requestData.request_type,
      status: requestData.status
    });

    // Update signature fields in database
    const updateData: any = {};
    if (signatureType === 'manager') {
      updateData.manager_signature = signature;
    } else if (signatureType === 'hr') {
      updateData.hr_signature = signature;
    }

    const { error: updateError } = await supabase
      .from('welfare_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error updating signature:', updateError);
      return false;
    }

    console.log(`✅ ${signatureType} signature updated in database successfully`);

    // Get updated request data with new signature
    const { data: updatedRequestData, error: updatedFetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (updatedFetchError || !updatedRequestData) {
      console.error('Error fetching updated request data:', updatedFetchError);
      return false;
    }

    // Regenerate PDF with new signature
    console.log('🔍 Getting employee data with:', updatedRequestData.employee_id?.toString() || updatedRequestData.userId);
    const employeeData = await getEmployeeData(updatedRequestData.employee_id?.toString() || updatedRequestData.userId);
    console.log('🔍 Retrieved employeeData:', employeeData);

    // Ensure employeeData has the correct name
    if (employeeData) {
      const actualName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
      if (actualName && actualName !== employeeData.Name) {
        console.log('🔧 Correcting employee name from', employeeData.Name, 'to', actualName);
        employeeData.Name = actualName;
      }
    }

    // Create a minimal user object for PDF generation
    // Get actual employee name first
    const actualEmployeeNameForUser = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
    console.log('🔍 User object - Actual employee name:', actualEmployeeNameForUser);

    const userForPDF: User = {
      id: updatedRequestData.employee_id?.toString() || updatedRequestData.userId || '',
      email: employeeData?.Name || '',
      name: actualEmployeeNameForUser || employeeData?.Name || updatedRequestData.employee_name || '',
      position: employeeData?.Position || '',
      role: 'employee' as const,
      department: employeeData?.Team || updatedRequestData.department_user || '',
      budget_fitness: 0
    };

    // Convert database fields to WelfareRequest format
    // Use actual employee name from Employee table, not the one from request which might be wrong
    const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
    console.log('🔍 PDF Generation - Actual employee name:', actualEmployeeName);
    console.log('🔍 PDF Generation - Employee data name:', employeeData?.Name);
    console.log('🔍 PDF Generation - Request employee name:', updatedRequestData.employee_name);

    const welfareRequestForPDF: WelfareRequest = {
      id: updatedRequestData.id,
      userId: updatedRequestData.employee_id?.toString() || updatedRequestData.userId || '',
      userName: actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || '',
      userDepartment: employeeData?.Team || updatedRequestData.department_user || '',
      type: updatedRequestData.request_type,
      status: updatedRequestData.status,
      amount: updatedRequestData.amount || 0,
      date: updatedRequestData.created_at,
      details: updatedRequestData.details || '',
      attachments: updatedRequestData.attachment_url ? JSON.parse(updatedRequestData.attachment_url) : [],
      createdAt: updatedRequestData.created_at,
      updatedAt: updatedRequestData.updated_at,
      title: updatedRequestData.title,
      userSignature: updatedRequestData.user_signature,
      managerSignature: updatedRequestData.manager_signature,
      hrSignature: updatedRequestData.hr_signature,
      managerApproverName: updatedRequestData.manager_approver_name,
      managerApprovedAt: updatedRequestData.manager_approved_at,
      hrApproverName: updatedRequestData.hr_approver_name,
      hrApprovedAt: updatedRequestData.hr_approved_at,
      birth_type: updatedRequestData.birth_type,
      department_user: updatedRequestData.department_user
    };

    console.log('🔄 Generating PDF with signatures...');
    console.log('📋 PDF Data Summary:');
    console.log('  - welfareRequestForPDF.userName:', welfareRequestForPDF.userName);
    console.log('  - userForPDF.name:', userForPDF.name);
    console.log('  - employeeData?.Name:', employeeData?.Name);

    const newPdfBase64 = await generateWelfarePDFAsBase64(
      welfareRequestForPDF,
      userForPDF,
      employeeData,
      updatedRequestData.user_signature,
      updatedRequestData.manager_signature,
      updatedRequestData.hr_signature
    );

    console.log('📄 PDF generated, base64 length:', newPdfBase64?.length || 0);

    if (newPdfBase64) {
      // Update PDF in appropriate database column based on signature type
      const updateData: any = {};

      // Convert base64 back to blob for upload (common for both manager and HR)
      const byteCharacters = atob(newPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

      if (signatureType === 'manager') {
        // Upload to Supabase Storage bucket "welfare-pdfs-manager" when Manager approves
        try {
          // Create safe filename for storage using actual employee name
          const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
          console.log('🔍 Actual employee name from DB:', actualEmployeeName);

          // Use actual employee name, fallback to employeeData, then request data
          const employeeName = actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || 'user';
          console.log('🔍 Final employee name for filename:', employeeName);

          // Create safe filename - remove all non-ASCII characters for Supabase compatibility
          const safeEmployeeName = employeeName
            .replace(/\s+/g, '_')  // Replace spaces with underscores
            .replace(/[^\x00-\x7F]/g, '')  // Remove all non-ASCII characters (including Thai)
            .replace(/[^a-zA-Z0-9_]/g, '')  // Keep only alphanumeric and underscore
            .substring(0, 50) || 'employee';  // Limit length and provide fallback

          const timestamp = Date.now();
          const filename = `welfare_${updatedRequestData.request_type}_${safeEmployeeName}_manager_approved_${timestamp}.pdf`;
          console.log('🔍 Generated filename:', filename);

          // Upload to manager bucket
          const { uploadPDFToManagerBucket } = await import('@/utils/pdfUtils');
          const storageUrl = await uploadPDFToManagerBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

          if (storageUrl) {
            // Store only the URL, not the base64 data
            updateData.pdf_request_manager = storageUrl;
            console.log('PDF uploaded to welfare-pdfs-manager bucket successfully (Manager):', storageUrl);
          } else {
            console.error('Failed to upload PDF to welfare-pdfs-manager bucket (Manager)');
            return false; // Fail if upload fails
          }
        } catch (uploadError) {
          console.error('Error uploading PDF to storage (Manager):', uploadError);
          return false; // Fail if upload fails
        }

      } else if (signatureType === 'hr') {
        // Upload to Supabase Storage bucket "welfare-pdfs-hr" when HR approves
        try {
          // Create safe filename for storage using actual employee name
          const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
          console.log('🔍 Actual employee name from DB:', actualEmployeeName);

          // Use actual employee name, fallback to employeeData, then request data
          const employeeName = actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || 'user';
          console.log('🔍 Final employee name for filename:', employeeName);

          // Create safe filename - remove all non-ASCII characters for Supabase compatibility
          const safeEmployeeName = employeeName
            .replace(/\s+/g, '_')  // Replace spaces with underscores
            .replace(/[^\x00-\x7F]/g, '')  // Remove all non-ASCII characters (including Thai)
            .replace(/[^a-zA-Z0-9_]/g, '')  // Keep only alphanumeric and underscore
            .substring(0, 50) || 'employee';  // Limit length and provide fallback

          const timestamp = Date.now();
          const filename = `welfare_${updatedRequestData.request_type}_${safeEmployeeName}_hr_approved_${timestamp}.pdf`;
          console.log('🔍 Generated filename:', filename);

          // Upload to HR bucket
          const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
          const storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

          if (storageUrl) {
            // Store only the URL, not the base64 data
            updateData.pdf_request_hr = storageUrl;
            console.log('PDF uploaded to welfare-pdfs-hr bucket successfully (HR):', storageUrl);
          } else {
            console.error('Failed to upload PDF to welfare-pdfs-hr bucket (HR)');
            return false; // Fail if upload fails
          }
        } catch (uploadError) {
          console.error('Error uploading PDF to storage (HR):', uploadError);
          return false; // Fail if upload fails
        }
      }

      const { error: pdfUpdateError } = await supabase
        .from('welfare_requests')
        .update(updateData)
        .eq('id', requestId);

      if (pdfUpdateError) {
        console.error('Error updating PDF:', pdfUpdateError);
        return false;
      }

      console.log(`🎉 ${signatureType} signature added to PDF successfully in column: ${signatureType === 'manager' ? 'pdf_request_manager' : 'pdf_request_hr'}`);
      console.log('📊 Final update data:', Object.keys(updateData));
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error adding ${signatureType} signature to PDF:`, error);
    return false;
  }
};

/**
 * Get actual employee name from Employee table
 */
const getActualEmployeeName = async (employeeId?: string): Promise<string | null> => {
  if (!employeeId) {
    console.log('🔍 getActualEmployeeName: No employeeId provided');
    return null;
  }

  try {
    console.log('🔍 getActualEmployeeName called with employeeId:', employeeId);

    // Try to find by employee ID first (if employeeId is numeric)
    const numericId = parseInt(employeeId, 10);
    if (!isNaN(numericId)) {
      console.log('🔍 Searching employee by numeric ID:', numericId);
      const { data: employeeById, error: errorById } = await supabase
        .from('Employee')
        .select('Name')
        .eq('id', numericId)
        .single();

      console.log('🔍 Employee by ID result:', { data: employeeById, error: errorById });

      if (!errorById && employeeById) {
        console.log('✅ Found employee name by ID:', employeeById.Name);
        return employeeById.Name;
      }
    }

    // Fallback to email_user lookup
    console.log('🔍 Fallback: Searching employee by email_user:', employeeId);
    const { data, error } = await supabase
      .from('Employee')
      .select('Name')
      .eq('"email_user"', employeeId)
      .single();

    console.log('🔍 Employee by email result:', { data, error });

    if (error || !data) {
      console.log('❌ No employee name found for employeeId:', employeeId);
      return null;
    }

    console.log('✅ Found employee name by email:', data.Name);
    return data.Name;
  } catch (error) {
    console.error('❌ Error fetching employee name:', error);
    return null;
  }
};

/**
 * Get employee data for PDF generation
 */
const getEmployeeData = async (userId: string): Promise<{ Name: string; Position: string; Team: string } | undefined> => {
  try {
    console.log('🔍 getEmployeeData called with userId:', userId);

    // Try to find by employee ID first (if userId is numeric)
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      console.log('🔍 Searching by numeric ID:', numericId);
      const { data: employeeById, error: errorById } = await supabase
        .from('Employee')
        .select('Name, Position, Team')
        .eq('id', numericId)
        .single();

      console.log('🔍 Employee by ID result:', { data: employeeById, error: errorById });

      if (!errorById && employeeById) {
        console.log('✅ Found employee by ID:', employeeById.Name);
        return {
          Name: employeeById.Name,
          Position: employeeById.Position,
          Team: employeeById.Team
        };
      }
    }

    // Fallback to email_user lookup
    console.log('🔍 Fallback: Searching by email_user:', userId);
    const { data, error } = await supabase
      .from('Employee')
      .select('Name, Position, Team')
      .eq('"email_user"', userId)
      .single();

    console.log('🔍 Employee by email result:', { data, error });

    if (error || !data) {
      console.log('❌ No employee data found for userId:', userId);
      return undefined;
    }

    console.log('✅ Found employee by email:', data.Name);
    return {
      Name: data.Name,
      Position: data.Position,
      Team: data.Team
    };
  } catch (error) {
    console.error('❌ Error fetching employee data:', error);
    return undefined;
  }
};

/**
 * Generate PDF and return as base64 string
 */
const generateWelfarePDFAsBase64 = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string
): Promise<string | null> => {
  try {
    // Generate PDF as Blob
    const pdfBlob = await generateWelfarePDF(welfareData, userData, employeeData, userSignature, managerSignature, hrSignature);

    // Convert Blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('Error generating PDF as base64:', error);
    return null;
  }
};

/**
 * Get the most appropriate PDF column based on request status
 */
const getPDFColumn = (status: string): string => {
  if (status === 'pending_hr' || status === 'approved') {
    return 'pdf_request_manager'; // Manager approved PDF
  }
  return 'pdf_request_manager'; // Default to manager PDF
};

/**
 * Download PDF from database
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
 */
/**
 * Debug function to check PDF columns
 */
export const debugPDFColumns = async (requestId: number): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('pdf_request_manager, pdf_request_hr, status, employee_name')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      console.error('Error fetching PDF columns:', error);
      return;
    }

    console.log(`PDF Columns Debug for Request ${requestId} (${data.employee_name}):`, {
      status: data.status,
      pdf_request_manager: data.pdf_request_manager ? `${data.pdf_request_manager.length} chars` : 'null',
      pdf_request_hr: data.pdf_request_hr ? `${data.pdf_request_hr.length} chars` : 'null'
    });
  } catch (error) {
    console.error('Error in debugPDFColumns:', error);
  }
};

// pdfManager.ts

export const previewPDFFromDatabase = async (requestId: number): Promise<void> => {
  try {
    // 1. ดึงข้อมูล PDF และลายเซ็น
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('pdf_request_manager, manager_signature, hr_signature')
      .eq('id', requestId)
      .single();

    console.log('Fetched data for preview:', data);

    if (error || !data) {
      console.error('Error fetching PDF data or request not found:', error);
      alert('ไม่พบข้อมูลคำขอ หรือเกิดข้อผิดพลาดในการโหลด');
      return;
    }

    // 2. ตรวจสอบว่ามีลายเซ็นอยู่หรือไม่
    if (!data.manager_signature && !data.hr_signature) {
      alert('ยังไม่มีลายเซ็นในเอกสารให้ตรวจสอบ');
      return;
    }

    // 3. เลือก PDF ที่เหมาะสม (ใช้ Manager PDF)
    const pdfData = data.pdf_request_manager;

    if (pdfData) {
      // Check if it's a URL or base64 data
      if (pdfData.startsWith('http')) {
        // It's a URL, open directly
        console.log('Opening PDF from Storage URL:', pdfData);
        const newWindow = window.open(pdfData, '_blank');

        if (!newWindow) {
          alert('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาตรวจสอบการตั้งค่า Pop-up Blocker ของเบราว์เซอร์');
        }
      } else {
        // It's base64 data (legacy), convert to blob
        console.log('Opening PDF from base64 data');
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

        // Clean up the URL after a delay
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