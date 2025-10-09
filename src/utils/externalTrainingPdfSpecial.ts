import { WelfareRequest, User } from '@/types';
import { generateTrainingPDF } from '@/components/pdf/TrainingPDFGenerator';
import { supabase } from '@/lib/supabase';

/**
 * External Training PDF Manager for Special Approval (> 10,000 THB)
 * Handles PDF generation and management for external training requests requiring special approval
 * Flow: User -> Manager -> HR -> Special Approval (Deputy Managing Director) -> Accounting
 */

/**
 * Create initial PDF for external training when request is submitted
 */
export const createInitialExternalTrainingSpecialPDF = async (
  request: WelfareRequest,
  user: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string }
): Promise<string | null> => {
  try {
    console.log('Creating initial External Training Special PDF for request:', request.id);

    // Get remaining budget for training PDF
    const remainingBudget = user.training_budget || (employeeData as any)?.Budget_Training || 0;
    
    // Generate PDF Blob with user signature only
    const pdfBlob = await generateTrainingPDF(
      request,
      user,
      employeeData,
      request.userSignature,
      remainingBudget,
      undefined, // managerSignature - not available during initial creation
      undefined, // hrSignature - not available during initial creation
      undefined  // specialSignature - not available during initial creation
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
        console.error('Error saving initial External Training Special PDF:', error);
        return null;
      }

      console.log('Initial External Training Special PDF created and saved successfully');
      return pdfBase64;
    }

    return null;
  } catch (error) {
    console.error('Error creating initial External Training Special PDF:', error);
    return null;
  }
};

/**
 * Add signature to existing external training special PDF
 */
