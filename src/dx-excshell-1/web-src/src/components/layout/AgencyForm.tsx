import * as React from 'react';
import { useState, useEffect } from 'react';
import { Agency } from '../../services/api';
import {
    View,
    Form,
    TextField,
    Button,
    Flex,
    Heading,
    Text,
    Switch,
    StatusLight,
    Divider,
    Content,
    Header,
    Image,
    Well,
    Picker,
    Item,
    ProgressCircle
} from '@adobe/react-spectrum';

interface WorkfrontCompany {
    ID: string;
    name: string;
    description?: string;
}

interface WorkfrontGroup {
    ID: string;
    name: string;
    description?: string;
}

interface AgencyFormProps {
    agency?: Agency | null;
    mode: 'edit' | 'view';
    onSubmit: (agencyData: Partial<Agency>) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    imsToken: string;
    imsOrgId: string;
}

const titleMap = {
    edit: 'Edit Agency',
    view: 'Agency Details'
};

const AgencyForm: React.FC<AgencyFormProps> = ({
    agency,
    mode,
    onSubmit,
    onCancel,
    loading = false,
    imsToken,
    imsOrgId
}) => {
    const [formData, setFormData] = useState<Partial<Agency>>({
        name: '',
        enabled: false,
        logo: undefined,
        endPointUrl: '',
        workfrontServerUrl: '',
        workfrontCompanyId: '',
        workfrontCompanyName: '',
        workfrontGroupId: '',
        workfrontGroupName: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Workfront state
    const [companies, setCompanies] = useState<WorkfrontCompany[]>([]);
    const [groups, setGroups] = useState<WorkfrontGroup[]>([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [workfrontError, setWorkfrontError] = useState<string | null>(null);

    useEffect(() => {
        if (agency) {
            setFormData({
                name: agency.name,
                enabled: agency.enabled,
                logo: agency.logo,
                endPointUrl: agency.agencyEndPointUrl || agency.endPointUrl || '',
                workfrontServerUrl: agency.workfrontServerUrl || '',
                workfrontCompanyId: agency.workfrontCompanyId || '',
                workfrontCompanyName: agency.workfrontCompanyName || '',
                workfrontGroupId: agency.workfrontGroupId || '',
                workfrontGroupName: agency.workfrontGroupName || ''
            });
            
            // Load Workfront data if URL exists when opening edit form
            if (agency.workfrontServerUrl && mode === 'edit') {
                setTimeout(() => {
                    loadCompanies();
                    loadGroups();
                }, 0);
            }
        }
    }, [agency]);

    // Load Workfront companies
    const loadCompanies = async () => {
        if (!formData.workfrontServerUrl) {
            return;
        }

        setIsLoadingCompanies(true);
        setWorkfrontError(null);

        try {
            const response = await fetch('/api/v1/web/a2b-brand/list-workfront-companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${imsToken}`,
                    'x-gw-ims-org-id': imsOrgId
                },
                body: JSON.stringify({ workfrontServerUrl: formData.workfrontServerUrl })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setCompanies(result.companies || []);
            } else {
                setWorkfrontError(result.message || 'Failed to load companies');
            }
        } catch (err) {
            setWorkfrontError(err instanceof Error ? err.message : 'Failed to load companies');
        } finally {
            setIsLoadingCompanies(false);
        }
    };

    // Load Workfront groups
    const loadGroups = async () => {
        if (!formData.workfrontServerUrl) {
            return;
        }

        setIsLoadingGroups(true);
        setWorkfrontError(null);

        try {
            const response = await fetch('/api/v1/web/a2b-brand/list-workfront-groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${imsToken}`,
                    'x-gw-ims-org-id': imsOrgId
                },
                body: JSON.stringify({ workfrontServerUrl: formData.workfrontServerUrl })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setGroups(result.groups || []);
            } else {
                setWorkfrontError(result.message || 'Failed to load groups');
            }
        } catch (err) {
            setWorkfrontError(err instanceof Error ? err.message : 'Failed to load groups');
        } finally {
            setIsLoadingGroups(false);
        }
    };

    // Auto-load when Workfront server URL changes
    useEffect(() => {
        if (formData.workfrontServerUrl && formData.workfrontServerUrl !== agency?.workfrontServerUrl) {
            loadCompanies();
            loadGroups();
        }
    }, [formData.workfrontServerUrl]);

    const handleSubmit = async () => {
        try {
            // Validate Workfront fields
            const validationErrors: Record<string, string> = {};
            
            if (formData.workfrontServerUrl) {
                if (!formData.workfrontCompanyId) {
                    validationErrors.workfrontCompanyId = 'Company is required when Workfront Server URL is specified';
                }
                if (!formData.workfrontGroupId) {
                    validationErrors.workfrontGroupId = 'Group is required when Workfront Server URL is specified';
                }
            }
            
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setWorkfrontError('Please fix the validation errors');
                return;
            }
            
            setErrors({});
            setWorkfrontError(null);
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting agency:', error);
        }
    };

    const isViewMode = mode === 'view';

    return (
        <View padding="size-400" maxWidth="size-6000">
            <Header>
                <Heading level={2}>{titleMap[mode] || 'Agency'}</Heading>
            </Header>

            <Content>
                {agency && mode === 'view' && (
                    <View marginBottom="size-200">
                        <Text>Agency ID: {agency.agencyId}</Text>
                        {agency.agencyName && (
                            <Text>Agency Name: {agency.agencyName}</Text>
                        )}
                        <Text>Created: {new Date(agency.createdAt).toLocaleDateString()}</Text>
                        <Text>Last Updated: {new Date(agency.updatedAt).toLocaleDateString()}</Text>
                        {agency.enabledAt && (
                            <Text>Enabled: {new Date(agency.enabledAt).toLocaleDateString()}</Text>
                        )}
                    </View>
                )}

                <Form necessityIndicator="label">
                    <TextField
                        label="Brand Name"
                        value={formData.name || ''}
                        onChange={(value) => setFormData({ ...formData, name: value })}
                        isRequired
                        isReadOnly={isViewMode}
                        description="Your brand's name as registered with this agency"
                    />

                    <TextField
                        label="Agency Endpoint URL"
                        value={formData.endPointUrl || ''}
                        isRequired
                        isReadOnly={true}
                        description="Set during registration and cannot be changed"
                    />

                    <Switch
                        isSelected={formData.enabled}
                        onChange={(isSelected) => setFormData({ ...formData, enabled: isSelected })}
                        isReadOnly={isViewMode}
                        marginTop="size-200"
                    >
                        {formData.enabled ? 'Agency connection is active' : 'Agency connection is inactive'}
                    </Switch>

                    {/* Workfront Integration Configuration */}
                    <Well marginTop="size-300">
                        <Heading level={4}>Workfront Integration</Heading>
                        <Text marginBottom="size-200">
                            Configure Workfront server and organization settings for this agency connection
                        </Text>

                        <Flex direction="column" gap="size-200">
                            <TextField
                                label="Workfront Server URL"
                                value={formData.workfrontServerUrl || ''}
                                onChange={(value) => {
                                    setFormData({ ...formData, workfrontServerUrl: value });
                                    // Clear Workfront validation errors if URL is cleared
                                    if (!value?.trim()) {
                                        setErrors(prev => {
                                            const updated = { ...prev };
                                            delete updated.workfrontCompanyId;
                                            delete updated.workfrontGroupId;
                                            return updated;
                                        });
                                    }
                                }}
                                placeholder="https://yourcompany.workfront.com"
                                isReadOnly={isViewMode}
                                description="Enter the base URL of your Workfront instance"
                                width="100%"
                            />

                            {(isLoadingCompanies || isLoadingGroups) && (
                                <Flex direction="row" gap="size-100" alignItems="center">
                                    <ProgressCircle size="S" isIndeterminate aria-label="Loading..." />
                                    <Text>Loading Workfront data...</Text>
                                </Flex>
                            )}

                            <Picker
                            label="Workfront Company"
                            selectedKey={formData.workfrontCompanyId || null}
                            onSelectionChange={(key) => {
                                const selectedCompany = companies.find(c => c.ID === key);
                                setFormData(prev => ({ 
                                    ...prev, 
                                    workfrontCompanyId: key as string,
                                    workfrontCompanyName: selectedCompany?.name || ''
                                }));
                                // Clear error when selection is made
                                if (key && errors.workfrontCompanyId) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.workfrontCompanyId;
                                        return updated;
                                    });
                                }
                            }}
                            isDisabled={isViewMode || isLoadingCompanies || companies.length === 0}
                            placeholder={isLoadingCompanies ? "Loading..." : companies.length === 0 ? "Enter Server URL above" : "Select a company"}
                            validationState={errors.workfrontCompanyId ? 'invalid' : undefined}
                            errorMessage={errors.workfrontCompanyId}
                            isRequired={formData.workfrontServerUrl?.trim() ? true : false}
                            necessityIndicator="label"
                            width="100%"
                        >
                            {companies.map((company) => (
                                <Item key={company.ID}>{company.name}</Item>
                            ))}
                        </Picker>

                            <Picker
                            label="Workfront Group"
                            selectedKey={formData.workfrontGroupId || null}
                            onSelectionChange={(key) => {
                                const selectedGroup = groups.find(g => g.ID === key);
                                setFormData(prev => ({ 
                                    ...prev, 
                                    workfrontGroupId: key as string,
                                    workfrontGroupName: selectedGroup?.name || ''
                                }));
                                // Clear error when selection is made
                                if (key && errors.workfrontGroupId) {
                                    setErrors(prev => {
                                        const updated = { ...prev };
                                        delete updated.workfrontGroupId;
                                        return updated;
                                    });
                                }
                            }}
                            isDisabled={isViewMode || isLoadingGroups || groups.length === 0}
                            placeholder={isLoadingGroups ? "Loading..." : groups.length === 0 ? "Enter Server URL above" : "Select a group"}
                            validationState={errors.workfrontGroupId ? 'invalid' : undefined}
                            errorMessage={errors.workfrontGroupId}
                            isRequired={formData.workfrontServerUrl?.trim() ? true : false}
                            necessityIndicator="label"
                            width="100%"
                        >
                            {groups.map((group) => (
                                <Item key={group.ID}>{group.name}</Item>
                            ))}
                        </Picker>

                            {workfrontError && (
                                <StatusLight variant="negative">
                                    {workfrontError}
                                </StatusLight>
                            )}
                        </Flex>
                    </Well>

                    {!isViewMode && (
                        <Flex gap="size-100" marginTop="size-200">
                            <Button
                                variant="primary"
                                onPress={handleSubmit}
                                isDisabled={loading}
                            >
                                {loading ? 'Saving...' : 'Update Agency'}
                            </Button>
                            <Button
                                variant="secondary"
                                onPress={onCancel}
                                isDisabled={loading}
                            >
                                Cancel
                            </Button>
                        </Flex>
                    )}

                    {isViewMode && (
                        <Button
                            variant="secondary"
                            onPress={onCancel}
                            marginTop="size-200"
                        >
                            Close
                        </Button>
                    )}
                </Form>
            </Content>
        </View>
    );
};

export default AgencyForm;

