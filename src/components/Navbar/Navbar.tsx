"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("vision_guard_token");
    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("vision_guard_token");
    setIsMenuOpen(false);
    router.push("/login");
  };

  const closeMenu = () => setIsMenuOpen(false);

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.brand}>Vision Guard</div>

        {isAuthenticated && (
          <button
            className={styles.menuToggle}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        )}
      </div>

      {isAuthenticated && (
        <div
          className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ""}`}
        >
          <Link
            href="/"
            onClick={closeMenu}
            className={`${styles.link} ${pathname === "/" ? styles.activeLink : ""}`}
          >
            Monitor en vivo
          </Link>

          <Link
            href="/cameras"
            onClick={closeMenu}
            className={`${styles.link} ${pathname === "/cameras" ? styles.activeLink : ""}`}
          >
            Cámaras
          </Link>

          <Link
            href="/dashboard"
            onClick={closeMenu}
            className={`${styles.link} ${pathname === "/dashboard" ? styles.activeLink : ""}`}
          >
            Historial de alertas
          </Link>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}
