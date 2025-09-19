import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface ManagerAdvancePDFGeneratorProps {
  advanceData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
  userSignature?: string;
  managerSignature?: string;
  managerApproverName?: string;
}

const createManagerAdvanceFormHTML = (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  managerApproverName?: string
) => {
  const employeeName = employeeData?.Name || userData.name || '';
  const employeePosition = employeeData?.Position || userData.position || '';
  const employeeTeam = employeeData?.Team || userData.department || '';

  // Format dates
  const formatThaiDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get current date for form
  const currentDate = formatThaiDate(new Date().toISOString());
  const approvalDate = advanceData.managerApprovedAt ? formatThaiDate(advanceData.managerApprovedAt) : currentDate;
  
  // Get expense items from the request data
  let expenseItems: any[] = [];
  try {
    if (advanceData.advanceExpenseItems) {
      if (typeof advanceData.advanceExpenseItems === 'string') {
        expenseItems = JSON.parse(advanceData.advanceExpenseItems);
      } else if (Array.isArray(advanceData.advanceExpenseItems)) {
        expenseItems = advanceData.advanceExpenseItems;
      }
    }
  } catch (error) {
    console.error('Error parsing expense items:', error);
    expenseItems = [];
  }

  // Calculate total from expense items
  const calculatedTotal = expenseItems.reduce((sum, item) => {
    return sum + (Number(item.requestAmount) || 0);
  }, 0);
  
  // Use the actual amount from the request, or calculated total as fallback
  const totalAmount = advanceData.amount || calculatedTotal;

  return `
    <div style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      font-family: 'Sarabun', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      background: white;
      color: black;
      box-sizing: border-box;
    ">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <!-- Left Logo -->
        <div style="display: flex; align-items: center;">
          <div style="
            width: 60px; 
            height: 60px; 
            border: 2px solid #0066cc; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-right: 15px;
            background: linear-gradient(45deg, #0066cc, #004499);
            color: white;
            font-weight: bold;
            font-size: 14px;
          ">
            ICP
          </div>
          <div style="
            width: 50px; 
            height: 50px; 
            background: #228B22; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 10px;
          ">
            Ladda
          </div>
        </div>
        
        <!-- Center Title -->
        <div style="text-align: center; flex: 1; margin: 0 20px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px; color: #0066cc;">ใบขออนุมัติ</div>
          <div style="font-size: 16px; margin-bottom: 10px; color: #228B22; font-weight: bold;">เบิกเงินล่วงหน้า</div>
          <div style="font-size: 12px; color: #666;">วันที่ ${currentDate}</div>
          <div style="margin-top: 10px; padding: 5px; background: #e8f5e8; border-radius: 5px;">
            <div style="font-size: 14px; font-weight: bold; color: #228B22;">✓ อนุมัติโดยผู้จัดการ</div>
            <div style="font-size: 10px; color: #666;">วันที่อนุมัติ: ${approvalDate}</div>
          </div>
        </div>
        
        <!-- Right Update Info -->
        <div style="text-align: right; color: red; font-size: 10px; font-weight: bold;">
          MANAGER APPROVED<br/>
          ${approvalDate}
        </div>
      </div>

      <!-- Employee Info Section -->
      <div style="margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">ข้อมูลผู้ขอเบิก</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">ชื่อ-นามสกุล:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${employeeName}</span>
          <span style="margin-left: 20px; font-weight: bold;">ตำแหน่ง:</span>
          <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">${employeePosition}</span>
        </div>
        
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">แผนก:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${employeeTeam}</span>
          <span style="margin-left: 20px; font-weight: bold;">เขต:</span>
          <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">${advanceData.advanceDistrict || ''}</span>
        </div>
        
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">วันที่ยื่นคำร้อง:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; padding-bottom: 2px;">${formatThaiDate(advanceData.createdAt || '')}</span>
          <span style="margin-left: 20px; font-weight: bold;">จำนวนเงิน:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px; text-align: right; font-weight: bold; color: #0066cc;">
            ${formatCurrency(advanceData.amount || 0)} บาท
          </span>
        </div>
      </div>

      <!-- Activity Type Section -->
      <div style="margin-bottom: 20px; background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <div style="margin-bottom: 10px; font-weight: bold; color: #0066cc;">รายละเอียดกิจกรรม</div>
        
        <!-- Activity Type Checkboxes -->
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: ${advanceData.advanceActivityType === 'project' ? 'black' : 'white'};
              position: relative;
            ">
              ${advanceData.advanceActivityType === 'project' ? `
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: white;
                  font-size: 12px;
                  font-weight: bold;
                ">✓</div>
              ` : ''}
            </div>
            <span>จัดประชุม</span>
          </div>
          
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: ${advanceData.advanceActivityType === 'meeting' ? 'black' : 'white'};
              position: relative;
            ">
              ${advanceData.advanceActivityType === 'meeting' ? `
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: white;
                  font-size: 12px;
                  font-weight: bold;
                ">✓</div>
              ` : ''}
            </div>
            <span>อบรม</span>
          </div>
          
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: ${advanceData.advanceActivityType === 'training' || advanceData.advanceActivityType === 'other' ? 'black' : 'white'};
              position: relative;
            ">
              ${advanceData.advanceActivityType === 'training' || advanceData.advanceActivityType === 'other' ? `
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: white;
                  font-size: 12px;
                  font-weight: bold;
                ">✓</div>
              ` : ''}
            </div>
            <span>อื่น ๆ ระบุ</span>
            <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">
              ${advanceData.advanceActivityOther || ''}
            </span>
          </div>
        </div>
        
        <!-- Additional Fields -->
        <div style="margin-bottom: 10px;">
          <span style="font-weight: bold;">กิจกรรม:</span>
          <span style="border-bottom: 1px dotted black; width: 300px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${advanceData.advanceActivityOther || advanceData.advanceProjectName || advanceData.details || ''}
          </span>
        </div>
        
        <div style="display: flex; margin-bottom: 10px;">
          <span style="font-weight: bold;">วันที่เริ่มกิจกรรม:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
            ${advanceData.start_date ? formatThaiDate(advanceData.start_date) : formatThaiDate(advanceData.createdAt || '')}
          </span>
          <span style="margin-left: 20px; font-weight: bold;">จำนวนผู้เข้าร่วม:</span>
          <span style="border-bottom: 1px dotted black; width: 60px; margin-left: 10px; padding-bottom: 2px; text-align: center;">
            ${advanceData.totalParticipants || '-'}
          </span>
          <span style="margin-left: 5px;">คน</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span style="font-weight: bold;">สถานที่:</span>
          <span style="border-bottom: 1px dotted black; width: 250px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${advanceData.venue || advanceData.advanceProjectLocation || ''}
          </span>
          <span style="margin-left: 20px; font-weight: bold;">จังหวัด:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${advanceData.advanceProvince || ''}
          </span>
        </div>
      </div>

      <!-- Expense Summary -->
      <div style="margin-bottom: 20px; background: #f0f8ff; border: 1px solid #0066cc; padding: 15px; border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">สรุปค่าใช้จ่าย</div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #e6f3ff;">
              <th style="border: 1px solid #0066cc; padding: 8px; text-align: left;">รายการ</th>
              <th style="border: 1px solid #0066cc; padding: 8px; text-align: center;">ภาษี %</th>
              <th style="border: 1px solid #0066cc; padding: 8px; text-align: right;">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            ${expenseItems.map(item => `
              <tr>
                <td style="border: 1px solid #0066cc; padding: 6px;">${item.name || 'รายการไม่ระบุ'}</td>
                <td style="border: 1px solid #0066cc; padding: 6px; text-align: center;">${item.taxRate || 0}%</td>
                <td style="border: 1px solid #0066cc; padding: 6px; text-align: right; font-weight: bold;">
                  ${formatCurrency(Number(item.requestAmount) || 0)}
                </td>
              </tr>
            `).join('')}
            ${expenseItems.length === 0 ? `
              <tr>
                <td style="border: 1px solid #0066cc; padding: 6px;" colspan="3">ไม่มีรายการค่าใช้จ่าย</td>
              </tr>
            ` : ''}
            <tr style="background: #e6f3ff; font-weight: bold;">
              <td style="border: 1px solid #0066cc; padding: 8px; text-align: center; color: #0066cc;" colspan="2">รวมทั้งสิ้น</td>
              <td style="border: 1px solid #0066cc; padding: 8px; text-align: right; color: #0066cc; font-size: 14px;">
                ${formatCurrency(totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Details Section -->
      <div style="margin-bottom: 20px; font-size: 11px; background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold; color: #0066cc;">รายละเอียดเพิ่มเติม:</span>
        </div>
        <div style="margin-bottom: 6px; line-height: 1.6;">
          ${advanceData.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
        </div>
        ${advanceData.advanceUrgencyLevel ? `
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">ระดับความเร่งด่วน:</span> ${advanceData.advanceUrgencyLevel}
        </div>
        ` : ''}
        ${advanceData.advanceExpectedReturnDate ? `
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">วันที่คาดว่าจะคืนเงิน:</span> ${formatThaiDate(advanceData.advanceExpectedReturnDate)}
        </div>
        ` : ''}
      </div>

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <!-- Left Signature - User -->
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 5px; font-weight: bold;">ผู้ขอเบิก</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px dotted black;">
            ${userSignature ? `
              <img src="${userSignature}" alt="User Signature" style="max-width: 150px; max-height: 50px;" />
            ` : ''}
          </div>
          <div style="margin-top: 5px; font-size: 10px;">
            <div style="font-weight: bold;">( ${employeeName} )</div>
            <div>ผู้ขอเบิก</div>
            <div>ตำแหน่ง: ${employeePosition}</div>
            <div>วันที่: ${formatThaiDate(advanceData.createdAt || '')}</div>
          </div>
        </div>

        <!-- Right Signature - Manager -->
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 5px; font-weight: bold; color: #228B22;">ผู้อนุมัติ ✓</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #228B22; background: #f0fff0;">
            ${managerSignature ? `
              <img src="${managerSignature}" alt="Manager Signature" style="max-width: 150px; max-height: 50px;" />
            ` : ''}
          </div>
          <div style="margin-top: 5px; font-size: 10px;">
            <div style="font-weight: bold; color: #228B22;">( ${managerApproverName || advanceData.managerApproverName || 'ผู้จัดการ'} )</div>
            <div style="color: #228B22;">ผู้อนุมัติ</div>
            <div>ตำแหน่ง: ผู้จัดการ</div>
            <div style="color: #228B22; font-weight: bold;">วันที่: ${approvalDate}</div>
          </div>
        </div>
      </div>

      <!-- Manager Approval Note -->
      <div style="margin-top: 20px; padding: 15px; border: 2px solid #228B22; background-color: #f0fff0; border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #228B22; text-align: center;">
          ✓ อนุมัติโดยผู้จัดการแล้ว
        </div>
        <div style="font-size: 11px; text-align: center; color: #666;">
          เอกสารนี้ได้รับการอนุมัติจากผู้จัดการเรียบร้อยแล้ว<br/>
          สามารถดำเนินการขั้นตอนถัดไปได้<br/>
          <strong>วันที่อนุมัติ: ${approvalDate}</strong>
        </div>
      </div>

    </div>
  `;
};

