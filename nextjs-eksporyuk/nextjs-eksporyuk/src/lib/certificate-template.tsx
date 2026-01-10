import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts (optional - using system fonts)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf', fontWeight: 700 },
  ]
})

// Styles for certificate
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Roboto',
  },
  border: {
    border: '8px solid #1e40af',
    padding: 30,
    height: '100%',
    position: 'relative',
  },
  innerBorder: {
    border: '2px solid #3b82f6',
    padding: 40,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 700,
    color: '#1e40af',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  presentedTo: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  studentName: {
    fontSize: 36,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 30,
    borderBottom: '2px solid #cbd5e1',
    paddingBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 1.6,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1e40af',
    marginTop: 10,
    marginBottom: 30,
  },
  dateSection: {
    marginTop: 40,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 50,
    width: '100%',
  },
  signatureBox: {
    alignItems: 'center',
    width: '40%',
  },
  signatureLine: {
    borderTop: '1px solid #cbd5e1',
    width: '100%',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  certNumber: {
    fontSize: 10,
    color: '#94a3b8',
  },
  verifyText: {
    fontSize: 9,
    color: '#cbd5e1',
    marginTop: 5,
  },
})

type CertificateTemplateProps = {
  studentName: string
  courseName: string
  completionDate: string
  certificateNumber: string
  verificationUrl: string
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  studentName,
  courseName,
  completionDate,
  certificateNumber,
  verificationUrl,
}) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.border}>
        <View style={styles.innerBorder}>
          <Text style={styles.title}>Certificate</Text>
          <Text style={styles.subtitle}>Of Completion</Text>
          
          <Text style={styles.presentedTo}>This is to certify that</Text>
          <Text style={styles.studentName}>{studentName}</Text>
          
          <Text style={styles.bodyText}>has successfully completed the course</Text>
          <Text style={styles.courseName}>{courseName}</Text>
          
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>Completed on {completionDate}</Text>
          </View>
          
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Course Instructor</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Platform Director</Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.certNumber}>Certificate No: {certificateNumber}</Text>
            <Text style={styles.verifyText}>
              Verify at: {verificationUrl}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
)

export default CertificateTemplate
