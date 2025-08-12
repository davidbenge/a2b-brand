import { useCallback, useMemo, useReducer, useState } from 'react';

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
  StatusLight,
  ActionButton
} from '@adobe/react-spectrum';
import ArrowLeft from '@spectrum-icons/workflow/ArrowLeft';

import { apiService } from '../../services/api';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import type { IBrand } from '../../../../../actions/types';
import { Brand } from '../../../../../actions/classes/Brand';


interface CompanyRegistrationForm {
  name: string;
  primaryContact: string;
  phoneNumber: string;
  endPointUrl: string;
}

interface AgencyRegistrationFormProps {
  updateBrands: (brand: IBrand) => void;
  changeViewType: () => void;
  viewProps: ViewPropsBase;
}
const initialState: CompanyRegistrationForm = {
  name: '',
  primaryContact: '',
  phoneNumber: '',
  endPointUrl: ''
};

const reducer = (state, action) => {
  return {
    ...state,
    ...action
  };
};

const AgencyRegistrationForm: React.FC<AgencyRegistrationFormProps> = ({
  viewProps,
  updateBrands,
  changeViewType
}) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useReducer(reducer, initialState);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.createBrand(formData);

      if (response.statusCode === 200) {
        setSubmitted(true);
        setFormData(initialState);
        updateBrands(new Brand(response.body.data));
      } else {
        setError(
          response.body.error || 'Registration failed. Please try again.'
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
          <ActionButton isQuiet onPress={changeViewType}>
            <ArrowLeft /> <Text>Back to List</Text>
          </ActionButton>
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
          <ActionButton isQuiet onPress={changeViewType}>
            <ArrowLeft /> <Text>Back to List</Text>
          </ActionButton>
          <Heading level={1}>Company Registration</Heading>
          <Text>Welcome, {viewProps.imsProfile.email}</Text>
        </Header>
        <Divider size="S" />

        <Flex direction="column" gap="size-200" marginTop="size-200">
          <View>
            <TextField
              label="Company Name"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              isRequired
              placeholder="Enter your company name"
            />
            <TextField
              marginStart="size-200"
              label="Primary Contact"
              value={formData.primaryContact}
              onChange={(value) => handleInputChange('primaryContact', value)}
              isRequired
              placeholder="Enter primary contact name"
            />
          </View>

          <View>
            <TextField
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(value) => handleInputChange('phoneNumber', value)}
              isRequired
              placeholder="Enter phone number"
            />
            <TextField
              marginStart="size-200"
              label="Enter endpoint url"
              value={formData.endPointUrl}
              onChange={(value) => handleInputChange('endPointUrl', value)}
              isRequired
              placeholder="Enter endpoint url"
            />
          </View>

          {error && <StatusLight variant="negative">{error}</StatusLight>}

          <Button
            width={'size-2400'}
            variant="primary"
            onPress={handleSubmit}
            isDisabled={loading || !isFormValid}
          >
            {loading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </Flex>
      </Content>
    </View>
  );
};

export default AgencyRegistrationForm;
