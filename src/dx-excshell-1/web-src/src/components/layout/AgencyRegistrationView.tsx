import { useEffect, useState } from 'react';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import axios from 'axios';
import { 
    View, 
    Text, 
    Heading, 
    Button, 
    Flex, 
    Form, 
    TextField, 
    Content,
    Header,
    Divider,
    StatusLight
} from '@adobe/react-spectrum';
import { 
    ENABLE_DEMO_MODE, 
    getSafeViewProps, 
    simulateApiDelay, 
    logDemoMode, 
    mockCompanyRegistrations 
} from '../../utils/demoMode';

interface CompanyRegistrationForm {
    name: string;
    primaryContact: string;
    phoneNumber: string;
}

const AgencyRegistrationView: React.FC<{ viewProps?: ViewPropsBase }> = ({ viewProps }) => {
    // Use safe view props with demo mode fallbacks
    const safeViewProps = getSafeViewProps(viewProps);
    
    const [loading, setLoading] = useState(!ENABLE_DEMO_MODE);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formData, setFormData] = useState<CompanyRegistrationForm>({
        name: '',
        primaryContact: '',
        phoneNumber: ''
    });
    const [localActionUrl, setLocalActionUrl] = useState('');

    useEffect(() => {
        logDemoMode('AgencyRegistrationView initialized', { safeViewProps, ENABLE_DEMO_MODE });

        // Build local action URL
        const localActionUrl = `https://${safeViewProps.aioRuntimeNamespace}.adobeio-static.net/api/v1/web/${safeViewProps.aioActionPackageName}/new-agency-registration`;
        
        console.log('AgencyRegistrationView props', viewProps);
        console.log('AgencyRegistrationView specific props:', {
            aioRuntimeNamespace: viewProps?.aioRuntimeNamespace,
            aioAppName: viewProps?.aioActionPackageName,
            imsProfile: viewProps?.imsProfile
        });
        console.log('Local action URL:', localActionUrl);

        // Validate required properties with detailed error messages
        if (!viewProps?.aioRuntimeNamespace) {
            console.error('aioRuntimeNamespace is not properly configured:', viewProps?.aioRuntimeNamespace);
            setError('Configuration error: Adobe I/O Runtime namespace not available. Please check your environment configuration.');
            setLoading(false);
            return;
        }
        
        if (!viewProps?.aioActionPackageName) {
            console.error('aioActionPackageName is not properly configured:', viewProps?.aioActionPackageName);
            setError('Configuration error: Adobe I/O App name not available. Please check your environment configuration.');
            setLoading(false);
            return;
        }

        setLocalActionUrl(localActionUrl);

        // Auto-fill form with user information from IMS profile
        if (viewProps?.imsProfile) {
            const displayName = viewProps.imsProfile.displayName 
                || viewProps.imsProfile.name 
                || viewProps.imsProfile.email 
                || '';
            
            const phoneNumber = viewProps.imsProfile.phoneNumber 
                || viewProps.imsProfile.phone 
                || '';

            setFormData(prev => ({
                ...prev,
                primaryContact: displayName,
                phoneNumber: phoneNumber
            }));
        }

        // Clear loading state after initialization
        setLoading(false);
    }, [viewProps]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        if (ENABLE_DEMO_MODE) {
            // Demo mode: simulate API call
            logDemoMode('Submitting company registration', { 
                ...formData,
                imsOrgName: safeViewProps.imsOrgName,
                imsOrgId: safeViewProps.imsOrg
            });
            
            try {
                await simulateApiDelay(1500); // Simulate realistic API delay
                
                logDemoMode('Registration successful (demo)');
                setSubmitted(true);
                setSuccess('Registration submitted successfully! (Demo Mode)');
                setFormData({
                    name: '',
                    primaryContact: '',
                    phoneNumber: ''
                });
            } catch (err) {
                setError('Demo mode: Simulated error occurred');
            }
        } else {
            // Production mode: Submit to local action
            try {
                const payload = {
                    data: {
                        ...formData,
                        imsOrgName: safeViewProps.imsOrgName,
                        imsOrgId: safeViewProps.imsOrg
                    }
                };
                
                console.log('Submitting brand registration to local action:');
                console.log('  POST to:', localActionUrl);
                console.log('  Full payload:', JSON.stringify(payload, null, 2));
                
                const response = await axios.post(
                    localActionUrl,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-gw-ims-org-id': safeViewProps.imsOrg,
                            'Authorization': `Bearer ${safeViewProps.imsToken}`
                        }
                    }
                );
                
                if (response.status === 200) {
                    setSubmitted(true);
                    setSuccess('Registration submitted successfully!');
                    setFormData({
                        name: '',
                        primaryContact: '',
                        phoneNumber: ''
                    });
                } else {
                    setError(response.data.error || 'Registration failed. Please try again.');
                }
            } catch (err: unknown) {
                console.error('Registration error:', err);
                
                if (axios.isAxiosError(err)) {
                    const errorMessage = err.response?.data?.body?.error 
                        || err.response?.data?.error 
                        || err.response?.data?.message
                        || err.message
                        || 'Registration failed. Please try again.';
                    
                    console.error('API Error Response:', {
                        status: err.response?.status,
                        statusText: err.response?.statusText,
                        data: err.response?.data
                    });
                    
                    setError(errorMessage);
                } else {
                    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
                    setError(errorMessage);
                }
            }
        }
        
        setLoading(false);
    };

    const handleInputChange = (field: keyof CompanyRegistrationForm, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (submitted) {
        return (
            <View padding="size-200">
                <Content>
                    <Header>
                        <Heading level={1}>Registration Successful!</Heading>
                    </Header>
                    <Divider size="S" />
                    
                    <Flex direction="column" gap="size-200" marginTop="size-200">
                        <StatusLight variant="positive">
                            {success || 'Registration submitted successfully!'}
                        </StatusLight>
                        <Text>
                            Thank you for registering your company. We will review your information and contact you soon.
                            {ENABLE_DEMO_MODE && ' (This is a simulated response in demo mode)'}
                        </Text>
                        <Button 
                            variant="primary" 
                            onPress={() => {
                                setSubmitted(false);
                                setSuccess(null);
                            }}
                        >
                            Register Another Company
                        </Button>
                    </Flex>
                </Content>
            </View>
        );
    }

    return (
        <View padding="size-200">
            <Content>
                <Header>
                    <Heading level={1}>Company Registration</Heading>
                    <Text>Welcome, {safeViewProps.imsProfile.email}</Text>
                </Header>
                <Divider size="S" />
                
                <Flex direction="column" gap="size-200" marginTop="size-200">
                    <TextField
                        label="Company Name"
                        value={formData.name}
                        onChange={(value) => handleInputChange('name', value)}
                        isRequired
                        description="Enter your company name"
                    />
                    
                    <TextField
                        label="Primary Contact"
                        value={formData.primaryContact}
                        onChange={(value) => handleInputChange('primaryContact', value)}
                        isRequired
                        description="Enter primary contact name"
                    />
                    
                    <TextField
                        label="Phone Number"
                        value={formData.phoneNumber}
                        onChange={(value) => handleInputChange('phoneNumber', value)}
                        isRequired
                        description="Enter phone number"
                    />

                    {error && (
                        <StatusLight variant="negative">
                            {error}
                        </StatusLight>
                    )}

                    <Button 
                        variant="primary" 
                        onPress={handleSubmit}
                        isDisabled={loading || !formData.name || !formData.primaryContact || !formData.phoneNumber}
                    >
                        {loading ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                </Flex>
            </Content>
        </View>
    );
};

export default AgencyRegistrationView;