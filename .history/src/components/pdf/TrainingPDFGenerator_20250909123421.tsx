import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface TrainingPDFGeneratorProps {
  welfareData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
  };
  remainingBudget?: number;
}

// Function to convert number to Thai text
const numberToThaiText = (num: number): string => {
  if (num === 0) return 'ศูนย์';

  const ones = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const tens = ['', '', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';

    let result = '';
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;

    if (hundred > 0) {
      result += ones[hundred] + 'ร้อย';
    }

    if (ten > 0) {
      if (ten === 1) {
        result += 'สิบ';
      } else if (ten === 2) {
        result += 'ยี่สิบ';
      } else {
        result += ones[ten] + 'สิบ';
      }
    }

    if (one > 0) {
      if (ten > 0 && one === 1) {
        result += 'เอ็ด';
      } else {
        result += ones[one];
      }
    }

    return result;
  };

  if (num < 1000000) {
    const million = 0;
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;

    let result = '';
    if (thousand > 0) {
      result += convertGroup(thousand) + 'พัน';
    }
    if (remainder > 0) {
      result += convertGroup(remainder);
    }

    return result + 'บาทถ้วน';
  }

  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'บาทถ้วน';
};

// Function to convert image to base64
const getImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return '';
  }
};

const createTrainingFormHTML = (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string },
  userSignature?: string,
  remainingBudgetParam?: number,
  managerSignature?: string,
  hrSignature?: string,
  logoBase64?: string
) => {
  const employeeName = employeeData?.Name || userData.name || '';
  const employeePosition = employeeData?.Position || userData.position || '';
  const employeeTeam = employeeData?.Team || userData.department || '';
  const details = welfareData.details || '';

  // Parse training topics
  let trainingTopics: string[] = [];
  if (welfareData.training_topics) {
    try {
      const parsed = JSON.parse(welfareData.training_topics);
      trainingTopics = Array.isArray(parsed) ? parsed.map(item => item.value || item).filter(Boolean) : [];
    } catch (e) {
      trainingTopics = [];
    }
  }

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForHeader = (dateString?: string) => {
    if (!dateString) return { day: '', month: '', year: '' };
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('th-TH', { month: 'long' }),
      year: (date.getFullYear() + 543).toString()
    };
  };

  const startDate = formatDate(welfareData.start_date);
  const endDate = formatDate(welfareData.end_date);

  // Format request date for header
  const requestDate = formatDateForHeader(welfareData.createdAt);

  // Calculate remaining budget
  const remainingBudget = remainingBudgetParam || userData.training_budget || 0;

  // Get tax values
  const tax7Percent = welfareData.tax7_percent || 0;
  const withholdingTax3Percent = welfareData.withholding_tax3_percent || 0;
  const netAmount = (welfareData.amount || 0) + tax7Percent - withholdingTax3Percent;

  // Convert net amount to Thai text
  const netAmountText = numberToThaiText(netAmount);

  return `
    <div style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      font-family: 'Sarabun', 'TH Sarabun New', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      background: white;
      color: black;
      box-sizing: border-box;
    ">
      <!-- Main Border -->
      <div style="border: 2px solid black; padding: 15px; min-height: 260mm;">
        
        <!-- Header Section -->
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <!-- Logo Section -->
          <div style="width: 80px; height: 60px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
            ${logoBase64 ? `
              <img src="${logoBase64}" 
                   alt="ICP Ladda Logo" 
                   style="max-width: 78px; max-height: 58px; object-fit: contain;" />
            ` : `
              <div style="text-align: center; font-size: 10px; border: 1px solid black; width: 78px; height: 58px; display: flex; align-items: center; justify-content: center;">
                <div>
                  <div style="font-weight: bold;">ICP</div>
                  <div>Ladda</div>
                </div>
              </div>
            `}
          </div>
          
          <!-- Title Section -->
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">
              แบบขออนุมัติส่งพนักงานเข้ารับการฝึกอบรม
            </div>
            <div style="font-size: 11px;">
              (External Training Application)
            </div>
          </div>
          
          <!-- Form Info -->
          <div style="text-align: right; font-size: 10px;">
            <div>F-TRA-01-06 Rev: 02 01/09/2023</div>
            <div style="margin-top: 5px;">
              <span style="border: 1px solid black; padding: 2px 5px;">ต้นสังกัด</span>
              <span style="margin: 0 5px;">→</span>
              <span style="border: 1px solid black; padding: 2px 5px;">HR</span>
              <span style="margin: 0 5px;">→</span>
              <span style="border: 1px solid black; padding: 2px 5px;">VP</span>
            </div>
          </div>
        </div>

        <!-- Date Section -->
        <div style="text-align: right; margin-bottom: 20px; font-size: 12px;">
          วันที่.....${requestDate.day}.....เดือน.....${requestDate.month}.....พ.ศ.....${requestDate.year}.....
        </div>

        <!-- Employee Information -->
        <div style="margin-bottom: 20px; font-size: 12px; line-height: 1.8;">
          <div style="margin-bottom: 8px;">
            เรียน ผู้จัดการฝ่ายทรัพยากรบุคคล
          </div>
          <div style="margin-bottom: 8px; text-indent: 50px;">
            เนื่องด้วยข้าพเจ้า นาย/นาง/นางสาว.....................................${employeeName}.....................................มีความประสงค์จะเข้ารับการอบรม
          </div>
          <div style="margin-bottom: 8px;">
            หลักสูตร .....................................${welfareData.course_name || ''}.....................................จัดโดย.....................................${welfareData.organizer || ''}.....................................
          </div>
          <div style="margin-bottom: 8px;">
            ตั้งแต่วันที่.....................................${startDate}.....................................ถึงวันที่.....................................${endDate}.....................................รวมเป็นจำนวน.......................${welfareData.total_days || 0}.......................วัน
          </div>
        </div>

        <!-- Training Objectives -->
        <div style="margin-bottom: 20px; font-size: 12px;">
          <div style="font-weight: bold; margin-bottom: 10px;">โดยมีวัตถุประสงค์ที่จะเข้ารับอบรม ดังนี้</div>
          <div style="margin-bottom: 8px;">
            1. .....................................${trainingTopics[0] || ''}.....................................
          </div>
          <div style="margin-bottom: 8px;">
            2. .....................................${trainingTopics[1] || ''}.....................................
          </div>
        </div>

        <!-- Cost Information -->
        <div style="margin-bottom: 20px; font-size: 12px;">
          <div style="margin-bottom: 10px;">
            ทั้งนี้ค่าใช้จ่ายในการอบรม ในวงเงิน ...................${welfareData.amount?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}................... บาท และคงเหลือค่าอบรมจำนวน .....${remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.....บาท
          </div>
          <div style="margin-bottom: 15px;">
            สำหรับรายละเอียดค่าใช้จ่ายการฝึกอบรม ในครั้งนี้ มีดังนี้
          </div>
          
          <!-- Cost Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr>
              <td style="border: 1px solid black; padding: 8px; text-align: left; background-color: #f0f0f0;">
                ค่าใช้จ่ายค่าอบรมหลักสูตร
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; background-color: #f0f0f0;">
                ${welfareData.amount?.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} บาท
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 8px; text-align: left;">
                ภาษีมูลค่าเพิ่ม 7%
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: right;">
                ${tax7Percent.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 8px; text-align: left;">
                หัก ภาษี ณ ที่จ่าย 3%
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: right;">
                ${withholdingTax3Percent.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold;">
                ยอดสุทธิ
              </td>
              <td style="border: 1px solid black; padding: 8px; text-align: right; font-weight: bold;">
                ${netAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
              </td>
            </tr>
            <tr>
              <td colspan="2" style="border: 1px solid black; padding: 15px; text-align: center;">
                <div>จำนวนเงิน ${netAmountText} </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Checkboxes Section -->
        <div style="margin-bottom: 20px; font-size: 12px;">
          <div style="display: flex; margin-bottom: 10px;">
            <div style="margin-right: 30px;">
              <span style="border: 1px solid black; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
              <span>ต้นสังกัด</span>
            </div>
            <div>
              <span style="border: 1px solid black; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
              <span>ส่วนกลางในนาม .....................................................................................................ลงวันที่.............................</span>
            </div>
          </div>
          <div>
            <span style="border: 1px solid black; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
            <span>ขอหนังสือรับรองจากการฝึก ณ ที่จ่าย</span>
          </div>
        </div>

        <!-- Signature Sections -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <!-- Employee Signature -->
            <td style="border: 1px solid black; padding: 15px; width: 50%; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px;"></span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: flex; align-items: flex-end; justify-content: center;">
                  <span style="margin-right: 10px;">ลงชื่อ</span>
                  ${userSignature ? `
                    <img src="${userSignature}" alt="Digital Signature" style="
                      max-width: 120px; 
                      max-height: 40px; 
                      margin: 0 10px;
                      border-bottom: 1px solid black;
                      display: inline-block;
                    " />
                  ` : `
                    <span style="
                      display: inline-block; 
                      width: 150px; 
                      border-bottom: 1px dotted black; 
                      margin: 0 10px;
                      height: 20px;
                    "></span>
                  `}
                  <span style="margin-left: 10px;">พนักงาน</span>
                </div>
                ${userSignature ? `
                  <div style="text-align: center; margin-top: 5px;">
                    <span style="font-size: 10px;">(${employeeName})</span>
                  </div>
                ` : ''}
              </div>
              <div style="text-align: center;">
                วันที่ .........../............./..............
              </div>
            </td>
            
            <!-- Manager Signature -->
            <td style="border: 1px solid black; padding: 15px; width: 50%; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px;"></span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: flex; align-items: flex-end; justify-content: center;">
                  <span style="margin-right: 10px;">ลงชื่อ</span>
                  ${managerSignature ? `
                    <img src="${managerSignature}" alt="Manager Signature" style="
                      max-width: 120px; 
                      max-height: 40px; 
                      margin: 0 10px;
                      border-bottom: 1px solid black;
                      display: inline-block;
                    " />
                  ` : `
                    <span style=\"display: inline-block; width: 150px; border-bottom: 1px dotted black; margin: 0 10px; height: 20px;\"></span>
                  `}
                  <span style="margin-left: 10px;">ผู้จัดการบริษัท</span>
                </div>
              </div>
              <div style="text-align: center;">
                วันที่ .........../............./..............
              </div>
            </td>
          </tr>
          
          <tr>
            <!-- Department Manager Signature -->
            <td style="border: 1px solid black; padding: 15px; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px;"></span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: flex; align-items: flex-end; justify-content: center;">
                  <span style="margin-right: 10px;">ลงชื่อ</span>
                  ${hrSignature ? `
                    <img src="${hrSignature}" alt="HR Signature" style="
                      max-width: 120px; 
                      max-height: 40px; 
                      margin: 0 10px;
                      border-bottom: 1px solid black;
                      display: inline-block;
                    " />
                  ` : `
                    <span style=\"display: inline-block; width: 150px; border-bottom: 1px dotted black; margin: 0 10px; height: 20px;\"></span>
                  `}
                  <span style="margin-left: 10px;">ฝ่ายทรัพยากรบุคคล</span>
                </div>
              </div>
              <div style="text-align: center;">
                วันที่ .........../............./..............
              </div>
            </td>
            
            <!-- HR Manager Signature -->
            <td style="border: 1px solid black; padding: 15px; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px;"></span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 40px;">
                <div>ลงชื่อ.................................................รองกรรมการผู้จัดการ</div>
              </div>
              <div style="text-align: center;">
                วันที่ .........../............./..............
              </div>
            </td>
          </tr>
        </table>

      </div>
    </div>
  `;
};

