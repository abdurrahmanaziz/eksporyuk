import { AffiliateEmailTemplateHelperData } from '@/types/affiliate-email-types'

interface AutomationCreatedEmailData {
  userName: string
  automationName: string
  triggerType: string
  automationUrl: string
  nextSteps: string[]
}

interface AutomationStatusEmailData {
  userName: string
  automationName: string
  status: string
  isActive: boolean
  stepCount: number
  triggerType: string
  automationUrl: string
}

/**
 * Generate automation created email content
 */
export function generateAutomationCreatedEmail(data: AutomationCreatedEmailData): AffiliateEmailTemplateHelperData {
  const { userName, automationName, triggerType, automationUrl, nextSteps } = data

  const subject = `🤖 Automation "${automationName}" Berhasil Dibuat!`
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🤖 Automation Email Sequence</h1>
        <p style="color: #6b7280; margin: 10px 0;">Automation baru berhasil dibuat</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
        <h2 style="color: white; margin: 0 0 10px 0;">🏷️ ${automationName}</h2>
        <p style="color: #ffe5e5; margin: 0 0 10px 0;">Trigger: ${triggerType}</p>
        <p style="color: #ffe5e5; margin: 0 0 20px 0; font-size: 14px;">Status: Draft (Belum aktif)</p>
        <a href="${automationUrl}" style="background: white; color: #f5576c; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          ⚙️ Kelola Automation
        </a>
      </div>
      
      <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #ea580c; margin: 0 0 15px 0;">⚠️ Automation Belum Aktif</h3>
        <p style="color: #9a3412; margin: 0 0 15px 0;">Untuk mengaktifkan automation ini, Anda perlu menambahkan email steps terlebih dahulu.</p>
        
        <h4 style="color: #9a3412; margin: 15px 0 10px 0;">📝 Langkah Selanjutnya:</h4>
        <ol style="color: #9a3412; margin: 0; padding-left: 20px;">
          ${nextSteps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
        </ol>
      </div>
      
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #0369a1; margin: 0 0 10px 0;">💡 Tips Email Automation</h3>
        <ul style="color: #0c4a6e; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Email pertama kirim dalam 1 jam setelah trigger</li>
          <li style="margin-bottom: 8px;">Email follow-up kirim dalam 2-3 hari</li>
          <li style="margin-bottom: 8px;">Maksimal 5-7 email per sequence</li>
          <li style="margin-bottom: 8px;">Gunakan subject line yang menarik</li>
          <li style="margin-bottom: 8px;">Sertakan call-to-action yang jelas</li>
        </ul>
      </div>
      
      <div style="border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
        <h3 style="color: #374151; margin: 0 0 10px 0;">🚀 Siap Untuk Otomatisasi?</h3>
        <p style="color: #6b7280; margin: 0 0 15px 0;">Setup email sequence dan biarkan automation bekerja untuk Anda 24/7</p>
        <a href="${automationUrl}" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          ➕ Tambah Email Steps
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>Email ini dikirim karena Anda membuat automation baru di platform EksporYuk</p>
        <p>© ${new Date().getFullYear()} EksporYuk. All rights reserved.</p>
      </div>
    </div>
  `

  const textContent = `
    🤖 Automation "${automationName}" Berhasil Dibuat!
    
    Halo ${userName},
    
    Automation email sequence baru Anda berhasil dibuat dengan detail:
    
    🏷️ Nama: ${automationName}
    ⚡ Trigger: ${triggerType}
    📊 Status: Draft (Belum aktif)
    
    📝 Langkah selanjutnya:
    ${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n    ')}
    
    💡 Tips automation:
    • Email pertama kirim dalam 1 jam
    • Follow-up dalam 2-3 hari
    • Maksimal 5-7 email per sequence
    • Gunakan subject menarik
    • Sertakan CTA yang jelas
    
    Kelola automation: ${automationUrl}
    
    ---
    EksporYuk - Platform Ekspor Terpercaya
  `

  return {
    subject,
    htmlContent,
    textContent
  }
}

/**
 * Generate automation status changed email content
 */
export function generateAutomationStatusEmail(data: AutomationStatusEmailData): AffiliateEmailTemplateHelperData {
  const { userName, automationName, status, isActive, stepCount, triggerType, automationUrl } = data

  const subject = `${isActive ? '✅' : '⏸️'} Automation "${automationName}" ${status.charAt(0).toUpperCase() + status.slice(1)}`
  
  const statusColor = isActive ? '#10b981' : '#ef4444'
  const statusBg = isActive ? '#ecfdf5' : '#fef2f2'
  const statusIcon = isActive ? '✅' : '⏸️'
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${statusIcon} Automation Status Update</h1>
        <p style="color: #6b7280; margin: 10px 0;">Status automation berubah</p>
      </div>
      
      <div style="background: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: ${statusColor}; margin: 0 0 15px 0;">🏷️ ${automationName}</h2>
        <div style="color: #374151;">
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${status.toUpperCase()}</span></p>
          <p style="margin: 5px 0;"><strong>Trigger:</strong> ${triggerType}</p>
          <p style="margin: 5px 0;"><strong>Email Steps:</strong> ${stepCount} emails</p>
        </div>
      </div>
      
      ${isActive ? `
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #047857; margin: 0 0 10px 0;">🚀 Automation Sedang Aktif!</h3>
          <p style="color: #065f46; margin: 0 0 15px 0;">Automation Anda sekarang berjalan otomatis dan akan mengirim email berdasarkan trigger "${triggerType}".</p>
          
          <div style="color: #065f46;">
            <p><strong>Yang Terjadi Sekarang:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Email akan terkirim otomatis saat trigger dipicu</li>
              <li>Sequence ${stepCount} email akan berjalan sesuai delay</li>
              <li>Anda bisa monitor performa di dashboard</li>
            </ul>
          </div>
        </div>
      ` : `
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">⏸️ Automation Dihentikan Sementara</h3>
          <p style="color: #991b1b; margin: 0 0 15px 0;">Automation "${automationName}" tidak akan mengirim email sampai diaktifkan kembali.</p>
          
          <div style="color: #991b1b;">
            <p><strong>Untuk mengaktifkan kembali:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Pastikan semua email steps sudah dikonfigurasi</li>
              <li>Review delay timing antar email</li>
              <li>Klik tombol "Aktifkan" di dashboard</li>
            </ul>
          </div>
        </div>
      `}
      
      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <p style="color: #6b7280; margin: 0 0 15px 0;">Kelola automation dan monitor performanya</p>
        <a href="${automationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          📊 Lihat Dashboard Automation
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>Email ini dikirim karena status automation Anda berubah di platform EksporYuk</p>
        <p>© ${new Date().getFullYear()} EksporYuk. All rights reserved.</p>
      </div>
    </div>
  `

  const textContent = `
    ${statusIcon} Automation "${automationName}" ${status.charAt(0).toUpperCase() + status.slice(1)}
    
    Halo ${userName},
    
    Status automation Anda berubah:
    
    🏷️ Nama: ${automationName}
    📊 Status: ${status.toUpperCase()}
    ⚡ Trigger: ${triggerType}
    📧 Email Steps: ${stepCount} emails
    
    ${isActive ? `
    🚀 Automation Aktif!
    • Email terkirim otomatis saat trigger dipicu
    • Sequence ${stepCount} email berjalan sesuai delay
    • Monitor performa di dashboard
    ` : `
    ⏸️ Automation Dihentikan
    • Tidak akan mengirim email sampai diaktifkan
    • Pastikan konfigurasi email sudah lengkap
    • Aktifkan kembali di dashboard
    `}
    
    Dashboard: ${automationUrl}
    
    ---
    EksporYuk - Platform Ekspor Terpercaya
  `

  return {
    subject,
    htmlContent,
    textContent
  }
}

export default {
  generateAutomationCreatedEmail,
  generateAutomationStatusEmail
}