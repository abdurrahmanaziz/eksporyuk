const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedDocumentTemplates() {
  console.log('Seeding document templates...')

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.log('No admin user found. Creating templates without createdBy...')
    return
  }

  const templates = [
    {
      name: 'Commercial Invoice',
      slug: 'commercial-invoice',
      type: 'INVOICE',
      category: 'INVOICE',
      description: 'Invoice standar untuk transaksi komersial internasional',
      paperSize: 'A4',
      orientation: 'portrait',
      templateHtml: `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .invoice-title { font-size: 24px; font-weight: bold; }
    .company-info { margin-bottom: 20px; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    .total-section { text-align: right; margin-top: 20px; }
    .sign-section { margin-top: 40px; display: flex; justify-content: space-around; }
  </style>
</head>
<body>
  <div class="header">
    <div class="invoice-title">COMMERCIAL INVOICE</div>
    <div>Invoice No: {{invoiceNo}}</div>
    <div>Date: {{invoiceDate}}</div>
  </div>

  <div class="company-info">
    <h3>{{sellerCompany}}</h3>
    <p>{{sellerAddress}}</p>
    <p>Phone: {{sellerPhone}}</p>
    <p>Email: {{sellerEmail}}</p>
  </div>

  <div class="section">
    <h4>SHIP TO:</h4>
    <p><strong>{{buyerCompany}}</strong></p>
    <p>{{buyerAddress}}</p>
    <p>{{buyerCity}}, {{buyerCountry}}</p>
  </div>

  <div class="section">
    <table>
      <tr>
        <th>Item Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
      <tr>
        <td>{{itemDescription}}</td>
        <td>{{itemQuantity}}</td>
        <td>USD {{itemUnitPrice}}</td>
        <td>USD {{itemAmount}}</td>
      </tr>
    </table>
  </div>

  <div class="total-section">
    <p>Subtotal: USD {{subtotal}}</p>
    <p>Shipping: USD {{shipping}}</p>
    <p>Tax: USD {{tax}}</p>
    <p><strong>Total: USD {{total}}</strong></p>
  </div>

  <div class="sign-section">
    <div>
      <p>Authorized By:</p>
      <p style="margin-top: 40px;">_________________</p>
      <p>{{sellerName}}</p>
    </div>
    <div>
      <p>Received By:</p>
      <p style="margin-top: 40px;">_________________</p>
      <p>{{buyerName}}</p>
    </div>
  </div>
</body>
</html>
      `,
      templateFields: JSON.stringify([
        { name: 'invoiceNo', label: 'Nomor Invoice', type: 'text', required: true },
        { name: 'invoiceDate', label: 'Tanggal Invoice', type: 'date', required: true },
        { name: 'sellerCompany', label: 'Nama Perusahaan Penjual', type: 'text', required: true },
        { name: 'sellerAddress', label: 'Alamat Penjual', type: 'textarea', required: true },
        { name: 'sellerPhone', label: 'Telepon Penjual', type: 'text', required: true },
        { name: 'sellerEmail', label: 'Email Penjual', type: 'email', required: true },
        { name: 'sellerName', label: 'Nama Penandatangan Penjual', type: 'text', required: true },
        { name: 'buyerCompany', label: 'Nama Perusahaan Pembeli', type: 'text', required: true },
        { name: 'buyerAddress', label: 'Alamat Pembeli', type: 'textarea', required: true },
        { name: 'buyerCity', label: 'Kota Pembeli', type: 'text', required: true },
        { name: 'buyerCountry', label: 'Negara Pembeli', type: 'text', required: true },
        { name: 'buyerName', label: 'Nama Pembeli', type: 'text', required: true },
        { name: 'itemDescription', label: 'Deskripsi Item', type: 'textarea', required: true },
        { name: 'itemQuantity', label: 'Jumlah', type: 'number', required: true },
        { name: 'itemUnitPrice', label: 'Harga Unit (USD)', type: 'number', required: true },
        { name: 'itemAmount', label: 'Total Jumlah (USD)', type: 'number', required: true },
        { name: 'subtotal', label: 'Subtotal (USD)', type: 'number', required: true },
        { name: 'shipping', label: 'Biaya Pengiriman (USD)', type: 'number', required: false },
        { name: 'tax', label: 'Pajak (USD)', type: 'number', required: false },
        { name: 'total', label: 'Total (USD)', type: 'number', required: true }
      ]),
      isActive: true,
      isPremium: false,
      isBuiltIn: true,
      createdBy: adminUser.id
    },
    {
      name: 'Packing List',
      slug: 'packing-list',
      type: 'PACKING',
      category: 'PACKING',
      description: 'Daftar item dalam pengiriman untuk verifikasi customs',
      paperSize: 'A4',
      orientation: 'portrait',
      templateHtml: `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 15px; }
    .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px; }
    .info-box { margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #ddd; }
    .summary { margin-top: 20px; }
  </style>
</head>
<body>
  <div class="title">PACKING LIST</div>

  <div class="info-box">
    <table>
      <tr><td><strong>Date:</strong></td><td>{{packingDate}}</td></tr>
      <tr><td><strong>Invoice No:</strong></td><td>{{invoiceNo}}</td></tr>
      <tr><td><strong>Shipper:</strong></td><td>{{shipperName}}, {{shipperCountry}}</td></tr>
      <tr><td><strong>Consignee:</strong></td><td>{{consigneeName}}, {{consigneeCountry}}</td></tr>
    </table>
  </div>

  <table>
    <tr>
      <th>No</th>
      <th>Description</th>
      <th>Quantity</th>
      <th>Unit</th>
      <th>Weight (kg)</th>
    </tr>
    <tr>
      <td>1</td>
      <td>{{itemDescription}}</td>
      <td>{{itemQuantity}}</td>
      <td>{{itemUnit}}</td>
      <td>{{itemWeight}}</td>
    </tr>
  </table>

  <div class="summary">
    <p><strong>Total Weight:</strong> {{totalWeight}} kg</p>
    <p><strong>Total Volume:</strong> {{totalVolume}} m³</p>
    <p><strong>Packages:</strong> {{totalPackages}}</p>
  </div>
</body>
</html>
      `,
      templateFields: JSON.stringify([
        { name: 'packingDate', label: 'Tanggal Packing', type: 'date', required: true },
        { name: 'invoiceNo', label: 'Nomor Invoice', type: 'text', required: true },
        { name: 'shipperName', label: 'Nama Pengirim', type: 'text', required: true },
        { name: 'shipperCountry', label: 'Negara Pengirim', type: 'text', required: true },
        { name: 'consigneeName', label: 'Nama Penerima', type: 'text', required: true },
        { name: 'consigneeCountry', label: 'Negara Penerima', type: 'text', required: true },
        { name: 'itemDescription', label: 'Deskripsi Item', type: 'textarea', required: true },
        { name: 'itemQuantity', label: 'Jumlah', type: 'number', required: true },
        { name: 'itemUnit', label: 'Satuan', type: 'text', required: true },
        { name: 'itemWeight', label: 'Berat Item (kg)', type: 'number', required: true },
        { name: 'totalWeight', label: 'Total Berat (kg)', type: 'number', required: true },
        { name: 'totalVolume', label: 'Total Volume (m³)', type: 'number', required: true },
        { name: 'totalPackages', label: 'Total Paket', type: 'number', required: true }
      ]),
      isActive: true,
      isPremium: false,
      isBuiltIn: true,
      createdBy: adminUser.id
    },
    {
      name: 'Shipping Instruction',
      slug: 'shipping-instruction',
      type: 'SHIPPING',
      category: 'SHIPPING',
      description: 'Instruksi pengiriman untuk forwarder dan customs',
      paperSize: 'A4',
      orientation: 'portrait',
      templateHtml: `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 15px; }
    .title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="title">SHIPPING INSTRUCTION</div>

  <div class="section">
    <div class="section-title">Shipper Information:</div>
    <p>{{shipperCompany}}</p>
    <p>{{shipperAddress}}</p>
    <p>{{shipperPhone}}</p>
  </div>

  <div class="section">
    <div class="section-title">Consignee Information:</div>
    <p>{{consigneeCompany}}</p>
    <p>{{consigneeAddress}}</p>
    <p>{{consigneePhone}}</p>
  </div>

  <div class="section">
    <div class="section-title">Shipping Details:</div>
    <p><strong>Departure Port:</strong> {{departurePort}}</p>
    <p><strong>Destination Port:</strong> {{destinationPort}}</p>
    <p><strong>Mode of Transport:</strong> {{transportMode}}</p>
    <p><strong>Estimated Departure:</strong> {{estimatedDeparture}}</p>
    <p><strong>Estimated Arrival:</strong> {{estimatedArrival}}</p>
  </div>

  <div class="section">
    <div class="section-title">Cargo Information:</div>
    <p><strong>Total Weight:</strong> {{totalWeight}} kg</p>
    <p><strong>Total Volume:</strong> {{totalVolume}} m³</p>
    <p><strong>Number of Packages:</strong> {{numberOfPackages}}</p>
    <p><strong>Description:</strong> {{cargoDescription}}</p>
  </div>

  <div class="section">
    <div class="section-title">Special Instructions:</div>
    <p>{{specialInstructions}}</p>
  </div>
</body>
</html>
      `,
      templateFields: JSON.stringify([
        { name: 'shipperCompany', label: 'Nama Perusahaan Pengirim', type: 'text', required: true },
        { name: 'shipperAddress', label: 'Alamat Pengirim', type: 'textarea', required: true },
        { name: 'shipperPhone', label: 'Telepon Pengirim', type: 'text', required: true },
        { name: 'consigneeCompany', label: 'Nama Perusahaan Penerima', type: 'text', required: true },
        { name: 'consigneeAddress', label: 'Alamat Penerima', type: 'textarea', required: true },
        { name: 'consigneePhone', label: 'Telepon Penerima', type: 'text', required: true },
        { name: 'departurePort', label: 'Pelabuhan Keberangkatan', type: 'text', required: true },
        { name: 'destinationPort', label: 'Pelabuhan Tujuan', type: 'text', required: true },
        { name: 'transportMode', label: 'Mode Pengiriman', type: 'select', options: ['SEA', 'AIR', 'LAND'], required: true },
        { name: 'estimatedDeparture', label: 'Estimasi Keberangkatan', type: 'date', required: true },
        { name: 'estimatedArrival', label: 'Estimasi Tiba', type: 'date', required: true },
        { name: 'totalWeight', label: 'Total Berat (kg)', type: 'number', required: true },
        { name: 'totalVolume', label: 'Total Volume (m³)', type: 'number', required: true },
        { name: 'numberOfPackages', label: 'Jumlah Paket', type: 'number', required: true },
        { name: 'cargoDescription', label: 'Deskripsi Cargo', type: 'textarea', required: true },
        { name: 'specialInstructions', label: 'Instruksi Khusus', type: 'textarea', required: false }
      ]),
      isActive: true,
      isPremium: false,
      isBuiltIn: true,
      createdBy: adminUser.id
    },
    {
      name: 'Memorandum of Understanding - Supplier',
      slug: 'mou-supplier',
      type: 'CONTRACT',
      category: 'CONTRACT',
      description: 'MOU antara pembeli dan supplier',
      paperSize: 'A4',
      orientation: 'portrait',
      templateHtml: `
<html>
<head>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 20px; line-height: 1.6; }
    .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; }
    .section { margin: 15px 0; text-align: justify; }
    .section-title { font-weight: bold; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="title">MEMORANDUM OF UNDERSTANDING</div>

  <div class="section">
    <p>This MOU is entered into on {{date}} between:</p>
    <p><strong>BUYER:</strong> {{buyerName}}</p>
    <p><strong>SUPPLIER:</strong> {{supplierName}}</p>
  </div>

  <div class="section">
    <div class="section-title">1. PRODUCT SPECIFICATION:</div>
    <p>{{productDescription}}</p>
    <p>Quantity: {{productQuantity}} {{productUnit}}</p>
    <p>Price per Unit: USD {{pricePerUnit}}</p>
    <p>Total Price: USD {{totalPrice}}</p>
  </div>

  <div class="section">
    <div class="section-title">2. DELIVERY TERMS:</div>
    <p>Delivery Port: {{deliveryPort}}</p>
    <p>Incoterm: {{incoterm}}</p>
    <p>Expected Delivery Date: {{expectedDeliveryDate}}</p>
  </div>

  <div class="section">
    <div class="section-title">3. PAYMENT TERMS:</div>
    <p>{{paymentTerms}}</p>
  </div>

  <div class="section">
    <div class="section-title">4. VALIDITY:</div>
    <p>This MOU is valid until {{moaValidityDate}}</p>
  </div>

  <div class="section" style="margin-top: 40px;">
    <p>BUYER:</p>
    <p style="margin-top: 30px;">_____________________</p>
    <p>{{buyerSignature}}</p>
    <p>{{buyerDate}}</p>
  </div>

  <div class="section">
    <p>SUPPLIER:</p>
    <p style="margin-top: 30px;">_____________________</p>
    <p>{{supplierSignature}}</p>
    <p>{{supplierDate}}</p>
  </div>
</body>
</html>
      `,
      templateFields: JSON.stringify([
        { name: 'date', label: 'Tanggal MOU', type: 'date', required: true },
        { name: 'buyerName', label: 'Nama Pembeli', type: 'text', required: true },
        { name: 'supplierName', label: 'Nama Supplier', type: 'text', required: true },
        { name: 'productDescription', label: 'Deskripsi Produk', type: 'textarea', required: true },
        { name: 'productQuantity', label: 'Jumlah Produk', type: 'number', required: true },
        { name: 'productUnit', label: 'Satuan', type: 'text', required: true },
        { name: 'pricePerUnit', label: 'Harga per Unit (USD)', type: 'number', required: true },
        { name: 'totalPrice', label: 'Harga Total (USD)', type: 'number', required: true },
        { name: 'deliveryPort', label: 'Pelabuhan Pengiriman', type: 'text', required: true },
        { name: 'incoterm', label: 'Incoterm', type: 'select', options: ['FOB', 'CIF', 'CIP', 'DDP', 'DAP'], required: true },
        { name: 'expectedDeliveryDate', label: 'Estimasi Tanggal Pengiriman', type: 'date', required: true },
        { name: 'paymentTerms', label: 'Syarat Pembayaran', type: 'textarea', required: true },
        { name: 'moaValidityDate', label: 'Tanggal Berlaku MOU', type: 'date', required: true },
        { name: 'buyerSignature', label: 'Nama Penandatangan Pembeli', type: 'text', required: true },
        { name: 'buyerDate', label: 'Tanggal Pembeli', type: 'date', required: true },
        { name: 'supplierSignature', label: 'Nama Penandatangan Supplier', type: 'text', required: true },
        { name: 'supplierDate', label: 'Tanggal Supplier', type: 'date', required: true }
      ]),
      isActive: true,
      isPremium: false,
      isBuiltIn: true,
      createdBy: adminUser.id
    },
    {
      name: 'Memorandum of Understanding - Buyer',
      slug: 'mou-buyer',
      type: 'CONTRACT',
      category: 'CONTRACT',
      description: 'MOU antara supplier dan pembeli',
      paperSize: 'A4',
      orientation: 'portrait',
      templateHtml: `
<html>
<head>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 20px; line-height: 1.6; }
    .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; }
    .section { margin: 15px 0; text-align: justify; }
    .section-title { font-weight: bold; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="title">MEMORANDUM OF UNDERSTANDING</div>

  <div class="section">
    <p>This MOU is entered into on {{date}} between:</p>
    <p><strong>SELLER/SUPPLIER:</strong> {{sellerName}}</p>
    <p><strong>BUYER:</strong> {{buyerName}}</p>
  </div>

  <div class="section">
    <div class="section-title">1. PRODUCT DETAILS:</div>
    <p>Product: {{productName}}</p>
    <p>Specifications: {{productSpecifications}}</p>
    <p>Quantity: {{quantity}} {{unit}}</p>
  </div>

  <div class="section">
    <div class="section-title">2. PRICING:</div>
    <p>Price per Unit: USD {{pricePerUnit}}</p>
    <p>Total Amount: USD {{totalAmount}}</p>
  </div>

  <div class="section">
    <div class="section-title">3. TERMS & CONDITIONS:</div>
    <p>{{termsAndConditions}}</p>
  </div>

  <div class="section">
    <div class="section-title">4. VALIDITY PERIOD:</div>
    <p>This MOU is valid from {{startDate}} until {{endDate}}</p>
  </div>

  <div class="section" style="margin-top: 40px;">
    <p>SELLER:</p>
    <p style="margin-top: 30px;">_____________________</p>
    <p>{{sellerName}}</p>
    <p>{{sellerDate}}</p>
  </div>

  <div class="section">
    <p>BUYER:</p>
    <p style="margin-top: 30px;">_____________________</p>
    <p>{{buyerName}}</p>
    <p>{{buyerDate}}</p>
  </div>
</body>
</html>
      `,
      templateFields: JSON.stringify([
        { name: 'date', label: 'Tanggal Pembuatan', type: 'date', required: true },
        { name: 'sellerName', label: 'Nama Penjual/Supplier', type: 'text', required: true },
        { name: 'buyerName', label: 'Nama Pembeli', type: 'text', required: true },
        { name: 'productName', label: 'Nama Produk', type: 'text', required: true },
        { name: 'productSpecifications', label: 'Spesifikasi Produk', type: 'textarea', required: true },
        { name: 'quantity', label: 'Jumlah', type: 'number', required: true },
        { name: 'unit', label: 'Satuan', type: 'text', required: true },
        { name: 'pricePerUnit', label: 'Harga per Unit (USD)', type: 'number', required: true },
        { name: 'totalAmount', label: 'Total Jumlah (USD)', type: 'number', required: true },
        { name: 'termsAndConditions', label: 'Syarat dan Ketentuan', type: 'textarea', required: true },
        { name: 'startDate', label: 'Tanggal Mulai Berlaku', type: 'date', required: true },
        { name: 'endDate', label: 'Tanggal Berakhir', type: 'date', required: true },
        { name: 'sellerDate', label: 'Tanggal Tanda Tangan Penjual', type: 'date', required: true },
        { name: 'buyerDate', label: 'Tanggal Tanda Tangan Pembeli', type: 'date', required: true }
      ]),
      isActive: true,
      isPremium: false,
      isBuiltIn: true,
      createdBy: adminUser.id
    },
    {
      name: 'Quotation Letter',
      slug: 'quotation-letter',
      type: 'QUOTATION',
      category: 'QUOTATION',
      description: 'Surat penawaran harga untuk calon pembeli',
      paperSize: 'A4',
      orientation: 'portrait',
      templateHtml: `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { margin-bottom: 30px; }
    .company-name { font-size: 18px; font-weight: bold; }
    .title { text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0; }
    .section { margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    .total { text-align: right; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{companyName}}</div>
    <p>{{companyAddress}}</p>
    <p>Phone: {{companyPhone}} | Email: {{companyEmail}}</p>
  </div>

  <div class="title">QUOTATION / PENAWARAN HARGA</div>

  <div class="section">
    <p>Date: {{quotationDate}}</p>
    <p>Quotation No: {{quotationNo}}</p>
    <p>Valid Until: {{validUntil}}</p>
  </div>

  <div class="section">
    <h4>TO:</h4>
    <p>{{buyerName}}</p>
    <p>{{buyerCompany}}</p>
    <p>{{buyerAddress}}</p>
    <p>{{buyerCity}}, {{buyerCountry}}</p>
  </div>

  <div class="section">
    <p>Dear {{buyerName}},</p>
    <p>Thank you for your inquiry. We are pleased to offer you the following:</p>
  </div>

  <table>
    <tr>
      <th>Item</th>
      <th>Description</th>
      <th>Quantity</th>
      <th>Unit Price</th>
      <th>Amount</th>
    </tr>
    <tr>
      <td>1</td>
      <td>{{itemDescription}}</td>
      <td>{{itemQuantity}}</td>
      <td>USD {{itemUnitPrice}}</td>
      <td>USD {{itemAmount}}</td>
    </tr>
  </table>

  <div class="total">
    <p>Subtotal: USD {{subtotal}}</p>
    <p>Shipping: USD {{shipping}}</p>
    <p>Tax: USD {{tax}}</p>
    <p style="font-size: 16px;">TOTAL: USD {{total}}</p>
  </div>

  <div class="section">
    <h4>TERMS & CONDITIONS:</h4>
    <p>{{termsAndConditions}}</p>
  </div>

  <div class="section" style="margin-top: 40px;">
    <p>Best Regards,</p>
    <p style="margin-top: 30px;">_____________________</p>
    <p>{{authorizedPerson}}</p>
  </div>
</body>
</html>
      `,
      templateFields: JSON.stringify([
        { name: 'companyName', label: 'Nama Perusahaan', type: 'text', required: true },
        { name: 'companyAddress', label: 'Alamat Perusahaan', type: 'textarea', required: true },
        { name: 'companyPhone', label: 'Telepon Perusahaan', type: 'text', required: true },
        { name: 'companyEmail', label: 'Email Perusahaan', type: 'email', required: true },
        { name: 'quotationDate', label: 'Tanggal Quotation', type: 'date', required: true },
        { name: 'quotationNo', label: 'Nomor Quotation', type: 'text', required: true },
        { name: 'validUntil', label: 'Berlaku Sampai', type: 'date', required: true },
        { name: 'buyerName', label: 'Nama Pembeli', type: 'text', required: true },
        { name: 'buyerCompany', label: 'Nama Perusahaan Pembeli', type: 'text', required: true },
        { name: 'buyerAddress', label: 'Alamat Pembeli', type: 'textarea', required: true },
        { name: 'buyerCity', label: 'Kota Pembeli', type: 'text', required: true },
        { name: 'buyerCountry', label: 'Negara Pembeli', type: 'text', required: true },
        { name: 'itemDescription', label: 'Deskripsi Item', type: 'textarea', required: true },
        { name: 'itemQuantity', label: 'Jumlah', type: 'number', required: true },
        { name: 'itemUnitPrice', label: 'Harga Unit (USD)', type: 'number', required: true },
        { name: 'itemAmount', label: 'Total Jumlah (USD)', type: 'number', required: true },
        { name: 'subtotal', label: 'Subtotal (USD)', type: 'number', required: true },
        { name: 'shipping', label: 'Biaya Pengiriman (USD)', type: 'number', required: false },
        { name: 'tax', label: 'Pajak (USD)', type: 'number', required: false },
        { name: 'total', label: 'Total (USD)', type: 'number', required: true },
        { name: 'termsAndConditions', label: 'Syarat dan Ketentuan', type: 'textarea', required: true },
        { name: 'authorizedPerson', label: 'Nama Penandatangan', type: 'text', required: true }
      ]),
      isActive: true,
      isPremium: false,
      isBuiltIn: true,
      createdBy: adminUser.id
    }
  ]

  // Upsert templates
  for (const template of templates) {
    await prisma.exportDocument.upsert({
      where: { slug: template.slug },
      update: template,
      create: template
    })
    console.log(`✓ Seeded: ${template.name}`)
  }

  console.log('✓ Document templates seeding complete!')
}

seedDocumentTemplates()
  .catch(e => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
