import { WelfareRequest } from '@/types';
import { jsPDF } from 'jspdf';

// Thai font data (you'll need to include this)
declare global {
  interface Window {
    THSarabunNew: any;
  }
}

export const generateAdvancePDF = async (
  request: WelfareRequest,
  user: any,
  employeeData: any,
  signature?: string
): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Set Thai font if available
  try {
    if (window.THSarabunNew) {
      doc.addFileToVFS('THSarabunNew.ttf', window.THSarabunNew);
      doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
      doc.setFont('THSarabunNew');
    }
  } catch (error) {
    console.warn('Thai font not available, using default font');
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Header
  doc.setFontSize(16);
  doc.text('แบบขออนุมัติเบิกเงินทดลอง', pageWidth / 2, 30, { align: 'center' });
  
  // Company info
  doc.setFontSize(12);
  doc.text('บริษัท ไอซีพี ลัดดา จำกัด', pageWidth / 2, 45, { align: 'center' });

  // Request ID and Date
  doc.setFontSize(10);
  doc.text(`เลขที่คำร้อง: ${request.id}`, margin, 65);
  doc.text(`วันที่ส่งคำร้อง: ${new Date(request.createdAt).toLocaleDateString('th-TH')}`, pageWidth - margin - 60, 65);

  let yPos = 80;

  // Employee Information
  doc.setFontSize(12);
  doc.text('ข้อมูลผู้ขอ', margin, yPos);
  yPos += 15;

  doc.setFontSize(10);
  doc.text(`ชื่อ-สกุล: ${request.userName}`, margin, yPos);
  doc.text(`ตำแหน่ง: ${employeeData?.Position || 'ไม่ระบุ'}`, margin + 120, yPos);
  yPos += 12;
  doc.text(`แผนก: ${request.userDepartment}`, margin, yPos);
  yPos += 20;

  // Request Details
  doc.setFontSize(12);
  doc.text('รายละเอียดการขอเบิกเงินทดลอง', margin, yPos);
  yPos += 15;

  doc.setFontSize(10);
  
  // Department and district
  doc.text(`แผนก: ${request.advanceDepartment || '-'}`, margin, yPos);
  doc.text(`เขต: ${request.advanceDistrict || '-'}`, margin + 120, yPos);
  yPos += 12;
  
  let activityText = request.advanceActivityType || '-';
  if (request.advanceActivityType === 'อื่นๆ ระบุ' && request.advanceActivityOther) {
    activityText = `อื่นๆ (${request.advanceActivityOther})`;
  }
  doc.text(`ประเภทกิจกรรม: ${activityText}`, margin, yPos);
  yPos += 12;

  // Shop/Company and location information
  doc.text(`ชื่อร้าน/บริษัท: ${request.advanceShopCompany || '-'}`, margin, yPos);
  yPos += 12;

  doc.text(`อำเภอ: ${request.advanceAmphur || '-'}`, margin, yPos);
  doc.text(`จังหวัด: ${request.advanceProvince || '-'}`, margin + 120, yPos);
  yPos += 20;

  // Time information
  doc.setFontSize(12);
  doc.text('ระยะเวลา', margin, yPos);
  yPos += 15;

  doc.setFontSize(10);
  doc.text(`วันที่เริ่มต้น: ${request.start_date ? new Date(request.start_date).toLocaleDateString('th-TH') : '-'}`, margin, yPos);
  doc.text(`วันที่สิ้นสุด: ${request.end_date ? new Date(request.end_date).toLocaleDateString('th-TH') : '-'}`, margin + 120, yPos);
  yPos += 12;

  doc.text(`จำนวนวันเดินทาง: ${request.advanceTravelDays || 0} วัน`, margin, yPos);
  doc.text(`จำนวนวันปฏิบัติงาน: ${request.advanceWorkDays || 0} วัน`, margin + 120, yPos);
  yPos += 12;

  doc.text(`รวมจำนวนวัน: ${request.advanceTotalDays || 0} วัน`, margin, yPos);
  yPos += 12;

  if (request.advanceExpectedReturnDate) {
    doc.text(`วันที่คาดว่าจะกลับ: ${new Date(request.advanceExpectedReturnDate).toLocaleDateString('th-TH')}`, margin, yPos);
    yPos += 12;
  }

  if (request.advanceApprovalDeadline) {
    doc.text(`วันที่ต้องการอนุมัติ: ${new Date(request.advanceApprovalDeadline).toLocaleDateString('th-TH')}`, margin, yPos);
    yPos += 20;
  }

  // Cost breakdown
  doc.setFontSize(12);
  doc.text('รายละเอียดค่าใช้จ่าย', margin, yPos);
  yPos += 15;

  doc.setFontSize(10);
  
  // Create a table for expenses
  const tableData = [
    ['รายการ', 'จำนวน (บาท)'],
    [`อัตราค่าใช้จ่ายรายวัน (${request.advanceTotalDays || 0} วัน)`, formatCurrency(request.advanceDailyRate || 0)],
    ['ค่าที่พัก', formatCurrency(request.advanceAccommodationCost || 0)],
    ['ค่าเดินทาง', formatCurrency(request.advanceTransportationCost || 0)],
    ['เบี้ยเลี้ยง', formatCurrency(request.advanceMealAllowance || 0)],
    ['ค่าใช้จ่ายอื่นๆ', formatCurrency(request.advanceOtherExpenses || 0)],
  ];

  // Draw table
  const startX = margin;
  const startY = yPos;
  const rowHeight = 8;
  const col1Width = 120;
  const col2Width = 60;

  // Table headers
  doc.setFillColor(230, 230, 230);
  doc.rect(startX, startY, col1Width, rowHeight, 'F');
  doc.rect(startX + col1Width, startY, col2Width, rowHeight, 'F');
  
  doc.setFontSize(9);
  doc.text('รายการ', startX + 2, startY + 5);
  doc.text('จำนวน (บาท)', startX + col1Width + 2, startY + 5);

  yPos += rowHeight;

  // Table rows
  tableData.slice(1).forEach((row) => {
    doc.rect(startX, yPos, col1Width, rowHeight);
    doc.rect(startX + col1Width, yPos, col2Width, rowHeight);
    
    doc.text(row[0], startX + 2, yPos + 5);
    doc.text(row[1], startX + col1Width + col2Width - 2, yPos + 5, { align: 'right' });
    
    yPos += rowHeight;
  });

  // Total amount
  doc.setFillColor(240, 240, 240);
  doc.rect(startX, yPos, col1Width, rowHeight, 'F');
  doc.rect(startX + col1Width, yPos, col2Width, rowHeight, 'F');
  
  doc.setFontSize(10);
  doc.text('รวมจำนวนเงินที่ขอเบิกทดลอง', startX + 2, yPos + 5);
  doc.text(formatCurrency(request.amount), startX + col1Width + col2Width - 2, yPos + 5, { align: 'right' });

  yPos += rowHeight + 20;

  // Additional details
  if (request.details) {
    doc.setFontSize(12);
    doc.text('รายละเอียดเพิ่มเติม', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    const detailLines = doc.splitTextToSize(request.details, pageWidth - margin * 2);
    doc.text(detailLines, margin, yPos);
    yPos += detailLines.length * 5 + 20;
  }

  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 30;
  }

  // Signature section
  doc.setFontSize(12);
  doc.text('ลายเซ็น', margin, yPos);
  yPos += 15;

  // Employee signature
  doc.setFontSize(10);
  doc.text('ผู้ขออนุมัติ', margin + 20, yPos);
  doc.text('ผู้จัดการ', margin + 120, yPos);
  doc.text('ฝ่ายบุคคล', margin + 220, yPos);
  yPos += 10;

  // Signature boxes
  doc.rect(margin, yPos, 80, 30);
  doc.rect(margin + 100, yPos, 80, 30);
  doc.rect(margin + 200, yPos, 80, 30);

  // Add signature if provided
  if (signature) {
    try {
      doc.addImage(signature, 'PNG', margin + 10, yPos + 5, 60, 20);
    } catch (error) {
      console.warn('Could not add signature image:', error);
    }
  }

  yPos += 35;

  // Names and dates
  doc.text(`(${request.userName})`, margin + 20, yPos);
  doc.text('(.....................)', margin + 120, yPos);
  doc.text('(.....................)', margin + 220, yPos);
  yPos += 10;

  doc.text(`วันที่: ${new Date().toLocaleDateString('th-TH')}`, margin + 20, yPos);
  doc.text('วันที่: ..................', margin + 120, yPos);
  doc.text('วันที่: ..................', margin + 220, yPos);

  return doc.output('blob');
};

// Helper functions
const getUrgencyText = (level?: string): string => {
  switch (level) {
    case 'normal':
      return 'ปกติ';
    case 'urgent':
      return 'เร่งด่วน';
    case 'very_urgent':
      return 'เร่งด่วนมาก';
    default:
      return 'ปกติ';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
