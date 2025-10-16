"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export function OTPInput({ value, onChange, length = 6, disabled = false }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (value) {
      const otpArray = value.split("").slice(0, length);
      const paddedArray = [...otpArray, ...new Array(length - otpArray.length).fill("")];
      setOtp(paddedArray);
    }
  }, [value, length]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Call parent onChange
    onChange(newOtp.join(""));

    // Focus next input
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        inputRefs.current[index - 1].focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length);
    const otpArray = pastedData.split("").filter(char => !isNaN(char));
    
    if (otpArray.length > 0) {
      const newOtp = [...new Array(length).fill("")];
      otpArray.forEach((char, index) => {
        if (index < length) newOtp[index] = char;
      });
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(otpArray.length, length - 1);
      inputRefs.current[nextIndex].focus();
    }
  };

  return (
    <div className="flex justify-center space-x-2">
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-semibold"
        />
      ))}
    </div>
  );
}