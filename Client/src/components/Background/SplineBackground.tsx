import React, { Suspense, lazy } from "react"; // Usunięto useState
import styles from "./SplineBackground.module.scss";
import placeholderImageUrl from "../../assets/Bez tytułu.webp"; // Lub ścieżka do SVG

// Lazy loading dla Spline
const Spline = lazy(() => import("@splinetool/react-spline"));

const SPLINE_SCENE_URL =
  "https://prod.spline.design/iXwpoFENb7cAd9e2/scene.splinecode";

const SplineBackground = () => {
  // Usunięto stan isSplineReady i handleSplineLoad

  return (
    <div className={styles.splineContainer}>
      {/* 1. Obraz tła - zawsze widoczny pod spodem */}

      {/* 2. Suspense dla kodu komponentu Spline */}
      <Suspense fallback={null}>
        {" "}
        {/* Nie potrzebujemy fallbacku, bo obraz jest zawsze widoczny */}
        {/* 3. Kontener dla płótna Spline - będzie nad obrazem */}
        <div className={styles.splineCanvasContainer}>
          <Spline
            scene={SPLINE_SCENE_URL}
            // Usunięto onLoad={handleSplineLoad}
          />
        </div>
      </Suspense>
    </div>
  );
};

export default SplineBackground;
