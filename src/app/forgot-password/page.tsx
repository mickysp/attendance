"use client";

import { useState } from "react";
import Navbar from "@/components/layouts/Navbar";
import ForgotPassword from "@/components/features/auth/ForgotPassword";
import VerifyOtp from "@/components/features/auth/VerifyOtp";
import ResetPassword from "@/components/features/auth/ResetPassword";
import Footer from "@/components/layouts/Footer";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 flex justify-center items-start pt-16">
        {step === 1 && (
          <ForgotPassword
            onNext={(emailValue) => {
              setEmail(emailValue);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <VerifyOtp
            email={email}
            onNext={(otpValue) => {
              setOtp(otpValue);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <ResetPassword
            email={email}
            otp={otp}
            onBack={() => setStep(2)}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}