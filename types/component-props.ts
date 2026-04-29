import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export type FieldLabelProps = {
  children: ReactNode;
  className?: string;
};

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export type CheckboxRowProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: ReactNode;
};

export type ButtonVariant = "primary" | "outline";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export type CodeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export type StatTileProps = {
  caption: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export type UrlDisplayProps = {
  children: ReactNode;
  className?: string;
};
