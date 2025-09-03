import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InternalTrainingRequest, User, ParticipantGroup } from '@/types';

interface InternalTrainingPDFGeneratorProps {
  trainingData: InternalTrainingRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
}

const createInternalTrainingFormHTML = (
  trainingData: InternalTrainingRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  managerSignature?: string,
  hrSignature?: string,
  userSignature?: string
) => {
  const employeeName = employeeData?.Name || userData.name || '';
  const employeePosition = employeeData?.Position || userData.position || '';
  const employeeTeam = employeeData?.Team || userData.department || '';

  // Format dates
  const formatThaiDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}.${minutes}`;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Parse participants
  let participants: ParticipantGroup[] = [];
  if (typeof trainingData.participants === 'string') {
    try {
      participants = JSON.parse(trainingData.participants);
    } catch (e) {
      participants = [];
    }
  } else if (Array.isArray(trainingData.participants)) {
    participants = trainingData.participants;
  }

  // Get user signature from trainingData or parameter
  const finalUserSignature = userSignature || trainingData.userSignature || trainingData.user_signature;



  const startDate = formatThaiDate(trainingData.start_date || trainingData.startDate);
  const endDate = formatThaiDate(trainingData.end_date || trainingData.endDate);
  const startTime = formatTime(trainingData.start_time || trainingData.startTime || '09:00');
  const endTime = formatTime(trainingData.end_time || trainingData.endTime || '17:00');
  const courseName = trainingData.course_name || trainingData.courseName || trainingData.title || 'หลักสูตรอบรม';
  const venue = trainingData.venue || 'สถานที่อบรม';
  const department = trainingData.department || trainingData.userDepartment || 'ฝ่ายทรัพยากรบุคคล';
  const branch = trainingData.branch || 'สำนักงานสุรวงศ์';

  return `
    <div style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      background: white;
      color: black;
      box-sizing: border-box;
    ">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="font-size: 10px;">
          <div>ICP</div>
          <div>Ledda</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <h1 style="font-size: 14px; font-weight: bold; margin: 0;">แบบขออนุมัติจัดฝึกอบรม</h1>
        </div>
        <div style="width: 60px;"></div>
      </div>

      <!-- Form Content -->
      <div style="margin-bottom: 15px;">
        <div style="margin-bottom: 8px;">
          <span>เรื่อง</span>
          <span style="margin-left: 20px;">ขออนุมัติจัดฝึกอบรมและค่าใช้จ่ายการอบรม</span>  
        </div>
        <!-- ช่องว่างแทนเส้น -->
        <div style="margin-top: 2px; height: 5px;"></div>
        
        <div style="margin-bottom: 12px;">
          <span>เรียน</span>
          <span style="margin-left: 20px;">กรรมการผู้จัดการ</span>
        </div>
        <!-- ช่องว่างแทนเส้น -->
        <div style="margin-top: 2px; height: 5px;"></div> 
      </div>

      <!-- Main Content -->
      <div style="margin-bottom: 15px;">
        <div style="margin-bottom: 8px;">
          <span>ด้วย</span>
          <span style="margin-left: 10px;">${department}</span>
          
          <span>สาขา</span>
          <span style="margin-left: 5px;">${branch}</span>
          
          <span>มีแผนจะจัดอบรมเรื่อง</span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <span style="margin-left: 10px;">${courseName}</span>
          
        </div>
      </div>

      <!-- Date and Time Section -->
      <div style="margin-bottom: 15px;">
        <div style="margin-bottom: 8px;">
          <span>ระหว่างวันที่</span>
          <span style="margin-left: 10px;">${startDate}</span>
          
          <span>ถึง วันที่</span>
          <span style="margin-left: 5px;">${endDate}</span>
          
          <span>เวลา</span>
          <span style="margin-left: 5px;">${startTime} - ${endTime}</span>
          
        </div>
        
        <div style="margin-bottom: 8px;">
          <span>รวมระยะเวลาการอบรม</span>
          <span style="margin-left: 10px;">${trainingData.total_hours || trainingData.totalHours || 7}</span>
          
          <span>ชั่วโมง สถานที่ฝึกอบรม</span>
          <span style="margin-left: 10px;">${venue}</span>
          
        </div>
        
        <div style="margin-bottom: 12px;">
          <span>ให้แก่พนักงานบริษัทฯ ในระดับ</span>
          
        </div>
      </div>

      <!-- Participants Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px;">
        <tbody>
          ${participants.map((participant, index) => {
    const teamName = participant?.team || '';
    const count = participant?.count?.toString() || '';
    return `
              <tr style="border: 0.5px solid black;">
                <td style="border: 0.5px solid black; padding: 3px; width: 20px; text-align: center;">${index + 1}</td>
                <td style="border: 0.5px solid black; padding: 3px; width: 120px;">${teamName}</td>
                <td style="border: 0.5px solid black; padding: 3px; width: 50px; text-align: center;">จำนวน</td>
                <td style="border: 0.5px solid black; padding: 3px; width: 40px; text-align: center;">${count}</td>
                <td style="border: 0.5px solid black; padding: 3px; width: 30px; text-align: center;">คน</td>
              </tr>
            `;
  }).join('')}
          <tr style="border: 0.5px solid black; font-weight: bold;">
            <td style="border: 0.5px solid black; padding: 3px;" colspan="2">รวมจำนวน</td>
            <td style="border: 0.5px solid black; padding: 3px; text-align: center;">จำนวน</td>
            <td style="border: 0.5px solid black; padding: 3px; text-align: center;">${participants.reduce((total, p) => total + (parseInt(p?.count?.toString() || '0') || 0), 0)}</td>
            <td style="border: 0.5px solid black; padding: 3px; text-align: center;">คน</td>
          </tr>
        </tbody>
      </table>

      <!-- Cost Section -->
      <div style="margin-bottom: 15px; font-size: 10px;">
        <div style="margin-bottom: 8px; font-weight: bold;">ซึ่งมีค่าใช้จ่ายดังนี้</div>
        
        <!-- ค่าวิทยากร -->
        <div style="margin-bottom: 6px; display: flex; align-items: center;">
          <span style="width: 120px;">ค่าวิทยากร</span>
          <span style="width: 80px; text-align: right;">${formatCurrency(trainingData.instructor_fee || trainingData.instructorFee || 0)}</span>
          <span style="margin: 0 5px;">บาท</span>
          <span style="margin-left: 10px;">หักภาษี ณ ที่จ่าย 3%:</span>
          <span style="width: 60px; text-align: right; margin-left: 5px;">${formatCurrency((trainingData.instructor_fee || trainingData.instructorFee || 0) * 0.03)}</span>
          <span style="margin: 0 5px;">บาท</span>
          <span style="margin-left: 10px;">VAT 7%:</span>
          <span style="width: 60px; text-align: right; margin-left: 5px;">${formatCurrency((trainingData.instructor_fee || trainingData.instructorFee || 0) * 0.07)}</span>
          <span style="margin-left: 5px;">บาท</span>
        </div>
        
        <!-- ค่าห้อง ค่าอาหารและเครื่องดื่ม -->
        <div style="margin-bottom: 6px; display: flex; align-items: center;">
          <span style="width: 120px;">ค่าห้อง ค่าอาหารและเครื่องดื่ม</span>
          <span style="width: 80px; text-align: right;">${formatCurrency(trainingData.room_food_beverage || trainingData.roomFoodBeverage || 0)}</span>
          <span style="margin: 0 5px;">บาท</span>
          <span style="margin-left: 10px;">หักภาษี ณ ที่จ่าย 3%:</span>
          <span style="width: 60px; text-align: right; margin-left: 5px;">${formatCurrency((trainingData.room_food_beverage || trainingData.roomFoodBeverage || 0) * 0.03)}</span>
          <span style="margin: 0 5px;">บาท</span>
          <span style="margin-left: 10px;">VAT 7%:</span>
          <span style="width: 60px; text-align: right; margin-left: 5px;">${formatCurrency((trainingData.room_food_beverage || trainingData.roomFoodBeverage || 0) * 0.07)}</span>
          <span style="margin-left: 5px;">บาท</span>
        </div>
        
        <!-- ค่าอื่นๆ -->
        <div style="margin-bottom: 6px; display: flex; align-items: center;">
          <span style="width: 120px;">ค่าอื่นๆ</span>
          <span style="width: 80px; text-align: right;">${formatCurrency(trainingData.other_expenses || trainingData.otherExpenses || 0)}</span>
          <span style="margin: 0 5px;">บาท</span>
          <span style="margin-left: 10px;">หักภาษี ณ ที่จ่าย 3%:</span>
          <span style="width: 60px; text-align: right; margin-left: 5px;">${formatCurrency((trainingData.other_expenses || trainingData.otherExpenses || 0) * 0.03)}</span>
          <span style="margin: 0 5px;">บาท</span>
          <span style="margin-left: 10px;">VAT 7%:</span>
          <span style="width: 60px; text-align: right; margin-left: 5px;">${formatCurrency((trainingData.other_expenses || trainingData.otherExpenses || 0) * 0.07)}</span>
          <span style="margin-left: 5px;">บาท</span>
        </div>
        
        <!-- รวมทั้งสิ้น -->
        <div style="margin-top: 10px; padding-top: 6px; border-top: 1px solid black; font-weight: bold;">
          <span>รวมทั้งสิ้น</span>
          <span style="margin-left: 20px;">${formatCurrency(
    (trainingData.instructor_fee || trainingData.instructorFee || 0) +
    (trainingData.room_food_beverage || trainingData.roomFoodBeverage || 0) +
    (trainingData.other_expenses || trainingData.otherExpenses || 0)
  )}</span>
          <span style="margin-left: 5px;">บาท</span>
          <span style="margin-left: 20px;">คิดเป็นค่าใช้จ่าย/คน:</span>
          <span style="margin-left: 5px;">${formatCurrency(
    ((trainingData.instructor_fee || trainingData.instructorFee || 0) +
      (trainingData.room_food_beverage || trainingData.roomFoodBeverage || 0) +
      (trainingData.other_expenses || trainingData.otherExpenses || 0)) /
    (participants.reduce((total, p) => total + (parseInt(p?.count?.toString() || '0') || 0), 0) || 1)
  )}</span>
          <span style="margin-left: 5px;">บาท</span>
        </div>
      </div>

      <!-- Notes Section -->
      <div style="margin-bottom: 15px; font-size: 10px;">
        <div style="margin-bottom: 6px;">
          <span>หมายเหตุ: ทำหนังสือรับรองหักภาษี ณ ที่จ่าย</span>
          <span style="margin-left: 10px;">${formatCurrency(trainingData.withholding_tax_amount || trainingData.withholdingTaxAmount || 0)}</span>
          <span style="border-bottom: 1px solid black; display: inline-block; width: 80px; margin: 0 5px;"></span>
          <span>บาท และชำระในนาม</span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <span>ลงวันที่</span>
          <span style="margin-left: 10px;">${new Date().toLocaleDateString('th-TH')}</span>
          <span style="border-bottom: 1px solid black; display: inline-block; width: 80px; margin: 0 5px;"></span>
          <span>จำนวน</span>
          <span style="margin-left: 10px;">${formatCurrency(trainingData.withholding_tax_amount || trainingData.withholdingTaxAmount || 0)}</span>
          <span style="border-bottom: 1px solid black; display: inline-block; width: 60px; margin: 0 5px;"></span>
          <span>บาท</span>
        </div>
        
        <div style="margin-bottom: 15px; margin-left: 10px;">
          จึงเรียนมาเพื่อพิจารณาอนุมัติ
        </div>
      </div>

      <!-- Signature Section -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr style="border: 1px solid black;">
          <td style="border: 1px solid black; padding: 10px; width: 33.33%; text-align: center; vertical-align: top;">
            <div style="font-size: 9px; margin-bottom: 5px;">ผู้ร้องขอ</div>
            <div style="height: 40px; display: flex; align-items: center; justify-content: center;">
              ${finalUserSignature ? `
                <img src="${finalUserSignature}" alt="User Signature" style="max-width: 120px; max-height: 35px;" />
              ` : ''}
            </div>
            <div style="border-top: 1px solid black; margin-top: 5px; padding-top: 3px;">
              <div style="font-size: 8px;">(${employeeName || '......................................'})</div>
              <div style="font-size: 8px;">ลงชื่อ................................</div>
              <div style="font-size: 8px;">วันที่ ${trainingData.createdAt ? formatThaiDate(trainingData.createdAt) : trainingData.created_at ? formatThaiDate(trainingData.created_at) : formatThaiDate(new Date().toISOString())}</div>
            </div>
          </td>
          <td style="border: 1px solid black; padding: 10px; width: 33.33%; text-align: center; vertical-align: top;">
            <div style="font-size: 9px; margin-bottom: 5px;">ผู้ทรัพยากรบุคคล</div>
            <div style="height: 40px; display: flex; align-items: center; justify-content: center;">
              ${hrSignature ? `
                <img src="${hrSignature}" alt="HR Signature" style="max-width: 120px; max-height: 35px;" />
              ` : ''}
            </div>
            <div style="border-top: 1px solid black; margin-top: 5px; padding-top: 3px;">
              <div style="font-size: 8px;">(${trainingData.hr_approver_name || trainingData.hrApproverName || '......................................'})</div>
              <div style="font-size: 8px;">ลงชื่อ................................</div>
              <div style="font-size: 8px;">วันที่ ${trainingData.hr_approved_at ? formatThaiDate(trainingData.hr_approved_at) : trainingData.hrApprovedAt ? formatThaiDate(trainingData.hrApprovedAt) : '..............................'}</div>
            </div>
          </td>
          <td style="border: 1px solid black; padding: 10px; width: 33.33%; text-align: center; vertical-align: top;">
            <div style="font-size: 9px; margin-bottom: 5px;">ผู้อนุมัติ/ผู้จัดการทั่วไป</div>
            <div style="height: 40px; display: flex; align-items: center; justify-content: center;">
              ${managerSignature ? `
                <img src="${managerSignature}" alt="Manager Signature" style="max-width: 120px; max-height: 35px;" />
              ` : ''}
            </div>
            <div style="border-top: 1px solid black; margin-top: 5px; padding-top: 3px;">
              <div style="font-size: 8px;">(${trainingData.manager_approver_name || trainingData.managerApproverName || '......................................'})</div>
              <div style="font-size: 8px;">ลงชื่อ................................</div>
              <div style="font-size: 8px;">วันที่ ${trainingData.manager_approved_at ? formatThaiDate(trainingData.manager_approved_at) : trainingData.managerApprovedAt ? formatThaiDate(trainingData.managerApprovedAt) : '..............................'}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <div style="margin-top: 20px;">
        <div style="font-size: 8px; margin-bottom: 10px;">
          หมายเหตุ : แบบฟอร์มนี้ต้องได้รับการอนุมัติก่อนจัดฝึกอบรมอย่างน้อย 1 สัปดาห์
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 9px;">
          <span>F-TRA-01-05 Rev: 00</span>
          <span>01/02/2561</span>
        </div>
      </div>
    </div>
  `;
};

export const generateInternalTrainingPDF = async (
  trainingData: InternalTrainingRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  managerSignature?: string,
  hrSignature?: string,
  userSignature?: string
): Promise<Blob> => {
  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createInternalTrainingFormHTML(trainingData, userData, employeeData, managerSignature, hrSignature, userSignature);
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '794px'; // Fixed width for consistent rendering
  tempDiv.style.height = '1123px'; // Fixed height for A4
  document.body.appendChild(tempDiv);

  try {
    // Convert HTML to canvas with optimized settings for smaller file size
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 1, // Reduced scale for smaller file size
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Use JPEG with compression for smaller file size
    const imgData = canvas.toDataURL('image/jpeg', 0.8); // 80% quality

    // Calculate dimensions to fit A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Return PDF as Blob
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

// เพิ่มฟังก์ชันสำหรับ download PDF (เพื่อใช้ในกรณีที่ต้องการ download)
export const generateAndDownloadInternalTrainingPDF = async (
  trainingData: InternalTrainingRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  managerSignature?: string,
  hrSignature?: string,
  userSignature?: string
) => {
  try {
    const pdfBlob = await generateInternalTrainingPDF(trainingData, userData, employeeData, managerSignature, hrSignature, userSignature);

    // Generate filename
    const employeeName = employeeData?.Name || userData.name || '';
    const courseName = trainingData.course_name || trainingData.courseName || trainingData.title || 'training';
    const filename = `internal_training_${courseName.replace(/\s+/g, '_')}_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return filename;
  } catch (error) {
    console.error('Error generating and downloading PDF:', error);
    throw error;
  }
};

export const InternalTrainingPDFGenerator: React.FC<InternalTrainingPDFGeneratorProps> = ({
  trainingData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadInternalTrainingPDF(trainingData, userData, employeeData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      ดาวน์โหลด PDF
    </button>
  );
};