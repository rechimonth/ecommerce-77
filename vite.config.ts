import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Solo Vitest recibe valores ficticios; el build de producción usa su entorno real.
  define: mode === "test" ? {
    "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify("AIzaSyDUMMYTESTKEY012345678901234567890"),
    "import.meta.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify("ecommerce-77-test.firebaseapp.com"),
    "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify("ecommerce-77-test"),
    "import.meta.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify("ecommerce-77-test.appspot.com"),
    "import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify("000000000000"),
    "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify("1:000000000000:web:0000000000000000000000"),
  } : {},
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 30,
            },
            {
              name: "firebase-vendor",
              test: /node_modules[\\/](firebase|@firebase)[\\/]/,
              minSize: 20000,
              maxSize: 280000,
              priority: 20,
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
              minSize: 30000,
              maxSize: 250000,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
}));
