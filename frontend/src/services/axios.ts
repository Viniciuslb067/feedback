import axios from "axios";
import { parseCookies } from "nookies";

export function getAPIClient(ctx?: any) {
  const { "feedback.token": token } = parseCookies(ctx);

  const api = axios.create({
    baseURL: "https://10.120.49.181:3001",
  });

  if (token) {
    api.defaults.headers["Authorization"] = `Bearer ${token}`;
  }
  
  return api;
}
