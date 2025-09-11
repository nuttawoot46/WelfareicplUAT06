import { WelfareRequest, User } from '@/types';
import { generateInternalTrainingPDFFromHTML } from '@/components/pdf/InternalTrainingPDFGeneratorHTML';
import { supabase } from '@/lib/supabase';

/**
 * Internal Training PDF Manager
 * Handles PDF generation and management for internal training requests
 */

/**
 * Create initial PDF for internal training when request is submitted
 */
export const createInitialInternalTrainingPDF = async (
  request: WelfareRequest,
  user: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string }
): Promise<string | null> => {
  try {
    console.log('Creating initial Internal Training PDF for request:', request.id);

    // Generate PDF Blob with user signature only using HTML-to-PDF for Thai language support
    const pdfBlob = await generateInternalTrainingPDFFromHTML(
      request as any, // Cast to InternalTrainingRequest
      user,
      employeeData
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
        console.error('Error saving initial Internal Training PDF:', error);
        return null;
      }

      console.log('Initial Internal Training PDF created and saved successfully');
      return pdfBase64;
    }

    return null;
  } catch (error) {
    console.error('Error creating initial Internal Training PDF:', error);
    return null;
  }
};

/**
 * Add signature to existing internal training PDF
 */
export const addSignatureToInternalTrainingPDF = async (
  requestId: number,
  signatureType: 'manager' | 'hr',
  signature: string,
  approverName: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Adding ${signatureType} signature to Internal Training PDF, request:`, requestId);

    // Get current request data
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      console.error('❌ Error fetching Internal Training request data:', fetchError);
      return false;
    }

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
      console.error('❌ Error updating Internal Training signature:', updateError);
      return false;
    }

    // Get updated request data with new signature
    const { data: updatedRequestData, error: updatedFetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (updatedFetchError || !updatedRequestData) {
      console.error('Error fetching updated Internal Training request data:', updatedFetchError);
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
    const welfareRequestForPDF: WelfareRequest = {
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
      attachmentSelections: (() => {
        try {
          if (!updatedRequestData.attachment_selections) return undefined;
          if (typeof updatedRequestData.attachment_selections === 'string') {
            return JSON.parse(updatedRequestData.attachment_selections);
          }
          return updatedRequestData.attachment_selections;
        } catch {
          return undefined;
        }
      })(),
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
      department_user: updatedRequestData.department_user,
      department_request: updatedRequestData.department_request,
      // Internal Training specific fields
      course_name: updatedRequestData.course_name,
      organizer: updatedRequestData.organizer,
      training_topics: updatedRequestData.training_topics,
      start_date: updatedRequestData.start_date,
      end_date: updatedRequestData.end_date,
      total_days: updatedRequestData.total_days
    };

    // Generate new PDF with signatures using HTML-to-PDF
    const newPdfBlob = await generateInternalTrainingPDFFromHTML(
      welfareRequestForPDF as any, // Cast to InternalTrainingRequest
      userForPDF,
      employeeData
    );

    if (newPdfBlob) {
      // Store PDF in appropriate bucket
      const result = await storeInternalTrainingPDFInDatabase(
        requestId,
        newPdfBlob,
        signature,
        signatureType,
        approverName
      );

      if (result) {
        console.log(`🎉 Internal Training ${signatureType} signature added successfully`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error adding ${signatureType} signature to Internal Training PDF:`, error);
    return false;
  }
};

/**
 * Store Internal Training PDF in database
 */
export const storeInternalTrainingPDFInDatabase = async (
  requestId: number,
  pdfBlob: Blob,
  signature: string,
  signatureType: 'manager' | 'hr',
  approverName: string
): Promise<boolean> => {
  try {
    console.log(`🔄 Storing Internal Training PDF in database for ${signatureType} signature, request:`, requestId);

    // Get current request data
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      console.error('❌ Error fetching Internal Training request data:', fetchError);
      return false;
    }

    // Get employee data for filename
    const actualEmployeeName = await getActualEmployeeName(requestData.employee_id?.toString());
    const employeeName = actualEmployeeName || requestData.employee_name || 'user';
    
    // Create safe filename
    const safeEmployeeName = employeeName
      .replace(/\s+/g, '_')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 50) || 'employee';

    const timestamp = Date.now();
    const filename = `internal_training_${safeEmployeeName}_${signatureType}_approved_${timestamp}.pdf`;

    // Upload to appropriate bucket
    let storageUrl: string | null = null;
    
    if (signatureType === 'manager') {
      const { uploadPDFToManagerBucket } = await import('@/utils/pdfUtils');
      storageUrl = await uploadPDFToManagerBucket(pdfBlob, filename, requestData.employee_id?.toString());
    } else if (signatureType === 'hr') {
      const { uploadPDFToHRBucket } = await import('@/utils/pdfUtils');
      storageUrl = await uploadPDFToHRBucket(pdfBlob, filename, requestData.employee_id?.toString());
    }

    if (!storageUrl) {
      console.error('Failed to upload Internal Training PDF to storage');
      return false;
    }

    // Update database with PDF URL
    const updateData: any = {};
    if (signatureType === 'manager') {
      updateData.pdf_request_manager = storageUrl;
    } else if (signatureType === 'hr') {
      updateData.pdf_request_hr = storageUrl;
    }

    const { error: updateError } = await supabase
      .from('welfare_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error updating Internal Training PDF URL:', updateError);
      return false;
    }

    console.log(`✅ Internal Training PDF stored successfully for ${signatureType} approval:`, storageUrl);
    return true;

  } catch (error) {
    console.error(`❌ Error storing Internal Training PDF in database:`, error);
    return false;
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