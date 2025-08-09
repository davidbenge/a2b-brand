/* 
* <license header>
*/

import React from 'react'
import { Provider, defaultTheme, View, Flex } from '@adobe/react-spectrum'
import ErrorBoundary from 'react-error-boundary'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import SpectrumHeader from './common/SpectrumHeader'
import ActionsForm from './ActionsForm'
import { Home } from './Home'
import { About } from './About'
import AgencyRegistrationView from './layout/AgencyRegistrationView'
import CompanyRegistrationList from './layout/CompanyRegistrationList'
import { ENABLE_DEMO_MODE, getSafeViewProps, logDemoMode } from '../utils/demoMode'

function App (props) {
  logDemoMode('App component initialized', { 
    runtime: !!props.runtime, 
    viewProps: !!props.viewProps,
    ENABLE_DEMO_MODE 
  })

  // Get safe view props with demo mode fallbacks
  const safeViewProps = getSafeViewProps(props.viewProps)

  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime?.on('configuration', (configProps) => {
    logDemoMode('Runtime configuration change', configProps)
  })

  // respond to history change events
  props.runtime?.on('history', ({ type, path }) => {
    logDemoMode('History change', { type, path })
  })

  return (
    <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
      <Router>
        <Provider theme={defaultTheme} colorScheme={'light'}>
          <Flex direction="column" height="100vh">
            {/* Spectrum Header with Navigation */}
            <SpectrumHeader viewProps={safeViewProps} />
            
            {/* Main Content Area */}
            <View 
              flex="1" 
              padding="size-300"
              overflow="auto"
              backgroundColor="gray-50"
            >
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/agency_registration' element={<AgencyRegistrationView viewProps={safeViewProps} />}/>
                <Route path='/registrations' element={<CompanyRegistrationList viewProps={safeViewProps} />}/>
                <Route path='/about' element={<About />}/>
              </Routes>
            </View>
          </Flex>
        </Provider>
      </Router>
    </ErrorBoundary>
  )

  // Methods

  // error handler on UI rendering failure
  function onError (e, componentStack) { }

  // component to show if UI fails rendering
  function fallbackComponent ({ componentStack, error }) {
    return (
      <React.Fragment>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>
          Something went wrong :(
        </h1>
        <pre>{componentStack + '\n' + error.message}</pre>
      </React.Fragment>
    )
  }
}

export default App
