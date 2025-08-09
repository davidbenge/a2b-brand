/* 
* <license header>
*/

import React from 'react'
import { Heading, View, Content, Link, Text, Flex, Divider } from '@adobe/react-spectrum'

export const About = () => (
  <View maxWidth="size-6000">
    <Content>
      <Flex direction="column" gap="size-300">
        <Heading level={1}>About Brand to Agency</Heading>
        <Divider size="S" />
        
        <Text>
          The Brand to Agency (B2A) solution is an active proof of concept built using Adobe App Builder. 
          It's designed to connect asset workflows between brand-owned AEM environments and agencies 
          in a secure and auditable way.
        </Text>
        
        <Heading level={2}>Key Features</Heading>
        <View paddingStart="size-200">
          <Text>
            • <strong>Agency Registration</strong>: Secure registration process for agencies<br/>
            • <strong>Asset Synchronization</strong>: Real-time asset sync between brand and agency<br/>
            • <strong>Event-Driven Architecture</strong>: CloudEvents-based communication<br/>
            • <strong>Demo Mode</strong>: Comprehensive demo functionality for development and testing
          </Text>
        </View>
        
        <Heading level={2}>Technologies Used</Heading>
        <View paddingStart="size-200">
          <Text>
            • Adobe App Builder & I/O Runtime<br/>
            • Adobe React Spectrum Design System<br/>
            • React 16.13.1 with TypeScript<br/>
            • Adobe Experience Cloud Shell<br/>
            • CloudEvents Specification
          </Text>
        </View>
        
        <Heading level={2}>Useful Documentation</Heading>
        <Content>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://github.com/AdobeDocs/project-firefly/blob/master/README.md#project-firefly-developer-guide' target='_blank'>
                  Adobe Developer App Builder
                </a>
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://github.com/adobe/aio-sdk#adobeaio-sdk' target='_blank'>
                  Adobe I/O SDK
                </a>
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://adobedocs.github.io/adobeio-runtime/' target='_blank'>
                  Adobe I/O Runtime
                </a>
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link>
                <a href='https://react-spectrum.adobe.com/react-spectrum/index.html' target='_blank'>
                  React Spectrum
                </a>
              </Link>
            </li>
          </ul>
        </Content>
      </Flex>
    </Content>
  </View>
)
