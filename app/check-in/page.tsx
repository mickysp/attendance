"use client";

import { Suspense } from "react";
import CheckInContent from "./CheckInContent";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckInContent />
    </Suspense>
  );
}