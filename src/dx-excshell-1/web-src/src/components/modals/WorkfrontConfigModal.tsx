/**
 * Workfront Configuration Modal
 * 
 * Modal dialog for configuring Workfront integration for an Agency
 * Allows selecting a WF server URL, Company, and Group
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    Heading,
    Divider,
    Content,
    Form,
    TextField,
    ButtonGroup,
    Button,
    Picker,
    Item,
    Text,
    ProgressCircle,
    View,
    Flex
} from '@adobe/react-spectrum';
import Alert from '@spectrum-icons/workflow/Alert';

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

interface WorkfrontConfigModalProps {
    agencyId: string;
    imsToken: string;
    imsOrgId: string;
    existingConfig?: {
        workfrontServerUrl?: string;
        workfrontCompanyId?: string;
        workfrontCompanyName?: string;
        workfrontGroupId?: string;
        workfrontGroupName?: string;
    };
    onSave: (config: {
        workfrontServerUrl: string;
        workfrontCompanyId: string;
        workfrontCompanyName: string;
        workfrontGroupId: string;
        workfrontGroupName: string;
    }) => Promise<void>;
    onClose: () => void;
}

export const WorkfrontConfigModal: React.FC<WorkfrontConfigModalProps> = ({
    agencyId,
    imsToken,
    imsOrgId,
    existingConfig,
    onSave,
    onClose
}) => {
    const [serverUrl, setServerUrl] = useState(existingConfig?.workfrontServerUrl || '');
    const [companies, setCompanies] = useState<WorkfrontCompany[]>([]);
    const [groups, setGroups] = useState<WorkfrontGroup[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(existingConfig?.workfrontCompanyId || '');
    const [selectedGroupId, setSelectedGroupId] = useState(existingConfig?.workfrontGroupId || '');
    
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load companies when server URL is entered
    const loadCompanies = async () => {
        if (!serverUrl) {
            setError('Please enter a Workfront server URL');
            return;
        }

        setIsLoadingCompanies(true);
        setError(null);

        try {
            // Call list-workfront-companies action
            const response = await fetch('/api/v1/web/a2b-brand/list-workfront-companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${imsToken}`,
                    'x-gw-ims-org-id': imsOrgId
                },
                body: JSON.stringify({ workfrontServerUrl: serverUrl })
            });

            const result = await response.json();

            if (response.ok && result.body?.success) {
                setCompanies(result.body.companies || []);
            } else {
                setError(result.body?.message || 'Failed to load companies');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load companies');
        } finally {
            setIsLoadingCompanies(false);
        }
    };

    // Load groups when server URL is entered
    const loadGroups = async () => {
        if (!serverUrl) {
            setError('Please enter a Workfront server URL');
            return;
        }

        setIsLoadingGroups(true);
        setError(null);

        try {
            // Call list-workfront-groups action
            const response = await fetch('/api/v1/web/a2b-brand/list-workfront-groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${imsToken}`,
                    'x-gw-ims-org-id': imsOrgId
                },
                body: JSON.stringify({ workfrontServerUrl: serverUrl })
            });

            const result = await response.json();

            if (response.ok && result.body?.success) {
                setGroups(result.body.groups || []);
            } else {
                setError(result.body?.message || 'Failed to load groups');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load groups');
        } finally {
            setIsLoadingGroups(false);
        }
    };

    // Auto-load when server URL changes
    useEffect(() => {
        if (serverUrl && serverUrl !== existingConfig?.workfrontServerUrl) {
            loadCompanies();
            loadGroups();
        }
    }, [serverUrl]);

    const handleSave = async () => {
        // Validate
        if (!serverUrl) {
            setError('Workfront server URL is required');
            return;
        }
        if (!selectedCompanyId) {
            setError('Please select a company');
            return;
        }
        if (!selectedGroupId) {
            setError('Please select a group');
            return;
        }

        const selectedCompany = companies.find(c => c.ID === selectedCompanyId);
        const selectedGroup = groups.find(g => g.ID === selectedGroupId);

        if (!selectedCompany || !selectedGroup) {
            setError('Invalid company or group selection');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave({
                workfrontServerUrl: serverUrl,
                workfrontCompanyId: selectedCompanyId,
                workfrontCompanyName: selectedCompany.name,
                workfrontGroupId: selectedGroupId,
                workfrontGroupName: selectedGroup.name
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog size="L">
            <Heading>Configure Workfront Integration</Heading>
            <Divider />
            <Content>
                <Form>
                    <TextField
                        label="Workfront Server URL"
                        value={serverUrl}
                        onChange={setServerUrl}
                        placeholder="https://yourcompany.workfront.com"
                        isRequired
                        description="Enter the base URL of your Workfront instance"
                    />

                    <Flex direction="row" gap="size-200" marginTop="size-200">
                        <Button
                            variant="secondary"
                            onPress={loadCompanies}
                            isDisabled={!serverUrl || isLoadingCompanies}
                        >
                            {isLoadingCompanies ? 'Loading...' : 'Load Companies'}
                        </Button>
                        <Button
                            variant="secondary"
                            onPress={loadGroups}
                            isDisabled={!serverUrl || isLoadingGroups}
                        >
                            {isLoadingGroups ? 'Loading...' : 'Load Groups'}
                        </Button>
                    </Flex>

                    {isLoadingCompanies || isLoadingGroups ? (
                        <View marginTop="size-200">
                            <ProgressCircle size="S" isIndeterminate aria-label="Loading..." />
                        </View>
                    ) : null}

                    {companies.length > 0 && (
                        <Picker
                            label="Company"
                            selectedKey={selectedCompanyId}
                            onSelectionChange={(key) => setSelectedCompanyId(key as string)}
                            isRequired
                            marginTop="size-200"
                        >
                            {companies.map((company) => (
                                <Item key={company.ID}>{company.name}</Item>
                            ))}
                        </Picker>
                    )}

                    {groups.length > 0 && (
                        <Picker
                            label="Group"
                            selectedKey={selectedGroupId}
                            onSelectionChange={(key) => setSelectedGroupId(key as string)}
                            isRequired
                            marginTop="size-200"
                        >
                            {groups.map((group) => (
                                <Item key={group.ID}>{group.name}</Item>
                            ))}
                        </Picker>
                    )}

                    {error && (
                        <Flex direction="row" gap="size-100" marginTop="size-200">
                            <Alert color="negative" />
                            <Text><span style={{ color: 'var(--spectrum-global-color-red-600)' }}>{error}</span></Text>
                        </Flex>
                    )}
                </Form>
            </Content>
            <ButtonGroup>
                <Button variant="secondary" onPress={onClose} isDisabled={isSaving}>
                    Cancel
                </Button>
                <Button
                    variant="cta"
                    onPress={handleSave}
                    isDisabled={isSaving || !serverUrl || !selectedCompanyId || !selectedGroupId}
                >
                    {isSaving ? 'Saving...' : 'Save & Register Events'}
                </Button>
            </ButtonGroup>
        </Dialog>
    );
};

