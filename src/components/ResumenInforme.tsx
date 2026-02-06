import React, { Suspense } from "react";

const LazyResumen = React.lazy(() => import("./ResumenInformeContent"));

export const ResumenInforme: React.FC = () => {
  return (
    <Suspense fallback={<div>Cargando informe…</div>}>
      <LazyResumen />
    </Suspense>
  );
};

export default ResumenInforme;
