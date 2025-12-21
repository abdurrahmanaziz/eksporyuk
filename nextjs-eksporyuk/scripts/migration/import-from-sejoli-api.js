/*
 * Import transaksi + affiliate + komisi via REST API Sejoli
 * - Tidak menghapus fitur apa pun, hanya menambah opsi import via API
 * - Idempotent dengan externalId: "sejoli-api-<orderId>"
 * - Mapping produk & komisi memakai product-membership-mapping.js
 * - Status mapping: completed→SUCCESS, cancelled→FAILED, refunded→REFUNDED, payment-confirm/on-hold→PENDING
 * - Membership: assign berdasarkan mapping (LIFETIME/12B/6B); event/webinar hanya set user FREE
 * - Affiliate: pakai affiliate_code (affiliate_id di Sejoli) untuk hubungkan ke AffiliateProfile
 * - Tidak ada force-reset DB; semua UPSERT
 */

require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || undefined })
const { PrismaClient, Prisma } = require('@prisma/client')
const qs = require('querystring')
const { PRODUCT_MEMBERSHIP_MAPPING, getCommissionForProduct } = require('./product-membership-mapping')

const prisma = new PrismaClient()

const CONFIG = {
  ordersUrl: process.env.SEJOLI_API_ORDERS_URL,
  usersUrl: process.env.SEJOLI_API_USERS_URL,
  affiliatesUrl: process.env.SEJOLI_API_AFFILIATES_URL,
  apiToken: process.env.SEJOLI_API_TOKEN,
  apiKey: process.env.SEJOLI_API_KEY, // optional header x-api-key
  perPage: Number(process.env.SEJOLI_API_PER_PAGE || '500'),
  since: process.env.SEJOLI_API_SINCE || null, // ISO date string
}

function requireEnv(value, name) {
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (CONFIG.apiToken) headers['Authorization'] = `Bearer ${CONFIG.apiToken}`
  if (CONFIG.apiKey) headers['x-api-key'] = CONFIG.apiKey
  return headers
}

