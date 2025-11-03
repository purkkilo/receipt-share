import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { TextInput } from "react-native-paper";

type FloatInputProps = {
  value?: number | null; // initial numeric value
  onChange?: (value: number | null) => void; // called with parsed number or null
  allowNegative?: boolean;
  label?: string;
  style?: any;
};

export default function FloatPaperInput({
  value = null,
  onChange,
  allowNegative = false,
  label = "Hinta",
  style,
}: FloatInputProps) {
  // keep displayed text separate from numeric value
  const [text, setText] = useState<string>(
    value !== null && value !== undefined ? String(value) : ""
  );
  const [num, setNum] = useState<number | null>(value);

  // if parent changes `value`, reflect it
  useEffect(() => {
    setNum(value ?? null);
    setText(value === null || value === undefined ? "" : String(value));
  }, [value]);

  const handleChange = (input: string) => {
    // allow digits, dot and comma (and minus if allowed)
    const allowedRegex = allowNegative ? /[^0-9\.,-]/g : /[^0-9\.,]/g;
    let sanitized = input.replace(allowedRegex, "");

    // if negative not allowed, strip minus signs
    if (!allowNegative) sanitized = sanitized.replace(/-/g, "");

    // if allowNegative: keep only one leading minus
    if (allowNegative) {
      // remove all minus signs, then re-add a leading minus if the original started with one
      const startsWithMinus = sanitized.startsWith("-");
      sanitized = sanitized.replace(/-/g, "");
      if (startsWithMinus) sanitized = "-" + sanitized;
    }

    // keep only first decimal separator (either . or ,)
    const firstDot = sanitized.indexOf(".");
    const firstComma = sanitized.indexOf(",");
    let firstSepIndex = -1;
    if (firstDot !== -1 && firstComma !== -1) {
      firstSepIndex = Math.min(firstDot, firstComma);
    } else {
      firstSepIndex = Math.max(firstDot, firstComma); // one of them or -1
    }

    if (firstSepIndex !== -1) {
      const before = sanitized.slice(0, firstSepIndex + 1);
      const after = sanitized.slice(firstSepIndex + 1).replace(/[.,]/g, "");
      sanitized = before + after;
    }

    setText(sanitized);

    // convert comma to dot for parsing
    const parsed = parseFloat(sanitized.replace(",", "."));
    const parsedValue = Number.isNaN(parsed) ? null : parsed;

    setNum(parsedValue);
    if (onChange) onChange(parsedValue);
  };

  const handleBlur = () => {
    // remove a trailing '.' or ',' (e.g. "12." -> "12")
    if (text.endsWith(".") || text.endsWith(",")) {
      const cleaned = text.slice(0, -1);
      setText(cleaned);
      const parsed = parseFloat(cleaned.replace(",", ","));
      const parsedValue = Number.isNaN(parsed) ? null : parsed;
      setNum(parsedValue);
      if (onChange) onChange(parsedValue);
      return;
    }

    // optional: format to two decimals on blur (uncomment if desired)
    // if (num !== null) {
    //   const formatted = num.toFixed(2);
    //   setText(formatted);
    // }
  };

  return (
    <TextInput
      label={label}
      mode="outlined"
      value={text}
      onChangeText={handleChange}
      onBlur={handleBlur}
      style={style}
      keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
      // inputMode="decimal" // for RN web or libraries that support it
    />
  );
}
