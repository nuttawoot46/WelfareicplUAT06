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
          <img src="/Picture/logo-Photoroom.jpg" alt="ICP Ladda Logo" style="
            width: 120px;
            height: 120px;
            object-fit: contain;
            margin-right: 15px;
          " />
        </div>
        
        <!-- Center Title -->
        <div style="text-align: center; flex: 1; margin: 0 20px; margin-left: -0.5cm;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">ใบขออนุมัติ</div>
          <div style="font-size: 14px; margin-bottom: 10px;">เบิกเงินล่วงหน้า</div>
          <div style="font-size: 12px;">วันที่ ${currentDate}</div>
        </div>

        <!-- Run Number -->
        <div style="text-align: right; min-width: 100px;">
          <div style="font-size: 12px; font-weight: bold;">เลขที่: ${advanceData.runNumber || '-'}</div>
        </div>
      </div>

      <!-- Employee Info Section -->
      <div style="margin-bottom: 4px;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">ข้อมูลผู้ขอเบิก</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold;">ชื่อ-นามสกุล:</span>
          <span style="margin-left: 8px;">${employeeName}</span>
          <span style="margin-left: 40px; font-weight: bold;">ตำแหน่ง:</span>
          <span style="margin-left: 8px;">${employeePosition}</span>
          <span style="margin-left: 40px; font-weight: bold;">แผนก:</span>
          <span style="margin-left: 8px;">${advanceData.advanceDepartment === 'อื่นๆ' ? advanceData.advanceDepartmentOther || 'อื่นๆ' : advanceData.advanceDepartment || ''}</span>
        </div>

        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold;">วันที่ยื่นคำร้อง:</span>
          <span style="margin-left: 8px;">${formatThaiDate(advanceData.createdAt || '')}</span>
          <span style="margin-left: 40px; font-weight: bold;">จำนวนเงิน:</span>
          <span style="margin-left: 8px; font-weight: bold; color: #0066cc;">
            ${formatCurrency(displayAmount)} บาท
          </span>
        </div>
      </div>

      <!-- Activity Type Section -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 10px;">
          <span style="font-weight: bold;">ประเภท:</span>
          <span style="margin-left: 8px;">${advanceData.advanceActivityType || '-'}</span>
        </div>

        <div style="display: flex; margin-bottom: 10px;">
          <span style="font-weight: bold;">วันที่เริ่มกิจกรรม</span>
          <span style="margin-left: 8px;">
            ${advanceData.start_date ? formatThaiDate(advanceData.start_date) : formatThaiDate(advanceData.createdAt || '')}
          </span>
          <span style="margin-left: 40px; font-weight: bold;">วันสิ้นสุดกิจกรรม</span>
          <span style="margin-left: 8px;">
            ${advanceData.end_date ? formatThaiDate(advanceData.end_date) : ''}
          </span>
        </div>

        <div style="display: flex; margin-bottom: 10px;">
          <span style="font-weight: bold;">จำนวนผู้เข้าร่วม</span>
          <span style="margin-left: 8px;">${advanceData.advanceParticipants || ''}</span>
          <span style="margin-left: 5px;">คน</span>
        </div>
      </div>

      <!-- Expense Summary -->
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">รายละเอียดค่าใช้จ่าย</div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #e5e7eb;">
              <th style="border: 0.2px solid black; padding: 6px; text-align: center; vertical-align: middle; width: 8%;">ลำดับ</th>
              <th style="border: 0.2px solid black; padding: 6px; text-align: center; vertical-align: middle; width: 37%;">ชื่อรายการ</th>
              <th style="border: 0.2px solid black; padding: 6px; text-align: center; vertical-align: middle; width: 22%;">จำนวนเงินเบิก</th>
              <th style="border: 0.2px solid black; padding: 6px; text-align: center; vertical-align: middle; width: 10%;">% ภาษี</th>
              <th style="border: 0.2px solid black; padding: 6px; text-align: center; vertical-align: middle; width: 23%;">ยอดเงินสุทธิ</th>
            </tr>
          </thead>
          <tbody>
            ${expenseItems.map((item, index) => {
    const requestAmount = Number(item.requestAmount) || 0;
    const taxRate = Number(item.taxRate) || 0;
    const taxAmount = Number(item.taxAmount) || 0;
    const netAmount = Number(item.netAmount) || (requestAmount - taxAmount);

    return `
                <tr>
                  <td style="border: 0.2px solid black; padding: 6px; text-align: center; vertical-align: middle;">${index + 1}</td>
                  <td style="border: 0.2px solid black; padding: 6px; vertical-align: middle;">${item.name || 'รายการไม่ระบุ'}</td>
                  <td style="border: 0.2px solid black; padding: 6px; text-align: right; vertical-align: middle;">
                    ${formatCurrency(requestAmount)}
                  </td>
                  <td style="border: 0.2px solid black; padding: 6px; text-align: center; vertical-align: middle;">${taxRate}%</td>
                  <td style="border: 0.2px solid black; padding: 6px; text-align: right; font-weight: bold; vertical-align: middle;">
                    ${formatCurrency(netAmount)}
                  </td>
                </tr>
              `;
  }).join('')}
            ${expenseItems.length === 0 ? `
              <tr>
                <td style="border: 0.2px solid black; padding: 6px;" colspan="5">ไม่มีรายการค่าใช้จ่าย</td>
              </tr>
            ` : ''}
            <tr style="background: #e5e7eb; font-weight: bold;">
              <td style="border: 0.2px solid black; padding: 8px; text-align: center;" colspan="2">รวมทั้งสิ้น</td>
              <td style="border: 0.2px solid black; padding: 8px; text-align: right;">
                ${formatCurrency(totalAmount)}
              </td>
              <td style="border: 0.2px solid black; padding: 8px; text-align: center;">-</td>
              <td style="border: 0.2px solid black; padding: 8px; text-align: right; font-size: 12px;">
                ${formatCurrency(expenseItems.reduce((sum, item) => {
    return sum + (Number(item.netAmount) || 0);
  }, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Details Section -->
      <div style="margin-bottom: 20px; font-size: 11px;">
        <div style="margin-bottom: 6px; line-height: 1.6;">
          <span style="font-weight: bold;">รายละเอียด:</span>
          <span style="margin-left: 8px;">${advanceData.details || 'ไม่มีรายละเอียดเพิ่มเติม'}</span>
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

      <!-- Bank Account Section -->
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">ข้อมูลบัญชีธนาคาร (สำหรับโอนเงิน)</div>
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">ชื่อบัญชี:</span>
          <span style="margin-left: 8px;">${advanceData.bankAccountName || '-'}</span>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">ธนาคาร:</span>
          <span style="margin-left: 8px;">${advanceData.bankName || '-'}</span>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">เลขที่บัญชี:</span>
          <span style="margin-left: 8px;">${advanceData.bankAccountNumber || '-'}</span>
        </div>
      </div>

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; margin-top: 3em; margin-bottom: 30px;">
        <!-- Left Signature - Department -->
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 5px;">ผู้ขอเบิก</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px dotted black;">
            ${userSignature ? `
              <img src="${userSignature}" alt="User Signature" style="max-width: 150px; max-height: 50px;" />
            ` : ''}
          </div>
          <div style="margin-top: 5px; font-size: 10px;">
            <div>( ${employeeName} )</div>
            <div>แผนก: ${employeeTeam || 'ไม่ระบุ'}</div>
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
            <div>( ${advanceData.managerApproverName || ''} )</div>
            <div>ตำแหน่ง: ${advanceData.managerApproverPosition || 'ผู้จัดการ'}</div>
            <div>วันที่: ${advanceData.managerApprovedAt ? formatThaiDate(advanceData.managerApprovedAt) : ''}</div>
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
  console.log('📄 generateAdvancePDF called with signatures:', {
    userSignature: userSignature ? `${userSignature.substring(0, 30)}... (${userSignature.length} chars)` : 'none',
    managerSignature: managerSignature ? `${managerSignature.substring(0, 30)}... (${managerSignature.length} chars)` : 'none',
    accountingSignature: accountingSignature ? `${accountingSignature.substring(0, 30)}... (${accountingSignature.length} chars)` : 'none',
  });

  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createAdvanceFormHTML(advanceData, userData, employeeData, userSignature, managerSignature, accountingSignature);
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '794px'; // Fixed width for consistent rendering
  document.body.appendChild(tempDiv);

  try {
    // Wait for all images (signatures) to load before capturing
    const images = tempDiv.querySelectorAll('img');
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Continue even if image fails
              }
            })
        )
      );
      console.log(`✅ All ${images.length} images loaded for PDF capture`);
    }

    const contentElement = tempDiv.firstElementChild as HTMLElement;
    const contentHeight = contentElement.scrollHeight;
    console.log(`📐 Content height: ${contentHeight}px`);

    // Convert HTML to canvas - auto height to capture all content including signatures
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      logging: false
    });

    // Create PDF and scale canvas to fit A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    // Scale to fit width, maintain aspect ratio
    const canvasAspectRatio = canvas.height / canvas.width;
    const imgHeight = pdfWidth * canvasAspectRatio;

    if (imgHeight <= pdfHeight) {
      // Content fits on one page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
    } else {
      // Scale to fit A4 page
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

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