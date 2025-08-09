import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Flex,
    Text,
    ActionButton,
    View,
    StatusLight
} from '@adobe/react-spectrum';
import { ENABLE_DEMO_MODE } from '../../utils/demoMode';

interface SpectrumHeaderProps {
    viewProps?: any;
}

const SpectrumHeader: React.FC<SpectrumHeaderProps> = ({ viewProps }) => {
    const location = useLocation();
    const navigate = useNavigate();

                        const navItems = [
        { label: 'Home', path: '/' },
        { label: 'Agency Registration', path: '/agencies' },
        { label: 'View Registrations', path: '/registrations' },
        { label: 'Sync Status', path: '/sync' },
        { label: 'About', path: '/about' }
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') {
            return true;
        }
        return path !== '/' && location.pathname.startsWith(path);
    };

    return (
        <View 
            backgroundColor="blue-600" 
            paddingX="size-300" 
            paddingY="size-200"
            borderBottomWidth="thick"
            borderBottomColor="blue-700"
        >
            <Flex 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center"
                wrap
                gap="size-200"
            >
                {/* Brand/Client Label */}
                <Flex direction="column" gap="size-50">
                    <Text 
                        UNSAFE_style={{ 
                            color: 'white', 
                            fontSize: '18px', 
                            fontWeight: 'bold' 
                        }}
                    >
                        Brand/Client
                        {ENABLE_DEMO_MODE && ' (Demo Mode)'}
                    </Text>
                    {viewProps?.imsProfile?.email && (
                        <Text 
                            UNSAFE_style={{ 
                                color: 'rgba(255, 255, 255, 0.8)', 
                                fontSize: '12px' 
                            }}
                        >
                            {viewProps.imsProfile.email}
                        </Text>
                    )}
                </Flex>

                {/* Navigation Items */}
                <Flex 
                    direction="row" 
                    gap="size-100" 
                    alignItems="center"
                    wrap
                >
                    {navItems.map((item) => (
                        <ActionButton
                            key={item.path}
                            onPress={() => navigate(item.path)}
                            isQuiet
                            UNSAFE_style={{
                                color: isActive(item.path) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                                backgroundColor: isActive(item.path) 
                                    ? 'rgba(255, 255, 255, 0.2)' 
                                    : 'transparent',
                                borderRadius: '4px',
                                padding: '8px 16px',
                                fontWeight: isActive(item.path) ? 'bold' : 'normal',
                                border: 'none',
                                transition: 'all 0.2s ease',
                                minHeight: '36px'
                            }}
                            UNSAFE_className="spectrum-header-nav-item"
                        >
                            {item.label}
                        </ActionButton>
                    ))}
                </Flex>

                {/* Demo Mode Indicator */}
                {ENABLE_DEMO_MODE && (
                    <StatusLight 
                        variant="info"
                        UNSAFE_style={{
                            '--spectrum-global-color-status-info': '#ffffff',
                            color: 'white'
                        }}
                    >
                        <Text UNSAFE_style={{ color: 'white', fontSize: '12px' }}>
                            Demo Mode Active
                        </Text>
                    </StatusLight>
                )}
            </Flex>
        </View>
    );
};

export default SpectrumHeader;
