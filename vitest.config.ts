import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // Unit tests live next to / under tests/. Live network "debug" scripts
        // under src/debug are NOT run as part of the test suite.
        include: ["tests/**/*.test.ts"],
        environment: "node",
        globals: true,
        reporters: "verbose",
    },
});
