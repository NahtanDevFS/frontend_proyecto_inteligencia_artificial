"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("vision_guard_token");
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("vision_guard_token");
    router.push("/login");
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>Vision Guard</div>

      {isAuthenticated && (
        <div className={styles.navLinks}>
          <Link
            href="/"
            className={`${styles.link} ${pathname === "/" ? styles.activeLink : ""}`}
          >
            Monitor en Vivo
          </Link>

          <Link
            href="/cameras"
            className={`${styles.link} ${pathname === "/cameras" ? styles.activeLink : ""}`}
          >
            Cámaras
          </Link>

          <Link
            href="/dashboard"
            className={`${styles.link} ${pathname === "/dashboard" ? styles.activeLink : ""}`}
          >
            Historial de Alertas
          </Link>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}
