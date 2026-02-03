import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WelfareRequest, User } from '@/types';

interface EmploymentApprovalPDFGeneratorProps {
  requestData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
  };
}

const createEmploymentApprovalHTML = (
  requestData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string,
  specialSignature?: string
) => {
  const employeeName = employeeData?.Name || userData.name || '';
  const employeePosition = employeeData?.Position || userData.position || '';

  // Format dates
  const requestDate = requestData.createdAt ? new Date(requestData.createdAt) : new Date();
  const formattedRequestDate = requestDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const startDate = requestData.employmentStartDate
    ? new Date(requestData.employmentStartDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const departureDate = requestData.replacementDepartureDate
    ? new Date(requestData.replacementDepartureDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  // Checkbox helper
  const checkbox = (checked: boolean) => checked ? '☑' : '☐';

  // Dotted line helper - text appears 1cm above the dotted line
  const dottedLine = (text: string = '', width: string = '200px') =>
    `<span style="display: inline-block; min-width: ${width}; position: relative; vertical-align: bottom; height: 30px;">
      <span style="position: absolute; top: 0; left: 0; right: 0; text-align: center; font-size: 16px;">${text}</span>
      <span style="position: absolute; bottom: 0; left: 0; right: 0; border-bottom: 1px dotted black;"></span>
    </span>`;

  // Parse current positions
  const currentPositionsData = requestData.currentPositions
    ? (typeof requestData.currentPositions === 'string'
        ? JSON.parse(requestData.currentPositions)
        : requestData.currentPositions
      )
    : [];

  const positionRows = [];
  for (let i = 0; i < 3; i++) {
    const pos = currentPositionsData[i];
    positionRows.push(`
      <div style="margin-bottom: 3px; margin-left: 15px;">
        ตำแหน่ง${dottedLine(pos?.positionName || '', '220px')} จำนวน ${dottedLine(pos?.count?.toString() || '', '50px')}คน
      </div>
    `);
  }

  return `
    <div style="
      width: 210mm;
      min-height: 297mm;
      padding: 8mm 10mm;
      font-family: 'Cordia New', 'TH Sarabun New', 'Sarabun', Arial, sans-serif;
      font-size: 18px;
      line-height: 1.2;
      background: white;
      color: black;
      box-sizing: border-box;
      position: relative;
    ">
      <!-- Company Logo and Header -->
      <table style="width: 100%; margin-bottom: 6px; border-collapse: collapse;">
        <tr>
          <td style="width: 80px; vertical-align: top; padding-right: 8px;">
            <div style="width: 75px; height: 60px; border: 1px solid #999; display: flex; align-items: center; justify-content: center; font-size: 9px; text-align: center; background: #f8f8f8;">
              <div>
                <div style="color: #0066cc; font-weight: bold; font-size: 11px;">ICP</div>
                <div style="color: #00aa00; font-weight: bold; font-size: 10px;">LADDA</div>
                <div style="font-size: 7px; margin-top: 2px;">LOGO</div>
              </div>
            </div>
          </td>
          <td style="text-align: center; vertical-align: middle;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 2px;">บริษัท ไอ ซี พี ลัดดา จำกัด</div>
            <div style="font-size: 14px; line-height: 1.3;">42 อาคาร ไอ ซี พี ชั้น 5 ถนนสุรวงศ์ สีลม บางรัก กรุงเทพฯ 10500</div>
            <div style="font-size: 14px; line-height: 1.3;">โทรศัพท์ (662) 029-9888 โทรสาร (662) 029-9886-7</div>
          </td>
        </tr>
      </table>

      <!-- Form Header Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 0px; border: 1.5px solid black;">
        <tr>
          <td style="border: 1.5px solid black; padding: 5px 8px; width: 25%; vertical-align: top; font-size: 14px;">
            <div style="margin-bottom: 2px;">รหัสแบบฟอร์ม:</div>
            <div style="font-weight: bold;">FM-HRM-01-01 REV: 01</div>
          </td>
          <td style="border: 1.5px solid black; padding: 5px 8px; width: 50%; text-align: center; vertical-align: middle;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 2px;">แบบขออนุมัติการจ้างงาน</div>
            <div style="font-size: 14px; font-weight: bold;">Requisition Form</div>
          </td>
          <td style="border: 1.5px solid black; padding: 5px 8px; width: 25%; vertical-align: top; font-size: 14px; line-height: 1.4;">
            <div>เริ่มใช้วันที่ 1 เมษายน 2560</div>
            <div>ปรับปรุงครั้งที่ ....เมื่อ................</div>
          </td>
        </tr>
      </table>

      <!-- Main container with left and right borders -->
      <div style="border-left: 1.5px solid black; border-right: 1.5px solid black;">
        <!-- Main Form Content - 2 columns -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0px;">
          <tr>
            <!-- Left Column: Department Info -->
            <td style="border-bottom: 1.5px solid black; border-right: 1.5px solid black; padding: 6px 8px; width: 50%; vertical-align: top; font-size: 16px; line-height: 1.2;">
              <div style="margin-bottom: 4px;">
                ฝ่าย ${dottedLine(requestData.departmentRequesting || '', '280px')}
              </div>
              <div style="margin-bottom: 4px;">
                ปัจจุบันมีพนักงานในฝ่าย${dottedLine(requestData.currentEmployeeCount?.toString() || '', '120px')}คน ประกอบด้วย
              </div>
              <div style="margin-bottom: 4px;">
                ตำแหน่ง${dottedLine(currentPositionsData[0]?.positionName || '', '180px')}จำนวน ${dottedLine(currentPositionsData[0]?.count?.toString() || '', '30px')}คน
              </div>
              <div style="margin-bottom: 4px;">
                ตำแหน่ง${dottedLine(currentPositionsData[1]?.positionName || '', '180px')}จำนวน ${dottedLine(currentPositionsData[1]?.count?.toString() || '', '30px')}คน
              </div>
              <div style="margin-bottom: 4px;">
                ตำแหน่ง${dottedLine(currentPositionsData[2]?.positionName || '', '180px')}จำนวน ${dottedLine(currentPositionsData[2]?.count?.toString() || '', '30px')}คน
              </div>
            </td>

            <!-- Right Column: Position Requirements -->
            <td style="border-bottom: 1.5px solid black; padding: 6px 8px; width: 50%; vertical-align: top; font-size: 16px; line-height: 1.2;">
              <div style="margin-bottom: 4px;">
                ตำแหน่งงานที่ต้องการ${dottedLine(requestData.positionTitle || '', '200px')}
              </div>
              <div style="margin-bottom: 4px;">
                จำนวนที่ต้องการ${dottedLine(requestData.numberOfPositions?.toString() || '', '180px')}อัตรา
              </div>
              <div style="margin-bottom: 4px;">
                วันที่ต้องการ${dottedLine(startDate, '220px')}
              </div>
              <div style="margin-bottom: 4px;">
                สถานที่ทำงาน${dottedLine(requestData.workLocation || '', '210px')}
              </div>
              <div style="margin-bottom: 4px;">
                รายงานโดยตรงต่อ${dottedLine(requestData.reportingTo || '', '200px')}
              </div>
            </td>
          </tr>
        </table>

        <!-- Hiring type section and Job Description -->
        <div style="border-bottom: 1.5px solid black; padding: 6px 8px; font-size: 16px; line-height: 1.2;">
        <div style="margin-bottom: 5px; font-weight: bold;">ประเภท / เหตุผลของการจ้าง</div>

        <div style="margin-bottom: 4px; margin-left: 40px;">
          ${checkbox(requestData.hiringReason === 'replacement')} ตำแหน่งทดแทน (ระบุ ทดแทน ใคร)${dottedLine(requestData.hiringReason === 'replacement' ? (requestData.replacementFor || '') : '', '260px')}วันที่ออก${dottedLine(requestData.hiringReason === 'replacement' ? departureDate : '', '140px')}
        </div>

        <div style="margin-bottom: 4px; margin-left: 40px;">
          ${checkbox(requestData.hiringReason === 'new-position')} ตำแหน่งประจำที่ขอเพิ่ม
        </div>

        <div style="margin-bottom: 4px; margin-left: 40px;">
          ${checkbox(requestData.hiringReason === 'temporary')} ตำแหน่งชั่วคราว ระยะเวลาการจ้าง${dottedLine(requestData.hiringReason === 'temporary' ? (requestData.temporaryDurationMonths?.toString() || '') : '', '100px')}เดือน${dottedLine(requestData.hiringReason === 'temporary' ? (requestData.temporaryDurationYears?.toString() || '') : '', '100px')}ปี
        </div>

        <div style="margin-bottom: 3px;">
          เหตุผลในการขอเพิ่ม ${dottedLine(requestData.hiringReason === 'new-position' ? (requestData.newPositionReason || '') : '', '560px')}
        </div>
        <div style="margin-bottom: 5px;">
          ${dottedLine('', '680px')}
        </div>

        <!-- Job Description -->
        <div style="margin-bottom: 0px;">
          ตำแหน่งนี้มีหน้าที่โดยสังเขปตาม Job Description No${dottedLine('', '100px')} (หากยังไม่มี Job Description กรุณาจัดทำและแนบมาด้วย)
        </div>
      </div>

        <!-- Qualifications Section -->
        <div style="border-bottom: 1.5px solid black; padding: 6px 8px; font-size: 16px; line-height: 1.2;">
          <div style="font-weight: bold; margin-bottom: 4px;">คุณสมบัติเบื้องต้น</div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
            <tr>
              <td style="width: 50%; padding: 2px 0; vertical-align: top;">
                <div style="margin-bottom: 3px;">เพศ ${dottedLine(requestData.gender || '', '260px')}</div>
                <div style="margin-bottom: 3px;">วุฒิการศึกษาขั้นต่ำ${dottedLine(requestData.minimumEducation || '', '210px')}</div>
                <div style="margin-bottom: 3px;">สาขาวิชา ${dottedLine(requestData.major || '', '240px')}</div>
                <div style="margin-bottom: 3px;">ผลประสบการณ์${dottedLine(requestData.experienceField || '', '210px')}</div>
                <div style="margin-bottom: 0px;">ประสบการณ์ขั้นต่ำ${dottedLine('', '210px')}</div>
              </td>
              <td style="width: 50%; padding: 2px 0 2px 8px; vertical-align: top;">
                <div style="margin-bottom: 3px;">ประสบการณ์ขั้นต่ำ${dottedLine(requestData.minimumExperience || '', '180px')}ปี</div>
                <div style="margin-bottom: 3px;">ความสามารถ / ความชำนาญอย่างอื่น (ภาษาต่างประเทศ</div>
                <div style="margin-bottom: 3px;">คอมพิวเตอร์ ขับรถยนตร์ได้มีใบอนุญาตขับขี่ ทำงานต่างจังหวัดได้ ฯลฯ)</div>
                <div style="border: 1.5px solid black; padding: 4px; min-height: 30px; margin-top: 3px;">
                  ${requestData.otherSkills || ''}
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Requester Signature -->
        <div style="border-bottom: 1.5px solid black; padding: 6px 8px; font-size: 16px; line-height: 1.2;">
          <div style="margin-bottom: 0px;">
            ลงชื่อ${userSignature ? `<img src="${userSignature}" style="height: 25px; margin: 0 6px; vertical-align: middle;" />` : dottedLine('', '200px')}ผู้ขอ ตำแหน่ง${dottedLine(employeePosition, '180px')}วันที่${dottedLine(formattedRequestDate, '160px')}
          </div>
        </div>

        <!-- Approval Section -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0px;">
          <tr>
            <!-- HR Opinion (Left Column) -->
            <td style="border-right: 1.5px solid black; border-bottom: 1.5px solid black; padding: 6px 8px; width: 50%; vertical-align: top; font-size: 16px; line-height: 1.2;">
              <div style="font-weight: bold; margin-bottom: 4px;">ความเห็นของฝ่ายทรัพยากรบุคคล</div>
              <div style="margin-bottom: 3px;">
                ${checkbox(false)} มีในแผนกำลังคน &nbsp;&nbsp; ${checkbox(false)} ไม่มีในแผนกำลังคน
              </div>
              <div style="margin-bottom: 6px;">
                ความเห็นเพิ่มเติม${dottedLine('', '300px')}
              </div>
              <div style="margin-bottom: 3px;">
                ลงชื่อ${hrSignature ? `<img src="${hrSignature}" style="height: 25px; margin: 0 6px; vertical-align: middle;" />` : dottedLine('', '200px')}ผู้จัดการฝ่าย
              </div>
              <div style="margin-left: 40px; margin-bottom: 3px;">
                (${dottedLine(requestData.hrApproverName || '', '200px')})
              </div>
            </td>

            <!-- Deputy Managing Director Decision (Right Column) -->
            <td style="border-bottom: 1.5px solid black; padding: 6px 8px; width: 50%; vertical-align: top; font-size: 16px; line-height: 1.2;">
              <div style="font-weight: bold; margin-bottom: 4px;">คำสั่งของกรรมการผู้จัดการ / ประธานบริษัท</div>
              <div style="margin-bottom: 3px;">
                ${checkbox(requestData.status === 'completed')} อนุมัติ
              </div>
              <div style="margin-bottom: 6px;">
                ${checkbox(requestData.status?.includes('rejected'))} ไม่อนุมัติ เพราะ${dottedLine('', '240px')}
              </div>
              <div style="margin-bottom: 3px;">
                ผู้อนุมัติ${specialSignature ? `<img src="${specialSignature}" style="height: 25px; margin: 0 6px; vertical-align: middle;" />` : dottedLine('', '200px')}
              </div>
              <div style="margin-left: 40px; margin-bottom: 3px;">
                (${dottedLine(requestData.specialApproverName || '', '200px')})
              </div>
            </td>
          </tr>

          <!-- HR Department Fill Section (Full Width) -->
          <tr>
            <td colspan="2" style="border-bottom: 1.5px solid black; padding: 6px 8px; font-size: 16px; line-height: 1.2;">
              <div style="font-weight: bold; margin-bottom: 4px;">สำหรับแผนกทรัพยากรมนุษย์กรอก</div>
              <div>
                วันที่จ้างงานได้: ${dottedLine('', '140px')} ชื่อของพนักงานที่ว่าจ้าง${dottedLine('', '300px')}
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
    </div>
  `;
};

// Main PDF generation function
export const generateEmploymentApprovalPDF = async (
  requestData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string,
  specialSignature?: string
): Promise<Blob> => {
  const html = createEmploymentApprovalHTML(
    requestData,
    userData,
    employeeData,
    userSignature,
    managerSignature,
    hrSignature,
    specialSignature
  );

  // Create temporary div
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  tempDiv.style.position = 'fixed';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  document.body.appendChild(tempDiv);

  try {
    // Convert to canvas with higher quality
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // A4 width in pixels at 96 DPI
      windowHeight: 1123 // A4 height in pixels at 96 DPI
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/JPEG', 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    return pdf.output('blob');
  } finally {
    document.body.removeChild(tempDiv);
  }
};

// Download PDF function
export const generateAndDownloadEmploymentApprovalPDF = async (
  requestData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string },
  userSignature?: string,
  managerSignature?: string,
  hrSignature?: string,
  specialSignature?: string
) => {
  try {
    const pdfBlob = await generateEmploymentApprovalPDF(
      requestData,
      userData,
      employeeData,
      userSignature,
      managerSignature,
      hrSignature,
      specialSignature
    );

    const employeeName = employeeData?.Name || userData.name || '';
    const filename = `employment_approval_${requestData.positionTitle?.replace(/\s+/g, '_')}_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

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

export const EmploymentApprovalPDFGenerator: React.FC<EmploymentApprovalPDFGeneratorProps> = ({
  requestData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      await generateAndDownloadEmploymentApprovalPDF(
        requestData,
        userData,
        employeeData,
        requestData.userSignature
      );
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

export default EmploymentApprovalPDFGenerator;
