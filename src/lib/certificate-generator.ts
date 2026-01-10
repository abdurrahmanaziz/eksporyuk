import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

interface CertificateData {
  certificateNumber: string
  studentName: string
  courseName: string
  completionDate: Date
  verificationUrl: string
  instructor?: string
  duration?: number
}

interface TemplateSettings {
  backgroundColor?: string
  primaryColor?: string
  secondaryColor?: string
  textColor?: string
  layout?: string
  logoUrl?: string
  signatureUrl?: string
}

/**
 * Generate Certificate PDF
 * Uses jsPDF for lightweight PDF generation
 */
export async function generateCertificatePDF(
  data: CertificateData,
  template?: TemplateSettings
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Colors
  const primaryColor = template?.primaryColor || '#3B82F6'
  const secondaryColor = template?.secondaryColor || '#60A5FA'
  const textColor = template?.textColor || '#1F2937'
  const backgroundColor = template?.backgroundColor || '#FFFFFF'

  // Background
  doc.setFillColor(backgroundColor)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Border
  doc.setDrawColor(primaryColor)
  doc.setLineWidth(2)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

  // Inner border (decorative)
  doc.setDrawColor(secondaryColor)
  doc.setLineWidth(0.5)
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24)

  // Title: "Certificate of Completion"
  doc.setFontSize(36)
  doc.setTextColor(primaryColor)
  doc.setFont('helvetica', 'bold')
  doc.text('Certificate of Completion', pageWidth / 2, 40, { align: 'center' })

  // Decorative line under title
  doc.setDrawColor(secondaryColor)
  doc.setLineWidth(0.8)
  doc.line(pageWidth / 2 - 60, 45, pageWidth / 2 + 60, 45)

  // "This is to certify that"
  doc.setFontSize(14)
  doc.setTextColor(textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('This is to certify that', pageWidth / 2, 60, { align: 'center' })

  // Student Name (large, bold)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor)
  doc.text(data.studentName, pageWidth / 2, 75, { align: 'center' })

  // Decorative line under name
  doc.setDrawColor(secondaryColor)
  doc.setLineWidth(0.5)
  doc.line(pageWidth / 2 - 50, 78, pageWidth / 2 + 50, 78)

  // "has successfully completed"
  doc.setFontSize(14)
  doc.setTextColor(textColor)
  doc.setFont('helvetica', 'normal')
  doc.text('has successfully completed', pageWidth / 2, 90, { align: 'center' })

  // Course Name (medium, bold)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(textColor)
  doc.text(data.courseName, pageWidth / 2, 105, { align: 'center' })

  // Completion date
  const dateStr = new Date(data.completionDate).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(textColor)
  doc.text(`Completed on ${dateStr}`, pageWidth / 2, 120, { align: 'center' })

  // Duration (if available)
  if (data.duration) {
    const hours = Math.floor(data.duration / 60)
    const durationText = hours > 0 ? `${hours} hours` : `${data.duration} minutes`
    doc.text(`Course Duration: ${durationText}`, pageWidth / 2, 128, { align: 'center' })
  }

  // Generate QR Code
  const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    width: 150,
    margin: 1,
    color: {
      dark: primaryColor,
      light: '#FFFFFF'
    }
  })

  // Add QR Code (bottom right)
  const qrSize = 25
  doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 45, pageHeight - 45, qrSize, qrSize)

  // QR Code label
  doc.setFontSize(8)
  doc.setTextColor(textColor)
  doc.text('Scan to verify', pageWidth - 32.5, pageHeight - 17, { align: 'center' })

  // Certificate Number (bottom left)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Certificate No: ${data.certificateNumber}`, 20, pageHeight - 30)

  // Signature section (bottom center)
  const signatureY = pageHeight - 50
  
  // Signature line
  doc.setLineWidth(0.3)
  doc.setDrawColor(textColor)
  doc.line(pageWidth / 2 - 30, signatureY, pageWidth / 2 + 30, signatureY)

  // Signature labels
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Authorized Signature', pageWidth / 2, signatureY + 5, { align: 'center' })
  
  if (data.instructor) {
    doc.setFontSize(9)
    doc.setTextColor(primaryColor)
    doc.text(data.instructor, pageWidth / 2, signatureY + 10, { align: 'center' })
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(textColor)
  doc.text('EksporYuk - Empowering Indonesian Exporters', pageWidth / 2, pageHeight - 15, { 
    align: 'center' 
  })

  // Verification URL
  doc.setFontSize(7)
  doc.setTextColor(secondaryColor)
  doc.text(`Verify at: ${data.verificationUrl}`, pageWidth / 2, pageHeight - 10, { 
    align: 'center' 
  })

  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

/**
 * Upload PDF to storage (placeholder - implement based on your storage solution)
 */
export async function uploadCertificatePDF(
  pdfBuffer: Buffer,
  certificateNumber: string
): Promise<string> {
  // TODO: Implement actual upload to Supabase/S3/Cloudinary
  // For now, we'll save to public folder (NOT RECOMMENDED for production)
  
  const fs = require('fs').promises
  const path = require('path')
  
  const publicDir = path.join(process.cwd(), 'public', 'certificates')
  
  // Ensure directory exists
  try {
    await fs.mkdir(publicDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
  
  const filename = `${certificateNumber}.pdf`
  const filepath = path.join(publicDir, filename)
  
  await fs.writeFile(filepath, pdfBuffer)
  
  return `/certificates/${filename}`
}

/**
 * Generate unique certificate number
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const timestamp = Date.now().toString().slice(-6)
  
  return `CERT-${year}-${random}${timestamp}`
}
