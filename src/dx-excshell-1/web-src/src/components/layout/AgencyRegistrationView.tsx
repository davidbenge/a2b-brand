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

interface CompanyRegistrationForm {
    name: string;
    primaryContact: string;
    phoneNumber: string;
    endPointUrl: string;
}

const AgencyRegistrationView: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

        const brandBaseUrl = `https://${viewProps.aioRuntimeNamespace}.adobeio-static.net/api/v1/web/${viewProps.aioActionPackageName}/agency-event-handler`;
        const agencyBaseUrl = `${viewProps.agencyBaseUrl}/new-brand-registration`;
        const imsOrg = viewProps.imsOrg;

        setBrandBaseUrl(brandBaseUrl);
        setAgencyBaseUrl(agencyBaseUrl);
        setImsOrg(imsOrg);
    }, []);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        
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
        } finally {
            setLoading(false);
        }
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
                        <Heading level={1}>Company Registration</Heading>
                    </Header>
                    <Divider size="S" />
                    <Flex direction="column" gap="size-200" marginTop="size-200">
                        <StatusLight variant="positive">
                            Registration submitted successfully!
                        </StatusLight>
                        <Text>
                            Thank you for registering your company. We will review your information and contact you soon.
                        </Text>
                        <Button 
                            variant="primary" 
                            onPress={() => setSubmitted(false)}
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
                    <Text>Welcome, {viewProps.imsProfile.email}</Text>
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