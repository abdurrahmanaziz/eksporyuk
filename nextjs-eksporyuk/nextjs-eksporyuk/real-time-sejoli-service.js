const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🔄 REAL-TIME SEJOLI SYNC SERVICE
class RealTimeSejoliService {
  constructor() {
    this.syncInterval = null;
    this.isRunning = false;
    this.config = {
      intervalMinutes: 30, // Sync every 30 minutes
      batchSize: 50,
      retryAttempts: 3,
      retryDelay: 5000,
      safeguards: {
        deleteProtection: true,
        backupBeforeSync: true,
        upsertOnly: true,
        dataValidation: true,
        transactionSafety: true,
        duplicateProtection: true
      }
    };
    this.lastSync = null;
    this.syncCount = 0;
    this.errorLog = [];
  }

  // 🚀 START REAL-TIME SERVICE
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Real-time Sejoli service already running');
      return { success: false, message: 'Service already running' };
    }

    try {
      // Validate environment
      await this.validateEnvironment();
      
      // Test connections
      await this.testConnections();
      
      // Start interval sync
      this.isRunning = true;
      console.log('🚀 Starting real-time Sejoli service...');
      
      // Run initial sync
      await this.performIncrementalSync();
      
      // Set up recurring sync
      this.syncInterval = setInterval(async () => {
        await this.performIncrementalSync();
      }, this.config.intervalMinutes * 60 * 1000);
      
      console.log(`✅ Real-time service started - syncing every ${this.config.intervalMinutes} minutes`);
      
      return {
        success: true,
        message: `Service started - syncing every ${this.config.intervalMinutes} minutes`,
        nextSync: new Date(Date.now() + this.config.intervalMinutes * 60 * 1000)
      };
      
    } catch (error) {
      console.error('❌ Failed to start real-time service:', error);
      this.isRunning = false;
      return { success: false, error: error.message };
    }
  }

  // ⏹️ STOP SERVICE
  async stop() {
    if (!this.isRunning) {
      return { success: false, message: 'Service not running' };
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isRunning = false;
    console.log('⏹️  Real-time Sejoli service stopped');
    
    return { 
      success: true, 
      message: 'Service stopped',
      totalSyncs: this.syncCount,
      lastSync: this.lastSync
    };
  }

  // 🔄 INCREMENTAL SYNC
  async performIncrementalSync() {
    if (!this.isRunning) {
      console.log('⚠️  Service not running - skipping sync');
      return;
    }

    const syncId = `sync_${Date.now()}`;
    const startTime = Date.now();
    
    console.log(`🔄 Starting incremental sync [${syncId}]...`);

    try {
      // Import safe sync class
      const { SafeSejoliSync } = require('./safe-sejoli-sync.js');
      const safeSync = new SafeSejoliSync();
      
      // Get last sync timestamp
      const lastSyncTime = this.lastSync || new Date(Date.now() - 24*60*60*1000);
      
      // Perform safe incremental sync
      const result = await safeSync.performIncrementalSync({
        since: lastSyncTime,
        batchSize: this.config.batchSize
      });
      
      const duration = Date.now() - startTime;
      this.syncCount++;
      this.lastSync = new Date();
      
      console.log(`✅ Incremental sync completed [${syncId}]:`, {
        duration: `${duration}ms`,
        processed: result.processed,
        added: result.added,
        updated: result.updated,
        errors: result.errors
      });
      
      // Log successful sync
      await this.logSync({
        syncId,
        type: 'incremental',
        status: 'success',
        duration,
        result
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Incremental sync failed [${syncId}]:`, error);
      
      // Add to error log
      this.errorLog.push({
        timestamp: new Date(),
        syncId,
        error: error.message,
        duration
      });
      
      // Keep only last 10 errors
      if (this.errorLog.length > 10) {
        this.errorLog = this.errorLog.slice(-10);
      }
      
      // Log failed sync
      await this.logSync({
        syncId,
        type: 'incremental',
        status: 'failed',
        duration,
        error: error.message
      });
      
      throw error;
    }
  }

  // ✅ VALIDATE ENVIRONMENT
  async validateEnvironment() {
    const required = [
      'SEJOLI_API_URL',
      'SEJOLI_API_USERNAME',
      'SEJOLI_API_PASSWORD'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ Environment validation passed');
  }

  // 🔗 TEST CONNECTIONS
  async testConnections() {
    // Test database
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection OK');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    // Test Sejoli API
    try {
      const axios = require('axios');
      const response = await axios.get(
        `${process.env.SEJOLI_API_URL}`,
        {
          auth: {
            username: process.env.SEJOLI_API_USERNAME,
            password: process.env.SEJOLI_API_PASSWORD
          },
          timeout: 10000
        }
      );
      
      if (response.status === 200) {
        console.log('✅ Sejoli API connection OK');
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Sejoli API connection failed: ${error.message}`);
    }
  }

  // 📊 GET STATUS
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      totalSyncs: this.syncCount,
      intervalMinutes: this.config.intervalMinutes,
      nextSync: this.isRunning ? 
        new Date(this.lastSync?.getTime() + this.config.intervalMinutes * 60 * 1000) : null,
      recentErrors: this.errorLog.slice(-5),
      config: this.config
    };
  }

  // ⚙️ UPDATE CONFIG
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart if interval changed and service is running
    if (this.isRunning && newConfig.intervalMinutes) {
      console.log(`🔄 Restarting service with new interval: ${newConfig.intervalMinutes} minutes`);
      this.stop().then(() => {
        setTimeout(() => this.start(), 1000);
      });
    }
    
    console.log('⚙️  Configuration updated:', newConfig);
  }

  // 📝 LOG SYNC
  async logSync(data) {
    try {
      // This could save to database or file
      console.log(`📝 Sync log [${data.syncId}]:`, {
        type: data.type,
        status: data.status,
        duration: `${data.duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Could save to sync_logs table:
      /*
      await prisma.syncLog.create({
        data: {
          syncId: data.syncId,
          type: data.type,
          status: data.status,
          duration: data.duration,
          result: data.result ? JSON.stringify(data.result) : null,
          error: data.error || null,
          timestamp: new Date()
        }
      });
      */
      
    } catch (error) {
      console.error('Failed to log sync:', error);
    }
  }

  // 🔄 FORCE SYNC NOW
  async forceSyncNow() {
    if (!this.isRunning) {
      throw new Error('Service not running');
    }
    
    console.log('🔄 Force sync requested...');
    return await this.performIncrementalSync();
  }

  // 📈 GET METRICS
  async getMetrics() {
    const dbStats = await Promise.all([
      prisma.transaction.count(),
      prisma.affiliateConversion.count(),
      prisma.affiliateProfile.count()
    ]);

    return {
      service: {
        isRunning: this.isRunning,
        uptime: this.isRunning ? Date.now() - (this.lastSync?.getTime() || Date.now()) : 0,
        totalSyncs: this.syncCount,
        errorRate: this.errorLog.length / Math.max(this.syncCount, 1)
      },
      database: {
        transactions: dbStats[0],
        conversions: dbStats[1],
        affiliates: dbStats[2]
      },
      sync: {
        lastSync: this.lastSync,
        intervalMinutes: this.config.intervalMinutes,
        nextSync: this.getStatus().nextSync
      }
    };
  }
}

// Export singleton instance
const realTimeService = new RealTimeSejoliService();

module.exports = { 
  RealTimeSejoliService,
  realTimeService
};

// 🚀 STANDALONE USAGE
if (require.main === module) {
  console.log('🔥 Starting Real-Time Sejoli Service...');
  
  realTimeService.start()
    .then(result => {
      console.log('Service result:', result);
      
      // Keep process alive
      process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping service...');
        await realTimeService.stop();
        process.exit(0);
      });
    })
    .catch(error => {
      console.error('Failed to start service:', error);
      process.exit(1);
    });
}