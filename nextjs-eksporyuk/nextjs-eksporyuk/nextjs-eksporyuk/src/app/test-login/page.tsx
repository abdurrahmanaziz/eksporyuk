'use client'

import { signIn, getCsrfToken } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function TestLoginPage() {
  const [result, setResult] = useState('')
  const [csrfToken, setCsrfToken] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  useEffect(() => {
    getCsrfToken().then(token => {
      setCsrfToken(token || 'NO CSRF TOKEN')
      addLog(`CSRF Token loaded: ${token ? 'YES' : 'NO'}`)
    })
  }, [])

  const testLogin = async () => {
    addLog('🔵 Starting login test...')
    setResult('Loading...')
    
    try {
      addLog('🔵 Calling signIn() with credentials...')
      
      const res = await signIn('credentials', {
        email: 'admin@eksporyuk.com',
        password: 'password123',
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      addLog(`🔵 signIn() returned: ${JSON.stringify(res)}`)
      
      if (res?.error) {
        addLog(`❌ Error: ${res.error}`)
        setResult(`❌ ERROR: ${res.error}\n\nFull response:\n${JSON.stringify(res, null, 2)}`)
      } else if (res?.ok) {
        addLog(`✅ Success! Status: ${res.status}`)
        setResult(`✅ SUCCESS!\n\nFull response:\n${JSON.stringify(res, null, 2)}`)
      } else {
        addLog(`⚠️  Unknown response: ${JSON.stringify(res)}`)
        setResult(`⚠️ UNKNOWN RESPONSE:\n${JSON.stringify(res, null, 2)}`)
      }
    } catch (error: any) {
      addLog(`❌ Exception: ${error.message}`)
      setResult(`❌ EXCEPTION: ${error.message}\n\n${error.stack}`)
    }
  }

  const testDirectFetch = async () => {
    addLog('🟢 Testing direct fetch to /api/auth/callback/credentials...')
    
    try {
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@eksporyuk.com',
          password: 'password123',
          csrfToken: csrfToken,
          callbackUrl: '/dashboard',
          json: true
        })
      })
      
      addLog(`🟢 Response status: ${response.status}`)
      
      const text = await response.text()
      addLog(`🟢 Response body: ${text.substring(0, 200)}...`)
      
      setResult(`Direct Fetch Result:\nStatus: ${response.status}\n\n${text}`)
    } catch (error: any) {
      addLog(`❌ Fetch error: ${error.message}`)
      setResult(`Fetch Error: ${error.message}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 Auth Debug Tool</h1>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
        <p className="font-semibold">CSRF Token:</p>
        <code className="text-xs break-all">{csrfToken}</code>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={testLogin}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Test signIn() Function
        </button>
        
        <button
          onClick={testDirectFetch}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
        >
          Test Direct POST
        </button>
      </div>
      
      {result && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Result:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto text-sm border border-gray-300">
            {result}
          </pre>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-bold mb-2">Logs:</h2>
        <div className="p-4 bg-black text-green-400 rounded overflow-auto text-sm font-mono h-64">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="font-semibold mb-2">📋 Instructions:</p>
        <ol className="text-sm space-y-1">
          <li>1. Open Browser DevTools → Network tab</li>
          <li>2. Click "Test signIn() Function" button</li>
          <li>3. Watch for POST request to /api/auth/callback/credentials</li>
          <li>4. Check terminal for [AUTH] logs</li>
          <li>5. If no POST appears, try "Test Direct POST" button</li>
        </ol>
      </div>
    </div>
  )
}
