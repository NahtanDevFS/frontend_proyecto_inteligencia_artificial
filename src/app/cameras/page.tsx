"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getCamerasApi,
  createCameraApi,
  updateCameraApi,
  deleteCameraApi,
} from "@/services/cameras.service";
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
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const data = await getCamerasApi(token);
      setCameras(data);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Unauthorized") {
        router.push("/login");
      } else {
        console.error(error);
        alert("No se pudieron cargar las cámaras.");
      }
    }
  };

  useEffect(() => {
    fetchCameras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    try {
      await createCameraApi(token, {
        location_name: newLocation,
        stream_url: newStreamUrl || "0",
        status: "active",
      });

      setNewLocation("");
      setNewStreamUrl("");
      fetchCameras();
    } catch (error) {
      console.error(error);
      alert("Error al intentar crear la cámara.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta cámara?")) return;

    const token = getToken();
    if (!token) return;

    try {
      await deleteCameraApi(token, id);
      fetchCameras();
    } catch (error) {
      console.error(error);
      alert("Error al intentar eliminar la cámara.");
    }
  };

  const startEdit = (cam: Camera) => {
    setEditingId(cam.id);
    setEditLocation(cam.location_name);
    setEditStreamUrl(cam.stream_url || "");
  };

  const handleUpdate = async (id: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await updateCameraApi(token, id, {
        location_name: editLocation,
        stream_url: editStreamUrl,
      });

      setEditingId(null);
      fetchCameras();
    } catch (error) {
      console.error(error);
      alert("Error al intentar actualizar la cámara.");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gestión de Cámaras</h1>
      </header>

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.cardNew}`}>
          <h3 className={styles.cardNewTitle}>Añadir Nueva Cámara</h3>
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
                <h3 className={styles.cameraTitle}>{cam.location_name}</h3>
                <p className={styles.streamUrlText}>
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
