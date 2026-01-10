/**
 * Scanner API Routes
 * GET - Get scan status/history
 * POST - Run new scan
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { 
  runScan, 
  getScanHistory, 
  getScanDetails, 
  getLatestHealthStatus,
  markAsFixed,
  ignoreIssue,
  getFixHistory
} from '@/lib/services/scannerService'
import { ScanType } from '@prisma/client'

// GET - Get scan data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'
    const scanId = searchParams.get('scanId')

    switch (action) {
      case 'status':
        // Get latest health status
        const status = await getLatestHealthStatus()
        return NextResponse.json(status)

      case 'history':
        // Get scan history
        const limit = parseInt(searchParams.get('limit') || '20')
        const history = await getScanHistory(limit)
        return NextResponse.json({ scans: history })

      case 'details':
        // Get specific scan details
        if (!scanId) {
          return NextResponse.json({ error: 'scanId required' }, { status: 400 })
        }
        const details = await getScanDetails(scanId)
        if (!details) {
          return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
        }
        return NextResponse.json(details)

      case 'fixes':
        // Get fix history
        const fixLimit = parseInt(searchParams.get('limit') || '50')
        const fixes = await getFixHistory(fixLimit)
        return NextResponse.json({ fixes })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Scanner GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// POST - Run scan or perform action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, scanType, resultId, fixMethod, notes } = body

    switch (action) {
      case 'scan':
        // Run new scan
        const validTypes: ScanType[] = ['FULL', 'API', 'DATABASE', 'FRONTEND', 'SECURITY', 'QUICK']
        const type = validTypes.includes(scanType) ? scanType : 'FULL'
        
        const result = await runScan(type, session.user.id)
        return NextResponse.json({
          success: true,
          message: 'Scan completed',
          ...result
        })

      case 'fix':
        // Mark issue as fixed
        if (!resultId || !fixMethod) {
          return NextResponse.json(
            { error: 'resultId and fixMethod required' },
            { status: 400 }
          )
        }
        const fixed = await markAsFixed(resultId, session.user.id, fixMethod, notes)
        return NextResponse.json({
          success: true,
          message: 'Issue marked as fixed',
          result: fixed
        })

      case 'ignore':
        // Ignore issue
        if (!resultId) {
          return NextResponse.json({ error: 'resultId required' }, { status: 400 })
        }
        const ignored = await ignoreIssue(resultId, session.user.id)
        return NextResponse.json({
          success: true,
          message: 'Issue ignored',
          result: ignored
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Scanner POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
