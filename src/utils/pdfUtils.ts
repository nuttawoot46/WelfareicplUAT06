import { WelfareRequest, User } from '@/types';
import { generateWelfarePDF } from '@/components/pdf/WelfarePDFGenerator';
import { supabase } from '@/lib/supabase';

export const uploadPDFToSupabase = async (
  blob: Blob,
  filename: string,
  userId?: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('welfare-pdfs')
      .upload(`${userId}/${filename}`, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('Error uploading PDF to Supabase:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('welfare-pdfs')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return null;
  }
};

export const updatePDFWithSignature = async (
  request: WelfareRequest,
  user: User,
  signatureType: 'manager' | 'hr',
  signature: string
) => {
  try {
    console.log('updatePDFWithSignature - request:', request);
    console.log('updatePDFWithSignature - request.userId:', request.userId);
    console.log('updatePDFWithSignature - request.userName:', request.userName);
    
    // Get employee data if needed
    let employeeData;
    if (request.userId) {
      console.log('Searching for employee with email_user:', request.userId);
      const { data, error } = await supabase
        .from('Employee')
        .select('Name, Position, Team')
        .eq('"email_user"', request.userId)
        .single();
      
      console.log('Employee query result:', { data, error });
      
      if (data) {
        employeeData = {
          Name: data.Name,
          Position: data.Position,
          Team: data.Team
        };
      }
    }
    
    // If no employee data found, try to use request.userName
    if (!employeeData && request.userName) {
      console.log('No employee data found, using request.userName:', request.userName);
      employeeData = {
        Name: request.userName,
        Position: request.userDepartment || 'พนักงาน',
        Team: request.userDepartment || 'ไม่ระบุแผนก'
      };
    }
    
    // Fallback: if still no employee data, use basic info
    if (!employeeData) {
      console.log('Using fallback employee data');
      employeeData = {
        Name: request.userName || 'ไม่ระบุชื่อ',
        Position: 'พนักงาน',
        Team: 'ไม่ระบุแผนก'
      };
    }
    
    console.log('Final employeeData:', employeeData);

    // Prepare signatures
    const userSignature = request.userSignature;
    const managerSignature = signatureType === 'manager' ? signature : request.managerSignature;
    const hrSignature = signatureType === 'hr' ? signature : request.hrSignature;

    console.log('Signature preparation:', {
      signatureType,
      userSignature: userSignature ? 'Present' : 'Missing',
      managerSignature: managerSignature ? 'Present' : 'Missing',
      hrSignature: hrSignature ? 'Present' : 'Missing',
      requestManagerSignature: request.managerSignature ? 'Present' : 'Missing',
      requestHrSignature: request.hrSignature ? 'Present' : 'Missing'
    });

    // Generate PDF with all available signatures
    await generateWelfarePDF(
      request,
      user,
      employeeData,
      userSignature,
      managerSignature,
      hrSignature
    );

    return true;
  } catch (error) {
    console.error('Error updating PDF with signature:', error);
    return false;
  }
};

export const generateFinalPDF = async (
  request: WelfareRequest,
  user: User
) => {
  try {
    // Get employee data
    let employeeData;
    if (request.userId) {
      const { data } = await supabase
        .from('Employee')
        .select('Name, Position, Team')
        .eq('"email_user"', request.userId)
        .single();
      
      if (data) {
        employeeData = {
          Name: data.Name,
          Position: data.Position,
          Team: data.Team
        };
      }
    }

    // Generate final PDF with all signatures
    await generateWelfarePDF(
      request,
      user,
      employeeData,
      request.userSignature,
      request.managerSignature,
      request.hrSignature
    );

    return true;
  } catch (error) {
    console.error('Error generating final PDF:', error);
    return false;
  }
};