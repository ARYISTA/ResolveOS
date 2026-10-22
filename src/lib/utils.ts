import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Class merger used by shadcn components
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return inrFormatter.format(amount);
}

