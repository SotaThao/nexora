/** Backend catalog error codes (shared merchant categories / services). */
export enum CatalogErrorCode {
  ServiceInUse = 'CATALOG_SERVICE_IN_USE',
  CategoryInUse = 'CATALOG_CATEGORY_IN_USE',
  ServiceAddOnNotFound = 'CATALOG_SERVICE_ADDON_NOT_FOUND',
  ServiceAddOnNameRequired = 'CATALOG_SERVICE_ADDON_NAME_REQUIRED',
  ServiceAddOnNameTooLong = 'CATALOG_SERVICE_ADDON_NAME_TOO_LONG',
  ServiceAddOnNameDuplicate = 'CATALOG_SERVICE_ADDON_NAME_DUPLICATE',
  ServiceAddOnPriceInvalid = 'CATALOG_SERVICE_ADDON_PRICE_INVALID',
  ServiceAddOnInUse = 'CATALOG_SERVICE_ADDON_IN_USE',
  ServiceAddOnCopySourceInvalid = 'CATALOG_SERVICE_ADDON_COPY_SOURCE_INVALID',
}
