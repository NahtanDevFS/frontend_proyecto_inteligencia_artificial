"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCamerasApi } from "@/services/cameras.service";
import styles from "./Monitor.module.css";

interface Detection {
  track_id: number;
  class_id: number;
  class_name: string;
  confidence: number;
  box: [number, number, number, number];
  status: string;
  trigger_alert: boolean;
}

interface Camera {
  id: string;
  location_name: string;
  stream_url: string;
  status: string;
}

interface WSData {
  status: string;
  message?: string;
  image?: string;
  detections: Detection[];
}

const getWsUrl = (cameraId: string, token: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const wsBaseUrl = apiUrl.replace(/^http/, "ws");

  const cleanBaseUrl = wsBaseUrl.endsWith("/")
    ? wsBaseUrl.slice(0, -1)
    : wsBaseUrl;

  return `${cleanBaseUrl}/ws/video-stream/${cameraId}?token=${token}`;
};

function CameraFeed({ camera, token }: { camera: Camera; token: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    setHasError(false);
    setErrorMessage("");

    const wsUrl = getWsUrl(camera.id, token);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      setHasError(true);
      setErrorMessage("Conexión perdida con el servidor");
    };
    ws.onmessage = (event: MessageEvent) => {
      const data: WSData = JSON.parse(event.data);
      if (data.status === "error") {
        setHasError(true);
        setErrorMessage(data.message || "Error desconocido");
        return;
      }
      if (data.status === "success" && data.image) {
        setHasError(false);
        renderFrameAndDetections(data);
      }
    };
  }, [camera.id, token]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  const renderFrameAndDetections = (data: WSData) => {
    const canvases = [canvasRef.current, modalCanvasRef.current];

    canvases.forEach((canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = `data:image/jpeg;base64,${data.image}`;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (data.detections && Array.isArray(data.detections)) {
          data.detections.forEach((det: Detection) => {
            const [x_c, y_c, w, h] = det.box;
            const x = x_c - w / 2;
            const y = y_c - h / 2;

            ctx.strokeStyle =
              det.status === "alerta"
                ? "#dc2626"
                : det.status === "epp_detectado"
                  ? "#3b82f6"
                  : "#16a34a";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = "16px Arial";
            ctx.fillText(
              `${det.class_name} (ID: ${det.track_id || "N/A"}) ${Math.round(det.confidence * 100)}% - ${det.status}`,
              x,
              y - 5,
            );
          });
        }
      };
    });
  };

  return (
    <>
      <div className={styles.cameraCard}>
        <h3 className={styles.cameraTitle}>
          {camera.location_name}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              className={`${styles.statusIndicator} ${isConnected && !hasError ? styles.statusOnline : styles.statusOffline}`}
            >
              ● {isConnected && !hasError ? "En Vivo" : "Desconectado"}
            </span>
            <button
              className={styles.fullscreenBtn}
              onClick={() => setIsFullscreen(true)}
            >
              ⛶ Ampliar
            </button>
          </div>
        </h3>

        <div className={styles.videoWrapper}>
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className={styles.canvasOverlay}
          />
          {hasError && (
            <div className={styles.errorOverlay}>
              <p>{errorMessage}</p>
              <button
                className={styles.reconnectBtn}
                onClick={connectWebSocket}
              >
                Intentar reconectar
              </button>
            </div>
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className={styles.modalOverlay}>
          <canvas
            ref={modalCanvasRef}
            width={640}
            height={480}
            className={styles.modalCanvas}
          />
          <button
            className={styles.modalCloseBtn}
            onClick={() => setIsFullscreen(false)}
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}

export default function Monitor() {
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("vision_guard_token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);

    const fetchCameras = async () => {
      try {
        const data = await getCamerasApi(storedToken);
        setCameras(data.filter((c: Camera) => c.status === "active"));
      } catch (err: unknown) {
        if (err instanceof Error && err.message === "Unauthorized") {
          router.push("/login");
        } else {
          console.error("Error obteniendo cámaras", err);
        }
      }
    };

    fetchCameras();
  }, [router]);

  if (!token) return null;

  return (
    <div className={styles.monitorContainer}>
      <h1 className={styles.title}>Panel de supervisión múltiple</h1>

      {cameras.length === 0 ? (
        <p className={styles.emptyState}>
          No hay cámaras activas configuradas. Ve a la pestaña de Cámaras para
          agregar una.
        </p>
      ) : (
        <div className={styles.grid}>
          {cameras.map((camera) => (
            <CameraFeed key={camera.id} camera={camera} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
