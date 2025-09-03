import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InternalTrainingRequest, User, ParticipantGroup } from '@/types';

// สร้าง HTML template สำหรับ Internal Training PDF
const createInternalTrainingHTML = (
  request: InternalTrainingRequest,
  user: User,
  employeeData: any
): string => {
  // Helper functions
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes} น.`;
  };

  // Parse participants
  let participants: ParticipantGroup[] = [];
  if (typeof request.participants === 'string') {
    try {
      participants = JSON.parse(request.participants);
    } catch (e) {
      participants = [];
    }
  } else if (Array.isArray(request.participants)) {
    participants = request.participants;
  }

  // Data preparation
  const department = request.department || request.userDepartment || 'ฝ่ายทรัพยากรบุคคล';
  const branch = request.branch || 'สำนักงานสุรวงศ์';
  const courseName = request.course_name || request.courseName || request.title || 'หลักสูตรอบรม';
  const startDate = formatDate(request.start_date || request.startDate);
  const endDate = formatDate(request.end_date || request.endDate);
  const startTime = formatTime(request.start_time || request.startTime);
  const endTime = formatTime(request.end_time || request.endTime);
  const venue = request.venue || 'สถานที่อบรม';
  const totalHours = request.total_hours || request.totalHours || 0;
  const totalParticipants = request.total_participants || request.totalParticipants || 0;
  const totalAmount = request.total_amount || request.amount || 0;
  const instructorFee = request.instructor_fee || request.instructorFee || 0;
  const roomFoodBeverage = request.room_food_beverage || request.roomFoodBeverage || 0;
  const otherExpenses = request.other_expenses || request.otherExpenses || 0;
  const withholdingTax = request.withholding_tax || request.withholdingTax || 0;
  const vat = request.vat || 0;
  const averageCost = request.average_cost_per_person || request.averageCostPerPerson || 0;
  const taxCertName = request.tax_certificate_name || request.taxCertificateName || '';
  const withholdingAmount = request.withholding_tax_amount || request.withholdingTaxAmount || 0;
  const beforeVat = totalAmount - vat;

  const currentDate = new Date();
  const thaiDate = currentDate.toLocaleDateString('th-TH');
  const day = currentDate.getDate().toString();
  const month = currentDate.toLocaleDateString('th-TH', { month: 'short' });
  const year = (currentDate.getFullYear() + 543).toString().slice(-2);

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>แบบขออนุมัติจัดฝึกอบรม</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #000;
          background: white;
          padding: 20px;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
        }
        
        .header {
          text-align: right;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 20px;
        }
        
        .form-row {
          margin-bottom: 8px;
          display: flex;
          align-items: baseline;
        }
        
        .label {
          font-weight: 500;
          margin-right: 10px;
        }
        
        .underline {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 200px;
          padding-bottom: 2px;
        }
        
        .content {
          margin-left: 20px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .table th,
        .table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
        }
        
        .table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .cost-section {
          margin: 20px 0;
        }
        
        .cost-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        
        .signature-box {
          text-align: center;
          width: 180px;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          height: 40px;
          margin: 10px 0;
        }
        
        .footer {
          margin-top: 30px;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
        }
        
        .note {
          margin-top: 20px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          แบบขออนุมัติจัดฝึกอบรม
        </div>

        <!-- Form Content -->
        <div class="form-row">
          <span class="label">เรื่อง</span>
          <span class="underline">ขออนุมัติหลักสูตรและค่าใช้จ่ายการอบรม</span>
        </div>

        <div class="form-row">
          <span class="label">เรียน</span>
          <span class="underline">กรรมการผู้จัดการ</span>
        </div>

        <div class="content">
          <p>ด้วย ${department} สาขา ${branch} มีแผนจะจัดอบรมเรื่อง</p>
          <p style="font-weight: bold; margin: 8px 0; text-decoration: underline;">${courseName}</p>
          
          <div class="form-row">
            <span>ระหว่างวันที่</span>
            <span class="underline" style="margin: 0 10px;">${startDate}</span>
            <span>ถึงวันที่</span>
            <span class="underline" style="margin: 0 10px;">${endDate}</span>
            <span>เวลา</span>
            <span class="underline" style="margin-left: 10px;">${startTime} - ${endTime}</span>
          </div>

          <div class="form-row">
            <span>รวมระยะเวลาการอบรม</span>
            <span class="underline" style="margin: 0 10px;">${totalHours}</span>
            <span>ชั่วโมง สถานที่ฝึกอบรม</span>
            <span class="underline" style="margin-left: 10px;">${venue}</span>
          </div>

          <div class="form-row">
            <span>ให้แก่พนักงานบริษัทฯ ในระดับ</span>
            <span class="underline" style="margin-left: 10px; flex: 1;"></span>
          </div>

          <!-- Participants Table -->
          <table class="table">
            <thead>
              <tr>
                <th style="width: 10%;">ลำดับ</th>
                <th style="width: 60%;">รายการ</th>
                <th style="width: 20%;">จำนวน</th>
                <th style="width: 10%;">หน่วย</th>
              </tr>
            </thead>
            <tbody>
              ${participants.map((group, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td style="text-align: left; padding-left: 10px;">${group.team}</td>
                  <td>${group.count}</td>
                  <td>คน</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold;">
                <td colspan="2">รวมจำนวน</td>
                <td>${totalParticipants}</td>
                <td>คน</td>
              </tr>
            </tbody>
          </table>

          <p>ซึ่งมีค่าใช้จ่ายดังนี้</p>

          <!-- Cost Details -->
          <div class="cost-section">
            <div class="cost-row">
              <span>ค่าวิทยากร <span class="underline" style="width: 100px; display: inline-block;"></span> บาท</span>
              <span>รวมทั้งสิ้น <span class="underline" style="width: 120px; display: inline-block;">${formatCurrency(totalAmount)}</span> บาท</span>
            </div>
            
            <div class="cost-row">
              <span>ค่าห้อง ค่าอาหารและเครื่องดื่ม <span class="underline" style="width: 100px; display: inline-block;">${formatCurrency(roomFoodBeverage)}</span> บาท</span>
              <span>หักภาษี ณ ที่จ่าย 3% <span class="underline" style="width: 100px; display: inline-block;">${formatCurrency(withholdingTax)}</span> บาท</span>
            </div>
            
            <div class="cost-row">
              <span>ค่าอื่นๆ <span class="underline" style="width: 100px; display: inline-block;">${formatCurrency(otherExpenses)}</span> บาท</span>
              <span>คิดเป็นค่าใช้จ่าย <span class="underline" style="width: 100px; display: inline-block;">${formatCurrency(averageCost)}</span> บาท</span>
            </div>
            
            <div class="cost-row">
              <span>รวมก่อน VAT <span class="underline" style="width: 100px; display: inline-block;">${formatCurrency(beforeVat)}</span> บาท</span>
              <span>ต่อคน</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-row">
            <span>หมายเหตุ: ทำหนังสือรับรองหักภาษี ณ ที่จ่าย</span>
            <span class="underline" style="margin: 0 10px;">${formatCurrency(withholdingAmount)}</span>
            <span>บาท และชำระในนาม</span>
            <span class="underline" style="margin-left: 10px;">${taxCertName}</span>
          </div>

          <div class="form-row">
            <span>ลงวันที่</span>
            <span class="underline" style="margin: 0 10px;">${thaiDate}</span>
            <span>จำนวน</span>
            <span class="underline" style="margin: 0 10px;">${formatCurrency(withholdingAmount)}</span>
            <span>บาท</span>
          </div>

          <p style="margin: 15px 0;">จึงเรียนมาเพื่อพิจารณาอนุมัติ</p>

          <!-- Signatures -->
          <div class="signature-section">
            <div class="signature-box">
              <div>ผู้ร้องขอ</div>
              <div class="signature-line"></div>
              <div>(...............................................)</div>
              <div>ลงชื่อ..................................</div>
              <div>วันที่ ${day} / ${month} / ${year}</div>
            </div>

            <div class="signature-box">
              <div>ผู้ทรัพยากรบุคคล</div>
              <div class="signature-line"></div>
              <div>(...............................................)</div>
              <div>ลงชื่อ..................................</div>
              <div>วันที่ ${day} / ${month} / ${year}</div>
            </div>

            <div class="signature-box">
              <div>ผู้อนุมัติ/หัวหน้าบัญชี</div>
              <div class="signature-line"></div>
              <div>(...............................................)</div>
              <div>ลงชื่อ..................................</div>
              <div>วันที่     /     /    </div>
            </div>
          </div>

          <!-- Note -->
          <div class="note">
            หมายเหตุ : แบบฟอร์มนี้ต้องได้รับการอนุมัติก่อนจัดฝึกอบรมอย่างน้อย 1 สัปดาห์
          </div>

          <!-- Footer -->
          <div class="footer">
            <span>F-TRA-01-05 Rev: 00</span>
            <span>01/02/2561</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateInternalTrainingPDFFromHTML = async (
  request: InternalTrainingRequest,
  user: User,
  employeeData: any
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // สร้าง HTML content
      const htmlContent = createInternalTrainingHTML(request, user, employeeData);
      
      // สร้าง temporary div element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.background = 'white';
      
      document.body.appendChild(tempDiv);
      
      // แปลง HTML เป็น Canvas แล้วเป็น PDF
      html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      }).then(canvas => {
        // ลบ temporary element
        document.body.removeChild(tempDiv);
        
        // สร้าง PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        
        // คำนวณขนาดให้พอดี A4
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        // Return PDF as blob
        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);
      }).catch(error => {
        // ลบ temporary element ในกรณีที่เกิด error
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};