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
    endPointUrl: string;
}

const AgencyRegistrationView: React.FC<{ viewProps?: ViewPropsBase }> = ({ viewProps }) => {
    // Use safe view props with demo mode fallbacks
    const safeViewProps = getSafeViewProps(viewProps);
    
    const [loading, setLoading] = useState(!ENABLE_DEMO_MODE);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [brandBaseUrl, setBrandBaseUrl] = useState('');
    const [formData, setFormData] = useState<CompanyRegistrationForm>({
        name: '',
        primaryContact: '',
        phoneNumber: '',
        endPointUrl:''
    });
    const [agencyBaseUrl, setAgencyBaseUrl] = useState('');
    const [imsOrg, setImsOrg] = useState('');

    useEffect(() => {
        logDemoMode('AgencyRegistrationView initialized', { safeViewProps, ENABLE_DEMO_MODE });

        const brandBaseUrl = `https://${safeViewProps.aioRuntimeNamespace}.adobeioruntime.net/api/v1/web/${safeViewProps.aioActionPackageName}/agency-event-handler`;
        const agencyBaseUrl = `${safeViewProps.agencyBaseUrl}/api/v1/web/a2b-agency/new-brand-registration`;
        const imsOrg = safeViewProps.imsOrg;
        console.log('AgencyRegistrationView props', viewProps);
        console.log('AgencyRegistrationView specific props:', {
            aioRuntimeNamespace: viewProps.aioRuntimeNamespace,
            aioAppName: viewProps.aioActionPackageName,
            agencyBaseUrl: viewProps.agencyBaseUrl
        });

        // Validate required properties with detailed error messages
        if (!viewProps.aioRuntimeNamespace) {
            console.error('aioRuntimeNamespace is not properly configured:', viewProps.aioRuntimeNamespace);
            setError('Configuration error: Adobe I/O Runtime namespace not available. Please check your environment configuration.');
            return;
        }
        
        if (!viewProps.aioActionPackageName) {
            console.error('aioActionPackageName is not properly configured:', viewProps.aioActionPackageName);
            setError('Configuration error: Adobe I/O App name not available. Please check your environment configuration.');
            return;
        }
        
        if (!viewProps.agencyBaseUrl) {
            console.error('agencyBaseUrl is not properly configured:', viewProps.agencyBaseUrl);
            setError('Configuration error: Agency base URL not available. Please check your environment configuration.');
            return;
        }

        setBrandBaseUrl(brandBaseUrl);
        setAgencyBaseUrl(agencyBaseUrl);
        setImsOrg(imsOrg);

        // Clear loading state in demo mode
        if (ENABLE_DEMO_MODE) {
            setLoading(false);
        }
    }, [safeViewProps]);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        if (ENABLE_DEMO_MODE) {
            // Demo mode: simulate API call
            logDemoMode('Submitting company registration', formData);
            
            try {
                await simulateApiDelay(1500); // Simulate realistic API delay
                
                // Create new mock registration entry
                const newRegistration = {
                    id: Date.now().toString(),
                    name: formData.name,
                    primaryContact: formData.primaryContact,
                    phoneNumber: formData.phoneNumber,
                    endPointUrl: brandBaseUrl,
                    status: 'pending' as const,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                logDemoMode('Registration successful (demo)', newRegistration);
                setSubmitted(true);
                setSuccess('Registration submitted successfully! (Demo Mode)');
                setFormData({
                    name: '',
                    primaryContact: '',
                    phoneNumber: '',
                    endPointUrl: ''
                });
            } catch (err) {
                setError('Demo mode: Simulated error occurred');
            }
        } else {
            // Production mode: real API call
            try {
                formData.endPointUrl = brandBaseUrl; //bolt on the brand base url to the form data
                const response = await axios.post(
                    agencyBaseUrl,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-gw-ims-org-id': imsOrg
                        }
                    }
                );
                
                if (response.status === 200) {
                    setSubmitted(true);
                    setSuccess('Registration submitted successfully!');
                    setFormData({
                        name: '',
                        primaryContact: '',
                        phoneNumber: '',
                        endPointUrl: ''
                    });
                } else {
                    setError(response.data.error || 'Registration failed. Please try again.');
                }
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.error || 'Registration failed. Please try again.');
                } else {
                    setError('An unexpected error occurred. Please try again.');
                }
                console.error('Registration error:', err);
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
                        placeholder="Enter your company name"
                    />
                    
                    <TextField
                        label="Primary Contact"
                        value={formData.primaryContact}
                        onChange={(value) => handleInputChange('primaryContact', value)}
                        isRequired
                        placeholder="Enter primary contact name"
                    />
                    
                    <TextField
                        label="Phone Number"
                        value={formData.phoneNumber}
                        onChange={(value) => handleInputChange('phoneNumber', value)}
                        isRequired
                        placeholder="Enter phone number"
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