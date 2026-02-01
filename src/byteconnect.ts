import {baseDriverModule} from '../core/base-driver-module';
import {inspect} from 'util';
import {ByteConnectStatsService} from './services/byteconnect-stats.service';

const os = require('os');
const path = require('path');
const fs = require('fs');

const byteconnectDir = path.join(os.homedir(), '.aydo', 'server', 'plugins').replace(/\\/g, '/');;

let aydoByteConnectProcess: any;

class ByteConnect extends baseDriverModule {
  byteconnectDir = byteconnectDir;
  binaryName = 'byteconnect';
  
  trafficMonitorInterval: NodeJS.Timeout | null = null;
  statsService: ByteConnectStatsService;
  
  totalBytesTransferred = 0;
  sessionStartTime: number | null = null;
  lastTrafficCheck: number = 0;

  installDeviceEx(resolve, reject) {
    const platform = os.platform();

    if (platform !== 'linux') {
      this.app.log('ByteConnect SDK only supports Ubuntu Linux');
      return reject(new Error('ByteConnect SDK only supports Ubuntu Linux'));
    }

    // Проверяем наличие бинарника прямо в текущей папке
    const binaryPath = path.join(this.byteconnectDir, this.binaryName);

    if (fs.existsSync(binaryPath)) {
      this.app.log('ByteConnect binary found in plugin directory');
      return resolve({});
    }

    super.installDeviceEx(() => {
      this.app.log('ByteConnect binary not found!');
      this.app.log(`Please place the '${this.binaryName}' binary into: ${this.byteconnectDir}`);
      this.app.log('The SDK is provided as a static binary for Ubuntu Linux');

      resolve({});
    }, reject);
  }

  initDeviceEx(resolve, reject) {
    this.log('initDeviceEx-try');

    const binaryPath = path.join(this.byteconnectDir, this.binaryName);

    if (!fs.existsSync(binaryPath)) {
      this.app.log('ByteConnect binary not found');
      this.app.log(`Please copy the binary to: ${this.byteconnectDir}/${this.binaryName}`);
      return resolve({});
    }

    try {
      fs.chmodSync(binaryPath, '755');
    } catch (e) {
      this.app.log(`Warning: Could not set executable permissions: ${e.message}`);
    }

    super.initDeviceEx(() => {
      this.statsService = new ByteConnectStatsService();
      
      if (this.params && this.params.gateway_id) {
        this.statsService.setGatewayId(this.params.gateway_id);
      }
      
      this.startService();

      if (this.checkRun() === false) {
        this.app.log('ByteConnect not running');
      }

      this.trafficMonitorInterval = setInterval(() => {
        this.monitorTrafficAndReward();
      }, 60_000);

      resolve({});
    }, reject);
  }

  startService(): void {
    this.app.log('ByteConnect starting from local directory...');

    const {spawn} = require('child_process');
    const binaryPath = path.join(this.byteconnectDir, this.binaryName);

    const env = {
      ...process.env,
      DAEMONIZE: '1',
      PUBLISHER_ID: 'AYDO'
    };

    aydoByteConnectProcess = spawn(
        binaryPath,
        [],
        {
          shell: true,
          env: env,
          cwd: this.byteconnectDir // Запуск из текущей папки
        }
    );

    this.sessionStartTime = Date.now();
    this.totalBytesTransferred = 0;

    if (this.logging) {
      this.app.log('ByteConnect process spawned');
    }

    aydoByteConnectProcess.stdout.on('data', (data: any) => {
      console.log(`BYTECONNECT: ${data}`);
      this.parseTrafficData(data.toString());
    });

    aydoByteConnectProcess.stderr.on('data', (data: any) => {
      console.error(`BYTECONNECT ERR: ${data}`);
    });

    aydoByteConnectProcess.on('close', (code: any) => {
      console.log(`BYTECONNECT: exited with code ${code}`);
      this.sessionStartTime = null;
    });
  }

  parseTrafficData(output: string): void {
    const bytesMatch = output.match(/bytes[:\s]+(\d+)/i);
    if (bytesMatch) {
      const bytes = parseInt(bytesMatch[1], 10);
      if (!isNaN(bytes)) {
        this.totalBytesTransferred += bytes;
      }
    }
  }

