// Script to seed sample buyers data
// Run with: node seed-sample-buyers.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleBuyers = [
  // Australian Buyers
  {
    productName: 'Coconut (Fresh)',
    productSpecs: 'Type: Fresh Tender Coconut\nGrade: A\nSize: Medium to Large\nPackaging: Mesh Bags\nOrigin: Indonesia preferred',
    quantity: '2 Twenty-Foot Container (monthly)',
    shippingTerms: 'CIF',
    destinationPort: 'Sydney, Melbourne',
    paymentTerms: 'T/T',
    companyName: 'Tropical Fruits Australia Pty Ltd',
    country: 'Australia',
    city: 'Sydney',
    address: '123 Import Drive, Sydney NSW 2000',
    contactPerson: 'Michael Chen',
    email: 'michael@tropicalfruits.com.au',
    phone: '+61 2 9876 5432',
    website: 'https://tropicalfruits.com.au',
    businessType: 'Importer & Distributor',
    productsInterest: 'Fresh Fruits, Tropical Produce, Coconut Products',
    annualImport: '$5M - $10M',
    tags: 'premium, reliable, fresh-produce',
    notes: 'Looking for consistent quality and regular supply',
    isVerified: true,
    rating: 4.8,
    totalDeals: 25,
    viewCount: 120,
    likeCount: 45
  },
  {
    productName: 'Palm Oil (Crude & RBD)',
    productSpecs: 'Type: Crude Palm Oil (CPO) / RBD Palm Olein\nFFA: Max 5%\nMoisture: Max 0.1%\nCertification: RSPO preferred',
    quantity: '500 MT monthly',
    shippingTerms: 'FOB',
    destinationPort: 'Melbourne',
    paymentTerms: 'L/C',
    companyName: 'OilCo Trading Group',
    country: 'Australia',
    city: 'Melbourne',
    address: '456 Industrial Ave, Melbourne VIC 3000',
    contactPerson: 'Sarah Williams',
    email: 'procurement@oilco.com.au',
    phone: '+61 3 8765 4321',
    website: 'https://oilco.com.au',
    businessType: 'Industrial Buyer',
    productsInterest: 'Vegetable Oils, Palm Derivatives',
    annualImport: '$20M - $50M',
    tags: 'bulk-buyer, industrial, RSPO',
    notes: 'RSPO certification required for all palm products',
    isVerified: true,
    rating: 4.5,
    totalDeals: 50,
    viewCount: 200,
    likeCount: 78
  },

  // USA Buyers
  {
    productName: 'Coffee Beans (Specialty)',
    productSpecs: 'Origin: Sumatra, Java, Sulawesi\nType: Arabica\nProcess: Wet-hulled (Giling Basah)\nGrade: Specialty Grade (80+ SCA score)\nMoisture: 11-12%',
    quantity: '3 Containers per quarter',
    shippingTerms: 'FOB',
    destinationPort: 'Los Angeles, Long Beach',
    paymentTerms: 'T/T',
    companyName: 'Pacific Coffee Importers LLC',
    country: 'USA',
    city: 'Los Angeles',
    address: '789 Coffee Boulevard, Los Angeles CA 90001',
    contactPerson: 'David Martinez',
    email: 'david@pacificcoffee.com',
    phone: '+1 310 555 1234',
    website: 'https://pacificcoffee.com',
    businessType: 'Specialty Coffee Importer',
    productsInterest: 'Specialty Coffee, Single Origin, Organic Coffee',
    annualImport: '$10M - $20M',
    tags: 'specialty-coffee, organic-certified, fair-trade',
    notes: 'Focused on direct trade relationships with Indonesian farmers',
    isVerified: true,
    rating: 4.9,
    totalDeals: 35,
    viewCount: 180,
    likeCount: 92
  },
  {
    productName: 'Furniture (Teak Wood)',
    productSpecs: 'Material: Solid Teak Wood\nStyle: Modern & Traditional\nFinish: Natural/Lacquered\nCertification: FSC preferred',
    quantity: '40ft Container monthly',
    shippingTerms: 'FOB',
    destinationPort: 'New York',
    paymentTerms: 'D/P',
    companyName: 'American Home Furnishings Inc',
    country: 'USA',
    city: 'New York',
    address: '321 Furniture Lane, New York NY 10001',
    contactPerson: 'Jennifer Adams',
    email: 'jennifer@ahfurnishings.com',
    phone: '+1 212 555 6789',
    website: 'https://ahfurnishings.com',
    businessType: 'Furniture Retailer',
    productsInterest: 'Wooden Furniture, Handicrafts, Home Decor',
    annualImport: '$15M - $25M',
    tags: 'teak-furniture, FSC-certified, wholesale',
    notes: 'Looking for exclusive designs and custom manufacturing',
    isVerified: true,
    rating: 4.6,
    totalDeals: 40,
    viewCount: 150,
    likeCount: 65
  },

  // Netherlands/EU Buyers
  {
    productName: 'Cocoa Beans',
    productSpecs: 'Type: Fermented Cocoa Beans\nGrade: Premium\nMoisture: Max 7%\nFermentation: 5-7 days\nOrigin: Sulawesi/Sumatra',
    quantity: '200 MT per shipment',
    shippingTerms: 'CIF',
    destinationPort: 'Rotterdam',
    paymentTerms: 'L/C',
    companyName: 'Dutch Cocoa Trading BV',
    country: 'Netherlands',
    city: 'Amsterdam',
    address: 'Keizersgracht 100, 1015 CV Amsterdam',
    contactPerson: 'Hans van der Berg',
    email: 'hans@dutchcocoa.nl',
    phone: '+31 20 123 4567',
    website: 'https://dutchcocoa.nl',
    businessType: 'Commodity Trader',
    productsInterest: 'Cocoa, Coffee, Spices',
    annualImport: '$50M - $100M',
    tags: 'cocoa-specialist, EU-certified, bulk-trader',
    notes: 'Requires EU compliance documentation',
    isVerified: true,
    rating: 4.7,
    totalDeals: 80,
    viewCount: 250,
    likeCount: 110
  },

  // Singapore Buyers
  {
    productName: 'Rubber (Natural)',
    productSpecs: 'Type: SMR-20, SIR-20\nGrade: Standard\nPacking: Bales (35kg)\nContamination: Free from foreign matter',
    quantity: '100 MT monthly',
    shippingTerms: 'FOB',
    destinationPort: 'Singapore',
    paymentTerms: 'T/T',
    companyName: 'Asia Rubber Trading Pte Ltd',
    country: 'Singapore',
    city: 'Singapore',
    address: '10 Marina Boulevard, #35-01, Singapore 018983',
    contactPerson: 'Lee Wei Ming',
    email: 'weiming@asiarubber.sg',
    phone: '+65 6789 1234',
    website: 'https://asiarubber.sg',
    businessType: 'Commodity Trading',
    productsInterest: 'Natural Rubber, Latex, Rubber Products',
    annualImport: '$30M - $50M',
    tags: 'rubber-trader, commodity, bulk',
    notes: 'Long-term contracts preferred',
    isVerified: true,
    rating: 4.5,
    totalDeals: 60,
    viewCount: 130,
    likeCount: 48
  },

  // Japan Buyers
  {
    productName: 'Shrimp (Vannamei)',
    productSpecs: 'Type: White Shrimp (Vannamei)\nSize: 21/25, 26/30, 31/40\nForm: HOSO, HLSO, PD, PUD\nProcessing: IQF Block Frozen',
    quantity: '40ft Reefer Container monthly',
    shippingTerms: 'CIF',
    destinationPort: 'Tokyo, Osaka',
    paymentTerms: 'T/T',
    companyName: 'Nippon Seafood Corporation',
    country: 'Japan',
    city: 'Tokyo',
    address: '1-2-3 Tsukiji, Chuo-ku, Tokyo 104-0045',
    contactPerson: 'Takeshi Yamamoto',
    email: 'yamamoto@nipponseafood.co.jp',
    phone: '+81 3 1234 5678',
    website: 'https://nipponseafood.co.jp',
    businessType: 'Seafood Importer',
    productsInterest: 'Shrimp, Crab, Tuna, Squid',
    annualImport: '$40M - $60M',
    tags: 'seafood, japanese-market, quality-focus',
    notes: 'Strict quality standards, requires HACCP and health certificates',
    isVerified: true,
    rating: 4.8,
    totalDeals: 55,
    viewCount: 190,
    likeCount: 85
  },

  // China Buyers
  {
    productName: 'Bird Nest (Edible)',
    productSpecs: 'Type: White Bird Nest\nGrade: AAA, AA\nPurity: 95%+\nMoisture: Max 15%\nOrigin: Indonesia (Kalimantan preferred)',
    quantity: '50 KG monthly',
    shippingTerms: 'CIF',
    destinationPort: 'Shanghai, Hong Kong',
    paymentTerms: 'T/T',
    companyName: 'Golden Nest Trading Co., Ltd',
    country: 'China',
    city: 'Shanghai',
    address: '888 Nanjing Road, Huangpu District, Shanghai 200001',
    contactPerson: 'Wang Li',
    email: 'wangli@goldennest.cn',
    phone: '+86 21 5555 6666',
    website: 'https://goldennest.cn',
    businessType: 'Luxury Food Importer',
    productsInterest: 'Bird Nest, Ginseng, Premium Seafood',
    annualImport: '$20M - $40M',
    tags: 'luxury-food, bird-nest, premium',
    notes: 'Requires AQSIQ registration and health certificates',
    isVerified: true,
    rating: 4.6,
    totalDeals: 30,
    viewCount: 170,
    likeCount: 72
  },

  // UAE Buyers
  {
    productName: 'Spices (Mixed)',
    productSpecs: 'Items: Pepper, Cinnamon, Cloves, Nutmeg\nForm: Whole and Ground\nPacking: 25kg bags\nQuality: Premium Export Grade',
    quantity: '20ft Container quarterly',
    shippingTerms: 'CNF',
    destinationPort: 'Dubai, Abu Dhabi',
    paymentTerms: 'L/C',
    companyName: 'Emirates Spice Trading LLC',
    country: 'UAE',
    city: 'Dubai',
    address: 'Jebel Ali Free Zone, Dubai, UAE',
    contactPerson: 'Ahmed Al-Rashid',
    email: 'ahmed@emiratesspice.ae',
    phone: '+971 4 888 9999',
    website: 'https://emiratesspice.ae',
    businessType: 'Re-exporter',
    productsInterest: 'Spices, Herbs, Essential Oils',
    annualImport: '$10M - $20M',
    tags: 'spices, middle-east, re-export',
    notes: 'Distributes to GCC and African markets',
    isVerified: true,
    rating: 4.4,
    totalDeals: 45,
    viewCount: 140,
    likeCount: 55
  },

  // Germany Buyers
  {
    productName: 'Textiles (Batik)',
    productSpecs: 'Type: Hand-drawn Batik, Batik Cap\nMaterial: 100% Cotton, Rayon\nDesign: Traditional & Contemporary\nWidth: 110cm',
    quantity: '5000 meters monthly',
    shippingTerms: 'DAP',
    destinationPort: 'Hamburg',
    paymentTerms: 'D/A',
    companyName: 'Berlin Fashion Import GmbH',
    country: 'Germany',
    city: 'Berlin',
    address: 'Friedrichstraße 100, 10117 Berlin',
    contactPerson: 'Anna Schmidt',
    email: 'anna@berlinfashion.de',
    phone: '+49 30 1234 5678',
    website: 'https://berlinfashion.de',
    businessType: 'Fashion Wholesaler',
    productsInterest: 'Batik Textiles, Ethnic Fashion, Accessories',
    annualImport: '$5M - $10M',
    tags: 'fashion, batik, sustainable',
    notes: 'Focused on sustainable and fair-trade products',
    isVerified: true,
    rating: 4.5,
    totalDeals: 25,
    viewCount: 100,
    likeCount: 38
  },

  // UK Buyers
  {
    productName: 'Rattan Furniture',
    productSpecs: 'Material: Natural Rattan\nStyle: Boho, Coastal, Modern\nItems: Chairs, Tables, Storage\nFinish: Natural/Painted',
    quantity: '40ft Container bi-monthly',
    shippingTerms: 'CIF',
    destinationPort: 'Felixstowe',
    paymentTerms: 'T/T',
    companyName: 'British Interiors Ltd',
    country: 'UK',
    city: 'London',
    address: '50 Oxford Street, London W1D 1BS',
    contactPerson: 'James Thompson',
    email: 'james@britishinteriors.co.uk',
    phone: '+44 20 7123 4567',
    website: 'https://britishinteriors.co.uk',
    businessType: 'Home Furnishings Retailer',
    productsInterest: 'Rattan Furniture, Wicker, Natural Home Decor',
    annualImport: '$8M - $15M',
    tags: 'rattan, home-decor, retail',
    notes: 'Supplies to major UK department stores',
    isVerified: true,
    rating: 4.7,
    totalDeals: 35,
    viewCount: 125,
    likeCount: 58
  },

  // India Buyers
  {
    productName: 'Coal (Thermal)',
    productSpecs: 'Type: Thermal Coal\nGCV: 5500-6000 kcal/kg\nAsh: Max 15%\nMoisture: Max 12%\nSize: 0-50mm',
    quantity: '50,000 MT monthly',
    shippingTerms: 'FOB',
    destinationPort: 'Mundra, Chennai',
    paymentTerms: 'L/C',
    companyName: 'Bharat Energy Resources Pvt Ltd',
    country: 'India',
    city: 'Mumbai',
    address: 'Nariman Point, Mumbai 400021',
    contactPerson: 'Rajesh Sharma',
    email: 'rajesh@bharatenergy.in',
    phone: '+91 22 6789 0123',
    website: 'https://bharatenergy.in',
    businessType: 'Energy Trader',
    productsInterest: 'Thermal Coal, Steam Coal, Petroleum Coke',
    annualImport: '$100M+',
    tags: 'coal, energy, bulk-commodity',
    notes: 'Supplies to power plants and industrial users',
    isVerified: true,
    rating: 4.3,
    totalDeals: 100,
    viewCount: 280,
    likeCount: 95
  },

  // South Korea Buyers
  {
    productName: 'Nickel Ore',
    productSpecs: 'Type: Laterite Nickel Ore\nNi Content: Min 1.5%\nFe Content: 15-25%\nMoisture: Max 35%',
    quantity: 'Panamax vessel monthly',
    shippingTerms: 'FOB',
    destinationPort: 'Pohang',
    paymentTerms: 'L/C',
    companyName: 'Korea Metal Industries Co., Ltd',
    country: 'South Korea',
    city: 'Seoul',
    address: '123 Teheran-ro, Gangnam-gu, Seoul 06141',
    contactPerson: 'Kim Sung-Ho',
    email: 'kimsh@koreamental.co.kr',
    phone: '+82 2 3456 7890',
    website: 'https://koreamental.co.kr',
    businessType: 'Metal Processor',
    productsInterest: 'Nickel Ore, Ferronickel, Stainless Steel Materials',
    annualImport: '$200M+',
    tags: 'mining, nickel, industrial',
    notes: 'Long-term supply agreements preferred',
    isVerified: true,
    rating: 4.6,
    totalDeals: 45,
    viewCount: 160,
    likeCount: 70
  },

  // Malaysia Buyers (Re-exporter)
  {
    productName: 'Plywood',
    productSpecs: 'Type: Commercial Plywood\nCore: Hardwood\nThickness: 9mm, 12mm, 18mm\nGrade: BB/CC\nSize: 1220x2440mm',
    quantity: '20 Containers monthly',
    shippingTerms: 'FOB',
    destinationPort: 'Port Klang',
    paymentTerms: 'T/T',
    companyName: 'Mega Timber Trading Sdn Bhd',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    address: 'Menara KL, Jalan Sultan Ismail, 50250 KL',
    contactPerson: 'Tan Ah Kow',
    email: 'ahkow@megatimber.com.my',
    phone: '+60 3 2345 6789',
    website: 'https://megatimber.com.my',
    businessType: 'Timber Trader',
    productsInterest: 'Plywood, MDF, Particle Board, Veneer',
    annualImport: '$25M - $40M',
    tags: 'timber, plywood, wood-products',
    notes: 'Re-exports to Middle East and Africa',
    isVerified: true,
    rating: 4.4,
    totalDeals: 70,
    viewCount: 145,
    likeCount: 52
  },

  // Not Verified Examples
  {
    productName: 'Cassava Chips',
    productSpecs: 'Type: Dried Cassava Chips\nMoisture: Max 14%\nStarch: Min 65%\nPacking: Jumbo Bags 1MT',
    quantity: '500 MT monthly',
    shippingTerms: 'FOB',
    destinationPort: 'Ho Chi Minh City',
    paymentTerms: 'T/T',
    companyName: 'Vietnam Animal Feed Co., Ltd',
    country: 'Vietnam',
    city: 'Ho Chi Minh City',
    address: '100 Le Loi Street, District 1, HCMC',
    contactPerson: 'Nguyen Van Minh',
    email: 'minh@vnfeed.vn',
    phone: '+84 28 1234 5678',
    businessType: 'Feed Manufacturer',
    productsInterest: 'Cassava, Corn, Soybean Meal',
    annualImport: '$5M - $10M',
    tags: 'animal-feed, cassava',
    notes: 'New inquiry - verification pending',
    isVerified: false,
    rating: 0,
    totalDeals: 0,
    viewCount: 25,
    likeCount: 5
  },
  {
    productName: 'Activated Carbon',
    productSpecs: 'Type: Coconut Shell Activated Carbon\nMesh Size: 8x30, 12x40\nIodine Number: Min 1000mg/g\nMoisture: Max 5%',
    quantity: '20MT per shipment',
    shippingTerms: 'CIF',
    destinationPort: 'Los Angeles',
    paymentTerms: 'T/T',
    companyName: 'Clean Water Solutions Inc',
    country: 'USA',
    city: 'Phoenix',
    address: '500 Industrial Park, Phoenix AZ 85001',
    contactPerson: 'Robert Johnson',
    email: 'robert@cleanwatersolutions.com',
    phone: '+1 602 555 4321',
    businessType: 'Water Treatment',
    productsInterest: 'Activated Carbon, Filter Media',
    annualImport: '$2M - $5M',
    tags: 'water-treatment, activated-carbon',
    notes: 'New inquiry - verification in progress',
    isVerified: false,
    rating: 0,
    totalDeals: 0,
    viewCount: 15,
    likeCount: 3
  }
];

