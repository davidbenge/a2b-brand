/* 
* <license header>
*/

import 'core-js/stable'
import 'regenerator-runtime/runtime'
import ReactDOM from 'react-dom'

import Runtime, { init } from '@adobe/exc-app'

import App from './components/App'
import './assets/styles/index.css'

window.React = require('react')
/* Here you can bootstrap your application and configure the integration with the Adobe Experience Cloud Shell */
try {
  // attempt to load the Experience Cloud Runtime
  require('./exc-runtime')
  // if there are no errors, bootstrap the app in the Experience Cloud Shell
  init(bootstrapInExcShell)
} catch (e) {
  console.log('application not running in Adobe Experience Cloud Shell')
  // fallback mode, run the application without the Experience Cloud Runtime
  bootstrapRaw()
}

function bootstrapRaw () {
  /* **here you can mock the exc runtime and ims objects** */
  const mockRuntime = { 
    on: () => {},
    done: () => {}
  }
  const mockIms = {}

  // Create mock viewProps for demo mode
  const mockViewProps = {
    baseUrl: 'https://demo.adobeioruntime.net',
    environment: 'demo',
    historyType: 'browser',
    imsEnvironment: 'demo',
    imsOrg: 'DEMO_ORG@AdobeOrg',
    imsOrgName: 'Demo Organization',
    imsProfile: {
      email: 'demo.user@example.com',
      name: 'Demo User',
      userId: 'demo-user-123'
    },
    imsToken: 'demo-token-12345',
    locale: 'en-US',
    preferredLanguages: ['en-US'],
    shellInfo: {
      version: '1.0.0'
    },
    tenant: 'demo-tenant',
    aioRuntimeNamespace: 'demo-namespace',
    aioAppName: 'a2b-brand-demo',
    agencyBaseUrl: 'https://demo-agency.adobeioruntime.net'
  }

  console.log('[DEMO MODE] Application running in fallback mode with mock runtime')

  // render the actual react application and pass along the runtime object to make it available to the App
  ReactDOM.render(
    <App runtime={mockRuntime} ims={mockIms} viewProps={mockViewProps} />,
    document.getElementById('root')
  )
}

function bootstrapInExcShell () {
  // get the Experience Cloud Runtime object
  const runtime = Runtime()

  // use this to set a favicon
  // runtime.favicon = 'url-to-favicon'

  // use this to respond to clicks on the app-bar title
  // runtime.heroClick = () => window.alert('Did I ever tell you you\'re my hero?')

  // ready event brings in authentication/user info
  runtime.on('ready', ({baseUrl,environment,historyType,imsEnvironment,imsOrg,imsOrgName,imsProfile,imsToken,locale,preferredLanguages,shellInfo,tenant}) => {
    // tell the exc-runtime object we are done
    runtime.done()
    //const appContainer = runtime.appApi();
    //console.log('Ready! received appContainer:', appContainer)
    console.log('Ready! received imsProfile:', imsProfile)
    
    // Try to get runtime info from the shell context or use fallbacks
    const aioRuntimeNamespace = process.env.AIO_runtime_namespace || shellInfo?.aio?.runtime?.namespace || undefined;
    const aioActionPackageName = process.env.AIO_ACTION_PACKAGE_NAME || undefined;
    const agencyBaseUrl = process.env.AGENCY_BASE_URL || undefined;

    console.log('Runtime configuration:', {
      aioRuntimeNamespace,
      aioActionPackageName,
      agencyBaseUrl,
      shellInfo: shellInfo?.aio
    });

    const viewProps = {
      baseUrl: baseUrl,
      environment: environment,
      historyType: historyType,
      imsEnvironment: imsEnvironment,
      imsOrg: imsOrg,
      imsOrgName: imsOrgName,
      imsProfile: imsProfile,
      imsToken: imsToken,
      locale: locale,
      preferredLanguages: preferredLanguages,
      shellInfo: shellInfo,
      tenant: tenant,
      aioRuntimeNamespace,
      aioActionPackageName,
      agencyBaseUrl
    }
    // render the actual react application and pass along the runtime and ims objects to make it available to the App
    ReactDOM.render(
      <App runtime={runtime} viewProps={viewProps} />,
      document.getElementById('root')
    )
  })

  // set solution info, shortTitle is used when window is too small to display full title
  runtime.solution = {
    icon: 'AdobeExperienceCloud',
    title: 'Brand to Agency',
    shortTitle: 'b2a'
  }
  runtime.title = 'b2a'
}
