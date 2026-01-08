import { AffiliateEmailTemplateHelperData } from '@/types/affiliate-email-types'

interface BioCreagedEmailData {
  userName: string
  bioUrl: string
  displayName: string
  action: string
  features: string[]
}

/**
 * Generate bio page updated email content
 */
export function generateBioPageUpdatedEmail(data: BioCreagedEmailData): AffiliateEmailTemplateHelperData {
  const { userName, bioUrl, displayName, action, features } = data

  const subject = `🎉 Bio Page ${action === 'dibuat' ? 'Berhasil Dibuat' : 'Diperbarui'} - ${displayName}`
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🎉 Bio Page ${action === 'dibuat' ? 'Dibuat' : 'Diperbarui'}!</h1>
        <p style="color: #6b7280; margin: 10px 0;">Link-in-Bio Anda siap untuk dishare</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 25px;">
        <h2 style="color: white; margin: 0 0 10px 0;">📄 ${displayName}</h2>
        <p style="color: #e5e7eb; margin: 0 0 20px 0;">Bio page Anda ${action} dan siap digunakan</p>
        <a href="${bioUrl}" style="background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
          🔗 Lihat Bio Page
        </a>
      </div>
      
      ${features.length > 0 ? `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin: 0 0 15px 0;">✨ Fitur yang Tersedia:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            ${features.map(feature => `<li style="margin-bottom: 8px;">${feature}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div style="border: 2px dashed #d1d5db; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
        <h3 style="color: #374151; margin: 0 0 10px 0;">📱 Share Bio Page Anda</h3>
        <p style="color: #6b7280; margin: 0 0 15px 0;">Copy link ini dan bagikan di media sosial:</p>
        <div style="background: #f9fafb; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 14px; color: #111827; word-break: break-all;">
          ${bioUrl}
        </div>
      </div>
      
      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #047857; margin: 0 0 10px 0;">💡 Tips Optimasi Bio Page</h3>
        <ul style="color: #065f46; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Tambahkan foto profil yang menarik</li>
          <li style="margin-bottom: 8px;">Buat headline yang compelling</li>
          <li style="margin-bottom: 8px;">Tambahkan CTA button untuk produk/membership</li>
          <li style="margin-bottom: 8px;">Update social media links</li>
          <li style="margin-bottom: 8px;">Share link bio di Instagram/TikTok bio</li>
        </ul>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <p style="color: #6b7280; margin: 0 0 15px 0;">Butuh bantuan mengoptimalkan bio page?</p>
        <a href="${process.env.NEXTAUTH_URL}/affiliate/bio" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
          ⚙️ Edit Bio Page
        </a>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>Email ini dikirim karena Anda ${action} bio page di platform EksporYuk</p>
        <p>© ${new Date().getFullYear()} EksporYuk. All rights reserved.</p>
      </div>
    </div>
  `

  const textContent = `
    🎉 Bio Page ${action === 'dibuat' ? 'Berhasil Dibuat' : 'Diperbarui'}!
    
    Halo ${userName},
    
    Bio Page "${displayName}" Anda ${action} dan siap untuk dishare!
    
    📄 Link Bio Page: ${bioUrl}
    
    ${features.length > 0 ? `✨ Fitur yang tersedia:
    ${features.map(f => `• ${f}`).join('\n    ')}
    ` : ''}
    
    💡 Tips optimasi:
    • Tambahkan foto profil yang menarik
    • Buat headline yang compelling  
    • Tambahkan CTA button untuk produk
    • Update social media links
    • Share di Instagram/TikTok bio
    
    Edit bio page: ${process.env.NEXTAUTH_URL}/affiliate/bio
    
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
  generateBioPageUpdatedEmail
}