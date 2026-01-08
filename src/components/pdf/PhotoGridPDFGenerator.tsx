import jsPDF from 'jspdf';

interface PhotoWithDescription {
  url: string;
  description: string;
}

/**
 * Generate a PDF with up to 4 photos arranged in a 2x2 grid on an A4 page
 * Each photo has its description displayed below it
 */
export const generatePhotoGridPDF = async (
  photos: PhotoWithDescription[],
  title?: string
): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Page margins
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);

  // Title section
  let yOffset = margin;
  if (title) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
  }

  // Add date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const today = new Date();
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const dateStr = `${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;
  pdf.text(`วันที่: ${dateStr}`, pageWidth / 2, yOffset, { align: 'center' });
  yOffset += 15;

  // Calculate grid dimensions for 2x2 layout
  const gridGap = 10;
  const photoWidth = (contentWidth - gridGap) / 2;
  const photoHeight = 80; // Fixed height for photos
  const descriptionHeight = 15; // Space for description text
  const cellHeight = photoHeight + descriptionHeight;

  // Filter out empty photos
  const validPhotos = photos.filter(p => p.url);

  // Load and add photos
  for (let i = 0; i < Math.min(validPhotos.length, 4); i++) {
    const photo = validPhotos[i];
    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = margin + (col * (photoWidth + gridGap));
    const y = yOffset + (row * (cellHeight + gridGap));

    try {
      // Load image
      const img = await loadImage(photo.url);

      // Calculate aspect ratio to fit within bounds
      const aspectRatio = img.width / img.height;
      let drawWidth = photoWidth;
      let drawHeight = photoWidth / aspectRatio;

      if (drawHeight > photoHeight) {
        drawHeight = photoHeight;
        drawWidth = photoHeight * aspectRatio;
      }

      // Center the image within its cell
      const imgX = x + (photoWidth - drawWidth) / 2;
      const imgY = y;

      // Draw border around image area
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, photoWidth, photoHeight);

      // Add image
      pdf.addImage(img.dataUrl, 'JPEG', imgX, imgY, drawWidth, drawHeight);

      // Add description below image
      if (photo.description) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);

        // Word wrap for long descriptions
        const descY = y + photoHeight + 5;
        const lines = pdf.splitTextToSize(photo.description, photoWidth);
        pdf.text(lines.slice(0, 2), x, descY); // Max 2 lines
      }

      // Add photo number
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`รูปที่ ${i + 1}`, x, y - 2);

    } catch (error) {
      console.error(`Error loading photo ${i + 1}:`, error);
      // Draw placeholder for failed image
      pdf.setFillColor(240, 240, 240);
      pdf.rect(x, y, photoWidth, photoHeight, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text('ไม่สามารถโหลดรูปได้', x + photoWidth / 2, y + photoHeight / 2, { align: 'center' });
    }
  }

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  return pdf.output('blob');
};

/**
 * Helper function to load an image and convert to base64
 */
const loadImage = (url: string): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      resolve({
        dataUrl,
        width: img.width,
        height: img.height
      });
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
};

/**
 * Generate and download the photo grid PDF
 */
export const generateAndDownloadPhotoGridPDF = async (
  photos: PhotoWithDescription[],
  title?: string,
  filename?: string
): Promise<string> => {
  try {
    const pdfBlob = await generatePhotoGridPDF(photos, title);

    const finalFilename = filename || `photo_grid_${Date.now()}.pdf`;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return finalFilename;
  } catch (error) {
    console.error('Error generating photo grid PDF:', error);
    throw error;
  }
};
