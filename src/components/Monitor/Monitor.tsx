"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
}

function CameraFeed({ camera, token }: { camera: Camera; token: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) wsRef.current.close();

    setHasError(false);
    setErrorMessage("");

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/video-stream/${camera.id}?token=${token}`,
    );
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onclose = () => {
      setIsConnected(false);
      setHasError(true);
      setErrorMessage("Conexión perdida con el servidor");
    };

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.status === "error") {
        setHasError(true);
        setErrorMessage(data.message);
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

  const renderFrameAndDetections = (data: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = `data:image/jpeg;base64,${data.image}`;

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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
          `${det.class_name} (ID: ${det.track_id || "N/A"}) - ${det.status}`,
          x,
          y - 5,
        );
      });
    };
  };

  return (
    <div className={styles.cameraCard}>
      <h3 className={styles.cameraTitle}>
        {camera.location_name}
        <span
          style={{
            fontSize: "0.8rem",
            color: isConnected && !hasError ? "green" : "red",
          }}
        >
          ● {isConnected && !hasError ? "En Vivo" : "Desconectado"}
        </span>
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
            <p>⚠️ {errorMessage}</p>
            <button className={styles.reconnectBtn} onClick={connectWebSocket}>
              ↻ Intentar Reconectar
            </button>
          </div>
        )}
      </div>
    </div>
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
        const res = await fetch("http://127.0.0.1:8000/cameras/", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCameras(data.filter((c: any) => c.status === "active"));
        }
      } catch (err) {
        console.error("Error obteniendo cámaras", err);
      }
    };

    fetchCameras();
  }, [router]);

  if (!token) return null;

  return (
    <div className={styles.monitorContainer}>
      <h1 className={styles.title}>Panel de Supervisión Múltiple</h1>

      {cameras.length === 0 ? (
        <p style={{ textAlign: "center" }}>
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
