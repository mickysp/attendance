"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

type ConfirmType = {
  message: string;
  onConfirm: () => void;
  variant?: ConfirmVariant;
  description?: string;
};

type ConfirmContextType = {
  showConfirm: (
    message: string,
    onConfirm: () => void,
    variant?: ConfirmVariant,
    description?: string,
  ) => void;
};

type ConfirmVariant = "delete" | "warning" | "info" | "edit" | "withdraw";

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirm, setConfirm] = useState<ConfirmType | null>(null);

  const variant = confirm?.variant || "info";

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    variant: ConfirmVariant = "info",
    description?: string,
  ) => {
    setConfirm({ message, onConfirm, variant, description });
  };

  const handleClose = () => setConfirm(null);

  const handleConfirm = () => {
    confirm?.onConfirm();
    handleClose();
  };

  const getIcon = () => {
    switch (variant) {
      case "delete":
        return <TrashIcon className="w-10 h-10 text-red-500" />;

      case "warning":
        return (
          <ExclamationTriangleIcon className="w-10 h-10 text-yellow-500" />
        );

      case "edit":
        return <PencilSquareIcon className="w-10 h-10 text-indigo-500" />;

      case "withdraw":
        return <ArrowUturnLeftIcon className="w-10 h-10 text-orange-500" />;

      default:
        return <DocumentCheckIcon className="w-10 h-10 text-blue-500" />;
    }
  };

  const getBg = () => {
    switch (variant) {
      case "delete":
        return "bg-red-100";
      case "warning":
        return "bg-yellow-100";
      case "edit":
        return "bg-indigo-100";
      case "withdraw":
        return "bg-orange-100";
      default:
        return "bg-blue-100";
    }
  };

  const getDefaultDescription = () => {
    switch (variant) {
      case "delete":
        return "การลบข้อมูลนี้ไม่สามารถกู้คืนได้";
      case "warning":
        return "การดำเนินการนี้อาจมีผลกระทบกับข้อมูล";
      case "edit":
        return "คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่";
      default:
        return "คุณต้องการบันทึกข้อมูลใช่หรือไม่";
      case "withdraw":
        return "คุณต้องการถอนรายวิชานี้ใช่หรือไม่";
    }
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-noto">
          <div className="bg-white rounded-xl shadow-lg w-[390px] p-8 text-center animate-[scaleIn_0.2s_ease]">
            <div
              className={`mb-3 flex items-center justify-center w-24 h-24 rounded-full mx-auto ${getBg()}`}
            >
              {getIcon()}
            </div>

            <p className="text-base text-gray-800 font-medium mb-1">
              {confirm.message}
            </p>

            <p className="text-sm text-gray-400 mb-4">
              {confirm.description || getDefaultDescription()}
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 text-sm rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleConfirm}
                className={`px-6 py-2.5 text-sm rounded-md text-white cursor-pointer ${
                  variant === "delete"
                    ? "bg-red-500 hover:bg-red-600"
                    : variant === "warning"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : variant === "edit"
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
