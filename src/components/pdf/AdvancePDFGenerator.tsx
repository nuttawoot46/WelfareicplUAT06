import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface AdvancePDFGeneratorProps {
  advanceData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
}

const createAdvanceFormHTML = (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
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

  // Calculate total request amount from expense items
  const calculatedRequestTotal = expenseItems.reduce((sum, item) => {
    return sum + (Number(item.requestAmount) || 0);
  }, 0);

  // Calculate total net amount from expense items
  const calculatedNetTotal = expenseItems.reduce((sum, item) => {
    return sum + (Number(item.netAmount) || 0);
  }, 0);

  // Use the actual amount from the request, or calculated total as fallback
  const totalAmount = advanceData.amount || calculatedRequestTotal;

  // Use net amount for display in employee info section
  const displayAmount = calculatedNetTotal || totalAmount;

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
        <!-- Company Logo -->
        <div style="display: flex; align-items: center;">
          <img src="/dist/Picture/logo-Photoroom.jpg" alt="ICP Ladda Logo" style="
            width: 120px; 
            height: 90px; 
            object-fit: contain;
            margin-right: 15px;
          " />
        </div>
        
        <!-- Center Title -->
        <div style="text-align: center; flex: 1; margin: 0 20px; margin-left: -3cm;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">ใบขออนุมัติ</div>
          <div style="font-size: 14px; margin-bottom: 10px;">เบิกล่วงหน้า</div>
          <div style="font-size: 12px;">วันที่ ${currentDate}</div>
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
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${advanceData.advanceDepartmentOther || ''}</span>
          <span style="margin-left: 20px; font-weight: bold;">เขต:</span>
          <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">${advanceData.advanceDistrict || ''}</span>
        </div>
        
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">วันที่ยื่นคำร้อง:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; padding-bottom: 2px;">${formatThaiDate(advanceData.createdAt || '')}</span>
          <span style="margin-left: 20px; font-weight: bold;">จำนวนเงิน:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px; text-align: right; font-weight: bold; color: #0066cc;">
            ${formatCurrency(displayAmount)} บาท
          </span>
        </div>
      </div>

      <!-- Activity Type Section -->
      <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 10px; font-weight: bold;">ประเภท</div>
        
        <!-- Activity Type Checkboxes -->
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: white;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${advanceData.advanceActivityType === 'project' ? `
                <div style="
                  font-size: 14px;
                  font-weight: bold;
                  color: black;
                  line-height: 1;
                ">✗</div>
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
              background: white;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${advanceData.advanceActivityType === 'meeting' ? `
                <div style="
                  font-size: 14px;
                  font-weight: bold;
                  color: black;
                  line-height: 1;
                ">✗</div>
              ` : ''}
            </div>
            <span>ออกบูธ</span>
          </div>
          
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: white;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${advanceData.advanceActivityType === 'training' ? `
                <div style="
                  font-size: 14px;
                  font-weight: bold;
                  color: black;
                  line-height: 1;
                ">✗</div>
              ` : ''}
            </div>
            <span>อื่น ๆ ระบุ</span>
            <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">
              ${advanceData.advanceActivityOther || ''}
            </span>
          </div>
          <!-- ดีลเลอร์ และ ซับดีลเลอร์ (บรรทัดเดียวกัน, ต่อจาก อื่น ๆ ระบุ) -->
<div style="display: flex; align-items: center; margin-top: 6px; gap: 30px;">
  <!-- ดีลเลอร์ -->
  <div style="display: flex; align-items: center;">
    <div style="
      border: 2px solid black; 
      width: 16px; 
      height: 16px; 
      margin-right: 8px;
      background: white;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ${advanceData.advanceActivityType === 'dealer' ? `
        <div style="
          font-size: 14px;
          font-weight: bold;
          color: black;
          line-height: 1;
        ">✗</div>
      ` : ''}
    </div>
    <span>ดีลเลอร์</span>
    <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
      ${advanceData.advanceDealerName || ''}
    </span>
  </div>

  <!-- ซับดีลเลอร์ -->
  <div style="display: flex; align-items: center;">
    <div style="
      border: 2px solid black; 
      width: 16px; 
      height: 16px; 
      margin-right: 8px;
      background: white;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ${advanceData.advanceActivityType === 'subdealer' ? `
        <div style="
          font-size: 14px;
          font-weight: bold;
          color: black;
          line-height: 1;
        ">✗</div>
      ` : ''}
    </div>
    <span>ซับดีลเลอร์</span>
    <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
      ${advanceData.advanceSubdealerName || ''}
    </span>
  </div>
</div>

        </div>
        
        <div style="display: flex; margin-bottom: 10px;">
          <span>วันที่เริ่มกิจกรรม/ประชุม</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
            ${advanceData.start_date ? formatThaiDate(advanceData.start_date) : formatThaiDate(advanceData.createdAt || '')}
          </span>
          <span style="margin-left: 20px;">วันสิ้นสุดกิจกรรม</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
            ${advanceData.end_date ? formatThaiDate(advanceData.end_date) : ''}
          </span>
        </div>
        
        <div style="display: flex; margin-bottom: 10px;">
          <span>จำนวนผู้เข้าร่วม</span>
          <span style="border-bottom: 1px dotted black; width: 60px; margin-left: 10px; padding-bottom: 2px; text-align: center;">
            ${advanceData.advanceParticipants || ''}
          </span>
          <span style="margin-left: 5px;">คน</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span>ชื่อร้าน/บริษัท</span>
          <span style="border-bottom: 1px dotted black; width: 180px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${advanceData.advanceLocation || ''}
          </span>
          <span style="margin-left: 15px;">อำเภอ</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${advanceData.advanceAmphur || ''}
          </span>  
          <span style="margin-left: 15px;">จังหวัด</span>
          <span style="border-bottom: 1px dotted black; width: 100px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${advanceData.advanceProvince || ''}
          </span>
        </div>
      </div>

      <!-- Expense Summary -->
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">สรุปค่าใช้จ่าย</div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid black; padding: 6px; text-align: left; width: 30%;">ชื่อรายการ</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right; width: 18%;">จำนวนเงินเบิก</th>
              <th style="border: 1px solid black; padding: 6px; text-align: center; width: 12%;">อัตรา % ภาษี</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right; width: 18%;">จำนวนภาษีหัก ณที่จ่าย</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right; width: 22%;">ยอดเงินสุทธิ</th>
            </tr>
          </thead>
          <tbody>
            ${expenseItems.map(item => {
    const requestAmount = Number(item.requestAmount) || 0;
    const taxRate = Number(item.taxRate) || 0;
    const taxAmount = Number(item.taxAmount) || 0; // Use existing taxAmount from data
    const netAmount = Number(item.netAmount) || (requestAmount - taxAmount); // Use existing netAmount or calculate

    return `
                <tr>
                  <td style="border: 1px solid black; padding: 5px;">${item.name || 'รายการไม่ระบุ'}</td>
                  <td style="border: 1px solid black; padding: 5px; text-align: right;">
                    ${formatCurrency(requestAmount)}
                  </td>
                  <td style="border: 1px solid black; padding: 5px; text-align: center;">${taxRate}%</td>
                  <td style="border: 1px solid black; padding: 5px; text-align: right;">
                    ${formatCurrency(taxAmount)}
                  </td>
                  <td style="border: 1px solid black; padding: 5px; text-align: right; font-weight: bold;">
                    ${formatCurrency(netAmount)}
                  </td>
                </tr>
              `;
  }).join('')}
            ${expenseItems.length === 0 ? `
              <tr>
                <td style="border: 1px solid black; padding: 6px;" colspan="5">ไม่มีรายการค่าใช้จ่าย</td>
              </tr>
            ` : ''}
            <tr style="background: #e6f3ff; font-weight: bold;">
              <td style="border: 1px solid black; padding: 8px; text-align: center;">รวมทั้งสิ้น</td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: blue;">
                ${formatCurrency(totalAmount)}
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: blue;">
                ${formatCurrency(expenseItems.reduce((sum, item) => {
    return sum + (Number(item.taxAmount) || 0); // Use existing taxAmount from data
  }, 0))}
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: blue; font-size: 12px;">
                ${formatCurrency(expenseItems.reduce((sum, item) => {
    return sum + (Number(item.netAmount) || 0); // Use existing netAmount from data
  }, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Details Section -->
      <div style="margin-bottom: 20px; font-size: 11px;">
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">รายละเอียด ( โปรดระบุ )</span>
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
        ${advanceData.advanceApprovalDeadline ? `
        <div style="margin-bottom: 6px;">
          <span style="font-weight: bold;">กำหนดเวลาอนุมัติ:</span> ${formatThaiDate(advanceData.advanceApprovalDeadline)}
        </div>
        ` : ''}
      </div>

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <!-- Left Signature - User -->
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 5px;">ผู้ขอเบิก</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px dotted black;">
            ${userSignature ? `
              <img src="${userSignature}" alt="User Signature" style="max-width: 150px; max-height: 50px;" />
            ` : ''}
          </div>
          <div style="margin-top: 5px; font-size: 10px;">
            <div>( ${employeeName} )</div>
            <div>ผู้ขอเบิก</div>
            <div>ตำแหน่ง: ${employeePosition}</div>
            <div>วันที่: ${formatThaiDate(advanceData.createdAt || '')}</div>
          </div>
        </div>

        <!-- Right Signature - Manager -->
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 5px;">ผู้อนุมัติ</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px dotted black;">
            ${managerSignature ? `
              <img src="${managerSignature}" alt="Manager Signature" style="max-width: 150px; max-height: 50px;" />
            ` : ''}
          </div>
          <div style="margin-top: 5px; font-size: 10px;">
            <div>( ${advanceData.managerApproverName || '..............................'} )</div>
            <div>ผู้อนุมัติ</div>
            <div>ตำแหน่ง: ผู้จัดการ</div>
            <div>วันที่: ${advanceData.managerApprovedAt ? formatThaiDate(advanceData.managerApprovedAt) : '......./......./........'}</div>
          </div>
        </div>
      </div>

 
    </div>
  `;
};

export const generateAdvancePDF = async (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
): Promise<Blob> => {
  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createAdvanceFormHTML(advanceData, userData, employeeData, userSignature, managerSignature, accountingSignature);
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

export const generateAndDownloadAdvancePDF = async (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
) => {
  try {
    const pdfBlob = await generateAdvancePDF(advanceData, userData, employeeData, userSignature, managerSignature, accountingSignature);

    const employeeName = employeeData?.Name || userData.name || '';
    const filename = `advance_payment_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

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

export const AdvancePDFGenerator: React.FC<AdvancePDFGeneratorProps> = ({
  advanceData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadAdvancePDF(advanceData, userData, employeeData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      ดาวน์โหลด PDF เบิกเงินล่วงหน้า
    </button>
  );
};