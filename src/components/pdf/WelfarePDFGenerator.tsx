import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';
import { uploadPDFToSupabase } from '@/utils/pdfUtils';

interface WelfarePDFGeneratorProps {
  welfareData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
}

const createWelfareFormHTML = (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string
) => {
  const employeeName = employeeData?.Name || userData.name || '';
  const employeePosition = employeeData?.Position || userData.position || '';
  const employeeTeam = employeeData?.Team || userData.department || '';
  const employeeStartDate = employeeData?.start_date || '';
  const details = welfareData.details || '';

  // ใช้วันที่ที่สร้างคำร้อง (วันที่กดเบิกสวัสดิการ)
  const requestDate = welfareData.createdAt ? new Date(welfareData.createdAt) : new Date();
  const formattedDate = requestDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Format time for the request
  const formattedTime = requestDate.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Format start date if available
  const formattedStartDate = employeeStartDate ?
    new Date(employeeStartDate).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }) : '';

  // Attachment checkbox selections - use from welfareData if available
  const att = welfareData.attachmentSelections || {};

  const checkbox = (checked: boolean) => checked ? '☑' : '☐';

  return `
    <div style="
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      font-family: 'Cordia New', 'TH Sarabun New', 'Sarabun', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.1;
      background: white;
      color: black;
      box-sizing: border-box;
    ">
      <!-- Main Border -->
      <div style="border: 2px solid black; padding: 15px; min-height: 260mm;">
        
        <!-- Header Section -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="border: 1px solid black; padding: 10px; width: 33.33%; text-align: center; vertical-align: middle; height: 60px;">
              <div style="font-size: 11px; line-height: 1.3;">
                <div style="font-weight: bold; margin-bottom: 3px;">รหัสแบบฟอร์ม</div>
                <div style="margin-bottom: 2px;">F-HRM-02-04</div>
                <div>Revision : 01</div>
              </div>
            </td>
            <td style="border: 1px solid black; padding: 10px; width: 33.33%; text-align: center; vertical-align: middle; height: 60px;">
              <div style="font-size: 14px; line-height: 1.3;">
                <div style="font-weight: bold; margin-bottom: 5px;">ใบขอเบิกสวัสดิการ</div>
                <div style="font-size: 11px;">บริษัท ไอ ซี พี ลัดดา จำกัด และบริษัทในเครือ</div>
              </div>
            </td>
            <td style="border: 1px solid black; padding: 10px; width: 33.33%; text-align: center; vertical-align: middle; height: 60px;">
              <div style="font-size: 11px;">
                <div style="font-weight: bold;">วันที่ใช้งาน : พฤษภาคม 2565</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Employee Information -->
        <div style="margin-bottom: 25px; font-size: 13px; line-height: 1.8;">
          <div style="margin-bottom: 10px;">ชื่อ - สกุล............................${employeeName}............................</div>
          <div style="margin-bottom: 10px;">สังกัดฝ่าย............................${employeeTeam}............................</div>
          <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
            <span>ตำแหน่ง............................${employeePosition}............................</span>
            <span>วันที่เริ่มงาน..............${formattedStartDate}.................</span>
          </div>
        </div>

        <!-- Welfare Type Selection -->
        <div style="margin-bottom: 25px;">
          <div style="margin-bottom: 15px; font-weight: bold; font-size: 13px;">ขอเบิกสวัสดิการประเภท ดังนี้</div>
          
          <!-- Row 1 -->
          <div style="display: flex; margin-bottom: 10px; font-size: 12px;">
            <div style="width: 100%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'wedding' ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">สวัสดิการงานสมรส 3,000 บาท</span>
            </div>
          </div>

          <!-- Row 2 -->
          <div style="display: flex; margin-bottom: 10px; font-size: 12px;">
            <div style="width: 50%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'childbirth' ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">สวัสดิการคลอดบุตร คลอดปกติ 4,000 บาท</span>
            </div>
            <div style="width: 50%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'childbirth' && welfareData.birth_type === 'cesarean' ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">ผ่าคลอด 6,000 บาท</span>
            </div>
          </div>

          <!-- Row 3 -->
          <div style="display: flex; margin-bottom: 10px; font-size: 12px;">
            
            <div style="width: 50%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'fitness' ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">เงินสนับสนุนค่าออกกำลังกาย (ตามจริงไม่เกิน 300 บาท/เดือน)</span>
            </div>
          </div>

          <!-- Row 4 -->
          <div style="display: flex; margin-bottom: 10px; font-size: 12px;">
            <div style="width: 100%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'dental' || welfareData.type === 'glasses' ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">สวัสดิการค่ารักษาทัตกรรมหรือ/และค่าตัดแว่นสายตา (ตามจริง ไม่เกิน 2,000 บาท)</span>
            </div>
          </div>
          
          <!-- Row 5 -->
          <div style="display: flex; margin-bottom: 10px; font-size: 12px;">
            <div style="width: 100%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'funeral' && welfareData.details?.includes('พนักงาน') ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">สวัสดิการงานศพ พนักงาน/สามีหรือภรรยาของพนักงาน ค่าเจ้าภาพ 3,000 เงินช่วยเหลือ 6,000 บาท + พวงหรีด 1 พวง</span>
            </div>
          </div>

          <!-- Row 6 -->
          <div style="display: flex; margin-bottom: 10px; font-size: 12px;">
            <div style="width: 100%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'funeral' && welfareData.details?.includes('บุตร') ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">สวัสดิการงานศพ บุตร ของพนักงาน ค่าเจ้าภาพ 3,000 เงินช่วยเหลือ 4,000 + พวงหรีด 1 พวง</span>
            </div>
          </div>

          <!-- Row 7 -->
          <div style="display: flex; margin-bottom: 15px; font-size: 12px;">
            <div style="width: 100%; display: flex; align-items: flex-start;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.type === 'funeral' && (welfareData.details?.includes('บิดา') || welfareData.details?.includes('มารดา')) ? '☑' : '☐'}</span>
              <span style="line-height: 1.4;">สวัสดิการงานศพ บิดา/มารดา ของพนักงาน ค่าเจ้าภาพ 3,000 เงินช่วยเหลือ 2,000 บาท + พวงหรีด 1 พวง</span>
            </div>
          </div>
        </div>

        <!-- Childbirth Details Section -->
        ${welfareData.type === 'childbirth' && welfareData.childbirths ? `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9;">
          <div style="font-weight: bold; margin-bottom: 10px; font-size: 13px;">รายละเอียดบุตร</div>
          ${(() => {
            try {
              const childbirths = typeof welfareData.childbirths === 'string'
                ? JSON.parse(welfareData.childbirths)
                : welfareData.childbirths;

              return childbirths.map((child: any, index: number) => `
                <div style="margin-bottom: 8px; padding: 10px; background-color: white; border: 1px solid #ddd; border-radius: 4px;">
                  <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <span style="font-weight: bold; margin-right: 10px;">บุตรคนที่ ${index + 1}:</span>
                    <span>${child.childName || '-'}</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="font-weight: bold; margin-right: 10px;">ประเภทการคลอด:</span>
                    <span>${child.birthType === 'natural' ? 'คลอดธรรมชาติ (4,000 บาท)' : 'ผ่าคลอด (6,000 บาท)'}</span>
                  </div>
                </div>
              `).join('');
            } catch (e) {
              return '<div>ไม่สามารถแสดงข้อมูลบุตรได้</div>';
            }
          })()}
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
            <span style="font-weight: bold;">จำนวนเงินรวม: </span>
            <span>${Number(welfareData.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
          </div>
        </div>
        ` : ''}

        <!-- Details Section -->
        <div style="margin-bottom: 25px;">
          <div style="font-weight: bold; margin-bottom: 15px; font-size: 13px;">หมายเหตุ/เหตุผลในการขอเบิกสวัสดิการ ดังรายละเอียดต่อไปนี้</div>
          
          <!-- Document Requirements Grid -->
          <div style="margin-bottom: 15px;">
            <!-- Row 1 -->
            <div style="display: flex; margin-bottom: 8px; font-size: 11px;">
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.receipt)}
                <span>ใบเสร็จรับเงิน</span>
              </div>
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.idCardCopy)}
                <span>สำเนาบัตรประชาชน</span>
              </div>
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.bankBookCopy)}
                <span>สำเนาบัญชีธนาคาร</span>
              </div>
            </div>
            
            <!-- Row 2 -->
            <div style="display: flex; margin-bottom: 8px; font-size: 11px;">
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.birthCertificate)}
                <span>สำเนาสูติบัตรบุตร</span>
              </div>
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.deathCertificate)}
                <span>สำเนาใบมรณะบัตร</span>
              </div>
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.weddingCard)}
                <span>การ์ดแต่งงาน</span>
              </div>
            </div>

            <!-- Row 3 -->
            <div style="display: flex; margin-bottom: 15px; font-size: 11px;">
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.medicalCertificate)}
                <span>ใบรับรองแพทย์</span>
              </div>
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.marriageCertificate)}
                <span>สำเนาทะเบียนสมรส</span>
              </div>
              <div style="width: 33.33%; display: flex; align-items: center;">
                ${checkbox(!!att.other)}
                <span>อื่นๆ${att.otherText ? `: ${att.otherText}` : ''}</span>
              </div>
            </div>
          </div>

        <!-- Signature Section -->
        <div style="margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px;">
            <div style="display: flex; align-items: flex-end;">
              <span style="font-size: 12px;">ลงชื่อ</span>
              ${userSignature ? `
                <img src="${userSignature}" alt="Digital Signature" style="
                  max-width: 150px; 
                  max-height: 50px; 
                  margin: 0 15px;
                  border-bottom: 1px solid black;
                  display: inline-block;
                " />
              ` : `
                <span style="
                  display: inline-block; 
                  width: 200px; 
                  border-bottom: 1px dotted black; 
                  margin: 0 15px;
                  height: 20px;
                "></span>
              `}
              <span style="font-size: 12px;">ผู้ขอเบิก</span>
            </div>
            <div style="font-size: 12px;">วันที่ ${formattedDate} เวลา ${formattedTime} น.</div>
          </div>
          <div style="display: flex; justify-content: flex-start; align-items: center;">
            <span style="font-size: 12px; width: 50px;"></span> <!-- Spacer for "ลงชื่อ" -->
            <div style="width: 200px; text-align: center; margin-left: -10mm; margin-right: 15px;">
              <span style="font-size: 11px;">(${employeeName})</span>
            </div>
          </div>
        </div>

        <!-- Manager Approval Section -->
        <div style="border: 2px solid black; padding: 15px; margin-bottom: 20px;">
          <div style="font-weight: bold; margin-bottom: 12px; font-size: 12px;">สำหรับผู้บังคับบัญชา</div>
          <div style="display: flex; margin-bottom: 15px; font-size: 12px;">
            <div style="display: flex; align-items: center; margin-right: 40px;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.status === 'completed' || welfareData.status === 'pending_hr' || welfareData.status === 'pending_accounting' ? '☑' : '☐'}</span>
              <span>เห็นควรอนุมัติ</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="margin-right: 10px; font-size: 16px;">${welfareData.status === 'rejected_manager' ? '☑' : '☐'}</span>
              <span>ไม่ควรอนุมัติ</span>
            </div>
          </div>
          
                    
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
            <div style="display: flex; align-items: flex-end;">
              <span style="font-size: 12px;">ลงชื่อ</span>
              ${managerSignature ? `
                <img src="${managerSignature}" alt="Manager Signature" style="
                  max-width: 150px; 
                  max-height: 50px; 
                  margin: 0 15px;
                  border-bottom: 1px solid black;
                  display: inline-block;
                " />
              ` : `
                <span style="
                  display: inline-block; 
                  width: 200px; 
                  border-bottom: 1px dotted black; 
                  margin: 0 15px;
                  height: 20px;
                "></span>
              `}
              <span style="font-size: 12px;">ผู้จัดการ</span>
            </div>
            <div style="font-size: 12px;">วันที่ ${welfareData.managerApprovedAt ?
      new Date(welfareData.managerApprovedAt).toLocaleDateString('th-TH') + ' เวลา ' +
      new Date(welfareData.managerApprovedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.'
      : '......./......./........ เวลา ........ น.'}</div>
          </div>
          <div style="display: flex; justify-content: flex-start; align-items: center; margin-top: 5px;">
            <span style="font-size: 12px; width: 50px;"></span> <!-- Spacer for "ลงชื่อ" -->
            <div style="width: 200px; text-align: center; margin-left: -15mm; margin-right: 15px;">
              <span style="font-size: 11px;">(${welfareData.managerApproverName || ''})</span>
            </div>
          </div>
        </div>

        <!-- HR Manager Approval Section -->
        <div style="border: 2px solid black; padding: 15px;">
          <div style="font-weight: bold; margin-bottom: 12px; font-size: 12px;">สำหรับผู้จัดการฝ่ายบุคคล</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 12px;">
            <div style="display: flex; align-items: center;">
              <div style="display: flex; align-items: center; margin-right: 40px;">
                <span style="margin-right: 10px; font-size: 16px;">${welfareData.status === 'completed' || welfareData.status === 'pending_accounting' ? '☑' : '☐'}</span>
                <span>เห็นควรอนุมัติ</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 10px; font-size: 16px;">${welfareData.status === 'rejected_hr' ? '☑' : '☐'}</span>
                <span>ไม่ควรอนุมัติ</span>
              </div>
            </div>
            
            <!-- Amount Section moved to same row -->
            <div style="display: flex; align-items: center;">
              <span>เป็นจำนวนเงินทั้งหมด</span>
              <span style="display: inline-block; width: 100px; margin: 0 10px; text-align: center;">
                ${welfareData.amount ? welfareData.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </span>
              <span>บาท</span>
            </div>
          </div>
                             
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px;">
            <div style="display: flex; align-items: flex-end;">
              <span style="font-size: 12px;">ลงชื่อ</span>
              ${hrSignature ? `
                <img src="${hrSignature}" alt="HR Signature" style="
                  max-width: 150px; 
                  max-height: 50px; 
                  margin: 0 15px;
                  border-bottom: 1px solid black;
                  display: inline-block;
                " />
              ` : `
                <span style="
                  display: inline-block; 
                  width: 200px; 
                  border-bottom: 1px dotted black; 
                  margin: 0 15px;
                  height: 20px;
                "></span>
              `}
              <span style="font-size: 12px;">ฝ่ายบุคคล</span>
            </div>
            <div style="font-size: 12px;">วันที่ ${welfareData.hrApprovedAt ?
      new Date(welfareData.hrApprovedAt).toLocaleDateString('th-TH') + ' เวลา ' +
      new Date(welfareData.hrApprovedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.'
      : '......./......./........ เวลา ........ น.'}</div>
          </div>
          <div style="display: flex; justify-content: flex-start; align-items: center; margin-top: 5px;">
            <span style="font-size: 12px; width: 50px;"></span> <!-- Spacer for "ลงชื่อ" -->
            <div style="width: 200px; text-align: center; margin-left: -10mm; margin-right: 15px;">
              <span style="font-size: 11px;">(${welfareData.hrApproverName || ''})</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
};

export const generateWelfarePDF = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string
): Promise<Blob> => {
  // Use signature from welfareData if available, otherwise use the passed userSignature
  const signatureToUse = welfareData.userSignature || userSignature;

  // Create a temporary div to hold the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createWelfareFormHTML(welfareData, userData, employeeData, signatureToUse, managerSignature, hrSignature);
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.width = '794px'; // Fixed width for consistent rendering
  tempDiv.style.height = '1123px'; // Fixed height for A4
  document.body.appendChild(tempDiv);

  try {
    // Convert HTML to canvas with higher quality
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Use JPEG with full quality
    const imgData = canvas.toDataURL('image/jpeg', 1.0); // 100% quality

    // Calculate dimensions to fit A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Return PDF as Blob instead of downloading
    return pdf.output('blob');
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
};

// เพิ่มฟังก์ชันสำหรับ download PDF (เพื่อใช้ในกรณีที่ต้องการ download)
export const generateAndDownloadWelfarePDF = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string; start_date?: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string
) => {
  try {
    const pdfBlob = await generateWelfarePDF(welfareData, userData, employeeData, userSignature, managerSignature, hrSignature);

    // Generate filename - สำหรับการดาวน์โหลด สามารถใช้ชื่อไทยได้
    const employeeName = employeeData?.Name || userData.name || '';
    const filename = `welfare_${welfareData.type}_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    // Create download link
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

export const WelfarePDFGenerator: React.FC<WelfarePDFGeneratorProps> = ({
  welfareData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      // ใช้ฟังก์ชันใหม่สำหรับ download
      await generateAndDownloadWelfarePDF(welfareData, userData, employeeData, welfareData.userSignature);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      ดาวน์โหลด PDF
    </button>
  );
};
