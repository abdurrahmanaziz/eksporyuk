const sejoliData = require('./sejoli-sales-1766146821365.json')

const withAff = sejoliData.filter(s => s.affiliate_id && s.affiliate_id !== '0').length
const noAff = sejoliData.filter(s => !s.affiliate_id || s.affiliate_id === '0').length

console.log('Sejoli data analysis:')
console.log('  Total orders:', sejoliData.length)
console.log('  With affiliate:', withAff, `(${((withAff/sejoliData.length)*100).toFixed(1)}%)`)
console.log('  No affiliate:', noAff, `(${((noAff/sejoliData.length)*100).toFixed(1)}%)`)
