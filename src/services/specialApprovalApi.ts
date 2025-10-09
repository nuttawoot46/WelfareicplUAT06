import { supabase } from '@/integrations/supabase/client';

export interface SpecialApprovalRequest {
  id: number;
  request_type: string;
  amount: number;
  employee_name: string;
  course_name: string;
  created_at: string;
  status: string;
  requires_special_approval: boolean;
}

/**
 * Get all requests that require special approval
 */
export const getSpecialApprovalRequests = async (): Promise<SpecialApprovalRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('welfare_requests')
      .select(`
        id,
        request_type,
        amount,
        employee_name,
        course_name,
        created_at,
        status,
        requires_special_approval,
        hr_approved_at
      `)
      .eq('requires_special_approval', true)
      .eq('status', 'pending_special_approval')
      .in('request_type', ['training', 'internal_training'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching special approval requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSpecialApprovalRequests:', error);
    throw error;
  }
};

/**
 * Approve a special approval request
 */
export const approveSpecialRequest = async (
  requestId: number,
  approverId: string,
  approverName: string,
  signature: string,
  notes?: string
): Promise<void> => {
  try {
    console.log('Approving special request:', { requestId, approverId, approverName });
    
    // First, try to update with the signature column
    let updateData: any = {
      status: 'pending_accounting',
      special_approver_id: approverId,
      special_approver_name: approverName,
      special_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add notes if provided (column may not exist in all schemas)
    if (notes) {
      updateData.hr_notes = notes; // Use hr_notes column instead of notes
    }

    // Try to add signature if column exists
    try {
      updateData.special_approver_signature = signature;
    } catch (e) {
      console.warn('special_approver_signature column may not exist yet');
    }

    const { error } = await supabase
      .from('welfare_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('Error approving special request:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If error is about missing column, try without signature
      if (error.message?.includes('special_approver_signature') || error.code === '42703') {
        console.log('Retrying without special_approver_signature column...');
        delete updateData.special_approver_signature;
        
        const { error: retryError } = await supabase
          .from('welfare_requests')
          .update(updateData)
          .eq('id', requestId);
          
        if (retryError) {
          console.error('Retry also failed:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    console.log('Special request approved successfully, checking for PDF generation...');

    // Generate PDF with special signature for external training requests
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('request_type')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching request type:', fetchError);
      throw fetchError;
    }

    console.log('Request type:', requestData?.request_type);

    if (requestData?.request_type === 'training') {
      console.log('Generating PDF with special signature for training request...');
      try {
        const { addSignatureToExternalTrainingSpecialPDF } = await import('@/utils/externalTrainingPdfSpecial');
        await addSignatureToExternalTrainingSpecialPDF(requestId, 'special', signature, approverName);
      } catch (pdfError) {
        console.error('Error generating PDF, but approval was successful:', pdfError);
        // Don't throw - approval was successful even if PDF generation failed
      }
    }
  } catch (error: any) {
    console.error('Error in approveSpecialRequest:', error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error details:', error?.details);
    throw error;
  }
};

/**
 * Reject a special approval request
 */
export const rejectSpecialRequest = async (
  requestId: number,
  approverId: string,
  approverName: string,
  reason: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('welfare_requests')
      .update({
        status: 'rejected_special_approval',
        special_approver_id: approverId,
        special_approver_name: approverName,
        special_approved_at: new Date().toISOString(),
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting special request:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in rejectSpecialRequest:', error);
    throw error;
  }
};

/**
 * Check if user is authorized for special approval
 */
export const isSpecialApprover = (userEmail: string, userRole?: string): boolean => {
  return userEmail === 'kanin.s@icpladda.com' || userRole?.toLowerCase() === 'admin';
};