async function seedBuyers() {
  console.log('🌱 Starting to seed sample buyers...\n');

  try {
    // Check if buyers already exist
    const existingCount = await prisma.buyer.count();
    if (existingCount > 0) {
      console.log(`⚠️  Database already has ${existingCount} buyers.`);
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('Do you want to add more sample buyers? (y/n): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        return;
      }
    }

    // Get admin user for addedBy
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const buyer of sampleBuyers) {
      // Check if company already exists
      const existing = await prisma.buyer.findFirst({
        where: { companyName: buyer.companyName }
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${buyer.companyName} (already exists)`);
        skipped++;
        continue;
      }

      await prisma.buyer.create({
        data: {
          ...buyer,
          addedBy: adminUser.id
        }
      });
      console.log(`✅ Created: ${buyer.companyName} (${buyer.country})`);
      created++;
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`   Created: ${created} buyers`);
    console.log(`   Skipped: ${skipped} buyers (already existed)`);

    // Show summary
    const totalBuyers = await prisma.buyer.count();
    const verifiedBuyers = await prisma.buyer.count({ where: { isVerified: true } });
    const countries = await prisma.buyer.groupBy({ by: ['country'], _count: true });

    console.log(`\n📊 Database Summary:`);
    console.log(`   Total Buyers: ${totalBuyers}`);
    console.log(`   Verified: ${verifiedBuyers}`);
    console.log(`   Countries: ${countries.length}`);
    console.log(`\n🔗 Access buyers at: /admin/databases/buyers (admin)`);
    console.log(`   Member view at: /databases/buyers`);

  } catch (error) {
    console.error('❌ Error seeding buyers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBuyers();
