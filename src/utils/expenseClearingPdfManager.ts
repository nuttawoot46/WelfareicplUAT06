import { WelfareRequest, User } from '@/types';
import { generateExpenseClearingPDF } from '@/components/pdf/ExpenseClearingPDFGenerator';
import { generateSalesExpenseClearingPDF } from '@/components/pdf/SalesExpenseClearingPDFGenerator';
import { supabase } from '@/lib/supabase';

/**
 * Expense Clearing PDF Manager
 * Handles PDF generation and management for expense clearing requests
 */

/**
 * Create initial PDF for expense clearing when request is submitted
 */
export const createInitialExpenseClearingPDF = async (
  request: WelfareRequest,
  user: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string }
): Promise<string | null> => {
  try {
    console.log('Creating initial Expense Clearing PDF for request:', request.id);

    // Generate PDF Blob with user signature only
    const pdfBlob = await generateExpenseClearingPDF(
      request,
      user,
      employeeData,
      request.userSignature // Include user signature in initial PDF
    );

    // Convert Blob to base64 for database storage
    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });

    if (pdfBase64) {
      // Save initial PDF to database
      const { error } = await supabase
        .from('welfare_requests')
        .update({ pdf_base64: pdfBase64 })
        .eq('id', request.id);

      if (error) {
        console.error('Error saving initial Expense Clearing PDF:', error);
        return null;
      }

      console.log('Initial Expense Clearing PDF created and saved successfully');
      return pdfBase64;
    }

    return null;
  } catch (error) {
    console.error('Error creating initial Expense Clearing PDF:', error);
    return null;
  }
};

/**
 * Add signature to existing expense clearing PDF
 */
export const addSignatureToExpenseClearingPDF = async (
  requestId: number,
  signatureType: 'manager' | 'hr' | 'accounting',
  signature: string,
  approverName: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Adding ${signatureType} signature to Expense Clearing PDF, request:`, requestId);

    // Get current request data
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      console.error('❌ Error fetching Expense Clearing request data:', fetchError);
      return false;
    }

    // Update signature fields in database
    const updateData: any = {};
    if (signatureType === 'manager') {
      updateData.manager_signature = signature;
      updateData.manager_approver_name = approverName;
      updateData.manager_approved_at = new Date().toISOString();
    } else if (signatureType === 'hr') {
      updateData.hr_signature = signature;
      updateData.hr_approver_name = approverName;
      updateData.hr_approved_at = new Date().toISOString();
    } else if (signatureType === 'accounting') {
      updateData.accounting_signature = signature;
      updateData.accounting_approver_name = approverName;
      updateData.accounting_approved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('welfare_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error updating Expense Clearing signature:', updateError);
      return false;
    }

    // Get updated request data with new signature
    const { data: updatedRequestData, error: updatedFetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (updatedFetchError || !updatedRequestData) {
      console.error('Error fetching updated Expense Clearing request data:', updatedFetchError);
      return false;
    }

    // Get employee data and user data for PDF generation
    const employeeData = await getEmployeeData(updatedRequestData.employee_id?.toString() || updatedRequestData.userId);
    const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
    
    if (employeeData && actualEmployeeName && actualEmployeeName !== employeeData.Name) {
      employeeData.Name = actualEmployeeName;
    }

    const userForPDF: User = {
      id: updatedRequestData.employee_id?.toString() || updatedRequestData.userId || '',
      email: employeeData?.Name || '',
      name: actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || '',
      position: employeeData?.Position || '',
      role: 'employee' as const,
      department: employeeData?.Team || updatedRequestData.department_user || updatedRequestData.department_request || '',
      budget_fitness: 0,
      training_budget: (employeeData as any)?.Budget_Training,
      original_training_budget: (employeeData as any)?.Original_Budget_Training
    };

    // Convert database fields to WelfareRequest format
    const expenseClearingRequestForPDF: WelfareRequest = {
      id: updatedRequestData.id,
      userId: updatedRequestData.employee_id?.toString() || updatedRequestData.userId || '',
      userName: actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || '',
      userDepartment: employeeData?.Team || updatedRequestData.department_user || updatedRequestData.department_request || '',
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
      managerApproverPosition: (updatedRequestData as any).manager_approver_position || '',
      managerApprovedAt: updatedRequestData.manager_approved_at,
      hrApproverName: updatedRequestData.hr_approver_name,
      hrApprovedAt: updatedRequestData.hr_approved_at,
      runNumber: (updatedRequestData as any).run_number,
      start_date: (updatedRequestData as any).start_date,
      end_date: (updatedRequestData as any).end_date,
      bankAccountName: (updatedRequestData as any).bank_account_name,
      bankName: (updatedRequestData as any).bank_name,
      bankAccountNumber: (updatedRequestData as any).bank_account_number,
      // Expense clearing specific fields
      originalAdvanceRequestId: updatedRequestData.original_advance_request_id,
      originalAdvanceRunNumber: (updatedRequestData as any).original_advance_run_number,
      advanceDepartment: updatedRequestData.advance_department,
      advanceDepartmentOther: (updatedRequestData as any).advance_department_other,
      advanceDistrict: updatedRequestData.advance_district,
      advanceActivityType: updatedRequestData.advance_activity_type,
      advanceActivityOther: updatedRequestData.advance_activity_other,
      advanceShopCompany: updatedRequestData.advance_shop_company,
      advanceAmphur: updatedRequestData.advance_amphur,
      advanceProvince: updatedRequestData.advance_province,
      advanceParticipants: updatedRequestData.advance_participants,
      advanceLocation: updatedRequestData.advance_location,
      advanceDealerName: updatedRequestData.advance_dealer_name,
      advanceSubdealerName: updatedRequestData.advance_subdealer_name,
      advanceEventDate: (updatedRequestData as any).advance_event_date,
      advanceExpenseItems: (updatedRequestData as any).advance_expense_items,
      expenseClearingItems: updatedRequestData.expense_clearing_items,
      department_user: updatedRequestData.department_user,
      department_request: updatedRequestData.department_request,
    };

    // Generate new PDF with signatures
    const newPdfBase64 = await generateExpenseClearingPDFAsBase64(
      expenseClearingRequestForPDF,
      userForPDF,
      employeeData,
      updatedRequestData.user_signature,
      updatedRequestData.manager_signature,
      updatedRequestData.hr_signature
    );

    if (newPdfBase64) {
      // Convert base64 to blob for upload
      const byteCharacters = atob(newPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

      const updateData: any = {};

      if (signatureType === 'manager') {
        // Upload to manager bucket
        const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
        const employeeName = actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || 'user';
        const safeEmployeeName = employeeName
          .replace(/\s+/g, '_')
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .substring(0, 50) || 'employee';

        const timestamp = Date.now();
        const filename = `expense_clearing_${safeEmployeeName}_manager_approved_${timestamp}.pdf`;

        const { uploadPDFToManagerBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToManagerBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          updateData.pdf_request_manager = storageUrl;
          console.log('Expense Clearing PDF uploaded to manager bucket:', storageUrl);
        } else {
          console.error('Failed to upload Expense Clearing PDF to manager bucket');
          return false;
        }

      } else if (signatureType === 'hr') {
        // Upload to HR bucket
        const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
        const employeeName = actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || 'user';
        const safeEmployeeName = employeeName
          .replace(/\s+/g, '_')
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .substring(0, 50) || 'employee';

        const timestamp = Date.now();
        const filename = `expense_clearing_${safeEmployeeName}_hr_approved_${timestamp}.pdf`;

        const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          updateData.pdf_request_hr = storageUrl;
          console.log('Expense Clearing PDF uploaded to HR bucket:', storageUrl);
        } else {
          console.error('Failed to upload Expense Clearing PDF to HR bucket');
          return false;
        }

      } else if (signatureType === 'accounting') {
        // Upload to accounting bucket (we'll use HR bucket for now)
        const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
        const employeeName = actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || 'user';
        const safeEmployeeName = employeeName
          .replace(/\s+/g, '_')
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .substring(0, 50) || 'employee';

        const timestamp = Date.now();
        const filename = `expense_clearing_${safeEmployeeName}_accounting_approved_${timestamp}.pdf`;

        const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          updateData.pdf_request_accounting = storageUrl;
          console.log('Expense Clearing PDF uploaded to accounting bucket:', storageUrl);
        } else {
          console.error('Failed to upload Expense Clearing PDF to accounting bucket');
          return false;
        }
      }

      const { error: pdfUpdateError } = await supabase
        .from('welfare_requests')
        .update(updateData)
        .eq('id', requestId);

      if (pdfUpdateError) {
        console.error('Error updating Expense Clearing PDF:', pdfUpdateError);
        return false;
      }

      console.log(`🎉 Expense Clearing ${signatureType} signature added successfully`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error adding ${signatureType} signature to Expense Clearing PDF:`, error);
    return false;
  }
};

