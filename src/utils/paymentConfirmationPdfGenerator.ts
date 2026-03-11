import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PaymentConfirmationPDFData {
  customerName: string;
  senderName: string;
  amount: string;
}

const createPaymentConfirmationHTML = (data: PaymentConfirmationPDFData): string => {
  const logoUrl = `${window.location.origin}/Logo_ICPL.png`;

  return `
    <div style="
      width: 794px;
      min-height: 1123px;
      padding: 60px 70px;
      font-family: 'Sarabun', 'TH Sarabun New', 'Cordia New', sans-serif;
      font-size: 16px;
      line-height: 2;
      color: #000;
      background: #fff;
      box-sizing: border-box;
    ">
      <!-- Logo -->
      <div style="margin-bottom: 10px;">
        <img src="${logoUrl}" alt="ICP Ladda" style="width: 80px; height: auto;" crossorigin="anonymous" />
      </div>

      <!-- Title -->
      <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0 40px 0;">
        หนังสือยืนยันการให้ผู้อื่นโอนเงินค่าสินค้าแทน
      </h2>

      <!-- Body -->
      <div style="font-size: 16px; line-height: 2.2;">
        <p style="text-indent: 60px; margin: 0;">
          โดยหนังสือฉบับนี้ ข้าพเจ้า
          <span style="border-bottom: 1px dotted #000; padding: 0 5px; min-width: 300px; display: inline-block;">
            ${data.customerName || ''}
          </span>
        </p>

        <p style="margin: 0;">
          ที่อยู่
          <span style="border-bottom: 1px dotted #000; padding: 0 5px; min-width: 550px; display: inline-block; width: 90%;">
            &nbsp;
          </span>
        </p>

        <p style="margin: 0;">
          เลขที่ผู้เสียภาษี
          <span style="border-bottom: 1px dotted #000; padding: 0 5px; min-width: 520px; display: inline-block; width: 85%;">
            &nbsp;
          </span>
        </p>

        <p style="text-indent: 60px; margin: 0;">
          ได้มอบให้
          <span style="border-bottom: 1px dotted #000; padding: 0 5px; min-width: 250px; display: inline-block;">
            ${data.senderName || ''}
          </span>
          ซึ่งมีความสัมพันธ์กับข้าพเจ้า คือ
          <span style="border-bottom: 1px dotted #000; padding: 0 5px; min-width: 100px; display: inline-block;">
            &nbsp;
          </span>
        </p>

        <p style="margin: 0;">
          เป็นผู้โอนเงินชำระค่าสินค้าที่ข้าพเจ้าคงค้างกับ <strong>บริษัท ไอ ซี พี ลัดดา จำกัด</strong> แทนข้าพเจ้า ซึ่งจำนวนเงิน
        </p>

        <p style="margin: 0;">
          ดังกล่าว คือ
          <span style="border-bottom: 1px dotted #000; padding: 0 5px; min-width: 480px; display: inline-block; width: 80%;">
            ${data.amount || ''}
          </span>
        </p>

        <p style="text-indent: 60px; margin: 30px 0 0 0;">
          ข้าพเจ้าขอรับรองว่า การกระทำที่ผู้รับมอบกระทำไปนั้นให้ถือเสมือนหนึ่งเป็นการกระทำของ
        </p>

        <p style="margin: 0;">
          ข้าพเจ้า หากเกิดความผิดพลาดอันใด ข้าพเจ้ายังคงยินยอมเป็นผู้รับสภาพความผิดนั้น
        </p>
      </div>

      <!-- Signature Area -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 120px; padding: 0 20px;">
        <!-- Company Stamp -->
        <div style="text-align: center; width: 200px;">
          <div style="border: 1px solid #999; width: 160px; height: 120px; margin: 0 auto 10px auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: #999; font-size: 13px;">ประทับตราบริษัท</span>
          </div>
          <p style="font-size: 14px; color: #666; margin: 0;">(ถ้ามี)</p>
        </div>

        <!-- Signature -->
        <div style="text-align: center; width: 280px;">
          <p style="margin: 0 0 5px 0;">
            ลงชื่อ
            <span style="border-bottom: 1px dotted #000; display: inline-block; width: 200px;">&nbsp;</span>
          </p>
          <p style="margin: 0; font-size: 14px;">(ผู้มีอำนาจลงนาม)</p>
        </div>
      </div>
    </div>
  `;
};

export const generatePaymentConfirmationPDF = async (
  data: PaymentConfirmationPDFData
): Promise<Blob> => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createPaymentConfirmationHTML(data);
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      logging: false
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  } finally {
    document.body.removeChild(tempDiv);
  }
};

export const downloadPaymentConfirmationPDF = async (
  data: PaymentConfirmationPDFData
): Promise<void> => {
  const blob = await generatePaymentConfirmationPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `หนังสือยืนยันการให้ผู้อื่นโอนเงินค่าสินค้าแทน.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
