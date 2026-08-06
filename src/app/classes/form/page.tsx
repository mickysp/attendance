"use client";

import { Suspense } from "react";
import QRContent from "./formContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QRContent />
    </Suspense>
  );
}