/**
 * Generate Expense Clearing PDF and return as base64 string
 */
const generateExpenseClearingPDFAsBase64 = async (
  expenseClearingData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string
): Promise<string | null> => {
  try {
    // Use sales-specific PDF generator for 'expense-clearing' (ฝ่ายขาย), general for 'general-expense-clearing'
    const pdfGenerator = expenseClearingData.type === 'expense-clearing' ? generateSalesExpenseClearingPDF : generateExpenseClearingPDF;
    const pdfBlob = await pdfGenerator(
      expenseClearingData,
      userData,
      employeeData,
      userSignature,
      managerSignature,
      hrSignature
    );

    // Convert Blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('Error generating Expense Clearing PDF as base64:', error);
    return null;
  }
};

/**
 * Get actual employee name from Employee table
 */
const getActualEmployeeName = async (employeeId?: string): Promise<string | null> => {
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
 * Get employee data for PDF generation
 */
const getEmployeeData = async (userId: string): Promise<{ Name: string; Position: string; Team: string; start_date?: string } | undefined> => {
  try {
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      const { data: employeeById, error: errorById } = await supabase
        .from('Employee')
        .select('Name, Position, Team, start_date, Budget_Training, Original_Budget_Training')
        .eq('id', numericId)
        .single();

      if (!errorById && employeeById) {
        return {
          Name: employeeById.Name,
          Position: employeeById.Position,
          Team: employeeById.Team,
          start_date: employeeById.start_date,
          Budget_Training: (employeeById as any)?.Budget_Training,
          Original_Budget_Training: (employeeById as any)?.Original_Budget_Training
        } as any;
      }
    }

    const { data, error } = await supabase
      .from('Employee')
      .select('Name, Position, Team, start_date, Budget_Training, Original_Budget_Training')
      .eq('"email_user"', userId)
      .single();

    if (error || !data) return undefined;

    return {
      Name: data.Name,
      Position: data.Position,
      Team: data.Team,
      start_date: data.start_date,
      Budget_Training: (data as any)?.Budget_Training,
      Original_Budget_Training: (data as any)?.Original_Budget_Training
    } as any;
  } catch (error) {
    console.error('Error fetching employee data:', error);
    return undefined;
  }
};