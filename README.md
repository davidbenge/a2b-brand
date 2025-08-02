# a2b Brand Application 

The Brand to Agency solution is an active proof of concept being developed using Adobe App Builder. It's designed to connect asset workflows between brand-owned AEM environments and agencies in a secure and auditable way—enabling brands to share assets with agencies without requiring direct access to the brand's systems.
This POC establishes a repeatable pattern that can be shared with brands to build their own Brand-to-Agency extension using Adobe App Builder and distributing on Adobe Exchange.

[Agency To Brand](https://github.com/davidbenge/a2b-agency)   
[Adobe](https://github.com/davidbenge/a2b-adobe)   


## Prerequisites

- Node.js = 20
- Adobe I/O CLI (`aio`)
- Adobe Developer Console access

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Populate the `.env` file in the project root and fill it as shown [below](#environment-variables)
4. Start the development server:
   ```bash
   npm run run:application
   ```

## Local Development

- `npm run run:application` - Run the application locally
- `npm run run:excshell` - Run the application in Experience Cloud Shell

## Testing & Coverage



## Dependencies

This project uses several key Adobe and React libraries:

- @adobe/aio-sdk
- @adobe/exc-app
- @adobe/react-spectrum
- React 16.13.1
- TypeScript
- Jest for testing

## Configuration

### Environment Variables

You can generate the `.env` file using the command `aio app use`. 

```bash
# This file must **not** be committed to source control

# Adobe I/O Runtime
AIO_RUNTIME_AUTH=
AIO_RUNTIME_NAMESPACE=

# Adobe I/O Events
AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID=
AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID=

# AEM Authentication
AEM_AUTH_CLIENT_SECRET=
AEM_AUTH_SCOPES=
AEM_AUTH_CLIENT_ID=
AEM_AUTH_TECH_ACCOUNT_ID=
AEM_AUTH_PRIVATE_KEY=
AEM_AUTH_TYPE=

# Service-to-Service Authentication
S2S_API_KEY=
S2S_CLIENT_SECRET=
S2S_SCOPES=

# Organization
ORG_ID=
```

### Application Runtime Information

The application implements a sophisticated runtime isolation mechanism to prevent event cross-contamination between different development environments. This is particularly important when multiple developers are working simultaneously or debugging in the same IMS organization, as event providers are shared across the entire organization.

#### How It Works

1. **Runtime Parameter Injection**: Every action receives an `APPLICATION_RUNTIME_INFO` parameter containing:
   ```json
   {
     "namespace": "${AIO_runtime_namespace}",
     "app_name": "${AIO_APP_NAME}"
   }
   ```

2. **Namespace Parsing**: The namespace is automatically parsed into three distinct components:
   - `consoleId`: The Adobe Developer Console identifier
   - `projectName`: The specific project name
   - `workspace`: The development workspace (e.g., dev, stage, prod)

3. **Event Enrichment**: Every event published through the EventManager automatically includes an `app_runtime_info` property in the event data:
   ```json
   {
     "app_runtime_info": {
       "consoleId": "console123",
       "projectName": "a2b-brand",
       "workspace": "dev"
     }
   }
   ```

#### Benefits

- **Environment Isolation**: Events can be filtered by runtime information, ensuring you only process events from your specific development environment
- **Debugging Clarity**: Eliminates confusion from seeing events from other developers' environments
- **Multi-tenant Safety**: Prevents accidental processing of events from other projects or workspaces
- **Audit Trail**: Provides clear traceability of which environment generated each event

#### Implementation Details

The runtime information is automatically handled by the EventManager and IoCustomEventManager classes. No additional code is required in your event handlers - the system transparently adds the runtime context to all outgoing events.

This feature is particularly valuable in enterprise development scenarios where multiple teams may be working on similar applications within the same Adobe I/O organization, ensuring clean separation of concerns and preventing unintended event processing.

### Project Configuration

```yaml
benge app project in TMD dev org: 27200-brand2agency-stage
title: brand to agency
```

## Project Structure

```
.
├── src/                          # Source code
│   ├── actions/                  # Adobe I/O Runtime actions
│   │   ├── agency-assetsync-event-handler/  # Asset sync event handling
│   │   ├── agency-assetsync-internal-handler/  # Internal assetsync event handler
│   │   ├── agency-event-handler/  # Agency event routing
│   │   ├── adobe-product-event-handler/  # Adobe product event handling
│   │   ├── classes/             # Shared classes
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   └── constants.ts         # Shared constants
│   └── dx-excshell-1/           # Experience Cloud Shell configuration
│       ├── web-src/             # Web application source
│       ├── test/                # Unit tests
│       ├── e2e/                 # End-to-end tests
│       └── ext.config.yaml      # Extension configuration
├── test/                        # Test files
├── docs/                        # Documentation
├── setup/                       # Setup scripts
└── dist/                        # Build output
```

## API Endpoints

The application exposes the following endpoints:

- `POST /api/v1/web/a2b-brand/agency-event-handler` - Route agency events to appropriate internal handlers
  - **Required Parameters**: `APPLICATION_RUNTIME_INFO` (JSON string with namespace and app_name), `type` (event type), `data` (event data with app_runtime_info)
  - **Validation**: Ensures event workspace matches action workspace for environment isolation
  - **Event Types Handled**:
    - `com.adobe.a2b.assetsync.*` → routes to `agency-assetsync-internal-handler`
- `POST /api/v1/web/a2b-brand/adobe-product-event-handler` - Route events from Adobe products to appropriate internal handlers
  - **Required Parameters passed in config**: `APPLICATION_RUNTIME_INFO` (JSON string with namespace and app_name)
  - **Event Types Handled**:
    - `aem.assets.asset.created` → routes to `agency-assetsync-event-handler`
    - `aem.assets.asset.updated` → routes to `agency-assetsync-event-handler`
    - `aem.assets.asset.deleted` → routes to `agency-assetsync-event-handler`
    - `aem.assets.asset.metadata_updated` → routes to `agency-assetsync-event-handler`

## Actions

The application also includes the following non-web actions:

- `agency-assetsync-event-handler` - Handle asset synchronization events from agencies (direct action invocation only)
  - **Required Parameters**: `APPLICATION_RUNTIME_INFO` (JSON string with namespace and app_name)
- `agency-assetsync-internal-handler` - Internal handler for com.adobe.a2b.assetsync events (direct action invocation only)
  - **Required Parameters**: `APPLICATION_RUNTIME_INFO` (JSON string with namespace and app_name), `type` (event type), `data` (event data with app_runtime_info)

All actions and endpoints automatically include runtime information in all published events for environment isolation.

## Event Routing Architecture

The application implements a two-tier event routing system:

### Adobe Product Event Routing

The `adobe-product-event-handler` serves as a central router for Adobe product events. It receives events from various Adobe products and routes them to the appropriate internal handlers based on the event type.

### Agency Event Routing

The `agency-event-handler` serves as a central router for agency events. It receives events from agencies and routes them to the appropriate internal handlers based on the event type.

#### Workspace Validation

The agency event handler includes workspace validation to ensure environment isolation:
- **Validation Logic**: Compares `params.data.app_runtime_info.workspace` with the workspace parsed from `APPLICATION_RUNTIME_INFO`
- **Security**: Prevents events from different workspaces (dev, stage, prod) from being processed by the wrong environment
- **Error Handling**: Returns 400 error with clear message when workspace mismatch is detected

### How Event Routing Works

1. **Event Reception**: The `adobe-product-event-handler` receives events from Adobe products via webhook
2. **Event Type Analysis**: The handler examines the `type` field of the incoming event
3. **Routing Decision**: Based on the event type, it determines which internal handler should process the event
4. **Action Invocation**: Uses OpenWhisk action invocation to call the appropriate internal handler
5. **Result Return**: Returns the routing result along with the original event processing status

### Current Event Type Mappings

#### Adobe Product Events
| Adobe Product Event Type | Internal Handler | Description |
|-------------------------|------------------|-------------|
| `aem.assets.asset.created` | `agency-assetsync-event-handler` | AEM asset creation events |
| `aem.assets.asset.updated` | `agency-assetsync-event-handler` | AEM asset update events |
| `aem.assets.asset.deleted` | `agency-assetsync-event-handler` | AEM asset deletion events |
| `aem.assets.asset.metadata_updated` | `agency-assetsync-event-handler` | AEM asset metadata changes |

#### Agency Events
| Agency Event Type | Internal Handler | Description |
|------------------|------------------|-------------|
| `com.adobe.a2b.assetsync.new` | `agency-assetsync-internal-handler` | New asset synchronization events |
| `com.adobe.a2b.assetsync.updated` | `agency-assetsync-internal-handler` | Asset synchronization update events |
| `com.adobe.a2b.assetsync.deleted` | `agency-assetsync-internal-handler` | Asset synchronization deletion events |

### Extending Event Routing

To add support for new Adobe product events:

1. Add the new event type to the switch statement in `adobe-product-event-handler`
2. Create a new routing function (e.g., `routeToCreativeCloudHandler`)
3. Create the corresponding internal handler action
4. Update the documentation and tests

## Unified Shell API

For more information, visit the [Unified Shell API documentation](https://github.com/AdobeDocs/exc-app).

## Event Registration

### Agency Registration Events

1. Create event provider:
```bash
aio event provider create
```
Label: "a2b-Brand Registration"
Description: Events from an agency into a brand

2. Create event metadata:
```bash
aio event eventmetadata create <id>
```

#### Event Types

1. **Brand Registration Received**
   - Label: "Brand Registration Received"
   - Code: `com.adobe.a2b.registration.received`
   - Description: "This contains an echo of event that was received from remote brand"

```json
{
  "specversion": "1.0",
  "id": "20daaf84-c938-48e6-815c-3d3dfcf8c900",
  "source": "urn:uuid:fefcd900-66b6-4a46-9494-1b9ff1c5d0ac",
  "type": "com.adobe.a2b.registration.received",
  "datacontenttype": "application/json",
  "time": "2025-06-08T05:44:51.686Z",
  "eventid": "591c4e47-6ba1-4599-a136-5ccb43157353",
  "event_id": "591c4e47-6ba1-4599-a136-5ccb43157353",
  "recipient_client_id": "4ab33463139e4f96b851589286cd46e4",
  "recipientclientid": "4ab33463139e4f96b851589286cd46e4",
  "data": {
    "brandId": "2e59b727-4f9c-4653-a6b9-a49a602ec983",
    "secret": "PFVZNkBLH9iquYvr8hGSctesInK4QlRh",
    "name": "test agency benge 37",
    "endPointUrl": "https://pathtoendpoint/37",
    "enabled": false,
    "createdAt": "2025-06-08T05:44:51.219Z",
    "updatedAt": "2025-06-08T05:44:51.219Z",
    "app_runtime_info": {
      "consoleId": "console123",
      "projectName": "a2b-brand",
      "workspace": "dev"
    }
  }
}
```

2. **Agency Registration Enabled**
   - Label: "Agency Registration Enabled"
   - Code: `com.adobe.a2b.registration.enabled`
   - Description: "When an admin approves a brand registration this event is thrown"

```json
{
  "specversion": "1.0",
  "id": "381691a0-a5c6-4c97-b1ac-662a06686856",
  "source": "urn:uuid:fefcd900-66b6-4a46-9494-1b9ff1c5d0ac",
  "type": "com.adobe.a2b.registration.enabled",
  "datacontenttype": "application/json",
  "time": "2025-06-08T05:39:47.227Z",
  "eventid": "d72bccdb-1af0-4c01-b802-fea422383017",
  "event_id": "d72bccdb-1af0-4c01-b802-fea422383017",
  "recipient_client_id": "4ab33463139e4f96b851589286cd46e4",
  "recipientclientid": "4ab33463139e4f96b851589286cd46e4",
  "data": {
    "aid": "f94496b9-a40c-4d7a-8c4e-e59db029f247",
    "secret": "Uebq3tGYkoDoxonUxQizqKFHzHG703F1",
    "name": "test agency benge 36",
    "endPointUrl": "https://pathtoendpoint/36",
    "enabled": false,
    "createdAt": "2025-06-08T05:39:46.778Z",
    "updatedAt": "2025-06-08T05:39:46.778Z",
    "app_runtime_info": {
      "consoleId": "console123",
      "projectName": "a2b-brand",
      "workspace": "dev"
    }
  }
}
```

3. **Brand Registration Disabled**
   - Label: "Brand Registration Disabled"
   - Code: `com.adobe.a2b.registration.disabled`
   - Description: "When an admin disables a brand registration this event is thrown"

```json
{
  "specversion": "1.0",
  "id": "706c19f6-2975-49a3-9e33-39672aed756e",
  "source": "urn:uuid:fefcd900-66b6-4a46-9494-1b9ff1c5d0ac",
  "type": "com.adobe.a2b.registration.disabled",
  "datacontenttype": "application/json",
  "time": "2025-06-08T05:42:22.333Z",
  "eventid": "175cf397-6b9f-4bb9-9aaa-943d5c42333d",
  "event_id": "175cf397-6b9f-4bb9-9aaa-943d5c42333d",
  "recipient_client_id": "4ab33463139e4f96b851589286cd46e4",
  "recipientclientid": "4ab33463139e4f96b851589286cd46e4",
  "data": {
    "bid": "4e9976ab-95ea-47c1-a2e3-7e266aa47935",
    "secret": "OMWwg3qNE5Mxlwye1KGXj3zYy7ORT9FC",
    "name": "test client benge 36",
    "endPointUrl": "https://pathtoendpoint/36",
    "enabled": false,
    "createdAt": "2025-06-08T05:42:21.855Z",
    "updatedAt": "2025-06-08T05:42:21.855Z",
    "app_runtime_info": {
      "consoleId": "console123",
      "projectName": "a2b-brand",
      "workspace": "dev"
    }
  }
}
```

### Environment Configuration

Update your `.env` with the provider id returned by `aio event provider create`:
```bash
AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID=fefcd900-fake-fake-fake-1b9ff1c5d0ac
```

## Asset Synchronization Events

### Event Provider Setup

```bash
aio event provider create
```
Label: "A2B Asset Sync"
Description: Event from Agency to Brand about an asset update

### Event Types

Create event metadata:
```bash
aio event eventmetadata create <provider_id>
```

1. **New Asset Published**
   - Label: "New Agency Asset Published"
   - Code: `com.adobe.a2b.assetsync.new`
   - Description: "Asset that has never been synced before is coming over for the first time"
   - Event body: Includes `app_runtime_info` for environment isolation

2. **Asset Updated**
   - Label: "Asset Updated"
   - Code: `com.adobe.a2b.assetsync.updated`
   - Description: "Asset that has been synced before has changed"
   - Event body: Includes `app_runtime_info` for environment isolation

3. **Asset Deleted**
   - Label: "Asset Deleted"
   - Code: `com.adobe.a2b.assetsync.deleted`
   - Description: "Asset that has been synced before has been deleted"
   - Event body: Includes `app_runtime_info` for environment isolation

### Asset Synchronization Setup

The `agency-assetsync-event-handler` is a non-web action that can be invoked directly by other actions or services. It handles asset synchronization events and can be triggered programmatically.

For AEM asset event processing, you can:
1. Invoke the action directly from other actions using the Adobe I/O Runtime SDK
2. Set up triggers to automatically invoke the action based on specific conditions
3. Use the action as part of a workflow or pipeline

Events that can be processed:
- Asset deleted event: `aem.assets.asset.deleted`
- Asset metadata updated event: `aem.assets.asset.metadata_updated`

These events will be published to the BRAND and also echoed locally for secondary in-house systems use.

## Troubleshooting

### Common Issues

1. **Authentication Issues**
   - Ensure all required environment variables are set
   - Verify Adobe I/O credentials are valid
   - Check AEM authentication configuration

2. **Asset Synchronization Issues**
   - Verify AEM event subscriptions
   - Check asset sync provider configuration
   - Review logs for detailed error messages

## Rules
1. all event are cloud events see (cloud events)[https://github.com/cloudevents/spec]

## Contributing

1. Ensure you have the required dependencies installed
2. Follow the coding standards (ESLint configuration is provided)
3. Write tests for new features that are actions. UI is nice to have but not wired
4. Submit a pull request

