import { api } from "@/utils/axios";

export const startPracticeSession = async (payload: {
  user_role: string; user_details: string; level: string;
  context: string; topic_id?: string; custom_title?: string;
  custom_description?: string; flow_type?: string;
}) => {
  const { data } = await api.POST<{ session_id: string; room_url?: string }>("/sessions/start", payload);
  return data;
};

export const getSettings = async () => {
  const { data } = await api.GET<{ role?: string; experience?: string; level?: string }>("/user/settings");
  return data;
};
