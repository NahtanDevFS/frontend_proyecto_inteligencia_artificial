"use client";

import { useEffect, useState } from "react";

interface SecureImageProps {
  url: string;
  alt: string;
  className?: string;
}

export default function SecureImage({ url, alt, className }: SecureImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string;

    const fetchImage = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!response.ok) throw new Error("Error cargando la imagen");

        const imageBlob = await response.blob();

        objectUrl = URL.createObjectURL(imageBlob);
        setImgSrc(objectUrl);
      } catch (error) {
        console.error("Error al cargar la imagen segura:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (url) {
      fetchImage();
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (isLoading) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e6f0ff",
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffe6e6",
          color: "#dc2626",
        }}
      >
        Error
      </div>
    );
  }

  return <img src={imgSrc} alt={alt} className={className} />;
}
