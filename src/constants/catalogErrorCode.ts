/** Backend catalog error codes (shared merchant categories / services). */
export enum CatalogErrorCode {
  ServiceInUse = 'CATALOG_SERVICE_IN_USE',
  CategoryInUse = 'CATALOG_CATEGORY_IN_USE',
  // POST {SHARED_CATALOG_BASE}/services/batch
  ServiceBatchItemsRequired = 'CATALOG_SERVICE_BATCH_ITEMS_REQUIRED',
  ServiceBatchTooManyItems = 'CATALOG_SERVICE_BATCH_TOO_MANY_ITEMS',
  ServiceBatchNameRequired = 'CATALOG_SERVICE_NAME_REQUIRED',
  ServiceBatchNameTooLong = 'CATALOG_SERVICE_NAME_TOO_LONG',
  ServiceBatchPriceInvalid = 'CATALOG_SERVICE_PRICE_INVALID',
  ServiceBatchDurationInvalid = 'CATALOG_SERVICE_DURATION_INVALID',
  ServiceBatchDescriptionTooLong = 'CATALOG_SERVICE_DESCRIPTION_TOO_LONG',
  ServiceBatchIconTooLong = 'CATALOG_SERVICE_ICON_TOO_LONG',
  ServiceBatchTagTooLong = 'CATALOG_SERVICE_TAG_TOO_LONG',
  ServiceBatchCategoryInvalid = 'CATALOG_SERVICE_CATEGORY_INVALID',
  ServiceBatchInvalidId = 'CATALOG_SERVICE_BATCH_INVALID_ID',
  ServiceBatchDuplicateId = 'CATALOG_SERVICE_BATCH_DUPLICATE_ID',
}
