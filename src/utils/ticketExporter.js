import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';

export const downloadTicketPDF = async (ticketElementId, bookingRef = 'BK-TICKET') => {
  const element = document.getElementById(ticketElementId);
  if (!element) {
    toast.error('Ticket element not found for PDF export');
    return;
  }

  const toastId = toast.loading('Generating high-resolution PDF ticket...');

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // High DPI rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0b0f19',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Center ticket on A4 page
    const yPos = (pdf.internal.pageSize.getHeight() - pdfHeight) / 3;

    pdf.setFillColor(11, 15, 25);
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

    pdf.addImage(imgData, 'PNG', 15, yPos > 10 ? yPos : 10, pdfWidth - 30, pdfHeight);

    // Save actual PDF file directly to user's downloads folder
    pdf.save(`CineBook_Ticket_${bookingRef}.pdf`);

    toast.update(toastId, {
      render: 'PDF ticket downloaded successfully!',
      type: 'success',
      isLoading: false,
      autoClose: 3000,
    });
  } catch (err) {
    console.error('PDF export error:', err);
    toast.update(toastId, {
      render: 'Failed to generate PDF ticket. Trying fallback PNG...',
      type: 'error',
      isLoading: false,
      autoClose: 3000,
    });
  }
};
