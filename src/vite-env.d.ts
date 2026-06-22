/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DATA_SOURCE?: string
  readonly VITE_ENABLE_DEMO_TOOLS?: string
  readonly VITE_TOUCH_BUSINESS_ID?: string
  readonly VITE_TOUCH_BUSINESS_ID_MAP?: string
  readonly VITE_VLINKPAY_WEB_URL_BASE?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Global loose object type for incremental migration of legacy form/state blobs. */
type LooseObject = Record<string, any>
