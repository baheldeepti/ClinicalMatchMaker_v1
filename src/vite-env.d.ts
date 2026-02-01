/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOOLHOUSE_API_KEY: string;
  readonly VITE_RTRVR_API_KEY: string;
  readonly VITE_ELEVENLABS_API_KEY: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_CLINICALTRIALS_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
