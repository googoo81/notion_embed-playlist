import type { FieldLabelProps } from "@/types/component-props";

export function FieldLabel({ children, className = "" }: FieldLabelProps) {
  return (
    <label
      className={`block text-sm font-medium ${className}`.trim()}
    >
      {children}
    </label>
  );
}
