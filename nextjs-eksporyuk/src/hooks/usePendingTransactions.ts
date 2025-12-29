import { useEffect, useState } from 'react'

interface PendingTransaction {
  id: string
  amount: string
  status: string
  type: string
  createdAt: string
  paymentUrl?: string
  invoiceNumber?: string
  customerEmail?: string
}

interface PendingTransactionResponse {
  success: boolean
  hasPendingTransactions: boolean
  pendingTransactions: PendingTransaction[]
}

export function usePendingTransactions() {
  const [hasPending, setHasPending] = useState(false)
  const [transactions, setTransactions] = useState<PendingTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPendingTransactions = async () => {
      try {
        const response = await fetch('/api/user/pending-transactions')
        const data = await response.json() as PendingTransactionResponse

        if (data.success) {
          setHasPending(data.hasPendingTransactions)
          setTransactions(data.pendingTransactions)
        }
      } catch (error) {
        console.error('Error fetching pending transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingTransactions()
  }, [])

  return { hasPending, transactions, loading }
}
