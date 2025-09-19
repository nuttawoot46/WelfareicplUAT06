import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface ExpenseClearingPDFGeneratorProps {
  expenseClearingData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
}

const createExpenseClearingFormHTML = (
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
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">ใบเคลียร์ค่าใช้จ่าย</div>
          <div style="font-size: 14px; margin-bottom: 10px;">รายงานการใช้เงินเบิกล่วงหน้า</div>
          <div style="font-size: 12px;">วันที่ ${currentDate}</div>
        </div>
      </div>

      <!-- Employee Info Section -->
      <div style="margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 10px; color: #0066cc;">ข้อมูลผู้เคลียร์ค่าใช้จ่าย</div>
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
          <span style="border-bottom: 1px dotted black; width: 150px; margin-left: 10px; padding-bottom: 2px;">${expenseClearingData.advanceDistrict || ''}</span>
        </div>
        
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">วันที่ยื่นคำร้อง:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; padding-bottom: 2px;">${formatThaiDate(expenseClearingData.createdAt || '')}</span>
          <span style="margin-left: 20px; font-weight: bold;">จำนวนเงินคืน:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px; text-align: right; font-weight: bold; color: #16a34a;">
            ${formatCurrency(totalRefund)} บาท
          </span>
        </div>
        
        ${expenseClearingData.originalAdvanceRequestId ? `
        <div style="display: flex; margin-bottom: 8px;">
          <span style="width: 100px; font-weight: bold;">อ้างอิงคำขอเดิม:</span>
          <span style="border-bottom: 1px dotted black; width: 120px; padding-bottom: 2px;">#${expenseClearingData.originalAdvanceRequestId}</span>
        </div>
        ` : ''}
      </div>

      <!-- Activity Type Section -->
      <div style="margin-bottom: 20px;">
        <div style="margin-bottom: 10px; font-weight: bold;">ประเภทกิจกรรม</div>
        
        <!-- Activity Type Checkboxes -->
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: ${expenseClearingData.advanceActivityType === 'จัดประชุม' ? 'black' : 'white'};
              position: relative;
            ">
              ${expenseClearingData.advanceActivityType === 'จัดประชุม' ? `
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
              background: ${expenseClearingData.advanceActivityType === 'ออกบูธ' ? 'black' : 'white'};
              position: relative;
            ">
              ${expenseClearingData.advanceActivityType === 'ออกบูธ' ? `
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
            <span>ออกบูธ</span>
          </div>
          
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: ${expenseClearingData.advanceActivityType === 'อื่นๆ' ? 'black' : 'white'};
              position: relative;
            ">
              ${expenseClearingData.advanceActivityType === 'อื่นๆ' ? `
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
              ${expenseClearingData.advanceActivityOther || ''}
            </span>
          </div>
        </div>

        <!-- ดีลเลอร์ และ ซับดีลเลอร์ -->
        <div style="display: flex; align-items: center; margin-top: 6px; gap: 30px;">
          <!-- ดีลเลอร์ -->
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: ${expenseClearingData.advanceActivityType === 'ดีลเลอร์' ? 'black' : 'white'};
              position: relative;
            ">
              ${expenseClearingData.advanceActivityType === 'ดีลเลอร์' ? `
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
            <span>ดีลเลอร์</span>
            <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
              ${expenseClearingData.advanceDealerName || ''}
            </span>
          </div>

          <!-- ซับดีลเลอร์ -->
          <div style="display: flex; align-items: center;">
            <div style="
              border: 2px solid black; 
              width: 16px; 
              height: 16px; 
              margin-right: 8px;
              background: ${expenseClearingData.advanceActivityType === 'ซับดีลเลอร์' ? 'black' : 'white'};
              position: relative;
            ">
              ${expenseClearingData.advanceActivityType === 'ซับดีลเลอร์' ? `
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
            <span>ซับดีลเลอร์</span>
            <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
              ${expenseClearingData.advanceSubdealerName || ''}
            </span>
          </div>
        </div>
        
        <div style="display: flex; margin-bottom: 10px; margin-top: 15px;">
          <span>วันที่เริ่มกิจกรรม/ประชุม</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px;">
            ${expenseClearingData.start_date ? formatThaiDate(expenseClearingData.start_date) : formatThaiDate(expenseClearingData.createdAt || '')}
          </span>
          <span style="margin-left: 20px;">จำนวนผู้เข้าร่วม</span>
          <span style="border-bottom: 1px dotted black; width: 60px; margin-left: 10px; padding-bottom: 2px; text-align: center;">
            ${expenseClearingData.advanceParticipants || ''}
          </span>
          <span style="margin-left: 5px;">คน</span>
        </div>
        
        <div style="margin-bottom: 15px;">
          <span>ชื่อร้าน/บริษัท</span>
          <span style="border-bottom: 1px dotted black; width: 180px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${expenseClearingData.advanceLocation || ''}
          </span>
          <span style="margin-left: 15px;">อำเภอ</span>
          <span style="border-bottom: 1px dotted black; width: 120px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${expenseClearingData.advanceAmphur || ''}
          </span>  
          <span style="margin-left: 15px;">จังหวัด</span>
          <span style="border-bottom: 1px dotted black; width: 100px; margin-left: 10px; padding-bottom: 2px; display: inline-block;">
            ${expenseClearingData.advanceProvince || ''}
          </span>
        </div>
      </div>

      <!-- Expense Clearing Summary -->
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">สรุปการใช้จ่ายและเคลียร์ค่าใช้จ่าย</div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid black; padding: 6px; text-align: left;">รายการ</th>
              <th style="border: 1px solid black; padding: 6px; text-align: center;">ภาษี %</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right;">เบิก (บาท)</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right;">ใช้จริง (บาท)</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right;">ภาษี</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right;">VAT</th>
              <th style="border: 1px solid black; padding: 6px; text-align: right;">คืน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            ${expenseItems.map(item => `
              <tr>
                <td style="border: 1px solid black; padding: 4px;">${item.name || 'รายการไม่ระบุ'}</td>
                <td style="border: 1px solid black; padding: 4px; text-align: center;">${item.taxRate || 0}%</td>
                <td style="border: 1px solid black; padding: 4px; text-align: right;">
                  ${formatCurrency(Number(item.requestAmount) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 4px; text-align: right; background: #fef3c7;">
                  ${formatCurrency(Number(item.usedAmount) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 4px; text-align: right;">
                  ${formatCurrency(Number(item.tax) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 4px; text-align: right;">
                  ${formatCurrency(Number(item.vat) || 0)}
                </td>
                <td style="border: 1px solid black; padding: 4px; text-align: right; background: #dcfce7; font-weight: bold;">
                  ${formatCurrency(Number(item.refund) || 0)}
                </td>
              </tr>
            `).join('')}
            ${expenseItems.length === 0 ? `
              <tr>
                <td style="border: 1px solid black; padding: 6px;" colspan="7">ไม่มีรายการค่าใช้จ่าย</td>
              </tr>
            ` : ''}
            <tr style="background: #e6f3ff; font-weight: bold;">
              <td style="border: 1px solid black; padding: 8px; text-align: center;" colspan="2">รวมทั้งสิ้น</td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: blue;">
                ${formatCurrency(totalRequested)}
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: orange;">
                ${formatCurrency(totalUsed)}
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: right;" colspan="2">-</td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; color: green; font-size: 12px;">
                ${formatCurrency(totalRefund)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary Box -->
      <div style="margin-bottom: 20px; background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 12px; color: #6c757d;">จำนวนเงินที่เบิก</div>
            <div style="font-size: 16px; font-weight: bold; color: #0066cc;">${formatCurrency(totalRequested)} บาท</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 12px; color: #6c757d;">จำนวนเงินที่ใช้จริง</div>
            <div style="font-size: 16px; font-weight: bold; color: #fd7e14;">${formatCurrency(totalUsed)} บาท</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 12px; color: #6c757d;">จำนวนเงินที่ต้องคืน</div>
            <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(totalRefund)} บาท</div>
          </div>
        </div>
      </div>

      <!-- Details Section -->
      <div style="margin-bottom: 20px; font-size: 11px;">
        <div style="margin-bottom: 8px;">
          <span style="font-weight: bold;">รายละเอียดเพิ่มเติม</span>
        </div>
        <div style="margin-bottom: 6px; line-height: 1.6; border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #f9f9f9;">
          ${expenseClearingData.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
        </div>
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

export const generateExpenseClearingPDF = async (
  expenseClearingData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
): Promise<Blob> => {
  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createExpenseClearingFormHTML(expenseClearingData, userData, employeeData, userSignature, managerSignature, accountingSignature);
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

export const generateAndDownloadExpenseClearingPDF = async (
  expenseClearingData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  accountingSignature?: string
) => {
  try {
    const pdfBlob = await generateExpenseClearingPDF(expenseClearingData, userData, employeeData, userSignature, managerSignature, accountingSignature);

    const employeeName = employeeData?.Name || userData.name || '';
    const filename = `expense_clearing_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

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

export const ExpenseClearingPDFGenerator: React.FC<ExpenseClearingPDFGeneratorProps> = ({
  expenseClearingData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadExpenseClearingPDF(expenseClearingData, userData, employeeData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
    >
      ดาวน์โหลด PDF เคลียร์ค่าใช้จ่าย
    </button>
  );
};