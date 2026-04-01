const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
});

interface AlertFilters {
  camera_id?: string;
  date_from?: string;
  date_to?: string;
}

export const getAlertsApi = async (token: string, filters?: AlertFilters) => {
  const params = new URLSearchParams();

  if (filters?.camera_id) params.append("camera_id", filters.camera_id);
  if (filters?.date_from)
    params.append("date_from", new Date(filters.date_from).toISOString());
  if (filters?.date_to)
    params.append("date_to", new Date(filters.date_to).toISOString());

  const queryString = params.toString();
  const url = queryString
    ? `${API_URL}/alerts?${queryString}`
    : `${API_URL}/alerts`;

  const res = await fetch(url, { headers: getHeaders(token) });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Error al obtener las alertas");

  return res.json();
};

export const deleteAlertApi = async (token: string, id: string) => {
  const res = await fetch(`${API_URL}/alerts/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });

  if (!res.ok) throw new Error("Error al eliminar la alerta");
  return true;
};

export const getImageUrl = (evidencePath: string) => {
  return `${API_URL}${evidencePath}`;
};
