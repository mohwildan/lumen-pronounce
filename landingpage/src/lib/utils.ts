import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const frauncesFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
});

/* Keep montserrat export so any remaining imports don't break */
export const montserratFont = interFont;
