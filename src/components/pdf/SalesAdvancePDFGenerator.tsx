import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface SalesAdvancePDFGeneratorProps {
  advanceData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
}

const createSalesAdvanceFormHTML = (
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

  // Get sales-specific information
  const salesDistrict = advanceData.advanceDistrict || '';
  const salesDealerName = advanceData.advanceDealerName || '';
  const salesSubdealerName = advanceData.advanceSubdealerName || '';
  const salesProvince = advanceData.advanceProvince || '';
  const salesAmphur = advanceData.advanceAmphur || '';

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
            height: 90px;
            object-fit: contain;
            margin-right: 15px;
          " />
        </div>

        <!-- Center Title -->
        <div style="text-align: center; flex: 1; margin: 0 20px; margin-left: -2.5cm;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">ใบขออนุมัติ</div>
          <div style="font-size: 14px; margin-bottom: 5px; color: #0066cc;">เบิกเงินล่วงหน้า (ฝ่ายขาย)</div>
          <div style="font-size: 12px;">วันที่ ${currentDate}</div>
        </div>

        <!-- Run Number -->
        <div style="text-align: right; min-width: 100px;">
          <div style="font-size: 12px; font-weight: bold;">เลขที่: ${advanceData.runNumber || '-'}</div>
        </div>
      </div>

      <!-- Employee Info Section -->
      <div style="margin-bottom: 20px; background: #f0f7ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">ข้อมูลผู้ขอเบิก (ฝ่ายขาย)</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">ชื่อ-นามสกุล:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${employeeName}</span>
          <span style="margin-left: 20px; font-weight: bold;">ตำแหน่ง:</span>
          <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">${employeePosition}</span>
        </div>

        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">แผนก:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${advanceData.advanceDepartment || ''}</span>
          <span style="margin-left: 20px; font-weight: bold;">เขตการขาย:</span>
          <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">${salesDistrict}</span>
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
        <div style="display: flex; margin-bottom: 10px;">
          <span style="font-weight: bold;">ประเภทกิจกรรม:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; margin-left: 10px; padding-bottom: 2px;">
            ${advanceData.advanceActivityType || '-'}
          </span>
        </div>

        <!-- Details Section -->
        <div style="margin-bottom: 10px;">
          <span style="font-weight: bold;">รายละเอียด ( โปรดระบุ )</span>
          <div style="margin-top: 5px; line-height: 1.6; padding: 10px; background: #fafafa; border-radius: 4px; border: 1px solid #e0e0e0;">
            ${advanceData.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
          </div>
        </div>

        <div style="display: flex; margin-bottom: 10px;">
          <span>วันที่เริ่มกิจกรรม</span>
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
      </div>

      <!-- Sales Information Section -->
      <div style="margin-bottom: 20px; background: #fff8e6; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 120px; font-weight: bold;">ชื่อดิลเลอร์:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${salesDealerName}</span>
        </div>

        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 120px; font-weight: bold;">ชื่อซับดิลเลอร์:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${salesSubdealerName}</span>
        </div>

        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 120px; font-weight: bold;">อำเภอ:</span>
          <span style="border-bottom: 1px dotted black; width: 150px; padding-bottom: 2px;">${salesAmphur}</span>
          <span style="margin-left: 20px; font-weight: bold;">จังหวัด:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; margin-left: 10px; padding-bottom: 2px;">${salesProvince}</span>
        </div>
      </div>

      <!-- Expense Summary -->
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">รายละเอียดค่าใช้จ่าย</div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #e3f2fd;">
              <th style="border: 1px solid black; padding: 6px; text-align: center; width: 8%;">ลำดับ</th>
              <th style="border: 1px solid black; padding: 6px; text-align: left; width: 37%;">ชื่อรายการ</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right; width: 22%;">จำนวนเงินเบิก</th>
              <th style="border: 1px solid black; padding: 6px; text-align: center; width: 10%;">% ภาษี</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right; width: 23%;">ยอดเงินสุทธิ</th>
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
                  <td style="border: 1px solid black; padding: 5px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid black; padding: 5px;">${item.name || 'รายการไม่ระบุ'}</td>
                  <td style="border: 1px solid black; padding: 5px; text-align: right;">
                    ${formatCurrency(requestAmount)}
                  </td>
                  <td style="border: 1px solid black; padding: 5px; text-align: center;">${taxRate}%</td>
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
            <tr style="background: #bbdefb; font-weight: bold;">
              <td style="border: 1px solid black; padding: 8px; text-align: center;" colspan="2">รวมทั้งสิ้น</td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: #1565c0;">
                ${formatCurrency(totalAmount)}
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: #1565c0; font-size: 12px;">
                ${formatCurrency(expenseItems.reduce((sum, item) => {
    return sum + (Number(item.netAmount) || 0);
  }, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <!-- Left Signature - Employee -->
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

export const generateSalesAdvancePDF = async (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
): Promise<Blob> => {
  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createSalesAdvanceFormHTML(advanceData, userData, employeeData, userSignature, managerSignature, accountingSignature);
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

export const generateAndDownloadSalesAdvancePDF = async (
  advanceData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
) => {
  try {
    const pdfBlob = await generateSalesAdvancePDF(advanceData, userData, employeeData, userSignature, managerSignature, accountingSignature);

    const employeeName = employeeData?.Name || userData.name || '';
    const filename = `sales_advance_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

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

export const SalesAdvancePDFGenerator: React.FC<SalesAdvancePDFGeneratorProps> = ({
  advanceData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadSalesAdvancePDF(advanceData, userData, employeeData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      ดาวน์โหลด PDF เบิกเงินล่วงหน้า (ฝ่ายขาย)
    </button>
  );
};