async function fetchPaginated(url, label) {
  const headers = buildHeaders()
  const perPage = CONFIG.perPage
  let page = 1
  const all = []

  while (true) {
    const query = { page, per_page: perPage }
    if (CONFIG.since) query.updated_after = CONFIG.since
    const fullUrl = `${url}?${qs.stringify(query)}`
    const res = await fetch(fullUrl, { headers })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${label} fetch failed (${res.status}): ${text}`)
    }
    const data = await res.json()
    const items = Array.isArray(data) ? data : data.items || data.data || []
    all.push(...items)
    if (!items.length || items.length < perPage) break
    page += 1
  }

  return all
}

function mapStatus(status) {
  if (status === 'completed') return 'SUCCESS'
  if (status === 'cancelled') return 'FAILED'
  if (status === 'refunded') return 'REFUNDED'
  if (status === 'on-hold' || status === 'payment-confirm') return 'PENDING'
  return 'PENDING'
}

function mapMembershipDuration(mapping) {
  if (!mapping) return null
  if (mapping.duration === null) return 'LIFETIME'
  if (mapping.duration === 365) return 'TWELVE_MONTHS'
  if (mapping.duration === 180) return 'SIX_MONTHS'
  return null
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

async function loadReferenceData() {
  requireEnv(CONFIG.ordersUrl, 'SEJOLI_API_ORDERS_URL')
  requireEnv(CONFIG.usersUrl, 'SEJOLI_API_USERS_URL')
  requireEnv(CONFIG.affiliatesUrl, 'SEJOLI_API_AFFILIATES_URL')

  console.log('📡 Mengambil users dari Sejoli API...')
  const sejoliUsers = await fetchPaginated(CONFIG.usersUrl, 'users')
  console.log(`   ✅ ${sejoliUsers.length.toLocaleString()} users`)

  console.log('📡 Mengambil affiliates dari Sejoli API...')
  const sejoliAffiliates = await fetchPaginated(CONFIG.affiliatesUrl, 'affiliates')
  console.log(`   ✅ ${sejoliAffiliates.length.toLocaleString()} affiliates`)

  console.log('📡 Mengambil orders dari Sejoli API...')
  const sejoliOrders = await fetchPaginated(CONFIG.ordersUrl, 'orders')
  console.log(`   ✅ ${sejoliOrders.length.toLocaleString()} orders`)

  return { sejoliUsers, sejoliAffiliates, sejoliOrders }
}

async function buildLocalMaps() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } })
  const emailToUser = new Map(users.map((u) => [u.email.toLowerCase(), u]))

  const affiliateProfiles = await prisma.affiliateProfile.findMany({ select: { id: true, userId: true, affiliateCode: true } })
  const affiliateCodeToProfile = new Map(
    affiliateProfiles.map((a) => [String(a.affiliateCode), a])
  )

  const memberships = await prisma.membership.findMany({ select: { id: true, slug: true, duration: true } })
  const membershipByDuration = new Map(memberships.map((m) => [m.duration, m]))

  return { emailToUser, affiliateCodeToProfile, membershipByDuration }
}

function resolveSejoliUser(order, sejoliUserMap) {
  const user = sejoliUserMap.get(order.user_id)
  const email = (order.user_email || (user && user.user_email) || '').trim().toLowerCase()
  const name = order.user_name || (user && (user.display_name || user.first_name || user.user_login)) || null
  return { email, name, sejoliUser: user }
}

function resolveAffiliate(order, sejoliAffiliateMap, affiliateCodeToProfile) {
  if (!order.affiliate_id || Number(order.affiliate_id) === 0) return { affiliateProfile: null, affiliateCode: null }
  const affiliateCode = String(order.affiliate_id)
  const sejoliAffiliate = sejoliAffiliateMap.get(affiliateCode)
  const affiliateProfile = affiliateCodeToProfile.get(affiliateCode) || null
  return { affiliateProfile, affiliateCode, sejoliAffiliate }
}

function resolveMembership(mapping, membershipByDuration, orderCreatedAt) {
  if (!mapping) return null
  const durationKey = mapMembershipDuration(mapping)
  if (!durationKey) return null
  const membership = membershipByDuration.get(durationKey)
  if (!membership) return null

  const startDate = new Date(orderCreatedAt)
  let endDate
  if (durationKey === 'LIFETIME') {
    endDate = new Date('2099-12-31T00:00:00Z')
  } else if (durationKey === 'TWELVE_MONTHS') {
    endDate = addDays(startDate, 365)
  } else if (durationKey === 'SIX_MONTHS') {
    endDate = addDays(startDate, 180)
  } else {
    endDate = addDays(startDate, 180)
  }

  return { membership, startDate, endDate, durationKey }
}

async function upsertUserMembership(userId, membershipPayload, price, transactionId) {
  const existing = await prisma.userMembership.findFirst({
    where: { userId, membershipId: membershipPayload.membership.id },
  })

  const data = {
    userId,
    membershipId: membershipPayload.membership.id,
    startDate: membershipPayload.startDate,
    endDate: membershipPayload.endDate,
    isActive: true,
    status: 'ACTIVE',
    price,
    transactionId,
  }

  if (existing) {
    await prisma.userMembership.update({ where: { id: existing.id }, data })
  } else {
    await prisma.userMembership.create({ data })
  }
}

async function upsertAffiliateConversion(transactionId, affiliateProfileId, commissionAmount, ratePercent) {
  await prisma.affiliateConversion.upsert({
    where: { transactionId },
    update: {
      affiliateId: affiliateProfileId,
      commissionAmount: new Prisma.Decimal(commissionAmount),
      commissionRate: new Prisma.Decimal(ratePercent ?? 0),
    },
    create: {
      affiliateId: affiliateProfileId,
      transactionId,
      commissionAmount: new Prisma.Decimal(commissionAmount),
      commissionRate: new Prisma.Decimal(ratePercent ?? 0),
    },
  })
}

async function processOrders({ sejoliOrders, sejoliUsers, sejoliAffiliates }) {
  const sejoliUserMap = new Map(sejoliUsers.map((u) => [u.id || u.user_id, u]))
  const sejoliAffiliateMap = new Map(
    sejoliAffiliates.map((a) => [String(a.affiliate_code || a.code || a.id), a])
  )
  const { emailToUser, affiliateCodeToProfile, membershipByDuration } = await buildLocalMaps()

  let created = 0
  let updated = 0
  let skippedNoUser = 0
  let skippedMissingMembership = 0
  let totalRevenue = 0
  let totalCommission = 0

  for (const order of sejoliOrders) {
    const { email, name } = resolveSejoliUser(order, sejoliUserMap)
    if (!email) {
      skippedNoUser++
      continue
    }

    const localUser = emailToUser.get(email)
    if (!localUser) {
      skippedNoUser++
      continue
    }

    const productId = Number(order.product_id)
    const mapping = PRODUCT_MEMBERSHIP_MAPPING[productId]
    const txStatus = mapStatus(order.status)
    const amount = Number(order.grand_total || 0)
    const externalId = `sejoli-api-${order.id}`
    const createdAt = order.created_at ? new Date(order.created_at) : new Date()

    const { affiliateProfile, affiliateCode } = resolveAffiliate(order, sejoliAffiliateMap, affiliateCodeToProfile)
    const affiliateShare = affiliateProfile ? getCommissionForProduct(productId) : 0
    const commissionRatePercent = amount > 0 ? (affiliateShare / amount) * 100 : 0

    const productType = mapping?.type || 'unknown'
    let txType = 'PRODUCT'
    if (productType === 'event') txType = 'EVENT'
    if (productType === 'membership' || productType === 'renewal') txType = 'MEMBERSHIP'

    const membershipPayload = txType === 'MEMBERSHIP' ? resolveMembership(mapping, membershipByDuration, createdAt) : null
    if (txType === 'MEMBERSHIP' && !membershipPayload) {
      skippedMissingMembership++
      continue
    }

    // Revenue split (flat affiliate, remaining for founder/cofounder/admin)
    let companyFee = null
    let founderShare = null
    let coFounderShare = null
    if (txStatus === 'SUCCESS' && amount > 0) {
      const remaining = amount - affiliateShare
      companyFee = remaining * 0.15
      const afterFee = remaining - companyFee
      founderShare = afterFee * 0.6
      coFounderShare = afterFee * 0.4
      totalCommission += affiliateShare
      totalRevenue += amount
    }

    const txData = {
      userId: localUser.id,
      amount,
      status: txStatus,
      customerName: name,
      customerEmail: email,
      description: mapping?.name || 'Produk Sejoli',
      type: txType,
      paymentProvider: 'SEJOLI',
      paymentMethod: order.payment_gateway || 'MANUAL',
      affiliateShare,
      founderShare,
      coFounderShare,
      companyFee,
      invoiceNumber: order.invoice_number || `INV${String(order.id).padStart(6, '0')}`,
      metadata: {
        sejoliOrderId: order.id,
        sejoliProductId: productId,
        sejoliStatus: order.status,
        sejoliAffiliateCode: affiliateCode || null,
        productType,
        quantity: order.quantity || 1,
      },
      createdAt,
    }

    const existing = await prisma.transaction.findUnique({ where: { externalId } })
    let transaction
    if (existing) {
      transaction = await prisma.transaction.update({ where: { id: existing.id }, data: txData })
      updated++
    } else {
      transaction = await prisma.transaction.create({
        data: {
          ...txData,
          externalId,
        },
      })
      created++
    }

    // Affiliate conversion
    if (affiliateShare > 0 && affiliateProfile) {
      await upsertAffiliateConversion(transaction.id, affiliateProfile.id, affiliateShare, commissionRatePercent)
    }

    // Membership activation (only if success)
    if (txType === 'MEMBERSHIP' && txStatus === 'SUCCESS' && membershipPayload) {
      await upsertUserMembership(localUser.id, membershipPayload, amount, transaction.id)
      // Upgrade role jika masih free
      if (localUser.role === 'MEMBER_FREE') {
        await prisma.user.update({ where: { id: localUser.id }, data: { role: 'MEMBER_PREMIUM' } })
      }
    }
  }

  return { created, updated, skippedNoUser, skippedMissingMembership, totalRevenue, totalCommission }
}

async function main() {
  try {
    console.log('🚀 Mulai import via Sejoli API...')
    const data = await loadReferenceData()
    const result = await processOrders(data)

    console.log('\n✅ Selesai tanpa error fatal')
    console.log(`   Transaksi dibuat: ${result.created}`)
    console.log(`   Transaksi diperbarui: ${result.updated}`)
    console.log(`   Skipped tanpa user/email: ${result.skippedNoUser}`)
    console.log(`   Skipped membership tanpa mapping ID: ${result.skippedMissingMembership}`)
    console.log(`   Total Revenue (SUCCESS): Rp ${result.totalRevenue.toLocaleString('id-ID')}`)
    console.log(`   Total Komisi (flat): Rp ${result.totalCommission.toLocaleString('id-ID')}`)
  } catch (error) {
    console.error('❌ Import gagal:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
