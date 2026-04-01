"use client";

import { useEffect, useRef, useState } from "react";
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

export default function Monitor() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const isWaitingRef = useRef<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("vision_guard_token");

    if (!token) {
      console.warn("Acceso denegado: No hay token. Redirigiendo al login...");
      router.push("/login");
      return;
    }

    setIsAuthorized(true);

    wsRef.current = new WebSocket(
      `ws://127.0.0.1:8000/ws/video-stream?token=${token}`,
    );

    wsRef.current.onopen = () => setIsConnected(true);

    wsRef.current.onclose = (event) => {
      setIsConnected(false);
      if (event.code === 1008) {
        localStorage.removeItem("vision_guard_token");
        router.push("/login");
      }
    };

    wsRef.current.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.status === "success") {
        drawDetections(data.detections);
      }
      isWaitingRef.current = false;
    };

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream: MediaStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err: Error) =>
        console.error("Error accediendo a la cámara:", err),
      );

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [router]);

  const sendFrameToBackend = () => {
    if (isWaitingRef.current) {
      animationFrameId.current = requestAnimationFrame(sendFrameToBackend);
      return;
    }

    if (videoRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL("image/jpeg", 0.5);

        isWaitingRef.current = true;
        wsRef.current.send(base64Image);
      }
    }
    animationFrameId.current = requestAnimationFrame(sendFrameToBackend);
  };

  const handleVideoPlaying = () => {
    sendFrameToBackend();
  };

  const drawDetections = (detections: Detection[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    detections.forEach((det) => {
      const [x_c, y_c, w, h] = det.box;
      const x = x_c - w / 2;
      const y = y_c - h / 2;

      ctx.strokeStyle = det.status === "alerta" ? "#dc2626" : "#16a34a";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = det.status === "alerta" ? "#dc2626" : "#16a34a";
      ctx.font = "16px Arial";
      ctx.fillText(
        `${det.class_name} (ID: ${det.track_id}) - ${det.status}`,
        x,
        y - 5,
      );
    });
  };

  return (
    <div className={styles.monitorContainer}>
      <h2>Panel de Supervisión en Tiempo Real</h2>

      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.hiddenVideo}
          onPlay={handleVideoPlaying}
          muted
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={styles.canvasOverlay}
        />
      </div>

      <div className={styles.statusPanel}>
        <p>
          Estado del Servidor IA:
          <span
            style={{
              color: isConnected ? "green" : "red",
              fontWeight: "bold",
              marginLeft: "8px",
            }}
          >
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </p>
      </div>
    </div>
  );
}
