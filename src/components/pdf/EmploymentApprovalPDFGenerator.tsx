import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface EmploymentApprovalPDFGeneratorProps {
  requestData: WelfareRequest;
  userData: User;
}

const createEmploymentApprovalHTML = (
  requestData: WelfareRequest,
  userData: User,
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string
) => {
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

  const currentDate = formatThaiDate(new Date().toISOString());

  const employmentTypeMap = {
    'new-hire': 'จ้างใหม่',
    'replacement': 'ทดแทนตำแหน่งเดิม',
    'temporary': 'จ้างชั่วคราว',
    'contract-extension': 'ต่อสัญญา'
  };

  const contractTypeMap = {
    'permanent': 'พนักงานประจำ',
    'temporary': 'ชั่วคราว',
    'contract': 'สัญญาจ้าง',
    'probation': 'ทดลองงาน'
  };

  const urgencyLevelMap = {
    'normal': 'ปกติ',
    'urgent': 'เร่งด่วน',
    'critical': 'เร่งด่วนมาก'
  };

  const recruitmentMethodMap = {
    'internal': 'ภายในองค์กร',
    'external': 'ภายนอกองค์กร',
    'agency': 'ผ่านเอเจนซี่',
    'referral': 'แนะนำโดยพนักงาน'
  };

  const allowances = requestData.allowances || {};
  const qualifications = requestData.qualifications || {};
  const benefits = requestData.benefits || [];

  return `
    <div style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      font-family: 'Sarabun', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      background: white;
      color: black;
      box-sizing: border-box;
    ">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
        <div style="font-size: 20px; font-weight: bold; color: #0066cc;">แบบขออนุมัติการจ้างงาน</div>
        <div style="font-size: 12px; margin-top: 5px;">EMPLOYMENT APPROVAL FORM</div>
        <div style="font-size: 11px; margin-top: 5px;">วันที่: ${currentDate}</div>
      </div>

      <!-- Section 1: ข้อมูลทั่วไป -->
      <div style="margin-bottom: 15px;">
        <div style="background: #0066cc; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px;">
          1. ข้อมูลทั่วไป (General Information)
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="padding: 5px; width: 30%; font-weight: bold;">ประเภทการจ้างงาน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${employmentTypeMap[requestData.employmentType as keyof typeof employmentTypeMap] || ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">ตำแหน่งงาน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.positionTitle || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">แผนกที่ขอจ้าง:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.departmentRequesting || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">รายงานตัวต่อ:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.reportingTo || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">สถานที่ทำงาน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.workLocation || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">จำนวนตำแหน่ง:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.numberOfPositions || 1} ตำแหน่ง</td>
          </tr>
          ${requestData.replacementFor ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">ทดแทนตำแหน่งของ:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.replacementFor}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Section 2: รายละเอียดการจ้างงาน -->
      <div style="margin-bottom: 15px;">
        <div style="background: #0066cc; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px;">
          2. รายละเอียดการจ้างงาน (Employment Details)
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="padding: 5px; width: 30%; font-weight: bold;">ประเภทสัญญา:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${contractTypeMap[requestData.contractType as keyof typeof contractTypeMap] || ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">ระยะเวลาทดลองงาน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.probationPeriod || 0} เดือน</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">วันที่เริ่มงาน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${requestData.employmentStartDate ? formatThaiDate(requestData.employmentStartDate) : ''}
            </td>
          </tr>
          ${requestData.employmentEndDate ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">วันที่สิ้นสุดสัญญา:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${formatThaiDate(requestData.employmentEndDate)}
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 5px; font-weight: bold;">เวลาทำงาน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.workingHours || ''}</td>
          </tr>
        </table>
      </div>

      <!-- Section 3: ค่าตอบแทนและสวัสดิการ -->
      <div style="margin-bottom: 15px;">
        <div style="background: #0066cc; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px;">
          3. ค่าตอบแทนและสวัสดิการ (Compensation & Benefits)
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="padding: 5px; width: 30%; font-weight: bold;">เงินเดือน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc; text-align: right;">
              ${formatCurrency(requestData.salaryOffered || 0)} บาท
            </td>
          </tr>
          ${allowances.housing ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">ค่าที่พัก:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc; text-align: right;">
              ${formatCurrency(allowances.housing)} บาท
            </td>
          </tr>
          ` : ''}
          ${allowances.transportation ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">ค่าเดินทาง:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc; text-align: right;">
              ${formatCurrency(allowances.transportation)} บาท
            </td>
          </tr>
          ` : ''}
          ${allowances.meal ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">ค่าอาหาร:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc; text-align: right;">
              ${formatCurrency(allowances.meal)} บาท
            </td>
          </tr>
          ` : ''}
          ${allowances.other ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">เบี้ยเลี้ยงอื่นๆ:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc; text-align: right;">
              ${formatCurrency(allowances.other)} บาท
              ${allowances.otherDescription ? `<br/><span style="font-size: 10px; color: #666;">(${allowances.otherDescription})</span>` : ''}
            </td>
          </tr>
          ` : ''}
          <tr style="background: #f0f0f0;">
            <td style="padding: 5px; font-weight: bold;">รวมค่าตอบแทนทั้งหมด:</td>
            <td style="padding: 5px; text-align: right; font-weight: bold; color: #0066cc;">
              ${formatCurrency(requestData.amount || 0)} บาท
            </td>
          </tr>
        </table>

        ${benefits.length > 0 ? `
        <div style="margin-top: 10px;">
          <div style="font-weight: bold; margin-bottom: 5px;">สวัสดิการที่ได้รับ:</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
            ${benefits.map(benefit => `
              <div style="padding: 3px;">✓ ${benefit}</div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Page Break -->
      <div style="page-break-after: always;"></div>

      <!-- Section 4: คุณสมบัติและหน้าที่ -->
      <div style="margin-bottom: 15px;">
        <div style="background: #0066cc; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px;">
          4. คุณสมบัติและหน้าที่ (Qualifications & Responsibilities)
        </div>
        
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold; margin-bottom: 5px;">หน้าที่และความรับผิดชอบ:</div>
          <div style="padding: 10px; background: #f9f9f9; border-left: 3px solid #0066cc; white-space: pre-wrap;">
            ${requestData.jobDescription || ''}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px; width: 30%; font-weight: bold; vertical-align: top;">วุฒิการศึกษา:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${qualifications.education || ''}</td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold; vertical-align: top;">ประสบการณ์:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${qualifications.experience || ''}</td>
          </tr>
          ${qualifications.skills && qualifications.skills.length > 0 ? `
          <tr>
            <td style="padding: 5px; font-weight: bold; vertical-align: top;">ทักษะที่ต้องการ:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${qualifications.skills.join(', ')}
            </td>
          </tr>
          ` : ''}
          ${qualifications.certifications && qualifications.certifications.length > 0 ? `
          <tr>
            <td style="padding: 5px; font-weight: bold; vertical-align: top;">ใบรับรอง:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${qualifications.certifications.join(', ')}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Section 5: เหตุผลและความจำเป็น -->
      <div style="margin-bottom: 15px;">
        <div style="background: #0066cc; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px;">
          5. เหตุผลและความจำเป็น (Justification)
        </div>
        
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold; margin-bottom: 5px;">เหตุผลในการจ้างงาน:</div>
          <div style="padding: 10px; background: #f9f9f9; border-left: 3px solid #0066cc; white-space: pre-wrap;">
            ${requestData.reasonForHiring || ''}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px; width: 30%; font-weight: bold;">ระดับความเร่งด่วน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${urgencyLevelMap[requestData.urgencyLevel as keyof typeof urgencyLevelMap] || ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px; font-weight: bold;">วิธีการสรรหา:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${recruitmentMethodMap[requestData.recruitmentMethod as keyof typeof recruitmentMethodMap] || ''}
            </td>
          </tr>
          ${requestData.expectedInterviewDate ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">วันที่คาดว่าจะสัมภาษณ์:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${formatThaiDate(requestData.expectedInterviewDate)}
            </td>
          </tr>
          ` : ''}
          ${requestData.expectedOnboardingDate ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">วันที่คาดว่าจะเริ่มงาน:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">
              ${formatThaiDate(requestData.expectedOnboardingDate)}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Section 6: ข้อมูลงบประมาณ -->
      ${requestData.budgetCode || requestData.costCenter ? `
      <div style="margin-bottom: 20px;">
        <div style="background: #0066cc; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 10px;">
          6. ข้อมูลงบประมาณ (Budget Information)
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          ${requestData.budgetCode ? `
          <tr>
            <td style="padding: 5px; width: 30%; font-weight: bold;">รหัสงบประมาณ:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.budgetCode}</td>
          </tr>
          ` : ''}
          ${requestData.costCenter ? `
          <tr>
            <td style="padding: 5px; font-weight: bold;">Cost Center:</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">${requestData.costCenter}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      ` : ''}

      <!-- Signatures Section -->
      <div style="margin-top: 30px;">
        <div style="background: #0066cc; color: white; padding: 5px 10px; font-weight: bold; margin-bottom: 15px;">
          ลายเซ็นอนุมัติ (Approval Signatures)
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 33%; text-align: center; padding: 10px; vertical-align: top;">
              <div style="font-weight: bold; margin-bottom: 10px;">ผู้ขออนุมัติ</div>
              <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
                ${userSignature ? `<img src="${userSignature}" style="max-height: 50px; max-width: 150px;" />` : ''}
              </div>
              <div style="border-top: 1px solid black; padding-top: 5px; margin-top: 5px;">
                ${userData.name}
              </div>
              <div style="font-size: 10px; color: #666;">
                วันที่: ${currentDate}
              </div>
            </td>
            
            <td style="width: 33%; text-align: center; padding: 10px; vertical-align: top;">
              <div style="font-weight: bold; margin-bottom: 10px;">ผู้จัดการอนุมัติ</div>
              <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
                ${managerSignature ? `<img src="${managerSignature}" style="max-height: 50px; max-width: 150px;" />` : ''}
              </div>
              <div style="border-top: 1px solid black; padding-top: 5px; margin-top: 5px;">
                ${requestData.managerApproverName || ''}
              </div>
              <div style="font-size: 10px; color: #666;">
                ${requestData.managerApprovedAt ? `วันที่: ${formatThaiDate(requestData.managerApprovedAt)}` : ''}
              </div>
            </td>
            
            <td style="width: 33%; text-align: center; padding: 10px; vertical-align: top;">
              <div style="font-weight: bold; margin-bottom: 10px;">ฝ่ายทรัพยากรบุคคล</div>
              <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
                ${hrSignature ? `<img src="${hrSignature}" style="max-height: 50px; max-width: 150px;" />` : ''}
              </div>
              <div style="border-top: 1px solid black; padding-top: 5px; margin-top: 5px;">
                ${requestData.hrApproverName || ''}
              </div>
              <div style="font-size: 10px; color: #666;">
                ${requestData.hrApprovedAt ? `วันที่: ${formatThaiDate(requestData.hrApprovedAt)}` : ''}
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; text-align: center; font-size: 10px; color: #666;">
        <div>แบบฟอร์มขออนุมัติการจ้างงาน | Employment Approval Form</div>
        <div>เลขที่คำขอ: ${requestData.runNumber || requestData.id}</div>
      </div>
    </div>
  `;
};

export const EmploymentApprovalPDFGenerator: React.FC<EmploymentApprovalPDFGeneratorProps> = ({
  requestData,
  userData,
}) => {
  const generatePDF = async () => {
    const htmlContent = createEmploymentApprovalHTML(
      requestData,
      userData,
      requestData.userSignature,
      requestData.managerSignature,
      requestData.hrSignature
    );

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`employment-approval-${requestData.id}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  return null;
};

export { createEmploymentApprovalHTML };
