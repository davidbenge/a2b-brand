import { useCallback, useMemo, useReducer, useState, useEffect } from 'react';

import axios from 'axios';
import {
  View,
  Text,
  Flex,
  Header,
  Button,
  Heading,
  Content,
  Divider,
  TextField,
  StatusLight
} from '@adobe/react-spectrum';

import { apiService } from '../../services/api';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import { Brand } from '../../../../../actions/classes/Brand';

interface CompanyRegistrationForm {
  name: string;
  primaryContact: string;
  phoneNumber: string;
}

interface AgencyRegistrationFormProps {
  viewProps: ViewPropsBase;
}
const initialState: CompanyRegistrationForm = {
  name: '',
  primaryContact: '',
  phoneNumber: ''
};

const reducer = (state, action) => {
  return {
    ...state,
    ...action
  };
};

const AgencyRegistrationForm: React.FC<AgencyRegistrationFormProps> = ({
  viewProps,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useReducer(reducer, initialState);

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
}, []);

  const endPointUrl = `https://${viewProps.aioRuntimeNamespace}.adobeio-static.net/api/v1/web/${viewProps.aioActionPackageName}/agency-event-handler`;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createBrand({
        ...formData,
        endPointUrl
      });

      if (response.statusCode === 200) {
        setSubmitted(true);
        setFormData(initialState);
      } else {
        setError(
          response.body?.error || 'Registration failed. Please try again.'
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error || 'Registration failed. Please try again.'
        );
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback(
    (field: keyof CompanyRegistrationForm, value: string) => {
      setFormData({ [field]: value });
    },
    []
  );

  const isFormValid = useMemo(() => {
    // TODO: Add validation for each field
    return Object.values(formData).every((value) => value !== '');
  }, [formData]);

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
              Thank you for registering your company. We will review your
              information and contact you soon.
            </Text>
            <Button
              variant="primary"
              width={'size-3000'}
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

          {error && <StatusLight variant="negative">{error}</StatusLight>}

          <View>
            <Button
              width={'size-2400'}
              variant="primary"
              onPress={handleSubmit}
              isDisabled={loading || !isFormValid}
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </View>
        </Flex>
      </Content>
    </View>
  );
};

export default AgencyRegistrationForm;
