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
    manager_name?: string;
  };
  userSignature?: string;
  remainingBudget?: number;
  managerSignature?: string;
  hrSignature?: string;
}

// Thai number conversion utility
const numberToThaiText = (num: number): string => {
  if (num === 0) return 'ศูนย์บาทถ้วน';

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

  // Handle numbers up to millions
  const million = Math.floor(num / 1000000);
  const thousand = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  let result = '';

  if (million > 0) {
    result += convertGroup(million) + 'ล้าน';
  }

  if (thousand > 0) {
    result += convertGroup(thousand) + 'พัน';
  }

  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return result + 'บาทถ้วน';
};

// Thai date formatting utility
const formatThaiDate = (dateString?: string) => {
  if (!dateString) {
    const now = new Date();
    return {
      day: now.getDate().toString(),
      month: now.toLocaleDateString('th-TH', { month: 'long' }),
      year: (now.getFullYear() + 543).toString(),
      formatted: now.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  }

  const date = new Date(dateString);
  return {
    day: date.getDate().toString(),
    month: date.toLocaleDateString('th-TH', { month: 'long' }),
    year: (date.getFullYear() + 543).toString(),
    formatted: date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  };
};

// Financial calculations utility - use values from welfareData instead of calculating
const calculateFinancials = (welfareData: WelfareRequest) => {
  const baseCost = welfareData.total_amount || welfareData.amount || 0;
  const vatAmount = welfareData.tax7_percent || 0;
  const withholdingTax = welfareData.withholding_tax3_percent || 0;
  const grossAmount = baseCost + vatAmount;
  const netAmount = welfareData.net_amount || (grossAmount - withholdingTax);
  const excessAmount = welfareData.excess_amount || 0;
  const companyPayment = welfareData.company_payment || 0;
  const employeePayment = welfareData.employee_payment || 0;

  return {
    baseCost,
    vatAmount,
    withholdingTax,
    grossAmount,
    netAmount,
    excessAmount,
    companyPayment,
    employeePayment,
    netAmountText: numberToThaiText(Math.round(netAmount))
  };
};

// Training objectives parser utility
const parseTrainingObjectives = (topicsSource?: string): string[] => {
  const defaultObjectives = [
    'เพิ่มพูนความรู้และทักษะในการปฏิบัติงาน',
    'พัฒนาประสิทธิภาพและคุณภาพการทำงาน'
  ];

  if (!topicsSource) return defaultObjectives;

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
        const objectives = parsed.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item.value) return item.value;
          return String(item);
        }).filter(Boolean);

        return objectives.length >= 2 ? objectives : [...objectives, ...defaultObjectives].slice(0, 2);
      }
    } else {
      // If not JSON, split by common delimiters
      const objectives = topicsData.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
      return objectives.length >= 2 ? objectives : [...objectives, ...defaultObjectives].slice(0, 2);
    }
  } catch (e) {
    // If parsing fails, split by delimiters
    const objectives = topicsSource.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
    return objectives.length >= 2 ? objectives : [...objectives, ...defaultObjectives].slice(0, 2);
  }

  return defaultObjectives;
};

// Image to base64 conversion utility
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

