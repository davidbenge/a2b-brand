/* 
* <license header>
*/

import React from 'react'
import { Heading, View, Content, Link, Text, Flex, Divider } from '@adobe/react-spectrum'

export const About = () => (
  <View maxWidth="size-6000">
    <Content>
      <Flex direction="column" gap="size-300">
        <Heading level={1}>About Brand/Client Portal</Heading>
        <Divider size="S" />
        
        <Text>
          This is the Brand/Client side of the Brand to Agency (B2A) solution, built using Adobe App Builder. 
          This portal allows brands to manage agency registrations, control asset workflows, and monitor 
          synchronization status with agency partners accessing brand-owned AEM environments.
        </Text>
        
        <Heading level={2}>Brand/Client Features</Heading>
        <View paddingStart="size-200">
          <Text>
            • <strong>Agency Management</strong>: Review and approve agency registration requests<br/>
            • <strong>Asset Control</strong>: Manage which assets are shared with agencies<br/>
            • <strong>Sync Monitoring</strong>: Track asset synchronization status with agency partners<br/>
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
