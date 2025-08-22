import React from 'react';
import jsPDF from 'jspdf';
import { WelfareRequest, User } from '@/types';

interface WelfarePDFGeneratorDirectProps {
  welfareData: WelfareRequest;
  userData: User;
  employeeData?: {
    Name: string;
    Position: string;
    Team: string;
    start_date?: string;
  };
}

// ฟังก์ชันสร้าง PDF โดยตรงด้วย jsPDF (ขนาดไฟล์เล็กมาก ~50KB)
export const generateWelfarePDFDirect = async (
  welfareData: WelfareRequest,
  userData: User,
  employeeData?: { Name: string; Position: string; Team: string }
): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // ตั้งค่าฟอนต์
  pdf.setFont('helvetica');
  
  const employeeName = employeeData?.Name || userData.name || '';
  const employeePosition = employeeData?.Position || userData.position || '';
  const employeeTeam = employeeData?.Team || userData.department || '';
  
  const requestDate = welfareData.createdAt ? new Date(welfareData.createdAt) : new Date();
  const formattedDate = requestDate.toLocaleDateString('th-TH');

  // Header
  pdf.rect(10, 10, 190, 180); // Main border
  
  // Header table
  pdf.rect(15, 15, 60, 20);
  pdf.rect(75, 15, 60, 20);
  pdf.rect(135, 15, 50, 20);
  
  pdf.setFontSize(8);
  pdf.text('Form Code', 17, 20);
  pdf.text('F-HRM-02-04', 17, 24);
  pdf.text('Revision: 01', 17, 28);
  
  pdf.setFontSize(10);
  pdf.text('Welfare Request Form', 85, 22, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('ICP Ladda Co., Ltd.', 85, 26, { align: 'center' });
  
  pdf.text('Date: May 2022', 137, 22);

  // Employee info
  let yPos = 45;
  pdf.setFontSize(10);
  pdf.text(`Name: ${employeeName}`, 20, yPos);
  yPos += 8;
  pdf.text(`Department: ${employeeTeam}`, 20, yPos);
  yPos += 8;
  pdf.text(`Position: ${employeePosition}`, 20, yPos);
  yPos += 15;

  // Welfare types
  pdf.setFontSize(9);
  pdf.text('Welfare Type Request:', 20, yPos);
  yPos += 10;

  const welfareTypes = [
    { key: 'wedding', text: 'Wedding welfare 3,000 THB', checked: welfareData.type === 'wedding' },
    { key: 'childbirth', text: 'Childbirth welfare - Normal 4,000 THB', checked: welfareData.type === 'childbirth' && welfareData.birth_type !== 'cesarean' },
    { key: 'cesarean', text: 'Childbirth welfare - Cesarean 6,000 THB', checked: welfareData.type === 'childbirth' && welfareData.birth_type === 'cesarean' },
    { key: 'medical', text: 'Medical visit 1,000 THB', checked: welfareData.type === 'medical' },
    { key: 'fitness', text: 'Fitness support (max 300 THB/month)', checked: welfareData.type === 'fitness' },
    { key: 'dental', text: 'Dental/Glasses (max 2,000 THB)', checked: welfareData.type === 'dental' || welfareData.type === 'glasses' },
  ];

  welfareTypes.forEach(type => {
    pdf.rect(20, yPos - 3, 4, 4);
    if (type.checked) {
      pdf.text('✓', 21, yPos);
    }
    pdf.text(type.text, 28, yPos);
    yPos += 8;
  });

  // Signatures
  yPos += 20;
  pdf.text('Employee Signature: ________________________', 20, yPos);
  pdf.text(`Date: ${formattedDate}`, 140, yPos);
  yPos += 8;
  pdf.text(`(${employeeName})`, 60, yPos, { align: 'center' });

  // Manager approval
  yPos += 20;
  pdf.rect(15, yPos - 5, 170, 30);
  pdf.text('Manager Approval:', 20, yPos);
  yPos += 8;
  
  pdf.rect(20, yPos - 3, 4, 4);
  if (welfareData.status === 'completed' || welfareData.status === 'pending_hr') {
    pdf.text('✓', 21, yPos);
  }
  pdf.text('Approved', 28, yPos);
  
  pdf.rect(80, yPos - 3, 4, 4);
  if (welfareData.status === 'rejected_manager') {
    pdf.text('✓', 81, yPos);
  }
  pdf.text('Rejected', 88, yPos);
  
  yPos += 15;
  pdf.text('Manager Signature: ________________________', 20, yPos);
  const managerDate = welfareData.managerApprovedAt ? new Date(welfareData.managerApprovedAt).toLocaleDateString('th-TH') : '';
  pdf.text(`Date: ${managerDate}`, 140, yPos);

  // HR approval
  yPos += 25;
  pdf.rect(15, yPos - 5, 170, 30);
  pdf.text('HR Manager Approval:', 20, yPos);
  yPos += 8;
  
  pdf.rect(20, yPos - 3, 4, 4);
  if (welfareData.status === 'completed') {
    pdf.text('✓', 21, yPos);
  }
  pdf.text('Approved', 28, yPos);
  
  pdf.rect(80, yPos - 3, 4, 4);
  if (welfareData.status === 'rejected_hr') {
    pdf.text('✓', 81, yPos);
  }
  pdf.text('Rejected', 88, yPos);
  
  const amount = welfareData.amount ? welfareData.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
  pdf.text(`Amount: ${amount} THB`, 120, yPos);
  
  yPos += 15;
  pdf.text('HR Signature: ________________________', 20, yPos);
  const hrDate = welfareData.hrApprovedAt ? new Date(welfareData.hrApprovedAt).toLocaleDateString('th-TH') : '';
  pdf.text(`Date: ${hrDate}`, 140, yPos);

  return pdf.output('blob');
};

export const WelfarePDFGeneratorDirect: React.FC<WelfarePDFGeneratorDirectProps> = ({
  welfareData,
  userData,
  employeeData
}) => {
  const handleGeneratePDF = async () => {
    try {
      const pdfBlob = await generateWelfarePDFDirect(welfareData, userData, employeeData);
      
      const employeeName = employeeData?.Name || userData.name || '';
      const filename = `welfare_${welfareData.type}_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
    >
      ดาวน์โหลด PDF (ขนาดเล็ก)
    </button>
  );
};