export const generateManagerAdvancePDF = async (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  managerApproverName?: string
): Promise<Blob> => {
  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createManagerAdvanceFormHTML(
    advanceData, 
    userData, 
    employeeData, 
    userSignature, 
    managerSignature, 
    managerApproverName
  );
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '794px'; // Fixed width for consistent rendering
  tempDiv.style.height = '1123px'; // Fixed height for A4
  document.body.appendChild(tempDiv);

  try {
    // Convert HTML to canvas with optimized settings
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  } finally {
    document.body.removeChild(tempDiv);
  }
};

export const generateAndDownloadManagerAdvancePDF = async (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  managerApproverName?: string
) => {
  try {
    const pdfBlob = await generateManagerAdvancePDF(
      advanceData, 
      userData, 
      employeeData, 
      userSignature, 
      managerSignature, 
      managerApproverName
    );
    
    const employeeName = employeeData?.Name || userData.name || '';
    const filename = `advance_payment_manager_approved_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

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
    console.error('Error generating and downloading Manager Advance PDF:', error);
    throw error;
  }
};

export const ManagerAdvancePDFGenerator: React.FC<ManagerAdvancePDFGeneratorProps> = ({
  advanceData,
  userData,
  employeeData,
  userSignature,
  managerSignature,
  managerApproverName
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadManagerAdvancePDF(
        advanceData, 
        userData, 
        employeeData, 
        userSignature, 
        managerSignature, 
        managerApproverName
      );
    } catch (error) {
      console.error('Error generating Manager Advance PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      ดาวน์โหลด PDF เบิกเงินล่วงหน้า (อนุมัติแล้ว)
    </button>
  );
};