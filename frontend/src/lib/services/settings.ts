import { api } from "../api";

export interface SystemConfigData {
  id?: number;
  confidence_threshold: number;
  phone_detection_sensitivity: number;
  head_movement_sensitivity: number;
  enable_object_detection: boolean;
  enable_continuous_tracking: boolean;
  enable_audio_monitoring: boolean;
}

export const settingsService = {
  getSettings: async (): Promise<SystemConfigData> => {
    try {
      const response = await api.get('/api/settings/');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      throw error;
    }
  },
  
  updateSettings: async (settings: Partial<SystemConfigData>): Promise<SystemConfigData> => {
    try {
      const response = await api.patch('/api/settings/', settings);
      return response.data;
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  }
};
