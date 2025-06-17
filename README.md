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


## Deployment & Cleanup

- `aio app deploy` to build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

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
AIO_AGENCY_EVENTS_AEM_ASSET_SYNCH_PROVIDER_ID=

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
│   │   ├── agency-assetsynch-event-handler/  # Asset sync event handling
│   │   ├── agency-event-handler/  # Agency event handling
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

- `POST /api/v1/web/a2b-brand/agency-assetsynch-event-handler` - Handle asset synchronization events from agencies
- `POST /api/v1/web/a2b-brand/agency-event-handler` - Handle general agency events

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
    "updatedAt": "2025-06-08T05:44:51.219Z"
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
    "updatedAt": "2025-06-08T05:39:46.778Z"
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
    "updatedAt": "2025-06-08T05:42:21.855Z"
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
Label: "A2B Asset Synch"
Description: Event from Agency to Brand about an asset update

### Event Types

1. **New Asset Published**
   - Label: "New Asset Published"
   - Code: `com.adobe.a2b.assetsynch.new`
   - Description: "Asset that has never been synched before is coming over for the first time"
   - Event body: TODO

2. **Asset Updated**
   - Label: "Asset Updated"
   - Code: `com.adobe.a2b.assetsynch.update`
   - Description: "Asset that has been synched before has changed"
   - Event body: TODO

3. **Asset Deleted**
   - Label: "Asset Deleted"
   - Code: `com.adobe.a2b.assetsynch.delete`
   - Description: "Asset that has been synched before has been deleted"
   - Event body: TODO

### Asset Synchronization Setup

Using the AEM Assets Author API, subscribe to the following events at:
`https://your_adobe_developer_project.adobeioruntime.net/api/v1/web/a2b-agency/assetsynch-event-handler`

This is done in the Adobe Developer Console. [See setup documentation](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/aem-apis/openapis/setup)

Events to subscribe to:
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
   - Check asset synchronization provider configuration
   - Review logs for detailed error messages

## Rules
1. all event are cloud events

## Contributing

1. Ensure you have the required dependencies installed
2. Follow the coding standards (ESLint configuration is provided)
3. Write tests for new features
4. Submit a pull request

