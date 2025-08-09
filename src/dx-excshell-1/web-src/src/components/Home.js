/*
* <license header>
*/

import React from 'react'
import { Heading, View, Text, Flex, Content, Divider } from '@adobe/react-spectrum'
import { ENABLE_DEMO_MODE } from '../utils/demoMode'

export const Home = () => (
  <View maxWidth="size-6000">
    <Content>
      <Flex direction='column' gap='size-300'>
        <Heading level={1}>Welcome to Brand to Agency</Heading>
        
        <Divider size="S" />
        
        <Text>
          The Brand to Agency solution is an active proof of concept designed to connect 
          asset workflows between brand-owned AEM environments and agencies in a secure 
          and auditable way.
        </Text>
        
        {ENABLE_DEMO_MODE && (
          <View 
            backgroundColor="blue-100" 
            padding="size-200" 
            borderRadius="medium"
            borderWidth="thin"
            borderColor="blue-300"
          >
            <Flex direction="column" gap="size-100">
              <Heading level={3}>Demo Mode Features</Heading>
              <Text>
                • Company registration form with simulated API responses<br/>
                • Registration management with 3 sample companies<br/>
                • Search, filter, and CRUD operations<br/>
                • Realistic delays and user feedback
              </Text>
            </Flex>
          </View>
        )}
        
        <Flex direction="column" gap="size-200">
          <Heading level={2}>Getting Started</Heading>
          <Text>
            Use the navigation menu above to:
          </Text>
          <View paddingStart="size-200">
            <Text>
              • <strong>Agency Registration</strong>: Register a new company<br/>
              • <strong>View Registrations</strong>: Manage existing registrations<br/>
              • <strong>About</strong>: Learn more about the application
            </Text>
          </View>
        </Flex>
      </Flex>
    </Content>
  </View>
)
