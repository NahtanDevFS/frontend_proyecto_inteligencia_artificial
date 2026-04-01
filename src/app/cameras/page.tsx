"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Cameras.module.css";

interface Camera {
  id: string;
  location_name: string;
  stream_url: string | null;
  status: string;
}

export default function CamerasPage() {
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);

  const [newLocation, setNewLocation] = useState("");
  const [newStreamUrl, setNewStreamUrl] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState("");
  const [editStreamUrl, setEditStreamUrl] = useState("");

  const getToken = () => localStorage.getItem("vision_guard_token");

  const fetchCameras = async () => {
    const token = getToken();
    if (!token) return router.push("/login");

    const res = await fetch("http://127.0.0.1:8000/cameras/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCameras(data);
    } else if (res.status === 401) {
      router.push("/login");
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    const res = await fetch("http://127.0.0.1:8000/cameras/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location_name: newLocation,
        stream_url: newStreamUrl || "0",
        status: "active",
      }),
    });

    if (res.ok) {
      setNewLocation("");
      setNewStreamUrl("");
      fetchCameras();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cámara?")) return;
    const token = getToken();
    const res = await fetch(`http://127.0.0.1:8000/cameras/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchCameras();
  };

  const startEdit = (cam: Camera) => {
    setEditingId(cam.id);
    setEditLocation(cam.location_name);
    setEditStreamUrl(cam.stream_url || "");
  };

  const handleUpdate = async (id: string) => {
    const token = getToken();
    const res = await fetch(`http://127.0.0.1:8000/cameras/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location_name: editLocation,
        stream_url: editStreamUrl,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      fetchCameras();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gestión de Cámaras</h1>
      </header>

      <div className={styles.grid}>
        <div className={styles.card} style={{ border: "2px dashed #0056b3" }}>
          <h3 style={{ color: "#0056b3", marginTop: 0 }}>
            Añadir Nueva Cámara
          </h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ubicación (Ej. Entrada Principal)
              </label>
              <input
                required
                className={styles.input}
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                URL de Stream (Ej. http://192.168.1.5/video)
              </label>
              <input
                className={styles.input}
                value={newStreamUrl}
                onChange={(e) => setNewStreamUrl(e.target.value)}
                placeholder="0 para cámara web local"
              />
            </div>
            <button
              type="submit"
              className={styles.btnPrimary}
              style={{ width: "100%" }}
            >
              + Guardar Cámara
            </button>
          </form>
        </div>

        {cameras.map((cam) => (
          <div key={cam.id} className={styles.card}>
            {editingId === cam.id ? (
              <div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ubicación</label>
                  <input
                    className={styles.input}
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>URL de Stream</label>
                  <input
                    className={styles.input}
                    value={editStreamUrl}
                    onChange={(e) => setEditStreamUrl(e.target.value)}
                  />
                </div>
                <div className={styles.buttonRow}>
                  <button
                    onClick={() => handleUpdate(cam.id)}
                    className={styles.btnPrimary}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className={styles.btnSecondary}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginTop: 0 }}>📍 {cam.location_name}</h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#666",
                    wordBreak: "break-all",
                  }}
                >
                  <strong>URL:</strong> {cam.stream_url || "Ninguna"}
                </p>
                <div className={styles.buttonRow}>
                  <button
                    onClick={() => startEdit(cam)}
                    className={styles.btnPrimary}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cam.id)}
                    className={styles.btnDanger}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
