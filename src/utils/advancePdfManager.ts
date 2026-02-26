import { WelfareRequest, User } from '@/types';
import { generateAdvancePDF } from '@/components/pdf/AdvancePDFGenerator';
import { generateSalesAdvancePDF } from '@/components/pdf/SalesAdvancePDFGenerator';
import { supabase } from '@/lib/supabase';

/**
 * Advance Payment PDF Manager
 * Handles PDF generation and management for advance payment requests
 */

/**
 * Create initial PDF for advance payment when request is submitted
 */
export const createInitialAdvancePDF = async (
  request: WelfareRequest,
  user: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string }
): Promise<string | null> => {
  try {
    console.log('Creating initial Advance Payment PDF for request:', request.id);

    // Generate PDF Blob with user signature only
    const pdfBlob = await generateAdvancePDF(
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
        console.error('Error saving initial Advance Payment PDF:', error);
        return null;
      }

      console.log('Initial Advance Payment PDF created and saved successfully');
      return pdfBase64;
    }

    return null;
  } catch (error) {
    console.error('Error creating initial Advance Payment PDF:', error);
    return null;
  }
};

/**
 * Add signature to existing advance payment PDF
 */
export const addSignatureToAdvancePDF = async (
  requestId: number,
  signatureType: 'manager' | 'hr' | 'accounting',
  signature: string,
  approverName: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Adding ${signatureType} signature to Advance Payment PDF, request:`, requestId, 'approverName:', approverName);
    console.log('📝 Signature length:', signature?.length, 'characters');

    // Get current request data
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      console.error('❌ Error fetching Advance Payment request data:', fetchError);
      return false;
    }

    // Update signature fields in database
    const updateData: any = {};
    if (signatureType === 'manager') {
      updateData.manager_signature = signature;
      updateData.manager_approver_name = approverName;
      updateData.manager_approved_at = new Date().toISOString();

      // Look up manager's position from Employee table
      const { data: managerData } = await supabase
        .from('Employee')
        .select('Position')
        .eq('Name', approverName)
        .single();

      if (managerData?.Position) {
        updateData.manager_approver_position = managerData.Position;
      }
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
      console.error('❌ Error updating Advance Payment signature:', updateError);
      return false;
    }

    // Get updated request data with new signature
    const { data: updatedRequestData, error: updatedFetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (updatedFetchError || !updatedRequestData) {
      console.error('Error fetching updated Advance Payment request data:', updatedFetchError);
      return false;
    }

    // Get employee data and user data for PDF generation
    const employeeData = await getEmployeeData(updatedRequestData.employee_id?.toString() || (updatedRequestData as any).userId);
    const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
    
    if (employeeData && actualEmployeeName && actualEmployeeName !== employeeData.Name) {
      employeeData.Name = actualEmployeeName;
    }

    const userForPDF: User = {
      id: updatedRequestData.employee_id?.toString() || (updatedRequestData as any).userId || '',
      email: employeeData?.Name || '',
      name: actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || '',
      position: employeeData?.Position || '',
      role: 'employee' as const,
      department: employeeData?.Team || (updatedRequestData as any).department_user || updatedRequestData.department_request || '',
      budget_fitness: 0,
      training_budget: (employeeData as any)?.Budget_Training,
      original_training_budget: (employeeData as any)?.Original_Budget_Training
    };

    // Convert database fields to WelfareRequest format
    const advanceRequestForPDF: WelfareRequest = {
      id: updatedRequestData.id,
      userId: updatedRequestData.employee_id?.toString() || (updatedRequestData as any).userId || '',
      userName: actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || '',
      userDepartment: employeeData?.Team || (updatedRequestData as any).department_user || updatedRequestData.department_request || '',
      type: updatedRequestData.request_type as any,
      status: updatedRequestData.status as any,
      amount: updatedRequestData.amount || 0,
      date: updatedRequestData.created_at,
      details: updatedRequestData.details || '',
      attachments: updatedRequestData.attachment_url ? (typeof updatedRequestData.attachment_url === 'string' ? JSON.parse(updatedRequestData.attachment_url) : updatedRequestData.attachment_url) : [],
      createdAt: updatedRequestData.created_at,
      updatedAt: (updatedRequestData as any).updated_at || updatedRequestData.created_at,
      title: updatedRequestData.title,
      runNumber: (updatedRequestData as any).run_number,
      bankAccountName: (updatedRequestData as any).bank_account_name,
      bankName: (updatedRequestData as any).bank_name,
      bankAccountNumber: (updatedRequestData as any).bank_account_number,
      userSignature: updatedRequestData.user_signature,
      managerSignature: updatedRequestData.manager_signature || (signatureType === 'manager' ? signature : undefined),
      hrSignature: updatedRequestData.hr_signature || (signatureType === 'hr' ? signature : undefined),
      managerApproverName: updatedRequestData.manager_approver_name || (signatureType === 'manager' ? approverName : undefined),
      managerApproverPosition: (updatedRequestData as any).manager_approver_position,
      managerApprovedAt: updatedRequestData.manager_approved_at || (signatureType === 'manager' ? new Date().toISOString() : undefined),
      hrApproverName: updatedRequestData.hr_approver_name || (signatureType === 'hr' ? approverName : undefined),
      hrApprovedAt: updatedRequestData.hr_approved_at || (signatureType === 'hr' ? new Date().toISOString() : undefined),
      // Advance payment specific fields - use safe access
      advanceDepartment: (updatedRequestData as any).advance_department,
      advanceDepartmentOther: (updatedRequestData as any).advance_department_other,
      advanceDistrict: (updatedRequestData as any).advance_district,
      advanceActivityType: (updatedRequestData as any).advance_activity_type,
      advanceActivityOther: (updatedRequestData as any).advance_activity_other,
      advanceShopCompany: (updatedRequestData as any).advance_shop_company,
      advanceAmphur: (updatedRequestData as any).advance_amphur,
      advanceProvince: (updatedRequestData as any).advance_province,
      advanceTravelDays: (updatedRequestData as any).advance_travel_days,
      advanceWorkDays: (updatedRequestData as any).advance_work_days,
      advanceTotalDays: (updatedRequestData as any).advance_total_days,
      advanceDailyRate: (updatedRequestData as any).advance_daily_rate,
      advanceAccommodationCost: (updatedRequestData as any).advance_accommodation_cost,
      advanceTransportationCost: (updatedRequestData as any).advance_transportation_cost,
      advanceMealAllowance: (updatedRequestData as any).advance_meal_allowance,
      advanceOtherExpenses: (updatedRequestData as any).advance_other_expenses,
      advanceProjectName: (updatedRequestData as any).advance_project_name,
      advanceProjectLocation: (updatedRequestData as any).advance_project_location,
      advanceExpectedReturnDate: (updatedRequestData as any).advance_expected_return_date,
      advanceUrgencyLevel: (updatedRequestData as any).advance_urgency_level,
      advanceApprovalDeadline: (updatedRequestData as any).advance_approval_deadline,
      advanceDealerName: (updatedRequestData as any).advance_dealer_name,
      advanceSubdealerName: (updatedRequestData as any).advance_subdealer_name,
      advanceLocation: (updatedRequestData as any).advance_location,
      advanceParticipants: (updatedRequestData as any).advance_participants,
      advanceEventDate: (updatedRequestData as any).advance_event_date,
      advanceExpenseItems: (updatedRequestData as any).advance_expense_items,
      department_user: (updatedRequestData as any).department_user,
      department_request: updatedRequestData.department_request,
      start_date: (updatedRequestData as any).start_date,
      end_date: (updatedRequestData as any).end_date,
    };

    // Generate new PDF with signatures - use function params as fallback
    const managerSig = updatedRequestData.manager_signature || (signatureType === 'manager' ? signature : undefined);
    const hrSig = updatedRequestData.hr_signature || (signatureType === 'hr' ? signature : undefined);
    const accountingSig = (updatedRequestData as any).accounting_signature || (signatureType === 'accounting' ? signature : undefined);

    console.log('🔍 Signature values for PDF generation:', {
      userSignature: updatedRequestData.user_signature ? 'present' : 'missing',
      managerSig: managerSig ? `present (${managerSig.length} chars)` : 'missing',
      hrSig: hrSig ? `present (${hrSig.length} chars)` : 'missing',
      accountingSig: accountingSig ? 'present' : 'missing',
      signatureType,
      fallbackUsed: !updatedRequestData.manager_signature && signatureType === 'manager' ? 'YES - using function param' : 'NO - using DB value',
    });

    const newPdfBase64 = await generateAdvancePDFAsBase64(
      advanceRequestForPDF,
      userForPDF,
      employeeData,
      updatedRequestData.user_signature,
      managerSig,
      accountingSig || hrSig
    );

    if (newPdfBase64) {
      console.log('✅ PDF generated successfully, base64 length:', newPdfBase64.length);
      
      // Convert base64 to blob for upload
      const byteCharacters = atob(newPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
      console.log('📄 PDF blob size:', pdfBlob.size, 'bytes');

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
        const filename = `advance_payment_${safeEmployeeName}_manager_approved_${timestamp}.pdf`;

        const { uploadPDFToManagerBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToManagerBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          updateData.pdf_request_manager = storageUrl;
          console.log('Advance Payment PDF uploaded to manager bucket:', storageUrl);
        } else {
          console.error('Failed to upload Advance Payment PDF to manager bucket');
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
        const filename = `advance_payment_${safeEmployeeName}_hr_approved_${timestamp}.pdf`;

        const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          updateData.pdf_request_hr = storageUrl;
          console.log('Advance Payment PDF uploaded to HR bucket:', storageUrl);
        } else {
          console.error('Failed to upload Advance Payment PDF to HR bucket');
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
        const filename = `advance_payment_${safeEmployeeName}_accounting_approved_${timestamp}.pdf`;

        const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          updateData.pdf_request_accounting = storageUrl;
          console.log('Advance Payment PDF uploaded to accounting bucket:', storageUrl);
        } else {
          console.error('Failed to upload Advance Payment PDF to accounting bucket');
          return false;
        }
      }

      const { error: pdfUpdateError } = await supabase
        .from('welfare_requests')
        .update(updateData)
        .eq('id', requestId);

      if (pdfUpdateError) {
        console.error('Error updating Advance Payment PDF:', pdfUpdateError);
        return false;
      }

      console.log(`🎉 Advance Payment ${signatureType} signature added successfully`);
      return true;
    } else {
      console.error('❌ Failed to generate PDF with signatures');
      return false;
    }
  } catch (error) {
    console.error(`Error adding ${signatureType} signature to Advance Payment PDF:`, error);
    return false;
  }
};

/**
 * Generate Advance Payment PDF and return as base64 string
 */
const generateAdvancePDFAsBase64 = async (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
): Promise<string | null> => {
  try {
    // Use sales-specific PDF generator for 'advance' (ฝ่ายขาย), general for 'general-advance'
    const pdfGenerator = advanceData.type === 'advance' ? generateSalesAdvancePDF : generateAdvancePDF;
    const pdfBlob = await pdfGenerator(
      advanceData,
      userData,
      employeeData,
      userSignature,
      managerSignature,
      accountingSignature
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
    console.error('Error generating Advance Payment PDF as base64:', error);
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
      .eq('email_user', employeeId)
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
        .select('Name, Position, Team, Budget_Training, Original_Budget_Training')
        .eq('id', numericId)
        .single();

      if (!errorById && employeeById) {
        return {
          Name: employeeById.Name,
          Position: employeeById.Position,
          Team: employeeById.Team,
          Budget_Training: (employeeById as any)?.Budget_Training,
          Original_Budget_Training: (employeeById as any)?.Original_Budget_Training
        } as any;
      }
    }

    const { data, error } = await supabase
      .from('Employee')
      .select('Name, Position, Team, Budget_Training, Original_Budget_Training')
      .eq('email_user', userId)
      .single();

    if (error || !data) return undefined;

    return {
      Name: data.Name,
      Position: data.Position,
      Team: data.Team,
      Budget_Training: (data as any)?.Budget_Training,
      Original_Budget_Training: (data as any)?.Original_Budget_Training
    } as any;
  } catch (error) {
    console.error('Error fetching employee data:', error);
    return undefined;
  }
};