import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zeinth Task Manager",
    short_name: "Zeinth",
    description: "A calm place to plan tasks, priorities, and reminders.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a1220",
    theme_color: "#7c5ce7",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
