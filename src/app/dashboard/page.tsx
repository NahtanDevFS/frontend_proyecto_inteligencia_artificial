"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Dashboard.module.css";

interface AlertDetail {
  id: string;
  epp_type: string;
  is_missing: boolean;
}

interface Alert {
  id: string;
  camera_id: string;
  evidence_url: string;
  duration_seconds: number;
  status: string;
  timestamp: string;
  details: AlertDetail[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      const token = localStorage.getItem("vision_guard_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/alerts/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("vision_guard_token");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Error al obtener el historial de alertas");
        }

        const data: Alert[] = await response.json();
        setAlerts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [router]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (isLoading)
    return (
      <div className={styles.loading}>Cargando historial de incidencias...</div>
    );
  if (error)
    return (
      <div className={styles.dashboardContainer}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Historial de Incidencias</h1>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#0056b3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Volver a Monitoreo en Vivo
        </button>
      </header>

      {alerts.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          No hay alertas registradas en el sistema.
        </p>
      ) : (
        <div className={styles.grid}>
          {alerts.map((alert) => (
            <div key={alert.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <img
                  src={`http://127.0.0.1:8000${alert.evidence_url}`}
                  alt="Evidencia de infracción"
                  className={styles.evidenceImage}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/640x480?text=Imagen+No+Disponible";
                  }}
                />
              </div>

              <div className={styles.cardContent}>
                <p className={styles.timestamp}>
                  {formatDate(alert.timestamp)}
                </p>
                <p className={styles.duration}>
                  Infracción continua: {alert.duration_seconds}s
                </p>

                <ul className={styles.detailsList}>
                  {alert.details.map((detail) => (
                    <li key={detail.id} className={styles.detailItem}>
                      <span className={styles.missingIcon}>X</span>
                      Falta:{" "}
                      {detail.epp_type === "helmet"
                        ? "Casco de seguridad"
                        : detail.epp_type === "vest"
                          ? "Chaleco reflectante"
                          : detail.epp_type}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
