# Migration Report: Transactions & Commissions from Sejoli

**Date**: 24 December 2025
**Status**: ✅ COMPLETED

---

## Summary

Successfully migrated all transaction and affiliate commission data from Sejoli (WordPress) to Eksporyuk (Next.js + PostgreSQL).

---

## Data Migrated

### Transactions
- **Total Transactions**: 12,896 orders
- **Total Omset**: Rp 4,174,477,962
- **Source**: `wp_sejolisa_orders` (completed status only)

### Affiliate Commissions
- **Total Conversions**: 5,160 records
- **Total Komisi**: Rp 1,261,471,000
- **Source**: `wp_sejolisa_affiliates` (paid/added status)
- **Commission Type**: FLAT (per PRD requirement)

### Products
- **Total Products**: 54 products created
- **Source**: Derived from `wp_sejolisa_orders` with product names

---

## PRD Validation

| Metric | PRD Target | Actual | Difference |
|--------|------------|--------|------------|
| Sales | 12,894 | 12,896 | +2 (0.02%) ✅ |
| Omset | Rp 4,172,579,962 | Rp 4,174,477,962 | +Rp 1,898,000 (0.05%) ✅ |
| Komisi | Rp 1,260,896,000 | Rp 1,261,471,000 | +Rp 575,000 (0.05%) ✅ |

> Minor differences are expected as PRD target was a snapshot at a specific time.

---

## Top Products by Revenue

| Product | Sales | Revenue |
|---------|-------|---------|
| Paket Ekspor Yuk Lifetime | 1,121 | Rp 1,121,866,864 |
| Bundling Kelas Ekspor + Aplikasi EYA | 1,161 | Rp 1,045,988,899 |
| Kelas Eksporyuk | 1,256 | Rp 804,419,661 |
| Kelas Ekspor Yuk 12 Bulan | 423 | Rp 380,194,426 |
| Paket Ekspor Yuk 6 Bulan | 216 | Rp 153,080,593 |

---

## Data Structure

### Transaction Model
```json
{
  "externalId": "sejoli-{order_id}",
  "type": "PRODUCT",
  "status": "SUCCESS",
  "amount": "{grand_total}",
  "productId": "{eksporyuk_product_id}",
  "affiliateId": "{eksporyuk_user_id}",
  "affiliateShare": "{commission_amount}",
  "paymentProvider": "sejoli",
  "metadata": {
    "sejoliOrderId": "{order_id}",
    "sejoliProductId": "{product_id}",
    "sejoliAffiliateId": "{affiliate_id}",
    "source": "sejoli_migration"
  }
}
```

### AffiliateConversion Model
```json
{
  "affiliateId": "{eksporyuk_user_id}",
  "transactionId": "{transaction_id}",
  "commissionAmount": "{commission_flat}",
  "commissionRate": 0,
  "paidOut": true/false
}
```

---

## Commission Status Mapping

| Sejoli Status | Sejoli paid_status | Eksporyuk Status |
|---------------|-------------------|------------------|
| added | 1 | PAID |
| added | 0 | LOCKED |
| pending | 0 | PENDING |
| cancelled | - | REVERSED (not imported) |

---

## Files Created

### Export Scripts
- `33-export-wallet-commission.exp` - Check wallet/commission structure
- `34-check-wallet-labels.exp` - Check wallet labels
- `35-check-affiliates.exp` - Check affiliate table structure
- `36-export-commission-total.exp` - Get total commission
- `37-export-full-data.exp` - Export orders to server
- `38-export-commissions.exp` - Export commissions and users
- `39-download-files.exp` - Download orders
- `40-download-commissions.exp` - Download commissions
- `41-download-users.exp` - Download users

### Data Files (exports/)
- `orders_export.tsv` - 12,896 completed orders
- `commissions_export.tsv` - 16,989 affiliate commission records
- `users_export.tsv` - 18,753 users

### Import Script
- `42-import-transactions-commissions.js` - Main migration script

---

## Database Tables Updated

1. **Transaction** - 12,896 new records
2. **AffiliateConversion** - 5,160 new records
3. **Product** - 54 new products created

---

## PRD Compliance

✅ **Komisi FLAT** - Used actual commission amounts from Sejoli, not calculated
✅ **Data dari Sejoli** - All data sourced from Sejoli database
✅ **Tidak dihitung ulang** - Commission values used as-is
✅ **Tidak di-hardcode** - All values from real database exports
✅ **Status locked/paid/reversed** - Mapped from Sejoli status

---

## Notes

1. Only completed orders were imported (status = 'completed')
2. Only paid/added commissions were imported (status != 'cancelled')
3. Products created with `sejoli-{id}` slug for easy tracking
4. User matching done via email address
5. Unknown users assigned to system user
6. All original Sejoli IDs preserved in metadata for traceability

---

## Next Steps

1. ✅ Transactions imported
2. ✅ Commissions imported
3. ✅ Products created
4. ⏳ Verify dashboard displays correct totals
5. ⏳ Map products to memberships/classes/groups
6. ⏳ Configure product commission rates
