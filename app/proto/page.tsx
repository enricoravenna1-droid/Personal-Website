import type { Metadata } from "next";
import { Film } from "@/components/film/film";

export const metadata: Metadata = {
  title: "Prototype",
  robots: { index: false, follow: false },
};

/** Throwaway route for the glass-plates prototype. Not linked from anywhere. */
export default function Proto() {
  return <Film />;
}
