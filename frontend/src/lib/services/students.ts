import { api } from "../api";

export interface StudentData {
  id: string;
  event_count: number;
  risk_score: number;
  status: string;
}

export const studentsService = {
  getStudents: async (): Promise<StudentData[]> => {
    try {
      const response = await api.get('/api/students/');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch students:", error);
      throw error;
    }
  }
};
