import { useState, forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextInput } from '../TextInput';

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

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
