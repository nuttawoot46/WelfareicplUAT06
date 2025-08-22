import { WelfareRequest, User } from '@/types';
import { generateAndDownloadWelfarePDF } from '@/components/pdf/WelfarePDFGenerator';
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
        .select('Name, Position, Team, start_date')
        .eq('"email_user"', request.userId)
        .single();
      
      console.log('Employee query result:', { data, error });
      
      if (data) {
        employeeData = {
          Name: data.Name,
          Position: data.Position,
          Team: data.Team,
          start_date: data.start_date
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
    await generateAndDownloadWelfarePDF(
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

export const uploadPDFToManagerBucket = async (
  blob: Blob,
  filename: string,
  userId?: string
): Promise<string | null> => {
  try {
    console.log('🔄 Starting upload to welfare-pdfs-manager bucket');
    console.log('📁 Upload path:', `${userId}/${filename}`);
    console.log('📄 Blob size:', blob.size, 'bytes');
    
    // First, try to list buckets to check if welfare-pdfs-manager exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
    } else {
      console.log('📦 Available buckets:', buckets?.map(b => b.name));
      const managerBucketExists = buckets?.some(b => b.name === 'welfare-pdfs-manager');
      console.log('🔍 welfare-pdfs-manager bucket exists:', managerBucketExists);
      
      if (!managerBucketExists) {
        console.log('🔧 Creating welfare-pdfs-manager bucket...');
        const { error: createError } = await supabase.storage.createBucket('welfare-pdfs-manager', {
          public: true,
          allowedMimeTypes: ['application/pdf'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (createError) {
          console.error('❌ Error creating bucket:', createError);
          // Try to use existing welfare-pdfs bucket as fallback
          console.log('🔄 Falling back to welfare-pdfs bucket...');
          return await uploadPDFToSupabase(blob, filename, userId);
        } else {
          console.log('✅ welfare-pdfs-manager bucket created successfully');
        }
      }
    }
    
    const { data, error } = await supabase.storage
      .from('welfare-pdfs-manager')
      .upload(`${userId}/${filename}`, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('❌ Error uploading PDF to Manager bucket:', error);
      console.log('🔄 Falling back to welfare-pdfs bucket...');
      // Fallback to regular welfare-pdfs bucket
      return await uploadPDFToSupabase(blob, filename, userId);
    }

    console.log('✅ PDF uploaded successfully to Manager bucket:', data.path);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('welfare-pdfs-manager')
      .getPublicUrl(data.path);

    console.log('🔗 Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading PDF to Manager bucket:', error);
    console.log('🔄 Falling back to welfare-pdfs bucket...');
    // Fallback to regular welfare-pdfs bucket
    try {
      return await uploadPDFToSupabase(blob, filename, userId);
    } catch (fallbackError) {
      console.error('❌ Fallback upload also failed:', fallbackError);
      return null;
    }
  }
};

export const uploadPDFToHRBucket = async (
  blob: Blob,
  filename: string,
  userId?: string
): Promise<string | null> => {
  try {
    console.log('🔄 Starting upload to welfare-pdfs-hr bucket');
    console.log('📁 Upload path:', `${userId}/${filename}`);
    console.log('📄 Blob size:', blob.size, 'bytes');
    
    // First, try to list buckets to check if welfare-pdfs-hr exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
    } else {
      console.log('📦 Available buckets:', buckets?.map(b => b.name));
      const hrBucketExists = buckets?.some(b => b.name === 'welfare-pdfs-hr');
      console.log('🔍 welfare-pdfs-hr bucket exists:', hrBucketExists);
      
      if (!hrBucketExists) {
        console.log('🔧 Creating welfare-pdfs-hr bucket...');
        const { error: createError } = await supabase.storage.createBucket('welfare-pdfs-hr', {
          public: true,
          allowedMimeTypes: ['application/pdf'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (createError) {
          console.error('❌ Error creating bucket:', createError);
          // Try to use existing welfare-pdfs bucket as fallback
          console.log('🔄 Falling back to welfare-pdfs bucket...');
          return await uploadPDFToSupabase(blob, filename, userId);
        } else {
          console.log('✅ welfare-pdfs-hr bucket created successfully');
        }
      }
    }
    
    const { data, error } = await supabase.storage
      .from('welfare-pdfs-hr')
      .upload(`${userId}/${filename}`, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('❌ Error uploading PDF to HR bucket:', error);
      console.log('🔄 Falling back to welfare-pdfs bucket...');
      // Fallback to regular welfare-pdfs bucket
      return await uploadPDFToSupabase(blob, filename, userId);
    }

    console.log('✅ PDF uploaded successfully to HR bucket:', data.path);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('welfare-pdfs-hr')
      .getPublicUrl(data.path);

    console.log('🔗 Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading PDF to HR bucket:', error);
    console.log('🔄 Falling back to welfare-pdfs bucket...');
    // Fallback to regular welfare-pdfs bucket
    try {
      return await uploadPDFToSupabase(blob, filename, userId);
    } catch (fallbackError) {
      console.error('❌ Fallback upload also failed:', fallbackError);
      return null;
    }
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
        .select('Name, Position, Team, start_date')
        .eq('"email_user"', request.userId)
        .single();
      
      if (data) {
        employeeData = {
          Name: data.Name,
          Position: data.Position,
          Team: data.Team,
          start_date: data.start_date
        };
      }
    }

    // Generate final PDF with all signatures
    await generateAndDownloadWelfarePDF(
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