import React, { useState, forwardRef } from 'react';
import { TextInput, TextInputProps } from '../TextInput/TextInput';

export interface PasswordInputProps extends Omit<TextInputProps, 'type' | 'iconRight' | 'onIconRightClick'> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <TextInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        iconRight={
          <span className="material-symbols-outlined text-[18px]">
            {showPassword ? 'visibility' : 'visibility_off'}
          </span>
        }
        onIconRightClick={togglePasswordVisibility}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
