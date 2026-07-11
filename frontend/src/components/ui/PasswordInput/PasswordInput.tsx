import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextInput } from '../TextInput/TextInput';
import type { TextInputProps } from '../TextInput/TextInput';

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
          showPassword ? <Eye size={18} /> : <EyeOff size={18} />
        }
        onIconRightClick={togglePasswordVisibility}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

