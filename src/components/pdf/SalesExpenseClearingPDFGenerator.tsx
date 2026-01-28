import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface SalesExpenseClearingPDFGeneratorProps {
  expenseClearingData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
}

const createSalesExpenseClearingFormHTML = (
  expenseClearingData: WelfareRequest,
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
    if (expenseClearingData.expenseClearingItems) {
      if (typeof expenseClearingData.expenseClearingItems === 'string') {
        expenseItems = JSON.parse(expenseClearingData.expenseClearingItems);
      } else if (Array.isArray(expenseClearingData.expenseClearingItems)) {
        expenseItems = expenseClearingData.expenseClearingItems;
      }
    }
  } catch (error) {
    console.error('Error parsing expense items:', error);
    expenseItems = [];
  }

  // Calculate totals from expense items
  const totalRequested = expenseItems.reduce((sum, item) => sum + (Number(item.requestAmount) || 0), 0);
  const totalUsed = expenseItems.reduce((sum, item) => sum + (Number(item.usedAmount) || 0), 0);
  const totalRefund = expenseItems.reduce((sum, item) => sum + (Number(item.refund) || 0), 0);

  // Get sales-specific information
  const salesDealerName = expenseClearingData.advanceDealerName || '';
  const salesSubdealerName = expenseClearingData.advanceSubdealerName || '';
  const salesProvince = expenseClearingData.advanceProvince || '';
  const salesAmphur = expenseClearingData.advanceAmphur || '';

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
        <div style="text-align: center; flex: 1; margin: 0 20px; margin-left: -1.5cm;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">ใบเคลียร์ค่าใช้จ่าย</div>
          <div style="font-size: 14px; margin-bottom: 10px; color: #1565c0;">(ฝ่ายขาย)</div>
          <div style="font-size: 12px;">วันที่ ${currentDate}</div>
        </div>

        <!-- Run Number -->
        <div style="text-align: right; min-width: 100px;">
          <div style="font-size: 12px; font-weight: bold;">เลขที่: ${expenseClearingData.runNumber || '-'}</div>
        </div>
      </div>

      <!-- Employee Info Section -->
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">ข้อมูลผู้เคลียร์ค่าใช้จ่าย</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">ชื่อ-นามสกุล:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${employeeName}</span>
          <span style="margin-left: 20px; font-weight: bold;">ตำแหน่ง:</span>
          <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">${employeePosition}</span>
        </div>

        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">แผนก:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; padding-bottom: 2px;">${employeeTeam}</span>
        </div>

        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">วันที่ยื่นคำร้อง:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; padding-bottom: 2px;">${formatThaiDate(expenseClearingData.createdAt || '')}</span>
          <span style="margin-left: 20px; font-weight: bold;">จำนวนเงินคืน:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px; text-align: right; font-weight: bold; color: #16a34a;">
            ${formatCurrency(totalRefund)} บาท
          </span>
        </div>

        ${expenseClearingData.originalAdvanceRunNumber || expenseClearingData.originalAdvanceRequestId ? `
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 160px; font-weight: bold; white-space: nowrap;">อ้างอิงเบิกเงินล่วงหน้า:</span>
          <span style="border-bottom: 1px dotted black; width: 200px; padding-bottom: 2px;">${expenseClearingData.originalAdvanceRunNumber || '#' + expenseClearingData.originalAdvanceRequestId}</span>
        </div>
        ` : ''}
      </div>

      <!-- Activity Type Section -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; margin-bottom: 10px;">
          <span style="font-weight: bold;">ประเภทกิจกรรม:</span>
          <span style="border-bottom: 1px dotted black; flex: 1; margin-left: 10px; padding-bottom: 2px;">
            ${expenseClearingData.advanceActivityType || '-'}
          </span>
        </div>

        <!-- Details Section -->
        <div style="margin-bottom: 10px;">
          <span style="font-weight: bold;">รายละเอียด ( โปรดระบุ )</span>
          <div style="margin-top: 5px; line-height: 1.6;">
            ${expenseClearingData.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
          </div>
        </div>

        <div style="display: flex; margin-bottom: 10px;">
          <span>วันที่เริ่มกิจกรรม</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
            ${expenseClearingData.start_date ? formatThaiDate(expenseClearingData.start_date) : formatThaiDate(expenseClearingData.createdAt || '')}
          </span>
          <span style="margin-left: 20px;">วันสิ้นสุดกิจกรรม</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
            ${expenseClearingData.end_date ? formatThaiDate(expenseClearingData.end_date) : ''}
          </span>
        </div>

        <div style="display: flex; margin-bottom: 10px;">
          <span>จำนวนผู้เข้าร่วม</span>
          <span style="border-bottom: 1px dotted black; width: 60px; margin-left: 10px; padding-bottom: 2px; text-align: center;">
            ${expenseClearingData.advanceParticipants || ''}
          </span>
          <span style="margin-left: 5px;">คน</span>
        </div>
      </div>

      <!-- Sales Information Section -->
      <div style="margin-bottom: 20px;">
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

      <!-- Expense Clearing Summary -->
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">สรุปการใช้จ่ายและเคลียร์ค่าใช้จ่าย</div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background: #e3f2fd; height: 40px;">
              <th style="border: 1px solid black; padding: 4px; text-align: center; vertical-align: middle; width: 30px; height: 40px;">ลำดับ</th>
              <th style="border: 1px solid black; padding: 4px; text-align: left; vertical-align: middle; height: 40px;">ชื่อรายการ</th>
              <th style="border: 1px solid black; padding: 4px; text-align: center; vertical-align: middle; width: 50px; height: 40px;">อัตราภาษี</th>
              <th style="border: 1px solid black; padding: 4px; text-align: right; vertical-align: middle; width: 70px; height: 40px;">จำนวนเบิก</th>
              <th style="border: 1px solid black; padding: 4px; text-align: right; vertical-align: middle; width: 70px; height: 40px;">จำนวนใช้<br/>(ก่อน VAT)</th>
              <th style="border: 1px solid black; padding: 4px; text-align: right; vertical-align: middle; width: 60px; height: 40px;">ภาษีมูลค่าเพิ่ม</th>
              <th style="border: 1px solid black; padding: 4px; text-align: right; vertical-align: middle; width: 60px; height: 40px;">ภาษีหัก ณ ที่จ่าย</th>
              <th style="border: 1px solid black; padding: 4px; text-align: right; vertical-align: middle; width: 70px; height: 40px;">รวมจำนวนเงินทั้งสิ้น</th>
              <th style="border: 1px solid black; padding: 4px; text-align: right; vertical-align: middle; width: 70px; height: 40px;">คืนเงิน(+)<br/>เบิกเงิน(-)</th>
            </tr>
          </thead>
          <tbody>
            ${expenseItems.map((item, index) => `
              <tr style="height: 28px;">
                <td style="border: 1px solid black; padding: 3px; text-align: center; vertical-align: middle; height: 28px;">${index + 1}</td>
                <td style="border: 1px solid black; padding: 3px; vertical-align: middle; height: 28px;">${item.name || 'รายการไม่ระบุ'}${item.otherDescription ? ` (${item.otherDescription})` : ''}</td>
                <td style="border: 1px solid black; padding: 3px; text-align: center; vertical-align: middle; height: 28px;">${item.taxRate || 0}%</td>
                <td style="border: 1px solid black; padding: 3px; text-align: right; vertical-align: middle; height: 28px;">
                  ${formatCurrency(Number(item.requestAmount) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 3px; text-align: right; vertical-align: middle; background: #fef3c7; height: 28px;">
                  ${formatCurrency(Number(item.usedAmount) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 3px; text-align: right; vertical-align: middle; height: 28px;">
                  ${formatCurrency(Number(item.vatAmount) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 3px; text-align: right; vertical-align: middle; height: 28px;">
                  ${formatCurrency(Number(item.taxAmount) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 3px; text-align: right; vertical-align: middle; background: #dbeafe; font-weight: bold; height: 28px;">
                  ${formatCurrency(Number(item.netAmount) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 3px; text-align: right; vertical-align: middle; background: ${(Number(item.refund) || 0) >= 0 ? '#dcfce7' : '#fee2e2'}; font-weight: bold; height: 28px;">
                  ${formatCurrency(Number(item.refund) || 0)}
                </td>
              </tr>
            `).join('')}
            ${expenseItems.length === 0 ? `
              <tr style="height: 28px;">
                <td style="border: 1px solid black; padding: 6px; vertical-align: middle; height: 28px;" colspan="9">ไม่มีรายการค่าใช้จ่าย</td>
              </tr>
            ` : ''}
            <tr style="background: #bbdefb; font-weight: bold; height: 32px;">
              <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: middle; height: 32px;" colspan="3">รวมทั้งสิ้น</td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; vertical-align: middle; color: #1565c0; height: 32px;">
                ${formatCurrency(totalRequested)}
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; vertical-align: middle; color: #fd7e14; height: 32px;">
                ${formatCurrency(totalUsed)}
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; vertical-align: middle; height: 32px;">
                ${formatCurrency(expenseItems.reduce((sum, item) => sum + (Number(item.vatAmount) || 0), 0))}
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; vertical-align: middle; height: 32px;">
                ${formatCurrency(expenseItems.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0))}
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; vertical-align: middle; height: 32px;">
                ${formatCurrency(expenseItems.reduce((sum, item) => sum + (Number(item.netAmount) || 0), 0))}
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; vertical-align: middle; color: ${totalRefund >= 0 ? '#16a34a' : '#dc2626'}; font-size: 11px; height: 32px;">
                ${formatCurrency(totalRefund)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Signature Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <!-- Left Signature - User -->
        <div style="text-align: center; width: 200px;">
          <div style="margin-bottom: 5px;">ผู้เคลียร์ค่าใช้จ่าย</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px dotted black;">
            ${userSignature ? `
              <img src="${userSignature}" alt="User Signature" style="max-width: 150px; max-height: 50px;" />
            ` : ''}
          </div>
          <div style="margin-top: 5px; font-size: 10px;">
            <div>( ${employeeName} )</div>
            <div>ผู้เคลียร์ค่าใช้จ่าย</div>
            <div>ตำแหน่ง: ${employeePosition}</div>
            <div>วันที่: ${formatThaiDate(expenseClearingData.createdAt || '')}</div>
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
            <div>( ${expenseClearingData.managerApproverName || '..............................'} )</div>
            <div>ผู้อนุมัติ</div>
            <div>ตำแหน่ง: ผู้จัดการ</div>
            <div>วันที่: ${expenseClearingData.managerApprovedAt ? formatThaiDate(expenseClearingData.managerApprovedAt) : '......./......./........'}</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const generateSalesExpenseClearingPDF = async (
  expenseClearingData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
): Promise<Blob> => {
  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createSalesExpenseClearingFormHTML(expenseClearingData, userData, employeeData, userSignature, managerSignature, accountingSignature);
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

export const generateAndDownloadSalesExpenseClearingPDF = async (
  expenseClearingData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
) => {
  try {
    const pdfBlob = await generateSalesExpenseClearingPDF(expenseClearingData, userData, employeeData, userSignature, managerSignature, accountingSignature);

    const employeeName = employeeData?.Name || userData.name || '';
    const filename = `sales_expense_clearing_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

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

export const SalesExpenseClearingPDFGenerator: React.FC<SalesExpenseClearingPDFGeneratorProps> = ({
  expenseClearingData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadSalesExpenseClearingPDF(expenseClearingData, userData, employeeData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      ดาวน์โหลด PDF เคลียร์ค่าใช้จ่าย (ฝ่ายขาย)
    </button>
  );
};
