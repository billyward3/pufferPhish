/**
 * Environment variable type definitions
 */

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_API_URL?: string;
    VITE_DEMO_MODE?: string;
    VITE_ENVIRONMENT?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
