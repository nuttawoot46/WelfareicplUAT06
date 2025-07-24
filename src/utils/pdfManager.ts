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
    
    // Generate PDF without any signatures
    const pdfBase64 = await generateWelfarePDFAsBase64(
      request,
      user,
      employeeData
    );
    
    if (pdfBase64) {
      // Save PDF to database
      const { error } = await supabase
        .from('welfare_requests')
        .update({ pdf_request: pdfBase64 })
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
    console.log(`Adding ${signatureType} signature to PDF for request:`, requestId);
    
    // Get current request data including PDF
    const { data: requestData, error: fetchError } = await supabase
      .from('welfare_requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (fetchError || !requestData) {
      console.error('Error fetching request data:', fetchError);
      return false;
    }
    
    if (!requestData.pdf_request) {
      console.error('No PDF found for request:', requestId);
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
      console.error('Error updating signature:', updateError);
      return false;
    }
    
    // Get updated request data
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
    const employeeData = await getEmployeeData(updatedRequestData.userId);
    const newPdfBase64 = await generateWelfarePDFAsBase64(
      updatedRequestData,
      { id: updatedRequestData.userId } as User, // Minimal user object
      employeeData,
      updatedRequestData.user_signature,
      updatedRequestData.manager_signature,
      updatedRequestData.hr_signature
    );
    
    if (newPdfBase64) {
      // Update PDF in database
      const { error: pdfUpdateError } = await supabase
        .from('welfare_requests')
        .update({ pdf_request: newPdfBase64 })
        .eq('id', requestId);
        
      if (pdfUpdateError) {
        console.error('Error updating PDF:', pdfUpdateError);
        return false;
      }
      
      console.log(`${signatureType} signature added to PDF successfully`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error adding ${signatureType} signature to PDF:`, error);
    return false;
  }
};

/**
 * Get employee data for PDF generation
 */
const getEmployeeData = async (userId: string): Promise<{ Name: string; Position: string; Team: string } | undefined> => {
  try {
    const { data, error } = await supabase
      .from('Employee')
      .select('Name, Position, Team')
      .eq('"email_user"', userId)
      .single();
      
    if (error || !data) {
      console.log('No employee data found for userId:', userId);
      return undefined;
    }
    
    return {
      Name: data.Name,
      Position: data.Position,
      Team: data.Team
    };
  } catch (error) {
    console.error('Error fetching employee data:', error);
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
    // This would need to be implemented to return base64 instead of downloading
    // For now, we'll use the existing generateWelfarePDF function
    await generateWelfarePDF(welfareData, userData, employeeData, userSignature, managerSignature, hrSignature);
    
    // TODO: Modify generateWelfarePDF to return base64 string instead of downloading
    // This is a placeholder - you'll need to modify the PDF generator
    return null;
  } catch (error) {
    console.error('Error generating PDF as base64:', error);
    return null;
  }
};

/**
 * Download PDF from database
 */
export const downloadPDFFromDatabase = async (requestId: number): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('welfare_requests')
      .select('pdf_request, userName, type')
      .eq('id', requestId)
      .single();
      
    if (error || !data || !data.pdf_request) {
      console.error('Error fetching PDF or PDF not found:', error);
      return;
    }
    
    // Convert base64 to blob and download
    const byteCharacters = atob(data.pdf_request);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `welfare_request_${data.userName}_${data.type}_${requestId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
};