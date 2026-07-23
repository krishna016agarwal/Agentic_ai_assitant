import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

export async function sendMessage(thread_id, query) {
  const response = await api.post("/chat", {
    thread_id,
    query,
  });
  return response.data;
}

export async function getVoiceToken(room_name = "banking-assistant", participant_name = "user") {
  const response = await api.post("/voice/token", {
    room_name,
    participant_name,
  });
  return response.data; // { url, token }
}