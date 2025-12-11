// Vercel Free Tier Capacity Calculator
// Based on Eksporyuk current data

const calculations = {
  // Asumsi traffic per hari
  dailyUsers: 1000,
  pageViewsPerUser: 20,
  
  // Kalkulasi bandwidth
  get totalPageViews() {
    return this.dailyUsers * this.pageViewsPerUser * 30; // per bulan
  },
  
  get bandwidth() {
    // Realistic: Vercel CDN cache 80-90% requests
    const avgPageSize = 75; // KB (after CDN cache, compression, static assets cached)
    const cacheHitRate = 0.85; // 85% served from CDN (tidak hit server)
    const effectivePageViews = this.totalPageViews * (1 - cacheHitRate);
    const totalKB = effectivePageViews * avgPageSize;
    return {
      kb: totalKB,
      mb: Math.round(totalKB / 1024),
      gb: Math.round(totalKB / 1024 / 1024 * 10) / 10
    };
  },
  
  // Kalkulasi function execution
  get functionExecutions() {
    // Not all pages hit API (static pages cached)
    const pagesWithAPI = 0.3; // 30% pages hit API (dashboard, profile, etc)
    const apiCallsPerPageView = 2; // average API calls per dynamic page
    const totalCalls = this.totalPageViews * pagesWithAPI * apiCallsPerPageView;
    const avgDuration = 150; // ms per call (optimized with Prisma pooling)
    const totalMs = totalCalls * avgDuration;
    return {
      calls: totalCalls,
      totalMs: totalMs,
      hours: Math.round(totalMs / 1000 / 3600 * 10) / 10
    };
  },
  
  // Vercel Free limits
  limits: {
    bandwidth: 100, // GB
    functionHours: 100,
  },
  
  // Apakah cukup?
  get isSufficient() {
    return {
      bandwidth: this.bandwidth.gb < this.limits.bandwidth,
      functions: this.functionExecutions.hours < this.limits.functionHours,
    };
  },
  
  // Sisa kapasitas
  get remaining() {
    return {
      bandwidth: `${this.limits.bandwidth - this.bandwidth.gb} GB`,
      functions: `${this.limits.functionHours - this.functionExecutions.hours} hours`,
      bandwidthPercent: Math.round((1 - this.bandwidth.gb / this.limits.bandwidth) * 100),
      functionsPercent: Math.round((1 - this.functionExecutions.hours / this.limits.functionHours) * 100),
    };
  }
};

console.log('\n📊 VERCEL FREE TIER CAPACITY CHECK\n');
console.log('Asumsi Traffic:');
console.log('- Daily users:', calculations.dailyUsers);
console.log('- Page views/user:', calculations.pageViewsPerUser);
console.log('- Total page views/bulan:', calculations.totalPageViews.toLocaleString());

console.log('\n📡 Bandwidth Usage:');
console.log('- Used:', calculations.bandwidth.gb, 'GB');
console.log('- Limit:', calculations.limits.bandwidth, 'GB');
console.log('- Remaining:', calculations.remaining.bandwidth);
console.log('- Status:', calculations.isSufficient.bandwidth ? '✅ CUKUP' : '❌ KURANG');
console.log('- Free capacity:', calculations.remaining.bandwidthPercent + '%');

console.log('\n⚡ Function Execution:');
console.log('- Used:', calculations.functionExecutions.hours, 'hours');
console.log('- Limit:', calculations.limits.functionHours, 'hours');
console.log('- Remaining:', calculations.remaining.functions);
console.log('- Status:', calculations.isSufficient.functions ? '✅ CUKUP' : '❌ KURANG');
console.log('- Free capacity:', calculations.remaining.functionsPercent + '%');

console.log('\n🎯 CAPACITY FOR HIGHER TRAFFIC:\n');

// Test dengan traffic lebih tinggi
const scenarios = [
  { users: 2000, label: '2K users/hari' },
  { users: 5000, label: '5K users/hari' },
  { users: 10000, label: '10K users/hari' },
];

scenarios.forEach(scenario => {
  const bandwidth = (scenario.users * 20 * 30 * 75 * 0.15) / 1024 / 1024; // with CDN cache
  const functions = (scenario.users * 20 * 30 * 0.3 * 2 * 150) / 1000 / 3600;
  
  console.log(`${scenario.label}:`);
  console.log(`  Bandwidth: ${Math.round(bandwidth * 10) / 10} GB ${bandwidth < 100 ? '✅' : '❌'}`);
  console.log(`  Functions: ${Math.round(functions * 10) / 10} hrs ${functions < 100 ? '✅' : '⚠️'}`);
});

console.log('\n💡 Recommendation:');
if (calculations.isSufficient.bandwidth && calculations.isSufficient.functions) {
  console.log('✅ Vercel Free tier lebih dari cukup untuk traffic saat ini');
  console.log('✅ Masih ada headroom untuk growth 2-3x lipat');
} else {
  console.log('⚠️ Perlu upgrade ke Vercel Pro ($20/bulan)');
}
