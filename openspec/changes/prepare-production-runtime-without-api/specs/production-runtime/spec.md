## ADDED Requirements

### Requirement: Production runtime hides demo tooling by default

The application SHALL NOT render demo or simulation tooling in the default runtime. Demo tooling includes Simulation Panel controls, quick demo login/dashboard entry, fake account database panels, pending-account password display, staff dashboard simulation entry, and simulation invite toasts.

#### Scenario: Default runtime hides demo controls
- **WHEN** the app is started without `VITE_ENABLE_DEMO_TOOLS=true`
- **THEN** the login screen does not show simulation controls or quick demo dashboard entry
- **AND** pending account passwords are not rendered in UI

#### Scenario: Demo tooling is explicitly enabled
- **WHEN** the app is started in development or test with `VITE_ENABLE_DEMO_TOOLS=true`
- **THEN** demo controls may render for test and smoke workflows

### Requirement: Storage-backed product flows remain available

The production runtime SHALL keep merchant login, registration, onboarding, dashboard, customer tipping, staff invite, and staff dashboard flows available with the current storage-backed adapter until the API phase implements real endpoints.

#### Scenario: Product flow does not require API adapter
- **WHEN** `VITE_DATA_SOURCE` is unset or `storage`
- **THEN** product flows continue to read and write through repositories backed by `storageAdapter`

### Requirement: API runtime remains out of scope

The change SHALL NOT make `VITE_DATA_SOURCE=api` a supported production mode. API adapter stubs may remain present and throw until the API phase.

#### Scenario: API adapter is not implemented in this phase
- **WHEN** `VITE_DATA_SOURCE=api`
- **THEN** API adapters may still throw `NotImplemented`
