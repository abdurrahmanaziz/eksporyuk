import React from 'react'

const config = {
  logo: <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>📚 EksporYuk Docs</span>,
  project: {
    link: 'https://github.com/eksporyuk/platform'
  },
  docsRepositoryBase: 'https://github.com/eksporyuk/platform/tree/main/docs-site',
  footer: {
    text: `© ${new Date().getFullYear()} EksporYuk. All rights reserved.`
  },
  head: () => {
    return (
      <>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Dokumentasi Lengkap Platform EksporYuk" />
        <meta name="og:title" content="EksporYuk Documentation" />
      </>
    )
  },
  primaryHue: 200,
  darkMode: true,
  nextThemes: {
    defaultTheme: 'system'
  },
  sidebar: {
    titleComponent: ({ title, type }) => {
      if (type === 'separator') {
        return <div style={{ fontWeight: 'bold', marginTop: '1rem' }}>{title}</div>
      }
      return <>{title}</>
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true
  },
  toc: {
    backToTop: true,
    title: 'Di Halaman Ini'
  },
  editLink: {
    text: 'Edit halaman ini di GitHub →'
  },
  feedback: {
    content: 'Ada pertanyaan? Hubungi kami →',
    labels: 'feedback'
  },
  search: {
    placeholder: 'Cari dokumentasi...'
  },
  banner: {
    key: 'v1-release',
    text: (
      <span>
        🎉 Platform EksporYuk v1.0 telah diluncurkan! <a href="/changelog" style={{ textDecoration: 'underline' }}>Lihat changelog</a>
      </span>
    )
  },
  navigation: {
    prev: true,
    next: true
  },
  gitTimestamp: false
}

export default config
