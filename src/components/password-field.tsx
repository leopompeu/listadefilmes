"use client";

import { ChangeEvent, memo, useMemo, useState } from "react";

type PasswordFieldProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
};

export const PasswordField = memo(function PasswordField({
  value,
  onChange,
  placeholder,
  maxLength = 72,
  required = false,
  disabled = false,
  name,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputType = visible ? "text" : "password";
  const toggleLabel = useMemo(() => (visible ? "Ocultar senha" : "Mostrar senha"), [visible]);
  const icon = visible ? "visibility_off" : "visibility";

  return (
    <div className="password-input-wrap">
      <input
        className="glass-input w-full pr-12"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={inputType}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        name={name}
        autoComplete={autoComplete}
      />
      <button
        className="password-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={`${toggleLabel} senha`}
      >
        <span className="material-symbols-rounded password-toggle-icon" aria-hidden="true">
          {icon}
        </span>
      </button>
    </div>
  );
});
