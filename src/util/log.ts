const ts = () => new Date().toISOString();

export const log = {
    info: (msg: string, ...rest: unknown[]) =>
        console.log(`[${ts()}] ℹ️  ${msg}`, ...rest),
    ok: (msg: string, ...rest: unknown[]) =>
        console.log(`[${ts()}] ✅ ${msg}`, ...rest),
    warn: (msg: string, ...rest: unknown[]) =>
        console.warn(`[${ts()}] ⚠️  ${msg}`, ...rest),
    error: (msg: string, ...rest: unknown[]) =>
        console.error(`[${ts()}] ❌ ${msg}`, ...rest),
    step: (msg: string) => console.log(`\n[${ts()}] ▶️  ${msg}`),
};