export const generateTrainingPDF = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string },
  userSignature?: string,
  remainingBudget?: number,
  managerSignature?: string,
  hrSignature?: string
): Promise<Blob> => {
  // Load logo as base64
  const logoBase64 = await getImageAsBase64('/logo-icpladda-training.png');
  
  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createTrainingFormHTML(
    welfareData,
    userData,
    employeeData,
    userSignature,
    remainingBudget,
    managerSignature,
    hrSignature,
    logoBase64
  );
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    // Convert HTML to canvas with optimized settings
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      timeout: 10000,
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions to fit A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Return PDF as Blob
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

// เพิ่มฟังก์ชันสำหรับ download PDF
export const generateAndDownloadTrainingPDF = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string },
  userSignature?: string,
  remainingBudget?: number
) => {
  const blob = await generateTrainingPDF(welfareData, userData, employeeData, userSignature, remainingBudget);

  // Generate filename
  const employeeName = employeeData?.Name || userData.name || '';
  const filename = `training_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
};

export const TrainingPDFGenerator: React.FC<TrainingPDFGeneratorProps> = ({
  welfareData,
  userData,
  employeeData,
  remainingBudget
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadTrainingPDF(welfareData, userData, employeeData, undefined, remainingBudget);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      ดาวน์โหลด PDF อบรม
    </button>
  );
};