// HTML template for exact form layout matching the Thai form image
const createTrainingFormHTML = (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; manager_name?: string; Original_Budget_Training?: number | string; Budget_Training?: number | string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string,
  remainingBudget?: number,
  logoBase64?: string,
  specialSignature?: string
) => {
  // Extract and process data
  const employeeName = employeeData?.Name || userData.name || '';
  const employeePosition = employeeData?.Position || '';
  const managerName = employeeData?.manager_name || '';

  const courseName = welfareData.course_name || welfareData.title || '';
  const organizer = welfareData.organizer || '';

  const startDate = formatThaiDate(welfareData.start_date);
  const endDate = formatThaiDate(welfareData.end_date);
  const requestDate = formatThaiDate(welfareData.createdAt);

  // Calculate total days
  let totalDays = welfareData.total_days || 0;
  if (!totalDays && welfareData.start_date && welfareData.end_date) {
    const start = new Date(welfareData.start_date);
    const end = new Date(welfareData.end_date);
    totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Parse training objectives
  const objectives = parseTrainingObjectives(welfareData.training_topics || welfareData.details);

  // Get financials from welfareData
  const financials = calculateFinancials(welfareData);

  // Get budget from employeeData
  const originalBudget = Number(employeeData?.Original_Budget_Training) || remainingBudget || userData.training_budget || 0;
  const remainingBudgetAmount = Number(employeeData?.Budget_Training) || remainingBudget || 0;

  // Get current Buddhist year
  const currentYear = new Date().getFullYear() + 543;

  return `
    <div style="
      width: 210mm;
      height: 297mm;
      padding: 10mm;
      font-family: 'Sarabun', 'TH Sarabun New', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.3;
      background: #ffffff;
      color: #000000;
      box-sizing: border-box;
      position: relative;
      margin: 0;
      overflow: hidden;
    ">
      <div style="border: 1.5px solid #000000; padding: 6mm; height: calc(100% - 12mm); background: #ffffff; display: flex; flex-direction: column;">

        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <!-- Company Logo -->
          <div style="width: 80px;">
            <img src="/dist/Picture/logo-Photoroom.jpg" alt="ICP Ladda Logo" style="
              width: 70px;
              height: 50px;
              object-fit: contain;
            " />
          </div>

          <!-- Title Section -->
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 14pt; font-weight: bold; color: #000;">
              แบบขออนุมัติส่งพนักงานเข้ารับการฝึกอบรม
            </div>
            <div style="font-size: 10pt; color: #000;">
              (External Training Application)
            </div>
          </div>

          <!-- Form Code and Workflow -->
          <div style="text-align: right; font-size: 8pt; color: #000; width: 140px;">
            <div style="margin-bottom: 3px;">F-TRA-01-06 Rev: 02 01/09/2023</div>
            <div style="display: flex; align-items: center; justify-content: flex-end; font-size: 7pt;">
              <span>ต้นสังกัด</span>
              <span style="margin: 0 3px;">→</span>
              <span>HR</span>
              <span style="margin: 0 3px;">→</span>
              <span>VP</span>
            </div>
          </div>
        </div>

        <!-- Date Section -->
        <div style="text-align: right; margin-bottom: 8px; font-size: 10pt; color: #000;">
          วันที่ <u>&nbsp;${requestDate.day}&nbsp;</u> เดือน <u>&nbsp;${requestDate.month}&nbsp;</u> พ.ศ. <u>&nbsp;${requestDate.year}&nbsp;</u>
        </div>

        <!-- Content Section -->
        <div style="margin-bottom: 8px; font-size: 10pt; line-height: 1.5; color: #000;">
          <div style="margin-bottom: 4px;">
            เรียน ผู้จัดการฝ่ายทรัพยากรบุคคล
          </div>
          <div style="margin-bottom: 4px; text-indent: 40px;">
            เนื่องด้วยข้าพเจ้า นาย/นาง/นางสาว <u>&nbsp;&nbsp;${employeeName}&nbsp;&nbsp;</u> มีความประสงค์จะเข้ารับการอบรม
          </div>
          <div style="margin-bottom: 4px;">
            หลักสูตร <u>&nbsp;&nbsp;${courseName || '........................................'}&nbsp;&nbsp;</u> ตั้งแต่วันที่ <u>&nbsp;${welfareData.start_date ? startDate.formatted : '............'}&nbsp;</u>
          </div>
          <div style="margin-bottom: 4px;">
            รวมเป็นจำนวน <u>&nbsp;${totalDays || '......'}&nbsp;</u> วัน
          </div>
        </div>

        <!-- Training Objectives -->
        <div style="margin-bottom: 8px; font-size: 10pt; color: #000;">
          <div style="margin-bottom: 4px;">โดยมีวัตถุประสงค์ที่จะเข้ารับอบรม ดังนี้</div>
          <div style="margin-left: 20px; margin-bottom: 3px; display: flex; align-items: flex-start;">
            <span style="border: 1.5px solid #000; width: 12px; height: 12px; display: inline-block; margin-right: 8px; margin-top: 2px; position: relative; background: #fff;">
              ${objectives?.[0] ? '<span style="position: absolute; top: -3px; left: 1px; font-size: 11pt; font-weight: bold;">✓</span>' : ''}
            </span>
            <span>${objectives?.[0]?.trim() || 'เพิ่มพูนความรู้และทักษะในการปฏิบัติงาน'}</span>
          </div>
          <div style="margin-left: 20px; margin-bottom: 3px; display: flex; align-items: flex-start;">
            <span style="border: 1.5px solid #000; width: 12px; height: 12px; display: inline-block; margin-right: 8px; margin-top: 2px; position: relative; background: #fff;">
              ${objectives?.[1] ? '<span style="position: absolute; top: -3px; left: 1px; font-size: 11pt; font-weight: bold;">✓</span>' : ''}
            </span>
            <span>${objectives?.[1]?.trim() || 'พัฒนาประสิทธิภาพและคุณภาพการทำงาน'}</span>
          </div>
        </div>

        <!-- Cost Information -->
        <div style="margin-bottom: 6px; font-size: 10pt; color: #000;">
          <div style="margin-bottom: 4px;">
            ทั้งนี้ข้าพเจ้ามีงบการอบรม ในปี ${currentYear} เป็นจำนวนเงิน <u>&nbsp;${originalBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}&nbsp;</u> บาท และคงเหลือก่อนเบิกจำนวน <u>&nbsp;${remainingBudgetAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}&nbsp;</u> บาท ส่วนต่าง
          </div>
          <div style="margin-bottom: 4px;">
            รายละเอียดค่าใช้จ่ายในการฝึกอบรม ในครั้งนี้ มีดังนี้
          </div>
        </div>

        <!-- Financial Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10pt; color: #000;">
          <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: left;">
              ค่าใช้จ่ายต่อหลักสูตร(ก่อน Vat)
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: right; width: 150px;">
              ${financials.baseCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center; width: 40px;">
              (a)
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: left;">
              ภาษีมูลค่าเพิ่ม 7% (a*0.07)
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: right;">
              ${financials.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">
              (b)
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: left;">
              <b>หัก</b> ภาษี ณ ที่จ่าย 3% (a*0.03)
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: right;">
              ${financials.withholdingTax.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">
              (c)
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: left; font-weight: bold;">
              ยอดสุทธิ (a+b-c)
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: right; font-weight: bold;">
              ${financials.netAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center; font-weight: bold;">
              (d)
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: left;">
              คิดเป็นส่วนเกินงบ (d-งบคงเหลือ)
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: right;">
              ${financials.excessAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: left;">
              บริษัทจ่าย (งบคงเหลือก่อนเบิก+ส่วนเกิน 50%)
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: right;">
              ${financials.companyPayment.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: left;">
              พนักงานจ่ายส่วนเกินที่เหลือ
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: right;">
              ${financials.employeePayment.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </td>
            <td style="border: 1px solid #000; padding: 3px 6px; text-align: center;">
            </td>
          </tr>
        </table>

        <!-- Checkboxes Section -->
        <div style="margin-bottom: 6px; font-size: 10pt; color: #000;">
          <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div style="display: flex; align-items: center;">
              <span style="border: 1.5px solid #000; width: 12px; height: 12px; display: inline-block; margin-right: 5px; position: relative; background: #fff;">
                <span style="position: absolute; top: -3px; left: 1px; font-size: 11pt; font-weight: bold;">✓</span>
              </span>
              <span>ต้นสังกัด</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="border: 1.5px solid #000; width: 12px; height: 12px; display: inline-block; margin-right: 5px; background: #fff;"></span>
              <span>ส่วนกลางในนาม ..................... ลงวันที่ ................</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="border: 1.5px solid #000; width: 12px; height: 12px; display: inline-block; margin-right: 5px; position: relative; background: #fff;">
                <span style="position: absolute; top: -3px; left: 1px; font-size: 11pt; font-weight: bold;">✓</span>
              </span>
              <span>ขอหนังสือรับรองจากการฝึก ณ ที่จ่าย</span>
            </div>
          </div>
        </div>

        <!-- Signature Sections -->
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt; color: #000;">
            <tr>
              <!-- Employee Signature -->
              <td style="border: 1.5px solid #000; padding: 6px; width: 50%; vertical-align: top;">
                <div style="text-align: center; margin-bottom: 20px;">
                  ${userSignature ? `
                    <img src="${userSignature}" alt="Employee Signature" style="max-width: 100px; max-height: 35px;" />
                  ` : ''}
                </div>
                <div style="text-align: center; font-size: 9pt;">
                  ลงชื่อ ..................................... พนักงาน
                </div>
                <div style="text-align: center; font-size: 9pt; margin-top: 3px;">
                  ตำแหน่ง <u>&nbsp;${employeePosition || '...................................'}&nbsp;</u>
                </div>
                <div style="text-align: center; font-size: 9pt; margin-top: 3px;">
                  วันที่ <u>&nbsp;${userSignature ? requestDate.day : '......'}&nbsp;</u> / <u>&nbsp;${userSignature ? requestDate.month : '......'}&nbsp;</u> / <u>&nbsp;${userSignature ? requestDate.year : '..........'}&nbsp;</u>
                </div>
              </td>

              <!-- Manager Signature -->
              <td style="border: 1.5px solid #000; padding: 6px; width: 50%; vertical-align: top;">
                <div style="text-align: center; margin-bottom: 5px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 9pt;">
                    <span style="display: flex; align-items: center;">
                      <span style="border: 1.5px solid #000; width: 11px; height: 11px; display: inline-block; margin-right: 4px; position: relative; background: ${managerSignature ? '#fff' : '#fff'};">
                        ${managerSignature ? '<span style="position: absolute; top: -3px; left: 0px; font-size: 10pt; font-weight: bold;">✓</span>' : ''}
                      </span>
                      อนุมัติ
                    </span>
                    <span style="display: flex; align-items: center;">
                      <span style="border: 1.5px solid #000; width: 11px; height: 11px; display: inline-block; margin-right: 4px; background: #fff;"></span>
                      ไม่อนุมัติ
                    </span>
                  </div>
                </div>
                <div style="text-align: center; margin-bottom: 10px; min-height: 30px;">
                  ${managerSignature ? `
                    <img src="${managerSignature}" alt="Manager Signature" style="max-width: 100px; max-height: 35px;" />
                  ` : ''}
                </div>
                <div style="text-align: center; font-size: 9pt;">
                  ลงชื่อ ..................................... ผู้บังคับบัญชา
                </div>
                <div style="text-align: center; font-size: 9pt; margin-top: 3px;">
                  วันที่ ........ / ........ / ..........
                </div>
              </td>
            </tr>

            <tr>
              <!-- HR Signature -->
              <td style="border: 1.5px solid #000; padding: 6px; vertical-align: top;">
                <div style="text-align: center; margin-bottom: 5px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 9pt;">
                    <span style="display: flex; align-items: center;">
                      <span style="border: 1.5px solid #000; width: 11px; height: 11px; display: inline-block; margin-right: 4px; position: relative; background: #fff;">
                        ${hrSignature ? '<span style="position: absolute; top: -3px; left: 0px; font-size: 10pt; font-weight: bold;">✓</span>' : ''}
                      </span>
                      อนุมัติ
                    </span>
                    <span style="display: flex; align-items: center;">
                      <span style="border: 1.5px solid #000; width: 11px; height: 11px; display: inline-block; margin-right: 4px; background: #fff;"></span>
                      ไม่อนุมัติ
                    </span>
                  </div>
                </div>
                <div style="text-align: center; margin-bottom: 10px; min-height: 30px;">
                  ${hrSignature ? `
                    <img src="${hrSignature}" alt="HR Signature" style="max-width: 100px; max-height: 35px;" />
                  ` : ''}
                </div>
                <div style="text-align: center; font-size: 9pt;">
                  ลงชื่อ ..................................... ฝ่ายทรัพยากรบุคคล
                </div>
                <div style="text-align: center; font-size: 9pt; margin-top: 3px;">
                  วันที่ ........ / ........ / ..........
                </div>
              </td>

              <!-- Managing Director Signature -->
              <td style="border: 1.5px solid #000; padding: 6px; vertical-align: top;">
                <div style="text-align: center; margin-bottom: 5px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 15px; font-size: 9pt;">
                    <span style="display: flex; align-items: center;">
                      <span style="border: 1.5px solid #000; width: 11px; height: 11px; display: inline-block; margin-right: 4px; position: relative; background: #fff;">
                        ${specialSignature ? '<span style="position: absolute; top: -3px; left: 0px; font-size: 10pt; font-weight: bold;">✓</span>' : ''}
                      </span>
                      อนุมัติ
                    </span>
                    <span style="display: flex; align-items: center;">
                      <span style="border: 1.5px solid #000; width: 11px; height: 11px; display: inline-block; margin-right: 4px; background: #fff;"></span>
                      ไม่อนุมัติ
                    </span>
                  </div>
                </div>
                <div style="text-align: center; margin-bottom: 10px; min-height: 30px;">
                  ${specialSignature ? `
                    <img src="${specialSignature}" alt="MD Signature" style="max-width: 100px; max-height: 35px;" />
                  ` : ''}
                </div>
                <div style="text-align: center; font-size: 9pt;">
                  ลงชื่อ ..................................... กรรมการผู้จัดการ
                </div>
                <div style="text-align: center; font-size: 9pt; margin-top: 3px;">
                  วันที่ ........ / ........ / ..........
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Footer Note -->
        <div style="margin-top: 6px; font-size: 8pt; color: #000;">
          <b>หมายเหตุ :</b> กรณีค่าใช้จ่ายในการอบรม มีจำนวนเงิน 10,000 บาทขึ้นไป ให้พิจารณาอนุมัติโดย กรรมการผู้จัดการ เท่านั้น *
        </div>

      </div>
    </div>
  `;
};

// Main PDF generation function using HTML-to-Canvas for Thai language support
export const generateTrainingPDF = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; manager_name?: string; Original_Budget_Training?: number | string; Budget_Training?: number | string },
  userSignature?: string,
  remainingBudget?: number,
  managerSignature?: string,
  hrSignature?: string,
  specialSignature?: string
): Promise<Blob> => {
  console.log('=== generateTrainingPDF Debug ===');
  console.log('welfareData:', welfareData);
  console.log('userData:', userData);
  console.log('employeeData:', employeeData);
  console.log('userSignature length:', userSignature?.length || 0);
  console.log('managerSignature length:', managerSignature?.length || 0);
  console.log('hrSignature length:', hrSignature?.length || 0);
  console.log('specialSignature length:', specialSignature?.length || 0);

  try {
    // Load logo as base64 if available
    let logoBase64 = '';
    try {
      logoBase64 = await getImageAsBase64('/logo.png');
    } catch (error) {
      console.log('Logo not found, using placeholder');
    }

    // Create HTML content
    const htmlContent = createTrainingFormHTML(
      welfareData,
      userData,
      employeeData,
      userSignature,
      managerSignature,
      hrSignature,
      remainingBudget,
      logoBase64,
      specialSignature
    );

    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    // Wait for fonts to load
    await document.fonts.ready;

    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      scrollX: 0,
      scrollY: 0,
      logging: false,
      removeContainer: true
    });

    // Clean up
    document.body.removeChild(container);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add canvas as image to PDF - ensure it fits exactly on A4
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = 297; // A4 height in mm - force exact A4 dimensions

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    console.log('PDF generation completed successfully');
    return pdf.output('blob');

  } catch (error) {
    console.error('Error in generateTrainingPDF:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Download function
export const generateAndDownloadTrainingPDF = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; manager_name?: string },
  userSignature?: string,
  remainingBudget?: number,
  managerSignature?: string,
  hrSignature?: string
) => {
  const blob = await generateTrainingPDF(
    welfareData,
    userData,
    employeeData,
    userSignature,
    remainingBudget,
    managerSignature,
    hrSignature
  );

  // Generate filename
  const employeeName = employeeData?.Name || userData.name || '';
  const filename = `external_training_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

  // Create download
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

// React Component
export const TrainingPDFGenerator: React.FC<TrainingPDFGeneratorProps> = ({
  welfareData,
  userData,
  employeeData,
  userSignature,
  remainingBudget,
  managerSignature,
  hrSignature
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      console.log('=== TrainingPDFGenerator: Starting PDF generation ===');
      console.log('welfareData:', welfareData);
      console.log('userData:', userData);
      console.log('employeeData:', employeeData);
      console.log('remainingBudget:', remainingBudget);

      await generateAndDownloadTrainingPDF(
        welfareData,
        userData,
        employeeData,
        userSignature,
        remainingBudget,
        managerSignature,
        hrSignature
      );
      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
    >
      {isGenerating ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF อบรม'}
    </button>
  );
};

export default TrainingPDFGenerator;