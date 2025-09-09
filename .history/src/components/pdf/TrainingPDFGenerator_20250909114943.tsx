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
  if (num === 0) return 'เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธย';

  const ones = ['', 'เน€เธเธเน€เธยเน€เธเธ–เน€เธยเน€เธย', 'เน€เธเธเน€เธเธเน€เธย', 'เน€เธเธเน€เธเธ’เน€เธเธ', 'เน€เธเธเน€เธเธ•เน€เธย', 'เน€เธเธเน€เธยเน€เธเธ’', 'เน€เธเธเน€เธย', 'เน€เธโฌเน€เธยเน€เธยเน€เธโ€', 'เน€เธยเน€เธยเน€เธโ€', 'เน€เธโฌเน€เธยเน€เธยเน€เธเธ’'];
  const tens = ['', '', 'เน€เธเธเน€เธเธ•เน€เธยเน€เธเธเน€เธเธ”เน€เธย', 'เน€เธเธเน€เธเธ’เน€เธเธเน€เธเธเน€เธเธ”เน€เธย', 'เน€เธเธเน€เธเธ•เน€เธยเน€เธเธเน€เธเธ”เน€เธย', 'เน€เธเธเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ”เน€เธย', 'เน€เธเธเน€เธยเน€เธเธเน€เธเธ”เน€เธย', 'เน€เธโฌเน€เธยเน€เธยเน€เธโ€เน€เธเธเน€เธเธ”เน€เธย', 'เน€เธยเน€เธยเน€เธโ€เน€เธเธเน€เธเธ”เน€เธย', 'เน€เธโฌเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ”เน€เธย'];
  const units = ['', 'เน€เธเธเน€เธเธ”เน€เธย', 'เน€เธเธเน€เธยเน€เธเธเน€เธเธ', 'เน€เธยเน€เธเธ‘เน€เธย', 'เน€เธเธเน€เธเธเน€เธเธ—เน€เธยเน€เธย', 'เน€เธยเน€เธเธเน€เธย', 'เน€เธเธ…เน€เธยเน€เธเธ’เน€เธย'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';

    let result = '';
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;

    if (hundred > 0) {
      result += ones[hundred] + 'เน€เธเธเน€เธยเน€เธเธเน€เธเธ';
    }

    if (ten > 0) {
      if (ten === 1) {
        result += 'เน€เธเธเน€เธเธ”เน€เธย';
      } else if (ten === 2) {
        result += 'เน€เธเธเน€เธเธ•เน€เธยเน€เธเธเน€เธเธ”เน€เธย';
      } else {
        result += ones[ten] + 'เน€เธเธเน€เธเธ”เน€เธย';
      }
    }

    if (one > 0) {
      if (ten > 0 && one === 1) {
        result += 'เน€เธโฌเน€เธเธเน€เธยเน€เธโ€';
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
      result += convertGroup(thousand) + 'เน€เธยเน€เธเธ‘เน€เธย';
    }
    if (remainder > 0) {
      result += convertGroup(remainder);
    }

    return result + 'เน€เธยเน€เธเธ’เน€เธโ€”เน€เธโ€“เน€เธยเน€เธเธเน€เธย';
  }

  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'เน€เธยเน€เธเธ’เน€เธโ€”เน€เธโ€“เน€เธยเน€เธเธเน€เธย';
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
  const employeeTeam = employeeData?.Team || userData.department || (welfareData as any)?.department_user || (welfareData as any)?.department_request || '';
  const details = welfareData.details || '';

  // Parse training topics (support double-encoded JSON)
  let trainingTopics: string[] = [];
  if (welfareData.training_topics) {
    try {
      let parsed: any = JSON.parse(welfareData.training_topics as any);
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      if (Array.isArray(parsed)) {
        trainingTopics = parsed.map((item: any) => item?.value ?? item).filter(Boolean);
      }
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
  const baseAmount = Number((welfareData as any).amount ?? 0);
  const tax7Percent = Number((welfareData as any).tax7_percent ?? 0);
  const withholdingTax3Percent = Number((welfareData as any).withholding_tax3_percent ?? 0);
  const netAmount = (welfareData as any).net_amount != null ? Number((welfareData as any).net_amount) : (baseAmount + tax7Percent - withholdingTax3Percent);
  const excessAmount = (welfareData as any).excess_amount || 0;
  const companyPayment = (welfareData as any).company_payment || 0;
  const employeePayment = (welfareData as any).employee_payment || 0;
  const isVatIncluded = (welfareData as any).is_vat_included ? true : false;

  // Convert net amount to Thai text
  const netAmountText = numberToThaiText(netAmount);
  // Approval states and dates
  const managerApprovedDate = formatDate((welfareData as any).managerApprovedAt || (welfareData as any).manager_approved_at);
  const hrApprovedDate = formatDate((welfareData as any).hrApprovedAt || (welfareData as any).hr_approved_at);
  const isManagerApproved = Boolean(managerSignature || (welfareData as any).managerApprovedAt || (welfareData as any).manager_approved_at);
  const isHRApproved = Boolean(hrSignature || (welfareData as any).hrApprovedAt || (welfareData as any).hr_approved_at);


  return `
    <div style="
      width: 210mm;
      height: 297mm;
      padding: 10mm;
      font-family: 'Sarabun', 'TH Sarabun New', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      background: white;
      color: black;
      box-sizing: border-box;
      overflow: hidden;
    ">
      <!-- Main Border -->
      <div style="border: 1.5px solid black; padding: 10px; height: calc(297mm - 20mm); box-sizing: border-box;">
        
        <!-- Header Section -->
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <!-- Logo Section (two logos) -->
          <div style="display: flex; align-items: center; gap: 6px; margin-right: 15px;">
            <div style="width: 80px; height: 60px; display: flex; align-items: center; justify-content: center;">
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
            <div style="width: 60px; height: 60px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px;">
              เน€เธยเน€เธเธ…เน€เธยเน€เธยเน€เธย
            </div>
          </div>
          
          <!-- Title Section -->
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 4px;">
              เน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธโฌเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ–เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ
            </div>
            <div style="font-size: 10px;">
              (External Training Application)
            </div>
          </div>
          
          <!-- Form Info -->
          <div style="text-align: right; font-size: 10px;">
            <div>F-TRA-01-06 Rev: 02 01/09/2023</div>
            <div style="margin-top: 5px;">
              <span style="border: 1px solid black; padding: 2px 5px;">เน€เธโ€ขเน€เธยเน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ‘เน€เธโ€</span>
              <span style="margin: 0 5px;">เนยโ€</span>
              <span style="border: 1px solid black; padding: 2px 5px;">HR</span>
              <span style="margin: 0 5px;">เนยโ€</span>
              <span style="border: 1px solid black; padding: 2px 5px;">VP</span>
            </div>
          </div>
        </div>

        <!-- Date Section -->
        <div style="text-align: right; margin-bottom: 12px; font-size: 11px;">
          เน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ•เน€เธย.....${requestDate.day}.....เน€เธโฌเน€เธโ€เน€เธเธ—เน€เธเธเน€เธย.....${requestDate.month}.....เน€เธย.เน€เธเธ.....${requestDate.year}.....
        </div>

        <!-- Employee Information -->
        <div style="margin-bottom: 12px; font-size: 11px; line-height: 1.8;">
          <div style="margin-bottom: 8px;">
            เน€เธโฌเน€เธเธเน€เธเธ•เน€เธเธเน€เธย เน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ‘เน€เธโ€เน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธโ€”เน€เธเธเน€เธเธ‘เน€เธยเน€เธเธเน€เธเธ’เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ…
          </div>
          <div style="margin-bottom: 8px; text-indent: 50px;">
            เน€เธโฌเน€เธยเน€เธเธ—เน€เธยเน€เธเธเน€เธยเน€เธโ€เน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธโฌเน€เธยเน€เธยเน€เธเธ’ เน€เธยเน€เธเธ’เน€เธเธ/เน€เธยเน€เธเธ’เน€เธย/เน€เธยเน€เธเธ’เน€เธยเน€เธเธเน€เธเธ’เน€เธเธ.....................................${employeeName}.....................................เน€เธเธเน€เธเธ•เน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธโฌเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธ
          </div>
          <div style="margin-bottom: 8px;">
            เน€เธยเน€เธยเน€เธยเน€เธย .....................................${employeeTeam}.....................................
          </div>
          <div style="margin-bottom: 8px;">
            เน€เธเธเน€เธเธ…เน€เธเธ‘เน€เธยเน€เธเธเน€เธเธเน€เธโ€ขเน€เธเธ .....................................${welfareData.course_name || ''}.....................................เน€เธยเน€เธเธ‘เน€เธโ€เน€เธยเน€เธโ€เน€เธเธ.....................................${welfareData.organizer || ''}.....................................
          </div>
          <div style="margin-bottom: 8px;">
            เน€เธโ€ขเน€เธเธ‘เน€เธยเน€เธยเน€เธยเน€เธโ€ขเน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ•เน€เธย.....................................${startDate}.....................................เน€เธโ€“เน€เธเธ–เน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ•เน€เธย.....................................${endDate}.....................................เน€เธเธเน€เธเธเน€เธเธเน€เธโฌเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธย.......................${welfareData.total_days || 0}.......................เน€เธเธเน€เธเธ‘เน€เธย
          </div>
          ${details ? `<div style=\"margin-top: 6px;\">เน€เธเธเน€เธเธ’เน€เธเธเน€เธเธ…เน€เธเธเน€เธโฌเน€เธเธเน€เธเธ•เน€เธเธเน€เธโ€เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธเน€เธโฌเน€เธโ€ขเน€เธเธ”เน€เธเธ: ${details}</div>` : ''}
        </div>

        <!-- Training Objectives -->
        <div style="margin-bottom: 12px; font-size: 11px;">
          <div style="font-weight: bold; margin-bottom: 10px;">เน€เธยเน€เธโ€เน€เธเธเน€เธเธเน€เธเธ•เน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธโ€“เน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธโ€”เน€เธเธ•เน€เธยเน€เธยเน€เธเธเน€เธโฌเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ‘เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ เน€เธโ€เน€เธเธ‘เน€เธยเน€เธยเน€เธเธ•เน€เธย</div>
          <div style="margin-bottom: 8px;">
            1. .....................................${trainingTopics[0] || ''}.....................................
          </div>
          <div style="margin-bottom: 8px;">
            2. .....................................${trainingTopics[1] || ''}.....................................
          </div>
        </div>

        <!-- Cost Information -->
        <div style="margin-bottom: 12px; font-size: 11px;">
          <div style="margin-bottom: 10px;">
            เน€เธโ€”เน€เธเธ‘เน€เธยเน€เธยเน€เธยเน€เธเธ•เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธโฌเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธ•เน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ’เน€เธโ€เน€เธยเน€เธยเน€เธยเน€เธเธ• ${(new Date(welfareData?.createdAt || new Date())).getFullYear() + 543} เน€เธโฌเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธยเน€เธโฌเน€เธยเน€เธเธ”เน€เธย ...................${baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}................... เน€เธยเน€เธเธ’เน€เธโ€” เน€เธยเน€เธเธ…เน€เธเธเน€เธยเน€เธยเน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธ—เน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธย .....${(Number(remainingBudget) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.....เน€เธยเน€เธเธ’เน€เธโ€” เน€เธเธเน€เธเธ“เน€เธเธเน€เธเธเน€เธเธ‘เน€เธยเน€เธเธเน€เธเธ’เน€เธเธเน€เธเธ…เน€เธเธเน€เธโฌเน€เธเธเน€เธเธ•เน€เธเธเน€เธโ€เน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธ–เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธ เน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธยเน€เธเธ•เน€เธย เน€เธเธเน€เธเธ•เน€เธโ€เน€เธเธ‘เน€เธยเน€เธยเน€เธเธ•เน€เธย
          </div>
          
          
          <!-- Cost Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: left; background-color: #f0f0f0;">
                เน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธเธ…เน€เธเธ‘เน€เธยเน€เธเธเน€เธเธเน€เธโ€ขเน€เธเธ ${isVatIncluded ? '(เน€เธเธเน€เธเธเน€เธเธ Vat)' : '(เน€เธเธเน€เธเธ‘เน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธ Vat)'}
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; background-color: #f0f0f0;">
                ${baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} เน€เธยเน€เธเธ’เน€เธโ€” <span style="color:#555">(a)</span>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: left;">
                เน€เธย เน€เธเธ’เน€เธเธเน€เธเธ•เน€เธเธเน€เธเธเน€เธเธ…เน€เธยเน€เธยเน€เธเธ’เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธ 7% <span style="color:#888">(a*0.07)</span>
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right;">
                ${tax7Percent.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} เน€เธยเน€เธเธ’เน€เธโ€” <span style="color:#555">(b)</span>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: left;">
                <span style="color:#d00; font-weight:600;">เน€เธเธเน€เธเธ‘เน€เธย</span> เน€เธย เน€เธเธ’เน€เธเธเน€เธเธ• เน€เธโ€ เน€เธโ€”เน€เธเธ•เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธ 3% <span style="color:#888">(a*0.03)</span>
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right;">
                ${withholdingTax3Percent.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} เน€เธยเน€เธเธ’เน€เธโ€” <span style="color:#555">(c)</span>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: left; font-weight: bold; color:#0033cc;">
                เน€เธเธเน€เธเธเน€เธโ€เน€เธเธเน€เธเธเน€เธโ€”เน€เธยเน€เธเธ” <span style="color:#888">(a+b-c)</span>
              </td>
              <td style="border: 1px solid black; padding: 6px; text-align: right; font-weight: bold;">
                ${netAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} เน€เธยเน€เธเธ’เน€เธโ€” <span style="color:#0033cc">(d)</span>
              </td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: left;">เน€เธยเน€เธเธ”เน€เธโ€เน€เธโฌเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธเน€เธเธเน€เธเธ <span style="color:#888">(d-1)</span></td>
              <td style="border: 1px solid black; padding: 6px; text-align: right;">${excessAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} เน€เธยเน€เธเธ’เน€เธโ€”</td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: left;">เน€เธยเน€เธเธเน€เธเธ”เน€เธเธเน€เธเธ‘เน€เธโ€”เน€เธยเน€เธยเน€เธเธ’เน€เธเธ (เน€เธยเน€เธเธเน€เธเธ”เน€เธเธเน€เธเธ‘เน€เธโ€”เน€เธเธเน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธยเน€เธโฌเน€เธยเน€เธเธ”เน€เธย+เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธโฌเน€เธยเน€เธเธ”เน€เธย 50%)</td>
              <td style="border: 1px solid black; padding: 6px; text-align: right;">${companyPayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} เน€เธยเน€เธเธ’เน€เธโ€”</td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 6px; text-align: left;">เน€เธยเน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธโ€”เน€เธเธ•เน€เธยเน€เธโฌเน€เธเธเน€เธเธ…เน€เธเธ—เน€เธเธ</td>
              <td style="border: 1px solid black; padding: 6px; text-align: right;">${employeePayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} เน€เธยเน€เธเธ’เน€เธโ€”</td>
            </tr>
            <tr>
              <td colspan="2" style="border: 1px solid black; padding: 10px; text-align: center;">
                <div>เน€เธยเน€เธเธ“เน€เธยเน€เธเธเน€เธยเน€เธโฌเน€เธยเน€เธเธ”เน€เธย ${netAmountText} </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Payment / certificate checkboxes -->
        <div style="margin-bottom: 12px; font-size: 11px; display: flex; gap: 20px; align-items: center;">
          <div>
            <span style="border: 1px solid black; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
            <span>เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธเน€เธโ€</span>
          </div>
          <div>
            <span style="border: 1px solid black; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
            <span>เน€เธโฌเน€เธยเน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธ .................................................. เน€เธเธ…เน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ•เน€เธย ........................</span>
          </div>
          <div>
            <span style="border: 1px solid black; width: 12px; height: 12px; display: inline-block; margin-right: 8px;"></span>
            <span>เน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธเธ‘เน€เธยเน€เธเธเน€เธเธ—เน€เธเธเน€เธเธเน€เธเธ‘เน€เธยเน€เธเธเน€เธเธเน€เธยเน€เธเธเน€เธเธ‘เน€เธยเน€เธย เน€เธเธ’เน€เธเธเน€เธเธ• เน€เธโ€ เน€เธโ€”เน€เธเธ•เน€เธยเน€เธยเน€เธยเน€เธเธ’เน€เธเธ</span>
          </div>
        </div>

        <!-- Signature Sections -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <!-- Employee Signature -->
            <td style="border: 1px solid black; padding: 10px; width: 50%; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">เน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px;"></span>
                  <span style="margin-right: 10px;">เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: flex; align-items: flex-end; justify-content: center;">
                  <span style="margin-right: 10px;">เน€เธเธ…เน€เธยเน€เธยเน€เธเธ—เน€เธยเน€เธเธ</span>
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
                  <span style="margin-left: 10px;">เน€เธยเน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธเธ’เน€เธย</span>
                </div>
                ${userSignature ? `
                  <div style="text-align: center; margin-top: 5px;">
                    <span style="font-size: 10px;">(${employeeName})</span>
                  </div>
                ` : ''}
              </div>
              <div style="text-align: center;">
                เน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ•เน€เธย .........../............./..............
              </div>
            </td>
            
                                    <!-- Manager Signature -->
            <td style="border: 1px solid black; padding: 10px; width: 50%; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px; text-align: center; line-height: 15px;">${isManagerApproved ? "✓" : ""}</span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; text-align: center; line-height: 15px;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
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
                  <span style="margin-left: 10px;">ผู้บังคับบัญชา</span>
                </div>
                <div style="text-align: center; font-size: 10px; margin-top: 5px;">${(welfareData as any).managerApproverName || ''}</div>
              </div>
              <div style="text-align: center;">
                วันที่ ${managerApprovedDate || '.........../............./..............'}
              </div>
            </td>
          </tr>
          
          <tr>
                                    <!-- Department Manager Signature -->
            <td style="border: 1px solid black; padding: 10px; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px; text-align: center; line-height: 15px;">${isHRApproved ? "✓" : ""}</span>
                  <span style="margin-right: 10px;">ไม่อนุมัติ</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; text-align: center; line-height: 15px;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
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
                <div style="text-align: center; font-size: 10px; margin-top: 5px;">${(welfareData as any).hrApproverName || ''}</div>
              </div>
              <div style="text-align: center;">
                วันที่ ${hrApprovedDate || '.........../............./..............'}
              </div>
            </td>
            
            <!-- HR Manager Signature -->
            <td style="border: 1px solid black; padding: 10px; vertical-align: top;">
              <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                  <span style="margin-right: 10px;">เน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block; margin-right: 15px;"></span>
                  <span style="margin-right: 10px;">เน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธเธเน€เธเธเน€เธเธ‘เน€เธโ€ขเน€เธเธ”</span>
                  <span style="border: 1px solid black; width: 15px; height: 15px; display: inline-block;"></span>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 20px;">
                <div>เน€เธเธ…เน€เธยเน€เธยเน€เธเธ—เน€เธยเน€เธเธ.................................................เน€เธยเน€เธเธเน€เธเธเน€เธเธเน€เธยเน€เธเธ’เน€เธเธเน€เธยเน€เธเธเน€เธยเน€เธยเน€เธเธ‘เน€เธโ€เน€เธยเน€เธเธ’เน€เธเธ</div>
              </div>
              <div style="text-align: center;">
                เน€เธเธเน€เธเธ‘เน€เธยเน€เธโ€”เน€เธเธ•เน€เธย .........../............./..............
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

// เน€เธโฌเน€เธยเน€เธเธ”เน€เธยเน€เธเธเน€เธยเน€เธเธ‘เน€เธยเน€เธยเน€เธยเน€เธยเน€เธเธ‘เน€เธยเน€เธเธเน€เธเธ“เน€เธเธเน€เธเธเน€เธเธ‘เน€เธย download PDF
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
      เน€เธโ€เน€เธเธ’เน€เธเธเน€เธยเน€เธยเน€เธยเน€เธเธเน€เธเธ…เน€เธโ€ PDF เน€เธเธเน€เธยเน€เธเธเน€เธเธ
    </button>
  );
};




