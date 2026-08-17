module.exports = {
  apps: [
    {
      name: 'sgf-api',
      script: 'dist/server.cjs',
      cwd: '/var/www/analitico',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=1536',
        PORT: 3000
      },
      out_file: '/var/log/sgf-api-out.log',
      error_file: '/var/log/sgf-api-error.log',
      merge_logs: true,
      time: true,
      exp_backoff_restart_delay: 500,
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
    {
      name: 'sgf-worker',
      script: 'dist/server-worker.cjs',
      cwd: '/var/www/analitico',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=1024',
      },
      out_file: '/var/log/sgf-worker-out.log',
      error_file: '/var/log/sgf-worker-error.log',
      merge_logs: true,
      time: true,
      exp_backoff_restart_delay: 500,
      max_restarts: 10,
      restart_delay: 5000,
    }
  ]
};
