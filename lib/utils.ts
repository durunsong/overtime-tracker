import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function jsonResponse<T>(
  payload: { success: boolean; data?: T; message?: string; error?: string },
  init?: ResponseInit,
) {
  return Response.json(payload, init);
}