  async monitorTrafficAndReward(): Promise<void> {
    try {
      const currentTime = Date.now();
      const timeSinceLastCheck = currentTime - this.lastTrafficCheck;
      
      if (this.sessionStartTime && this.isServiceRunning()) {
        const sessionDuration = currentTime - this.sessionStartTime;
        const hoursRunning = Math.floor(sessionDuration / (60 * 60 * 1000));
        
        const stats = {
          sessionDuration,
          hoursRunning,
          totalBytesTransferred: this.totalBytesTransferred,
          isRunning: true
        };

        console.log(`[monitor] ByteConnect stats:`, stats);

        if (hoursRunning > 0 && timeSinceLastCheck >= 60 * 60 * 1000) {
          this.lastTrafficCheck = currentTime;
          await this.statsService.recordTrafficReward(hoursRunning, this.totalBytesTransferred);
        }
      }
    } catch (err) {
      console.error('[monitor] Error in monitorTrafficAndReward:', err);
    }
  }

  isServiceRunning(): boolean {
    return aydoByteConnectProcess && !aydoByteConnectProcess.killed;
  }

  private isShuttingDown = false;

  stopService(): void {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;
    
    this.app.log('Stopping ByteConnect service...');
    
    if (this.trafficMonitorInterval) {
      clearInterval(this.trafficMonitorInterval);
      this.trafficMonitorInterval = null;
    }

    if (aydoByteConnectProcess) {
      aydoByteConnectProcess.kill('SIGTERM');
    }

    const {execSync} = require('child_process');
    try {
      execSync(`pkill -f "${this.binaryName}"`, {stdio: 'ignore'});
    } catch (e) {
    }

    this.sessionStartTime = null;
    this.app.log('ByteConnect service stopped');
  }

  checkRun() {
    const ps = require('ps-node');

    ps.lookup({
      command: `${this.byteconnectDir}/${this.binaryName}`,
      psargs: ''
    }, function (err, resultList) {
      if (err) {
        throw new Error(err);
      }

      resultList.forEach(function (process) {
        if (process && process.command === `${this.byteconnectDir}/${this.binaryName}`) {
          return true;
        }
      });
    });

    return false;
  }

  connectEx(resolve, reject) {
    const status: any = {connected: true};

    this.capabilities = [];

    this.capabilities.push({ident: 'status', index: 1, display_name: 'Status'});
    this.capabilities.push({ident: 'traffic', index: 2, display_name: 'Traffic'});
    this.capabilities.push({ident: 'uptime', index: 3, display_name: 'Uptime'});

    this.counter = 0;
    status.capabilities = this.capabilities;
    this.publish(this.eventTypeStatus(this.pluginTemplate.class_name, `${this.id}`), status);

    this.getDevices().then(devices => {
      this.app.log(devices);
    });

    setInterval(() => {
      this.commandEx('status', null, null, null, () => {
      }, () => {
      }, null);
    }, 15000);

    resolve({});
  }

  commandEx(command, value, params, options, resolve, reject, status) {
    const update = () => {
      (async () => {
        const isRunning = this.isServiceRunning();
        const uptimeHours = this.sessionStartTime 
          ? Math.floor((Date.now() - this.sessionStartTime) / (60 * 60 * 1000)) 
          : 0;
        const trafficMB = Math.round(this.totalBytesTransferred / (1024 * 1024) * 100) / 100;

        const statusObj: any = {
          connected: true,
          status_1: isRunning ? 'Online' : 'Offline',
          traffic_2: `${trafficMB} MB`,
          uptime_3: `${uptimeHours}h`,
        };
        this.publish(this.eventTypeStatus(this.pluginTemplate.class_name, `${this.id}`), statusObj);
      })();
    }

    switch (command) {
      case 'status':
        this.index++;
        this.counter++;
        update()
        resolve({});
        break;
      case 'start':
        if (!this.isServiceRunning()) {
          this.startService();
        }
        update();
        resolve({});
        break;
      case 'stop':
        if (aydoByteConnectProcess) {
          aydoByteConnectProcess.kill('SIGTERM');
        }
        update();
        resolve({});
        break;
      default:
        this.currentStatus[command] = value;
        update()
        resolve({});
    }
  }

  async getServiceStatus() {
    return this.isServiceRunning() ? 'Online' : 'Offline';
  }
}

const app = new ByteConnect();
app.logging = true;

const shutdown = (signal: string) => {
  console.log(`${signal} signal received. Terminating all processes.`);
  app.stopService();
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('exit', () => {
  app.stopService();
});

process.on('uncaughtException', (err) => {
  console.error(`${err ? err.message : inspect(err)}`);
  app.stopService();
});

