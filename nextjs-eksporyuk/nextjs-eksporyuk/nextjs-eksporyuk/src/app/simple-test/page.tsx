'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SimpleLoginTest() {
  const [email, setEmail] = useState('admin@eksporyuk.com')
  const [password, setPassword] = useState('password123')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const testDirectAPI = async () => {
    setResult('Testing direct API...')
    setLoading(true)
    
    try {
      const response = await fetch('/api/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      setResult(`Direct API Result:\n${JSON.stringify(data, null, 2)}`)
      
      if (data.success) {
        alert('✅ Direct API login works! Database and credentials are correct.')
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testNextAuth = async () => {
    setResult('Testing NextAuth signIn...')
    setLoading(true)
    
    try {
      console.log('[TEST] Calling signIn...')
      console.log('[TEST] Email:', email)
      console.log('[TEST] Password length:', password.length)
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      console.log('[TEST] SignIn returned:', result)
      console.log('[TEST] Result type:', typeof result)
      console.log('[TEST] Result keys:', result ? Object.keys(result) : 'null/undefined')
      
      setResult(`NextAuth Result:\n${JSON.stringify(result, null, 2)}`)
      
      if (result === undefined) {
        console.error('[TEST] Result is undefined - NextAuth may not be configured correctly')
        alert('❌ signIn() returned undefined. This means NextAuth is not properly initialized.')
        setResult('ERROR: signIn() returned undefined\n\nPossible causes:\n1. SessionProvider not wrapping app\n2. NextAuth API route not working\n3. NEXTAUTH_URL mismatch\n4. next-auth package issue')
        return
      }
      
      if (result?.ok) {
        alert('✅ NextAuth login works!')
        router.push('/dashboard')
      } else {
        const errorMsg = result?.error || 'Unknown error'
        alert(`❌ NextAuth failed: ${errorMsg}`)
      }
    } catch (error: any) {
      console.error('[TEST] Exception caught:', error)
      setResult(`Exception: ${error.message}\n\nStack: ${error.stack}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">🔧 Simple Login Test</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={testDirectAPI}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Test 1: Direct API (No NextAuth)
          </button>
          
          <button
            onClick={testNextAuth}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            Test 2: NextAuth signIn()
          </button>
        </div>

        {result && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
            {result}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <p className="font-semibold mb-2">📋 What this tests:</p>
          <ul className="space-y-1 ml-4">
            <li>• <strong>Test 1</strong>: Direct database authentication (bypasses NextAuth)</li>
            <li>• <strong>Test 2</strong>: Full NextAuth flow with signIn()</li>
          </ul>
          <p className="mt-2 text-gray-700">
            If Test 1 works but Test 2 doesn't → NextAuth configuration issue
          </p>
        </div>
      </div>
    </div>
  )
}
