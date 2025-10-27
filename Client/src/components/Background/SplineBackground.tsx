import React, { Suspense } from "react";
import styles from "./SplineBackground.module.scss";

// 1. Change the import syntax like this:

// Lazy loading for Spline
const Spline = React.lazy(() => import("@splinetool/react-spline"));

const SPLINE_SCENE_URL =
  "https://prod.spline.design/iXwpoFENb7cAd9e2/scene.splinecode"; // Make sure this is correct

const SplineBackground = () => {
  return (
    <div className={styles.splineContainer}>
      <Suspense
        fallback={
          <div className={styles.placeholderContainer}>
            {/* 2. Use the imported URL in an <img> tag */}
            <img
              src={SPLINE_SCENE_URL} // Use the URL here
              className={styles.placeholderSvg} // Apply class to the <img> tag
              alt="Loading background placeholder" // Add alt text
            />
          </div>
        }
      >
        <Spline scene={SPLINE_SCENE_URL} />
      </Suspense>
    </div>
  );
};

export default SplineBackground;
