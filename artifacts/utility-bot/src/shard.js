import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding';

import { config } from '#config/config';
import { logger } from '#utils/logger';
import './healthcheck.js';

// ── Startup validation ────────────────────────────────────────────────────────
if (!config.token) {
  logger.error('ClusterManager', '❌ TOKEN environment variable is not set. Cannot start.');
  process.exit(1);
}

if (!config.clientId) {
  logger.warn('ClusterManager', '⚠️  CLIENT_ID is not set — slash command registration will be skipped.');
}

logger.info('ClusterManager', `✅ TOKEN present (${config.token.slice(0, 8)}...), CLIENT_ID: ${config.clientId ? 'set' : 'NOT SET'}`);
logger.info('ClusterManager', `Sharding mode: ${config.sharding.totalShards}, clusters per shard: ${config.sharding.shardsPerCluster}`);

// ─────────────────────────────────────────────────────────────────────────────

const manager = new ClusterManager('./src/index.js', {
  totalShards: config.sharding.totalShards,
  shardsPerCluster: config.sharding.shardsPerCluster,
  mode: 'process',
  token: config.token,
  respawn: true,
  restartMode: 'gracefulSwitch',
});

manager.extend(
  new HeartbeatManager({
    interval: 2000,
    maxMissedHeartbeats: 5,
  }),
);

manager.on('clusterCreate', cluster => {
  logger.info('ClusterManager', ` ==> Launched Cluster ${cluster.id} [${cluster.shardList.join(', ')}]`);
  cluster.on('clientReady', () =>
    logger.success('ClusterManager', `Cluster ${cluster.id} ==> Ready ✅`),
  );
  cluster.on('reconnecting', () =>
    logger.warn('ClusterManager', `Cluster ${cluster.id} ==> Reconnecting...`),
  );
  cluster.on('death', (p, code) =>
    logger.error('ClusterManager', `Cluster ${cluster.id} ==> Died with exit code ${code}. Respawning...`),
  );
  cluster.on('error', e =>
    logger.error('ClusterManager', `Cluster ${cluster.id} ==> An error occurred:`, e),
  );
});

manager.on('debug', msg => {
  if (!msg.includes('Heartbeat')) {
    logger.debug('ClusterManager', msg);
  }
});

const shutdown = () => {
  logger.info('ClusterManager', ' ==> Shutting down all clusters...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

manager
  .spawn({ timeout: -1 })
  .then(() =>
    logger.success('ClusterManager', ' ==> All clusters are loaded and bot is ready! 🚀'),
  )
  .catch(error => {
    logger.error('ClusterManager', ' ==> Fatal error during spawn — exiting so the process restarts:', error);
    process.exit(1);
  });
