"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  TrashIcon 
} from "@heroicons/react/24/outline";

type ConfirmType = {
  message: string;
  onConfirm: () => void;
  variant?: ConfirmVariant;
};

type ConfirmContextType = {
  showConfirm: (
    message: string,
    onConfirm: () => void,
    variant?: ConfirmVariant,
  ) => void;
};

type ConfirmVariant = "delete" | "warning" | "info";

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirm, setConfirm] = useState<ConfirmType | null>(null);
  const variant = confirm?.variant || "info";

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    variant: ConfirmVariant = "info",
  ) => {
    setConfirm({ message, onConfirm, variant });
  };

  const handleClose = () => setConfirm(null);

  const handleConfirm = () => {
    confirm?.onConfirm();
    handleClose();
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-noto">
          <div className="bg-white rounded-xl shadow-lg w-[390px] p-8 text-center animate-[scaleIn_0.2s_ease]">
            <div
              className={`mb-3 flex items-center justify-center w-24 h-24 rounded-full mx-auto ${
                variant === "delete"
                  ? "bg-red-100"
                  : variant === "warning"
                    ? "bg-yellow-100"
                    : "bg-blue-100"
              }`}
            >
              {variant === "delete" ? (
                <TrashIcon className="w-7 h-7 text-red-500" />
              ) : variant === "warning" ? (
                <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />
              ) : (
                <DocumentCheckIcon className="w-7 h-7 text-blue-500" />
              )}
            </div>

            <p className="text-base text-gray-800 font-medium mb-1">
              {confirm.message}
            </p>

            <p className="text-sm text-gray-400 mb-4">
              {variant === "delete"
                ? "การลบข้อมูลนี้ไม่สามารถกู้คืนได้"
                : variant === "warning"
                  ? "การดำเนินการนี้จะลบข้อมูลเฉพาะวิชา"
                  : "กรุณาตรวจสอบข้อมูลก่อนดำเนินการ"}
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm rounded-md text-white cursor-pointer ${
                  variant === "delete"
                    ? "bg-red-500 hover:bg-red-600"
                    : variant === "warning"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
};
