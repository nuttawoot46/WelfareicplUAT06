import jsPDF from 'jspdf';
import { InternalTrainingRequest, User, ParticipantGroup } from '@/types';

// Thai font data (you'll need to add this)
const addThaiFont = (doc: jsPDF) => {
  // This is a placeholder - you'll need to add actual Thai font
  // For now, we'll use the default font
  doc.setFont('helvetica');
};

export const generateInternalTrainingPDF = async (
  request: InternalTrainingRequest,
  user: User,
  employeeData: any
): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Add Thai font support
  addThaiFont(doc);
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper function to add text with automatic line wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12): number => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * (fontSize * 0.4));
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('th-TH', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to format time
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes} น.`;
  };

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = 'แบบฟอร์มขออนุมัติการอบรมภายใน';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 15;

  // Company header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const companyName = 'บริษัท ไอซีพี ลัดดา จำกัด';
  const companyWidth = doc.getTextWidth(companyName);
  doc.text(companyName, (pageWidth - companyWidth) / 2, yPosition);
  yPosition += 20;

  // Request information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Request details
  yPosition = addWrappedText(`เลขที่คำร้อง: ${request.id}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`วันที่ส่งคำร้อง: ${formatDate(request.created_at)}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`ผู้ขออนุมัติ: ${request.user_name}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`ฝ่าย/แผนก: ${request.department}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`สาขา: ${request.branch}`, margin, yPosition, contentWidth);
  yPosition += 15;

  // Section 1: Training Details
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('ส่วนที่ 1: รายละเอียดการอบรม', margin, yPosition, contentWidth, 14);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`ชื่อหลักสูตร/หัวข้ออบรม: ${request.course_name}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`วันที่เริ่มอบรม: ${formatDate(request.start_date)}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`วันที่สิ้นสุดอบรม: ${formatDate(request.end_date)}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`เวลาเริ่ม: ${formatTime(request.start_time)}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`เวลาสิ้นสุด: ${formatTime(request.end_time)}`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`รวมระยะเวลาการอบรม: ${request.total_hours} ชั่วโมง`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`สถานที่ฝึกอบรม: ${request.venue}`, margin, yPosition, contentWidth);
  yPosition += 15;

  // Section 2: Participants
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('ส่วนที่ 2: จำนวนผู้เข้าร่วมอบรม', margin, yPosition, contentWidth, 14);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  
  // Parse participants if it's a string
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

  // Display participants table
  if (participants.length > 0) {
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('ทีม/แผนก', margin, yPosition);
    doc.text('จำนวน (คน)', margin + 100, yPosition);
    yPosition += 8;
    
    // Draw line under headers
    doc.line(margin, yPosition - 2, margin + contentWidth, yPosition - 2);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    participants.forEach((participant) => {
      if (participant.team && participant.count > 0) {
        doc.text(participant.team, margin, yPosition);
        doc.text(participant.count.toString(), margin + 100, yPosition);
        yPosition += 6;
      }
    });
    
    // Total participants
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`รวมจำนวนผู้เข้าอบรมทั้งหมด: ${request.total_participants} คน`, margin, yPosition);
    yPosition += 15;
  }

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Section 3: Budget and Expenses
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('ส่วนที่ 3: งบประมาณและค่าใช้จ่าย', margin, yPosition, contentWidth, 14);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`ค่าวิทยากร: ${formatCurrency(request.instructor_fee)} บาท`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`ค่าห้อง อาหารและเครื่องดื่ม: ${formatCurrency(request.room_food_beverage)} บาท`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`ค่าใช้จ่ายอื่นๆ: ${formatCurrency(request.other_expenses)} บาท`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`หักภาษี ณ ที่จ่าย (3%): ${formatCurrency(request.withholding_tax)} บาท`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`ภาษีมูลค่าเพิ่ม (VAT 7%): ${formatCurrency(request.vat)} บาท`, margin, yPosition, contentWidth);
  yPosition += 10;
  
  // Total amount (highlighted)
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText(`รวมเป็นเงินทั้งสิ้น: ${formatCurrency(request.total_amount)} บาท`, margin, yPosition, contentWidth);
  yPosition += 5;
  yPosition = addWrappedText(`เฉลี่ยค่าใช้จ่ายต่อคน: ${formatCurrency(request.average_cost_per_person)} บาท/คน`, margin, yPosition, contentWidth);
  yPosition += 15;

  // Section 4: Notes
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('ส่วนที่ 4: หมายเหตุ', margin, yPosition, contentWidth, 14);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  if (request.tax_certificate_name) {
    yPosition = addWrappedText(`ออกหนังสือรับรองหักภาษี ณ ที่จ่ายในนาม: ${request.tax_certificate_name}`, margin, yPosition, contentWidth);
    yPosition += 5;
  }
  yPosition = addWrappedText(`จำนวนเงินที่ต้องหัก ณ ที่จ่าย: ${formatCurrency(request.withholding_tax_amount)} บาท`, margin, yPosition, contentWidth);
  yPosition += 5;
  
  if (request.additional_notes) {
    yPosition = addWrappedText(`หมายเหตุเพิ่มเติม: ${request.additional_notes}`, margin, yPosition, contentWidth);
    yPosition += 10;
  }

  // Check if we need a new page for signatures
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  // Signature section
  yPosition += 20;
  doc.setFont('helvetica', 'bold');
  yPosition = addWrappedText('ลายเซ็นอนุมัติ', margin, yPosition, contentWidth, 14);
  yPosition += 15;

  // Signature boxes
  const signatureBoxWidth = 150;
  const signatureBoxHeight = 60;
  
  // Employee signature
  doc.setFont('helvetica', 'normal');
  doc.text('ผู้ขออนุมัติ', margin, yPosition);
  doc.rect(margin, yPosition + 5, signatureBoxWidth, signatureBoxHeight);
  doc.text(`ชื่อ: ${request.user_name}`, margin, yPosition + signatureBoxHeight + 15);
  doc.text(`วันที่: ${formatDate(request.created_at)}`, margin, yPosition + signatureBoxHeight + 25);

  // Manager signature
  doc.text('ผู้จัดการ', margin + signatureBoxWidth + 20, yPosition);
  doc.rect(margin + signatureBoxWidth + 20, yPosition + 5, signatureBoxWidth, signatureBoxHeight);
  if (request.manager_approver_name) {
    doc.text(`ชื่อ: ${request.manager_approver_name}`, margin + signatureBoxWidth + 20, yPosition + signatureBoxHeight + 15);
    if (request.manager_approved_at) {
      doc.text(`วันที่: ${formatDate(request.manager_approved_at)}`, margin + signatureBoxWidth + 20, yPosition + signatureBoxHeight + 25);
    }
  }

  yPosition += signatureBoxHeight + 40;

  // HR signature
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.text('HR', margin, yPosition);
  doc.rect(margin, yPosition + 5, signatureBoxWidth, signatureBoxHeight);
  if (request.hr_approver_name) {
    doc.text(`ชื่อ: ${request.hr_approver_name}`, margin, yPosition + signatureBoxHeight + 15);
    if (request.hr_approved_at) {
      doc.text(`วันที่: ${formatDate(request.hr_approved_at)}`, margin, yPosition + signatureBoxHeight + 25);
    }
  }

  // Accounting signature
  doc.text('บัญชี', margin + signatureBoxWidth + 20, yPosition);
  doc.rect(margin + signatureBoxWidth + 20, yPosition + 5, signatureBoxWidth, signatureBoxHeight);
  if (request.accounting_approver_name) {
    doc.text(`ชื่อ: ${request.accounting_approver_name}`, margin + signatureBoxWidth + 20, yPosition + signatureBoxHeight + 15);
    if (request.accounting_approved_at) {
      doc.text(`วันที่: ${formatDate(request.accounting_approved_at)}`, margin + signatureBoxWidth + 20, yPosition + signatureBoxHeight + 25);
    }
  }

  // Footer
  yPosition = doc.internal.pageSize.height - 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const footer = `สร้างโดยระบบ ICP Ladda - ${new Date().toLocaleDateString('th-TH')}`;
  const footerWidth = doc.getTextWidth(footer);
  doc.text(footer, (pageWidth - footerWidth) / 2, yPosition);

  // Return PDF as blob
  return new Promise((resolve) => {
    const pdfBlob = doc.output('blob');
    resolve(pdfBlob);
  });
};