import axios from 'axios';

export class ByteConnectStatsService {
  private readonly cloudApiUrl: string;
  private readonly questsApiUrl: string;
  private gatewayId: number | null = null;

  constructor() {
    this.cloudApiUrl = process.env.AYDO_CLOUD_URL || 'http://localhost:3000';
    this.questsApiUrl = process.env.AYDO_QUESTS_URL || 'http://localhost:3002';
  }

  setGatewayId(gatewayId: number): void {
    this.gatewayId = gatewayId;
  }

  async recordTrafficReward(hoursRunning: number, bytesTransferred: number): Promise<void> {
    try {
      const mbTransferred = bytesTransferred / (1024 * 1024);
      
      const rewardData = {
        gatewayId: this.gatewayId,
        plugin: 'byteconnect',
        type: 'traffic',
        hoursRunning,
        mbTransferred,
        timestamp: new Date().toISOString()
      };

      console.log(`[ByteConnectStats] Recording traffic reward:`, rewardData);

      if (this.gatewayId) {
        await this.sendToQuestsService(rewardData);
      } else {
        console.log('[ByteConnectStats] Gateway ID not set, skipping reward');
      }
    } catch (error) {
      console.error('[ByteConnectStats] Error recording traffic reward:', error);
    }
  }

  async sendToQuestsService(rewardData: any): Promise<void> {
    try {
      await axios.post(`${this.questsApiUrl}/byteconnect/traffic`, rewardData);
      console.log('[ByteConnectStats] Traffic report sent to quests service');
    } catch (error) {
      console.log('[ByteConnectStats] Could not send to quests service, trying cloud API');
      await this.sendRewardNotification(rewardData);
    }
  }

  async sendRewardNotification(rewardData: any): Promise<void> {
    try {
      await axios.post(`${this.cloudApiUrl}/api/rewards/traffic`, rewardData);
      console.log('[ByteConnectStats] Reward notification sent to cloud');
    } catch (error) {
      console.log('[ByteConnectStats] Could not send reward notification (services may be offline)');
    }
  }

  async getTrafficStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.cloudApiUrl}/api/stats/byteconnect`);
      return response.data;
    } catch (error) {
      console.error('[ByteConnectStats] Error fetching traffic stats:', error);
      return null;
    }
  }
}
