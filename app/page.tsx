import { Hero } from "@/components/home/hero";
import { Chapters } from "@/components/home/chapters";
import { Values } from "@/components/home/values";
import { Vision } from "@/components/home/vision";
import "@/components/home/home.css";

/** The home page is the film. See lib/content.ts FILM for every word. */
export default function Home() {
  return (
    <>
      <Hero />
      <Chapters />
      <Values />
      <Vision />
    </>
  );
}
