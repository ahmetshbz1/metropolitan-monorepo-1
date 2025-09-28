"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const codeLength = 6;

const Digit = ({
  digit,
  isFocused,
  isError,
}: {
  digit: string;
  isFocused: boolean;
  isError: boolean;
}) => {
  return (
    <motion.div
      className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all duration-200",
        isFocused && !isError && "border-primary bg-primary/5",
        isError && "border-red-500 bg-red-50",
        !isFocused && !isError && "border-border bg-muted/30"
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.span
        className="text-xl font-semibold"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        key={digit}
      >
        {digit}
      </motion.span>
    </motion.div>
  );
};

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  isError?: boolean;
  disabled?: boolean;
}

export const OTPInput = ({
  value,
  onChange,
  onComplete,
  isError = false,
  disabled = false,
}: OTPInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldShake, setShouldShake] = useState(false);
  const prevErrorRef = useRef(false);

  useEffect(() => {
    if (value.length === codeLength && onComplete) {
      onComplete();
    }
  }, [value, onComplete]);

  useEffect(() => {
    // Auto-focus on mount
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    // Sadece error state false'dan true'ya geçtiğinde titret
    if (isError && !prevErrorRef.current) {
      setShouldShake(true);
      // Shake animasyonu bittikten sonra shake state'ini resetle
      setTimeout(() => setShouldShake(false), 400);
    }
    prevErrorRef.current = isError;
  }, [isError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, "").slice(0, codeLength);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <motion.div
        className="flex gap-3 justify-center cursor-text"
        onClick={() => inputRef.current?.focus()}
        animate={shouldShake ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {Array.from({ length: codeLength }).map((_, index) => (
          <Digit
            key={index}
            digit={value[index] || ""}
            isFocused={index === value.length && !disabled}
            isError={isError}
          />
        ))}
      </motion.div>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleInputChange}
        maxLength={codeLength}
        disabled={disabled}
        className="w-full h-12 text-center text-transparent bg-transparent border-none outline-none caret-transparent"
        autoComplete="one-time-code"
        autoFocus
      />
    </div>
  );
};