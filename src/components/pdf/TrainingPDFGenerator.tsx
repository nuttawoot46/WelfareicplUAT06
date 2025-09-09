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
  const managerName = (employeeData as any)?.manager_name || (userData as any).manager_name || 'ผู้จัดการ';

  // Debug: Log the data to console for troubleshooting
  console.log('=== TrainingPDFGenerator Debug ===');
  console.log('Full welfareData:', welfareData);
  console.log('Course Name:', welfareData.course_name || welfareData.title);
  console.log('Organizer:', welfareData.organizer);
  console.log('Training Topics:', welfareData.training_topics);
  console.log('Start Date:', welfareData.start_date);
  console.log('End Date:', welfareData.end_date);
  console.log('Total Days:', welfareData.total_days);
  console.log('Employee Data:', employeeData);

  // Get course name from multiple possible fields - try to get from raw data if not in mapped fields
  const courseName = welfareData.course_name || 
                     welfareData.title || 
                     (welfareData as any).courseName || 
                     (welfareData as any).course_name || 
                     'หลักสูตรการฝึกอบรม';

  // Parse training topics from details or training_topics field
  let trainingTopics: string[] = [];
  const topicsSource = welfareData.training_topics || welfareData.details;
  
  if (topicsSource) {
    try {
      let topicsData = topicsSource;
      
      // Handle double-encoded JSON strings
      if (typeof topicsData === 'string' && topicsData.startsWith('"') && topicsData.endsWith('"')) {
        topicsData = JSON.parse(topicsData);
      }
      
      // Try to parse as JSON first
      if (typeof topicsData === 'string' && (topicsData.includes('[') || topicsData.includes('{'))) {
        const parsed = JSON.parse(topicsData);
        if (Array.isArray(parsed)) {
          trainingTopics = parsed.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item.value) return item.value;
            return String(item);
          }).filter(Boolean);
        }
      } else {
        // If not JSON, split by common delimiters
        trainingTopics = topicsData.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
      }
    } catch (e) {
      // If JSON parsing fails, treat as plain string and split by delimiters
      const fallbackText = topicsSource;
      trainingTopics = fallbackText.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
    }
  }
  
  // Ensure we have at least 2 topics for the form with meaningful defaults
  const defaultTopics = ['เพิ่มพูนความรู้และทักษะ', 'พัฒนาประสิทธิภาพการทำงาน'];
  while (trainingTopics.length < 2) {
    trainingTopics.push(defaultTopics[trainingTopics.length] || '');
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

  const startDate = formatDate(welfareData.start_date || 
                              (welfareData as any).startDate || 
                              (welfareData as any).start_date) || 
                   formatDate(new Date().toISOString());
  const endDate = formatDate(welfareData.end_date || 
                            (welfareData as any).endDate || 
                            (welfareData as any).end_date) || 
                 formatDate(new Date().toISOString());

  // Format request date for header
  const requestDate = formatDateForHeader(welfareData.createdAt || new Date().toISOString());

  // Calculate remaining budget
  const remainingBudget = remainingBudgetParam || userData.training_budget || 0;

  // Get tax values - calculate based on base amount
  const baseAmount = welfareData.amount || 0;
  const tax7Percent = welfareData.tax7_percent || (baseAmount * 0.07);
  const withholdingTax3Percent = welfareData.withholding_tax3_percent || (baseAmount * 0.03);
  const totalAmount = baseAmount + tax7Percent;
  const netAmount = totalAmount - withholdingTax3Percent;

  // Convert net amount to Thai text
  const netAmountText = numberToThaiText(netAmount);
  
  // Get organizer - try multiple field names and raw data
  const organizer = welfareData.organizer || 
                   (welfareData as any).organizerName || 
                   (welfareData as any).organizer || 
                   (welfareData as any).venue || 
                   'องค์กรจัดการฝึกอบรม';
  
  // Get total days - calculate from dates if not available
  let totalDays = welfareData.total_days || 
                  (welfareData as any).totalDays || 
                  (welfareData as any).total_days || 
                  0;
  if (!totalDays && startDate && endDate) {
    const start = new Date(welfareData.start_date || (welfareData as any).startDate || (welfareData as any).start_date || '');
    const end = new Date(welfareData.end_date || (welfareData as any).endDate || (welfareData as any).end_date || '');
    if (start && end) {
      totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  }
  if (!totalDays) totalDays = 1; // Default to 1 day

  return `
    <div style="
      width: 794px;
      min-height: 1123px;
      padding: 30px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      background: #ffffff;
      color: #000000;
      box-sizing: border-box;
      position: relative;
    ">
      <div style="border: 3px solid #000000; padding: 20px; min-height: 1060px; background: #ffffff;">
        
        
        <!-- Header Section -->
        <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
          <!-- Logo Section -->
          <div style="width: 70px; height: 50px; border: 1px solid black; display: flex; align-items: center; justify-content: center; margin-right: 12px; margin-top: 5px;">
            ${logoBase64 ? `
              <img src="${logoBase64}" 
                   alt="Logo" 
                   style="max-width: 65px; max-height: 45px; object-fit: contain;" />
            ` : `
              <div style="text-align: center; font-size: 9px;">
                <div style="font-weight: bold;">โลโก้</div>
              </div>
            `}
          </div>
          
          <!-- Title Section -->
          <div style="flex: 1; text-align: center; margin: 0 10px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
              แบบขออนุมัติส่งพนักงานเข้ารับการฝึกอบรม
            </div>
            <div style="font-size: 14px;">
              (External Training Application)
            </div>
          </div>
          
          <!-- Form Code -->
          <div style="text-align: right; font-size: 10px; margin-top: 5px;">
            <div style="margin-bottom: 8px;">F-TRA-01-06 Rev: 02 01/09/2023</div>
            <div style="display: flex; align-items: center; justify-content: flex-end;">
              <div style="border: 1px solid black; padding: 2px 4px; margin-right: 3px; font-size: 9px;">ต้นสังกัด</div>
              <div style="margin: 0 2px;">→</div>
              <div style="border: 1px solid black; padding: 2px 4px; margin-right: 3px; font-size: 9px;">HR</div>
              <div style="margin: 0 2px;">→</div>
              <div style="border: 1px solid black; padding: 2px 4px; font-size: 9px;">VP</div>
            </div>
          </div>
        </div>

        <!-- Date Section -->
        <div style="text-align: right; margin-bottom: 20px; font-size: 16px; font-weight: bold;">
          วันที่.....${requestDate.day}.....เดือน.....${requestDate.month}.....พ.ศ.....${requestDate.year}.....
        </div>

        <!-- Content Section -->
        <div style="margin-bottom: 20px; font-size: 16px; line-height: 1.6; color: #000000;">
          <div style="margin-bottom: 8px;">
            เรียน ผู้จัดการฝ่ายทรัพยากรบุคคล
          </div>
          <div style="margin-bottom: 8px; text-indent: 50px;">
            เนื่องด้วยข้าพเจ้า นาย/นาง/นางสาว.....................................${employeeName}.....................................มีความประสงค์จะเข้ารับการอบรม
          </div>
          <div style="margin-bottom: 8px;">
            หลักสูตร .....................................${courseName}.....................................Strategy.....................................
          </div>
          <div style="margin-bottom: 8px;">
            หน่วยงาน .....................................${organizer}.....................................จัดโดย.....................................
          </div>
          <div style="margin-bottom: 8px;">
            ตั้งแต่วันที่.....................................${startDate}.....................................ถึงวันที่.....................................${endDate}.....................................รวมเป็น
          </div>
          <div style="margin-bottom: 8px;">
            จำนวน.......................${totalDays}.......................วัน
          </div>
        </div>

        <!-- Training Objectives -->
        <div style="margin-bottom: 20px; font-size: 16px; color: #000000;">
          <div style="margin-bottom: 10px; font-weight: bold;">โดยมีวัตถุประสงค์ของจะเข้ารับอบรม ดังนี้</div>
          <div style="margin-bottom: 8px;">
            1. .....................................${trainingTopics[0]}.....................................
          </div>
          <div style="margin-bottom: 10px;">
            2. .....................................${trainingTopics[1]}.....................................
          </div>
        </div>

        <!-- Cost Information -->
        <div style="margin-bottom: 20px; font-size: 16px; color: #000000;">
          <div style="margin-bottom: 10px;">
            ทั้งนี้ค่าใช้จ่ายในการอบรม ในวงเงิน ...................${totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}................... บาท และคงเหลือค่าอบรมจำนวน .....${remainingBudget.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.....บาท โดย
          </div>
          <div style="margin-bottom: 10px;">
            สำหรับรายละเอียดค่าใช้จ่ายการฝึกอบรม ในครั้งนี้ มีดังนี้
          </div>
        </div>

        <!-- Cost Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px; color: #000000;">
          <tr>
            <td style="border: 1px solid black; padding: 8px; text-align: left;">
              ค่าใช้จ่ายค่าอบรมหลักสูตร (ยกเว้น Vat)
            </td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;">
              ${baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท (${Math.round(baseAmount)})
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px; text-align: left;">
              ภาษีมูลค่าเพิ่ม 7% (${baseAmount > 0 ? (tax7Percent/baseAmount*100).toFixed(2) : '7.00'}%)
            </td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;">
              ${tax7Percent.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท (${Math.round(tax7Percent)})
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px; text-align: left;">
              หัก ภาษี ณ ที่จ่าย 3% (${baseAmount > 0 ? (withholdingTax3Percent/baseAmount*100).toFixed(2) : '3.00'}%)
            </td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;">
              ${withholdingTax3Percent.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท (${Math.round(withholdingTax3Percent)})
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold;">
              ยอดสุทธิ (ส.ป.)
            </td>
            <td style="border: 1px solid black; padding: 8px; text-align: right; font-weight: bold;">
              ${netAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท (${Math.round(netAmount)})
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px; text-align: left;">
              รวมทั้งสิ้นจำนวน (ส.ป.)
            </td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;">
              ${totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท (${Math.round(totalAmount)})
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px; text-align: left;">
              ค่าใช้จ่ายส่วนตัวขอเบิกจากบริษัท 50%
            </td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;">
              ${(welfareData.company_payment || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px; text-align: left;">
              หักค่าใช้จ่ายส่วนตัวที่ไม่สามารถขอเบิกได้
            </td>
            <td style="border: 1px solid black; padding: 8px; text-align: right;">
              ${(welfareData.employee_payment || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 10px; text-align: center; font-weight: bold;" colspan="2">
              จำนวนเงิน ${netAmountText}
            </td>
          </tr>
        </table>

        <!-- Checkboxes Section -->
        <div style="margin-bottom: 25px; font-size: 16px; color: #000000;">
          <div style="display: flex; margin-bottom: 10px;">
            <div style="margin-right: 30px;">
              <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; margin-right: 8px; position: relative; background: #ffffff;">
                ${welfareData.status === 'completed' ? '<span style="position: absolute; top: 0px; left: 4px; font-size: 14px; font-weight: bold; color: #000000;">✓</span>' : ''}
              </span>
              <span>ต้นสังกัด</span>
            </div>
            <div style="margin-right: 30px;">
              <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; margin-right: 8px; background: #ffffff;"></span>
              <span>ส่วนกลางในนาม .....................................ลงวันที่.............................</span>
            </div>
            <div>
              <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; margin-right: 8px; position: relative; background: #ffffff;">
                ${welfareData.status === 'completed' ? '<span style="position: absolute; top: 0px; left: 4px; font-size: 14px; font-weight: bold; color: #000000;">✓</span>' : ''}
              </span>
              <span>ขอหนังสือรับรองจากการฝึก ณ ที่จ่าย</span>
            </div>
          </div>
        </div>

        <!-- Signature Sections -->
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #000000;">
          <tr>
            <!-- Employee Signature -->
            <td style="border: 1px solid black; padding: 15px; width: 50%; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">อนุมัติ</span>
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; margin-right: 15px; position: relative; background: #ffffff;">
                    ${userSignature ? '<span style="position: absolute; top: 0px; left: 4px; font-size: 14px; font-weight: bold; color: #000000;">✓</span>' : ''}
                  </span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; background: #ffffff;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 30px;">
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
                    <span style="font-size: 11px;">(${employeeName})</span>
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
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; margin-right: 15px; position: relative; background: #ffffff;">
                    ${managerSignature ? '<span style="position: absolute; top: 0px; left: 4px; font-size: 14px; font-weight: bold; color: #000000;">✓</span>' : ''}
                  </span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; background: #ffffff;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 30px;">
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
                    <span style="display: inline-block; width: 150px; border-bottom: 1px dotted black; margin: 0 10px; height: 20px;"></span>
                  `}
                  <span style="margin-left: 10px;">ผู้จัดการบริษัท</span>
                </div>
                ${managerSignature ? `
                  <div style="text-align: center; margin-top: 5px;">
                    <span style="font-size: 11px;">(${managerName})</span>
                  </div>
                ` : ''}
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
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; margin-right: 15px; position: relative; background: #ffffff;">
                    ${hrSignature ? '<span style="position: absolute; top: 0px; left: 4px; font-size: 14px; font-weight: bold; color: #000000;">✓</span>' : ''}
                  </span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; background: #ffffff;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 30px;">
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
                    <span style="display: inline-block; width: 150px; border-bottom: 1px dotted black; margin: 0 10px; height: 20px;"></span>
                  `}
                  <span style="margin-left: 10px;">ฝ่ายทรัพยากรบุคคล</span>
                </div>
                ${hrSignature ? `
                  <div style="text-align: center; margin-top: 5px;">
                    <span style="font-size: 11px;">(ฝ่ายทรัพยากรบุคคล)</span>
                  </div>
                ` : ''}
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
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; margin-right: 15px; background: #ffffff;"></span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 2px solid #000000; width: 18px; height: 18px; display: inline-block; background: #ffffff;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 30px;">
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
  const logoBase64 = await getImageAsBase64('/Logo_ICPL.png');
  
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
  tempDiv.style.backgroundColor = 'white';
  document.body.appendChild(tempDiv);

  try {
    // Wait a bit for fonts to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert HTML to canvas with optimized settings for smaller file size
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 1.5, // Reduced from 2 to 1.5 for smaller file size
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      logging: false, // Disable logging for better performance
      foreignObjectRendering: true
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    // Use JPEG with lower quality for smaller file size
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
