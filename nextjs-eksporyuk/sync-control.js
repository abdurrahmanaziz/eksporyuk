#!/usr/bin/env node

const readline = require('readline');
const { realTimeService } = require('./real-time-sejoli-service.js');

// 🎮 INTERACTIVE CONTROL CENTER
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
🔥 EKSPORYUK SEJOLI REAL-TIME SYNC CONTROL CENTER
================================================

Commands:
  start       - Start real-time sync service
  stop        - Stop real-time sync service  
  status      - Show current status
  sync        - Force sync now
  metrics     - Show detailed metrics
  config      - Update configuration
  test        - Test connections
  logs        - Show recent error logs
  exit        - Exit control center

`);

// 🎯 COMMAND HANDLER
async function handleCommand(command) {
  const args = command.trim().split(' ');
  const cmd = args[0].toLowerCase();
  
  try {
    switch (cmd) {
      case 'start':
        console.log('🚀 Starting service...');
        const startResult = await realTimeService.start();
        console.log(startResult.success ? 
          `✅ ${startResult.message}` : 
          `❌ ${startResult.error || startResult.message}`);
        break;
        
      case 'stop':
        console.log('⏹️  Stopping service...');
        const stopResult = await realTimeService.stop();
        console.log(`✅ ${stopResult.message}`);
        console.log(`   Total syncs: ${stopResult.totalSyncs}`);
        console.log(`   Last sync: ${stopResult.lastSync || 'Never'}`);
        break;
        
      case 'status':
        const status = realTimeService.getStatus();
        console.log('\n📊 SERVICE STATUS:');
        console.log(`   Running: ${status.isRunning ? '✅ YES' : '❌ NO'}`);
        console.log(`   Last sync: ${status.lastSync || 'Never'}`);
        console.log(`   Total syncs: ${status.totalSyncs}`);
        console.log(`   Interval: ${status.intervalMinutes} minutes`);
        console.log(`   Next sync: ${status.nextSync || 'N/A'}`);
        console.log(`   Recent errors: ${status.recentErrors.length}`);
        break;
        
      case 'sync':
        console.log('🔄 Force syncing now...');
        const syncResult = await realTimeService.forceSyncNow();
        console.log('✅ Force sync completed:', {
          processed: syncResult.processed,
          added: syncResult.added,
          updated: syncResult.updated,
          errors: syncResult.errors
        });
        break;
        
      case 'metrics':
        console.log('📈 Loading metrics...');
        const metrics = await realTimeService.getMetrics();
        console.log('\n📊 DETAILED METRICS:');
        console.log('   SERVICE:');
        console.log(`     Running: ${metrics.service.isRunning}`);
        console.log(`     Uptime: ${Math.round(metrics.service.uptime / 1000 / 60)} minutes`);
        console.log(`     Total syncs: ${metrics.service.totalSyncs}`);
        console.log(`     Error rate: ${(metrics.service.errorRate * 100).toFixed(2)}%`);
        console.log('   DATABASE:');
        console.log(`     Transactions: ${metrics.database.transactions.toLocaleString()}`);
        console.log(`     Conversions: ${metrics.database.conversions.toLocaleString()}`);
        console.log(`     Affiliates: ${metrics.database.affiliates.toLocaleString()}`);
        console.log('   SYNC:');
        console.log(`     Last sync: ${metrics.sync.lastSync || 'Never'}`);
        console.log(`     Interval: ${metrics.sync.intervalMinutes} minutes`);
        console.log(`     Next sync: ${metrics.sync.nextSync || 'N/A'}`);
        break;
        
      case 'config':
        console.log('\n⚙️  CURRENT CONFIG:');
        const currentConfig = realTimeService.getStatus().config;
        console.log(`   Interval: ${currentConfig.intervalMinutes} minutes`);
        console.log(`   Batch size: ${currentConfig.batchSize}`);
        console.log(`   Retry attempts: ${currentConfig.retryAttempts}`);
        console.log(`   Safeguards: ${Object.entries(currentConfig.safeguards)
          .map(([k,v]) => `${k}=${v}`).join(', ')}`);
        
        console.log('\nTo update, use: config interval=60 or config batchSize=100');
        
        if (args.length > 1) {
          const updates = {};
          args.slice(1).forEach(arg => {
            const [key, value] = arg.split('=');
            if (key && value) {
              updates[key] = isNaN(value) ? value : Number(value);
            }
          });
          
          if (Object.keys(updates).length > 0) {
            realTimeService.updateConfig(updates);
            console.log('✅ Config updated:', updates);
          }
        }
        break;
        
      case 'test':
        console.log('🔗 Testing connections...');
        try {
          await realTimeService.testConnections();
          console.log('✅ All connections OK');
        } catch (error) {
          console.log('❌ Connection test failed:', error.message);
        }
        break;
        
      case 'logs':
        const statusWithLogs = realTimeService.getStatus();
        console.log('\n📋 RECENT ERROR LOGS:');
        if (statusWithLogs.recentErrors.length === 0) {
          console.log('   No recent errors ✅');
        } else {
          statusWithLogs.recentErrors.forEach((error, i) => {
            console.log(`   ${i+1}. [${error.timestamp.toLocaleString()}] ${error.error}`);
            console.log(`      Sync: ${error.syncId}, Duration: ${error.duration}ms`);
          });
        }
        break;
        
      case 'exit':
        console.log('👋 Stopping service and exiting...');
        await realTimeService.stop();
        rl.close();
        process.exit(0);
        break;
        
      case 'help':
        console.log(`
Available commands:
  start       - Start real-time sync service
  stop        - Stop real-time sync service  
  status      - Show current status
  sync        - Force sync now
  metrics     - Show detailed metrics
  config      - Update configuration
  test        - Test connections
  logs        - Show recent error logs
  exit        - Exit control center
        `);
        break;
        
      default:
        console.log(`❌ Unknown command: ${cmd}`);
        console.log('Type "help" for available commands');
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
  }
  
  console.log(''); // Empty line
  promptUser();
}

// 💬 PROMPT USER
function promptUser() {
  rl.question('Eksporyuk Sync > ', handleCommand);
}

// 🎯 ERROR HANDLING
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  promptUser();
});

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await realTimeService.stop();
  rl.close();
  process.exit(0);
});

// 🚀 START CONTROL CENTER
console.log('Ready! Type "start" to begin or "help" for commands.');
promptUser();