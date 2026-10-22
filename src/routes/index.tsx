import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

// The game bundle (three.js + game modules) reads browser APIs at module load,
// so it is imported lazily and only rendered after hydration.
const Game = lazy(() => import("@/components/game/Game"));

const TITLE = "Astro Relic — Abandoned but Not Forgotten";
const DESCRIPTION =
  "An interactive 3D space narrative game exploring forgotten relics and mysteries across Mars and the solar system.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function LoadingScreen() {
  return (
    <div
      className="flex h-screen w-screen items-center justify-center"
      style={{ backgroundColor: "#030308", color: "#ece7db" }}
    >
      <div className="text-center">
        <div className="font-display text-2xl font-bold tracking-[0.3em] uppercase">
          Astro Relic
        </div>
        <p className="mt-4 text-xs tracking-[0.4em] text-white/50 uppercase">
          Initializing mission…
        </p>
      </div>
    </div>
  );
}

function Index() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Game />
    </Suspense>
  );
}