export const addSignatureToExternalTrainingSpecialPDF = async (
  requestId: number,
  signatureType: 'manager' | 'hr' | 'special',
  signature: string,
  approverName: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Adding ${signatureType} signature to External Training Special PDF, request:`, requestId);

    // Get current request data
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      console.error('❌ Error fetching External Training Special request data:', fetchError);
      return false;
    }

    // Update signature fields in database
    const signatureUpdateData: any = {};
    if (signatureType === 'manager') {
      signatureUpdateData.manager_signature = signature;
    } else if (signatureType === 'hr') {
      signatureUpdateData.hr_signature = signature;
    } else if (signatureType === 'special') {
      signatureUpdateData.special_approver_signature = signature;
      signatureUpdateData.special_approver_name = approverName;
      signatureUpdateData.special_approved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('welfare_requests')
      .update(signatureUpdateData)
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error updating External Training Special signature:', updateError);
      return false;
    }

    // Get updated request data with new signature
    const { data: updatedRequestData, error: updatedFetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (updatedFetchError || !updatedRequestData) {
      console.error('Error fetching updated External Training Special request data:', updatedFetchError);
      return false;
    }

    // Get employee data and user data for PDF generation
    const employeeData = await getEmployeeData(updatedRequestData.employee_id?.toString() || '');
    const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
    
    if (employeeData && actualEmployeeName && actualEmployeeName !== employeeData.Name) {
      employeeData.Name = actualEmployeeName;
    }

    const userForPDF: User = {
      id: updatedRequestData.employee_id?.toString() || '',
      email: employeeData?.Name || '',
      name: actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || '',
      position: employeeData?.Position || '',
      role: 'employee' as const,
      department: employeeData?.Team || updatedRequestData.department_request || '',
      budget_fitness: 0,
      training_budget: (employeeData as any)?.Budget_Training,
      original_training_budget: (employeeData as any)?.Original_Budget_Training
    };

    // Convert database fields to WelfareRequest format
    const welfareRequestForPDF: WelfareRequest = {
      id: updatedRequestData.id,
      userId: updatedRequestData.employee_id?.toString() || '',
      userName: actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || '',
      userDepartment: employeeData?.Team || updatedRequestData.department_request || '',
      type: updatedRequestData.request_type as any,
      status: updatedRequestData.status as any,
      amount: updatedRequestData.amount || 0,
      date: updatedRequestData.created_at,
      details: updatedRequestData.details || '',
      attachments: updatedRequestData.attachment_url ? JSON.parse(updatedRequestData.attachment_url) : [],
      attachmentSelections: undefined,
      createdAt: updatedRequestData.created_at,
      updatedAt: updatedRequestData.created_at,
      title: updatedRequestData.title,
      userSignature: updatedRequestData.user_signature,
      managerSignature: updatedRequestData.manager_signature,
      hrSignature: updatedRequestData.hr_signature,
      specialSignature: (updatedRequestData as any).special_approver_signature,
      managerApproverName: updatedRequestData.manager_approver_name,
      managerApprovedAt: updatedRequestData.manager_approved_at,
      hrApproverName: updatedRequestData.hr_approver_name,
      hrApprovedAt: updatedRequestData.hr_approved_at,
      specialApproverName: (updatedRequestData as any).special_approver_name,
      specialApprovedAt: (updatedRequestData as any).special_approved_at,
      birth_type: (updatedRequestData as any).birth_type,
      department_user: updatedRequestData.department_request,
      department_request: updatedRequestData.department_request,
      // External Training specific fields
      course_name: updatedRequestData.course_name,
      organizer: (updatedRequestData as any).organizer,
      training_topics: (updatedRequestData as any).training_topics,
      start_date: updatedRequestData.start_date,
      end_date: updatedRequestData.end_date,
      total_days: (updatedRequestData as any).total_days
    };

    // Generate new PDF with signatures
    const newPdfBase64 = await generateExternalTrainingSpecialPDFAsBase64(
      welfareRequestForPDF,
      userForPDF,
      employeeData,
      updatedRequestData.user_signature,
      updatedRequestData.manager_signature,
      updatedRequestData.hr_signature,
      (updatedRequestData as any).special_approver_signature
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

      const pdfUpdateData: any = {};

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
        const filename = `external_training_special_${safeEmployeeName}_manager_approved_${timestamp}.pdf`;

        const { uploadPDFToManagerBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToManagerBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          pdfUpdateData.pdf_request_manager = storageUrl;
          console.log('✅ External Training Special PDF uploaded to manager bucket:', storageUrl);
        } else {
          console.error('❌ Failed to upload External Training Special PDF to manager bucket');
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
        const filename = `external_training_special_${safeEmployeeName}_hr_approved_${timestamp}.pdf`;

        const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          pdfUpdateData.pdf_request_hr = storageUrl;
          console.log('✅ External Training Special PDF uploaded to HR bucket:', storageUrl);
        } else {
          console.error('❌ Failed to upload External Training Special PDF to HR bucket');
          return false;
        }

      } else if (signatureType === 'special') {
        // Upload to special approval bucket
        const actualEmployeeName = await getActualEmployeeName(updatedRequestData.employee_id?.toString());
        const employeeName = actualEmployeeName || employeeData?.Name || updatedRequestData.employee_name || 'user';
        const safeEmployeeName = employeeName
          .replace(/\s+/g, '_')
          .replace(/[^\x00-\x7F]/g, '')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .substring(0, 50) || 'employee';

        const timestamp = Date.now();
        const filename = `external_training_special_${safeEmployeeName}_special_approved_${timestamp}.pdf`;

        // For now, use HR bucket for special approvals (can create separate bucket later)
        const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
        const storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, updatedRequestData.employee_id?.toString());

        if (storageUrl) {
          pdfUpdateData.pdf_request_special = storageUrl;
          console.log('✅ External Training Special PDF uploaded to special bucket:', storageUrl);
        } else {
          console.error('❌ Failed to upload External Training Special PDF to special bucket');
          return false;
        }
      }

      // Update database with PDF URL
      console.log('📝 Updating database with PDF URL:', pdfUpdateData);
      const { error: pdfUrlUpdateError } = await supabase
        .from('welfare_requests')
        .update(pdfUpdateData)
        .eq('id', requestId);

      if (pdfUrlUpdateError) {
        console.error('❌ Error updating PDF URL in database:', pdfUrlUpdateError);
        return false;
      }

      console.log(`✅ External Training Special ${signatureType} signature and PDF URL updated successfully`);
      return true;
    }

    // If no PDF was generated, still return success for signature update
    console.log('⚠️ No PDF generated, but signature was updated');
    return true;
  } catch (error) {
    console.error(`❌ Error adding ${signatureType} signature to External Training Special PDF:`, error);
    return false;
  }
};

/**
 * Generate External Training Special PDF and return as base64 string
 */
const generateExternalTrainingSpecialPDFAsBase64 = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string,
  specialSignature?: string
): Promise<string | null> => {
  try {
    console.log('=== Generating External Training Special PDF ===');
    
    // Get remaining budget for training PDF
    const remainingBudget = userData.training_budget || (employeeData as any)?.Budget_Training || 0;
    
    const pdfBlob = await generateTrainingPDF(
      welfareData,
      userData,
      employeeData,
      userSignature,
      remainingBudget,
      managerSignature,
      hrSignature,
      specialSignature
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
    console.error('Error generating External Training Special PDF as base64:', error);
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
      .eq('"email_user"', userId)
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
