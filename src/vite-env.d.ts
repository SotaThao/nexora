/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DATA_SOURCE?: string
  readonly VITE_ENABLE_DEMO_TOOLS?: string
  readonly VITE_TOUCH_BUSINESS_ID?: string
  readonly VITE_TOUCH_BUSINESS_ID_MAP?: string
  readonly VITE_VLINKPAY_WEB_URL_BASE?: string
  readonly VITE_ONESIGNAL_APP_ID?: string
  readonly VITE_PUSH_DEVICE_REGISTER_PATH?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_MAPBOX_TOKEN?: string
  readonly VITE_MAP_MARKER_ENGINE?: string
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Global loose object type for incremental migration of legacy form/state blobs. */
type LooseObject = Record<string, any>
