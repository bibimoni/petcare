import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`flex h-10 w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };