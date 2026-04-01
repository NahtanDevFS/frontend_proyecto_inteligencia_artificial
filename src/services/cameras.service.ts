const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const getHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
});

export const getCamerasApi = async (token: string) => {
  const res = await fetch(`${API_URL}/cameras`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Error al obtener la lista de cámaras");

  return res.json();
};

export const createCameraApi = async (
  token: string,
  data: { location_name: string; stream_url: string; status: string },
) => {
  const res = await fetch(`${API_URL}/cameras`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error al crear la cámara");
  return res.json();
};

export const updateCameraApi = async (
  token: string,
  id: string,
  data: { location_name: string; stream_url: string },
) => {
  const res = await fetch(`${API_URL}/cameras/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error al actualizar la cámara");
  return res.json();
};

export const deleteCameraApi = async (token: string, id: string) => {
  const res = await fetch(`${API_URL}/cameras/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!res.ok) throw new Error("Error al eliminar la cámara");
  return true;
};
