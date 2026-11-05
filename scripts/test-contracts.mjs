import{execFileSync}from'node:child_process';
// The opt-in setup hook must be loaded in the offline spec's own test process.
const env={...process.env,FRAGMENT_KIT_CONTRACT_CONFIG:'testing-contract.config.mjs',FRAGMENT_KIT_BASE_URL:process.env.FRAGMENT_KIT_BASE_URL??process.env.SHEETS_TEST_BASE_URL??'http://127.0.0.1:4173/',BROWSERS:process.env.BROWSERS??process.env.BROWSER??'chromium,firefox,webkit'};
const args=['node_modules/@playwright/test/cli.js','test','--config','vendor/fragment-kit-v0.3.4/testing/playwright.config.js'];
for(const filter of [['offline.spec.js','--grep','atomic install'],['--grep-invert','atomic install']])execFileSync(process.execPath,[...args,...filter],{stdio:'inherit',env});
