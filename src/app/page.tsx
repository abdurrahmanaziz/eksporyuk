export default function HomePage() {
  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ color: "#0066cc", marginBottom: "20px" }}>Welcome to Eksporyuk</h1>
      <p style={{ fontSize: "18px", marginBottom: "20px" }}>
        Local development server is now working correctly! 🎉
      </p>
      <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px" }}>
        <h2>System Status:</h2>
        <ul>
          <li>✅ Next.js 14.2.15 running</li>
          <li>✅ Page routing working</li>
          <li>✅ TypeScript compilation successful</li>
          <li>📍 Location: localhost:3000</li>
        </ul>
      </div>
      <p style={{ marginTop: "20px" }}>
        You can now test the commission management pages:
      </p>
      <ul>
        <li><a href="/admin/affiliate-commissions">Admin Commission Management</a></li>
        <li><a href="/affiliate/commissions">Affiliate Commission View</a></li>
      </ul>
    </div>
  )
}
