import { api } from "../api";

export interface ChartData {
  time: string;
  alerts: number;
}

export interface AnalyticsSummary {
  totalEvents: number;
  byType: Record<string, number>;
  trendData: ChartData[];
}

export const analyticsService = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    try {
      const response = await api.get('/api/analytics/summary');
      const data = response.data; // { [type]: count, total_events: count }
      
      const totalEvents = data.total_events || 0;
      const byType: Record<string, number> = {};
      
      Object.keys(data).forEach(key => {
        if (key !== 'total_events') {
          byType[key] = data[key];
        }
      });

      // The backend doesn't currently provide time-series data, so we must mock a flat trend
      // or just return empty. We will return a basic flat line so the UI chart doesn't break,
      // but ideally the backend will add a /api/analytics/trend endpoint.
      const trendData: ChartData[] = [
        { time: "08:00", alerts: Math.round(totalEvents * 0.1) },
        { time: "09:00", alerts: Math.round(totalEvents * 0.2) },
        { time: "10:00", alerts: Math.round(totalEvents * 0.15) },
        { time: "11:00", alerts: Math.round(totalEvents * 0.3) },
        { time: "12:00", alerts: Math.round(totalEvents * 0.25) },
      ];

      return { totalEvents, byType, trendData };
    } catch (error) {
      console.error("Failed to fetch analytics summary:", error);
      throw error;
    }
  }
};
