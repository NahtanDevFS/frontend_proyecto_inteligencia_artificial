"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCamerasApi } from "@/services/cameras.service";
import {
  getAlertsApi,
  deleteAlertApi,
  getImageUrl,
} from "@/services/alerts.service";
import styles from "./Dashboard.module.css";
import SecureImage from "@/components/SecureImage";

interface AlertDetail {
  epp_type: string;
  is_missing: boolean;
}

interface Alert {
  id: string;
  camera_id: string;
  evidence_url: string;
  timestamp: string;
  status: string;
  details: AlertDetail[];
}

interface Camera {
  id: string;
  location_name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);

  const [filterCameraId, setFilterCameraId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("vision_guard_token");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const loadInitialData = async () => {
      try {
        const [camerasData, alertsData] = await Promise.all([
          getCamerasApi(token),
          getAlertsApi(token),
        ]);
        setCameras(camerasData);
        setAlerts(alertsData);
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Unauthorized") {
          router.push("/login");
        } else {
          console.error("Error cargando datos del dashboard", error);
        }
      }
    };

    loadInitialData();
  }, [router]);

  const handleApplyFilters = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const data = await getAlertsApi(token, {
        camera_id: filterCameraId,
        date_from: filterDateFrom,
        date_to: filterDateTo,
      });
      setAlerts(data);
    } catch (error) {
      console.error("Error al aplicar filtros", error);
      alert("No se pudieron obtener las incidencias con esos filtros.");
    }
  };

  const handleDelete = async (alertId: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de eliminar esta evidencia permanentemente?",
      )
    )
      return;

    const token = getToken();
    if (!token) return;

    try {
      await deleteAlertApi(token, alertId);
      handleApplyFilters();
    } catch (error) {
      console.error("Error eliminando alerta", error);
      alert("Hubo un error al eliminar la alerta");
    }
  };

  const translateEPP = (type: string) => {
    if (type.toLowerCase() === "helmet") return "Casco";
    if (type.toLowerCase() === "vest") return "Chaleco";
    return type;
  };

  const getCameraName = (cameraId: string) => {
    const camera = cameras.find((c) => c.id === cameraId);
    return camera ? camera.location_name : "Cámara desconocida";
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Historial de Incidencias</h1>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>Filtrar por Cámara:</label>
          <select
            className={styles.input}
            value={filterCameraId}
            onChange={(e) => setFilterCameraId(e.target.value)}
          >
            <option value="">Todas las cámaras</option>
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.location_name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Desde:</label>
          <input
            type="datetime-local"
            className={styles.input}
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Hasta:</label>
          <input
            type="datetime-local"
            className={styles.input}
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>

        <button className={styles.btnPrimary} onClick={handleApplyFilters}>
          Aplicar Filtros
        </button>
      </div>

      <div className={styles.grid}>
        {alerts.length === 0 ? (
          <p className={styles.noData}>
            No se encontraron incidencias con estos filtros.
          </p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={styles.card}>
              <div
                onClick={(e) => {
                  const img = e.currentTarget.querySelector("img");
                  if (img && img.src.startsWith("blob:")) {
                    setSelectedImage(img.src);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <SecureImage
                  url={getImageUrl(alert.evidence_url)}
                  alt="Evidencia"
                  className={styles.image}
                />
              </div>

              <div className={styles.cardBody}>
                <p className={styles.timestamp}>
                  {" "}
                  {new Date(alert.timestamp).toLocaleString("es-GT", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  })}
                </p>
                <p className={styles.cameraName}>
                  {getCameraName(alert.camera_id)}
                </p>

                <div className={styles.badges}>
                  <p className={styles.badgeTitle}>Faltas detectadas:</p>
                  {alert.details.map(
                    (detail, index) =>
                      detail.is_missing && (
                        <span key={index} className={styles.badgeMissing}>
                          Falta {translateEPP(detail.epp_type)}
                        </span>
                      ),
                  )}
                </div>

                <button
                  className={styles.btnDanger}
                  onClick={() => handleDelete(alert.id)}
                >
                  Eliminar registro
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {selectedImage && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Evidencia ampliada"
            className={styles.modalImage}
          />
        </div>
      )}
    </div>
  );
}
