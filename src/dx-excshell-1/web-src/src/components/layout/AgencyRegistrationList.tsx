import { useState, useEffect, useMemo } from 'react';
import {
    View,
    Heading,
    Flex,
    SearchField,
    Button,
    Content,
    Header,
    Divider,
    StatusLight,
    Text,
    TableView,
    TableHeader,
    TableBody,
    Cell,
    Column,
    Row,
    ActionButton,
    ButtonGroup,
    Dialog,
    DialogTrigger,
    AlertDialog,
    ProgressCircle
} from '@adobe/react-spectrum';
import Edit from '@spectrum-icons/workflow/Edit';
import Delete from '@spectrum-icons/workflow/Delete';
import Refresh from '@spectrum-icons/workflow/Refresh';
import Settings from '@spectrum-icons/workflow/Settings';
import { ENABLE_DEMO_MODE, logDemoMode } from '../../utils/demoMode';
import { apiService, Agency } from '../../services/api';
import { WorkfrontConfigModal } from '../modals/WorkfrontConfigModal';

interface AgencyRegistrationListProps {
    viewProps?: any;
}

const AgencyRegistrationList: React.FC<AgencyRegistrationListProps> = ({ viewProps }) => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedAgencyForWF, setSelectedAgencyForWF] = useState<Agency | null>(null);

    // Initialize API service on mount
    useEffect(() => {
        if (viewProps && !ENABLE_DEMO_MODE) {
            // Construct the base URL from runtime namespace
            const apiBaseUrl = `https://${viewProps.aioRuntimeNamespace}.adobeio-static.net`;
            apiService.initialize(
                apiBaseUrl,
                viewProps.imsToken,
                viewProps.imsOrg
            );
        }
    }, [viewProps]);

    // Load agencies on mount and when status changes
    useEffect(() => {
        loadAgencies();
    }, []);

    const loadAgencies = async () => {
        setLoading(true);
        setError(null);

        try {
            if (ENABLE_DEMO_MODE) {
                logDemoMode('Loading agencies in demo mode');
                // In demo mode, show empty list
                setAgencies([]);
                setLoading(false);
                return;
            }

            const response = await apiService.getAgencies();
            
            if (response.statusCode === 200 && response.body.data) {
                // Convert date strings to Date objects
                const agenciesWithDates = response.body.data.map(agency => ({
                    ...agency,
                    createdAt: new Date(agency.createdAt),
                    updatedAt: new Date(agency.updatedAt),
                    enabledAt: agency.enabledAt ? new Date(agency.enabledAt) : null
                }));
                setAgencies(agenciesWithDates as Agency[]);
            } else {
                setError(response.body.message || 'Failed to load agencies');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error loading agencies');
        } finally {
            setLoading(false);
        }
    };

    // Filter agencies based on search and status
    const filteredAgencies = useMemo(() => {
        let filtered = [...agencies];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(agency =>
                agency.name.toLowerCase().includes(query) ||
                (agency.agencyName ? agency.agencyName.toLowerCase().includes(query) : false) ||
                agency.agencyId.toLowerCase().includes(query) ||
                agency.endPointUrl.toLowerCase().includes(query) ||
                (agency.agencyEndPointUrl ? agency.agencyEndPointUrl.toLowerCase().includes(query) : false)
            );
        }

        // Apply status filter
        if (statusFilter === 'enabled') {
            filtered = filtered.filter(agency => agency.enabled);
        } else if (statusFilter === 'disabled') {
            filtered = filtered.filter(agency => !agency.enabled);
        }

        return filtered;
    }, [agencies, searchQuery, statusFilter]);

    const handleToggleEnabled = async (agencyId: string, currentStatus: boolean) => {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('Toggling agency enabled status', { agencyId, newStatus: !currentStatus });
            setSuccess(`Agency ${!currentStatus ? 'enabled' : 'disabled'} successfully (Demo Mode)`);
            setTimeout(() => setSuccess(null), 3000);
            return;
        }

        try {
            const response = await apiService.updateAgency(agencyId, {
                enabled: !currentStatus
            });

            if (response.statusCode === 200) {
                setSuccess(`Agency ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
                setTimeout(() => setSuccess(null), 3000);
                // Reload agencies to get updated data
                await loadAgencies();
            } else {
                setError(response.body.message || 'Failed to update agency');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error updating agency');
        }
    };

    const handleDelete = async (agencyId: string) => {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('Deleting agency', { agencyId });
            setSuccess('Agency deleted successfully (Demo Mode)');
            setTimeout(() => setSuccess(null), 3000);
            return;
        }

        try {
            const response = await apiService.deleteAgency(agencyId);

            if (response.statusCode === 200) {
                setSuccess('Agency deleted successfully');
                setTimeout(() => setSuccess(null), 3000);
                // Reload agencies to reflect deletion
                await loadAgencies();
            } else {
                setError(response.body.message || 'Failed to delete agency');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error deleting agency');
        }
    };

    const handleWorkfrontConfigSave = async () => {
        if (!selectedAgencyForWF) return;
        
        try {
            setSuccess('Workfront configuration saved successfully');
            
            // Refresh the agencies list to show updated Workfront info
            await loadAgencies();
        } catch (err) {
            console.error('Error refreshing agencies after Workfront config:', err);
        }
        
        // Close the modal
        setSelectedAgencyForWF(null);
        
        // Clear messages after 3 seconds
        setTimeout(() => {
            setSuccess(null);
        }, 3000);
    };

    const getStatusVariant = (enabled: boolean): 'positive' | 'negative' => {
        return enabled ? 'positive' : 'negative';
    };

    const getStatusText = (enabled: boolean): string => {
        return enabled ? 'Enabled' : 'Disabled';
    };

    if (loading) {
        return (
            <View padding="size-200">
                <Content>
                    <Flex direction="column" alignItems="center" gap="size-200">
                        <ProgressCircle aria-label="Loading agencies" isIndeterminate />
                        <Text>Loading agency registrations...</Text>
                    </Flex>
                </Content>
            </View>
        );
    }

    return (
        <View padding="size-200">
            <Content>
                <Header>
                    <Flex justifyContent="space-between" alignItems="center">
                        <Heading level={1}>Agency Registrations</Heading>
                        <ActionButton onPress={loadAgencies} isQuiet>
                            <Refresh />
                            <Text>Refresh</Text>
                        </ActionButton>
                    </Flex>
                </Header>
                <Divider size="S" />

                {success && (
                    <StatusLight variant="positive" marginBottom="size-200">
                        {success}
                    </StatusLight>
                )}

                {error && (
                    <StatusLight variant="negative" marginBottom="size-200">
                        {error}
                    </StatusLight>
                )}

                <Flex direction="row" gap="size-200" marginBottom="size-300" wrap>
                    <SearchField
                        label="Search agencies"
                        placeholder="Search by name, ID, or endpoint URL..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        width="size-3000"
                    />
                    
                    <ButtonGroup>
                        <Button 
                            variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                            onPress={() => setStatusFilter('all')}
                        >
                            All ({agencies.length})
                        </Button>
                        <Button 
                            variant={statusFilter === 'enabled' ? 'primary' : 'secondary'}
                            onPress={() => setStatusFilter('enabled')}
                        >
                            Enabled ({agencies.filter(a => a.enabled).length})
                        </Button>
                        <Button 
                            variant={statusFilter === 'disabled' ? 'primary' : 'secondary'}
                            onPress={() => setStatusFilter('disabled')}
                        >
                            Disabled ({agencies.filter(a => !a.enabled).length})
                        </Button>
                    </ButtonGroup>
                </Flex>

                {filteredAgencies.length === 0 ? (
                    <View padding="size-400">
                        <Text>
                            {searchQuery || statusFilter !== 'all' 
                                ? 'No agencies found matching your criteria.'
                                : ENABLE_DEMO_MODE 
                                    ? 'No agency registrations found. In demo mode, connect with an agency to see registrations here.'
                                    : 'No agency registrations found. Register with an agency to see them here.'
                            }
                        </Text>
                    </View>
                ) : (
                    <TableView 
                        aria-label="Agency registrations table"
                        selectionMode="none"
                        density="compact"
                    >
                        <TableHeader>
                            <Column key="agencyName" allowsSorting>Agency Name</Column>
                            <Column key="name" allowsSorting>Brand Name</Column>
                            <Column key="agencyId">Agency ID</Column>
                            <Column key="brandId">Brand ID</Column>
                            <Column key="endpoint">Endpoint URL</Column>
                            <Column key="agencyEndpoint">Agency Endpoint URL</Column>
                            <Column key="status" allowsSorting>Status</Column>
                            <Column key="enabledAt" allowsSorting>Enabled At</Column>
                            <Column key="actions">Actions</Column>
                        </TableHeader>
                        <TableBody>
                            {filteredAgencies.map((agency) => (
                                <Row key={agency.agencyId}>
                                    <Cell>{agency.agencyName || agency.agencyId}</Cell>
                                    <Cell>{agency.name}</Cell>
                                    <Cell>
                                        <Text 
                                            UNSAFE_style={{ 
                                                fontSize: '11px', 
                                                fontFamily: 'monospace',
                                                color: '#6B7280'
                                            }}
                                        >
                                            {agency.agencyId.substring(0, 12)}...
                                        </Text>
                                    </Cell>
                                    <Cell>
                                        <Text 
                                            UNSAFE_style={{ 
                                                fontSize: '11px', 
                                                fontFamily: 'monospace',
                                                color: '#6B7280'
                                            }}
                                        >
                                            {agency.brandId.substring(0, 12)}...
                                        </Text>
                                    </Cell>
                                    <Cell>
                                        <Text 
                                            UNSAFE_style={{ 
                                                fontSize: '12px',
                                                color: '#4B5563'
                                            }}
                                        >
                                            {new URL(agency.endPointUrl).hostname}
                                        </Text>
                                    </Cell>
                                    <Cell>
                                        <Text 
                                            UNSAFE_style={{ 
                                                fontSize: '12px',
                                                color: '#4B5563'
                                            }}
                                        >
                                            {agency.agencyEndPointUrl ? new URL(agency.agencyEndPointUrl).hostname : '—'}
                                        </Text>
                                    </Cell>
                                    <Cell>
                                        <StatusLight variant={getStatusVariant(agency.enabled)}>
                                            {getStatusText(agency.enabled)}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>
                                        {agency.enabledAt 
                                            ? new Date(agency.enabledAt).toLocaleDateString()
                                            : '-'
                                        }
                                    </Cell>
                                    <Cell>
                                        <Flex gap="size-100">
                                            <ActionButton
                                                onPress={() => handleToggleEnabled(agency.agencyId, agency.enabled)}
                                                isQuiet
                                                aria-label={agency.enabled ? "Disable agency" : "Enable agency"}
                                            >
                                                <Text slot="label">
                                                    {agency.enabled ? 'Disable' : 'Enable'}
                                                </Text>
                                            </ActionButton>
                                            
                                            <DialogTrigger type="modal" isDismissable>
                                                <ActionButton 
                                                    isQuiet 
                                                    aria-label="Configure Workfront"
                                                    onPress={() => setSelectedAgencyForWF(agency)}
                                                >
                                                    <Settings />
                                                </ActionButton>
                                                {(close) => (
                                                    <WorkfrontConfigModal
                                                        agencyId={agency.agencyId}
                                                        imsToken={viewProps?.imsToken || ''}
                                                        imsOrgId={viewProps?.imsOrg || ''}
                                                        existingConfig={{
                                                            workfrontServerUrl: agency.workfrontServerUrl,
                                                            workfrontCompanyId: agency.workfrontCompanyId,
                                                            workfrontCompanyName: agency.workfrontCompanyName,
                                                            workfrontGroupId: agency.workfrontGroupId,
                                                            workfrontGroupName: agency.workfrontGroupName
                                                        }}
                                                        onSave={async (config) => {
                                                            await handleWorkfrontConfigSave();
                                                        }}
                                                        onClose={() => {
                                                            close();
                                                            setSelectedAgencyForWF(null);
                                                        }}
                                                    />
                                                )}
                                            </DialogTrigger>
                                            
                                            <DialogTrigger type="modal">
                                                <ActionButton isQuiet aria-label="Delete agency">
                                                    <Delete />
                                                </ActionButton>
                                                <AlertDialog
                                                    title="Delete Agency Registration"
                                                    variant="destructive"
                                                    primaryActionLabel="Delete"
                                                    cancelLabel="Cancel"
                                                    onPrimaryAction={() => handleDelete(agency.agencyId)}
                                                >
                                                    Are you sure you want to delete the registration for "{agency.name}"? 
                                                    This action cannot be undone and you will need to re-register with this agency.
                                                    {ENABLE_DEMO_MODE && ' (Demo Mode - no real data will be affected)'}
                                                </AlertDialog>
                                            </DialogTrigger>
                                        </Flex>
                                    </Cell>
                                </Row>
                            ))}
                        </TableBody>
                    </TableView>
                )}
            </Content>
        </View>
    );
};

export default AgencyRegistrationList;

