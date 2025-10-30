import { useState, useEffect, useMemo } from 'react';
import {
    View,
    Heading,
    Flex,
    SearchField,
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
    ProgressCircle,
    Image,
    TooltipTrigger,
    Tooltip,
    ComboBox,
    Item
} from '@adobe/react-spectrum';
import Edit from '@spectrum-icons/workflow/Edit';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';
import Delete from '@spectrum-icons/workflow/Delete';
import Close from '@spectrum-icons/workflow/Close';

interface Agency {
    agencyId: string;
    orgId: string;
    brandId: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    logo?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    enabledAt: Date | string | null;
}

interface AgencyListViewProps {
    viewProps?: any;
}

const AgencyListView: React.FC<AgencyListViewProps> = ({ viewProps }) => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [sortDescriptor, setSortDescriptor] = useState<any>(undefined);

    const safeViewProps = viewProps || {} as any;
    const aioEnableDemoMode = safeViewProps.aioEnableDemoMode || false;

    // Load agencies from API
    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                setLoading(true);
                setError(null);

                const apiBaseUrl = `https://${safeViewProps.aioRuntimeNamespace}.adobeio-static.net/api/v1/web/${safeViewProps.aioActionPackageName}`;
                const response = await fetch(`${apiBaseUrl}/get-agencies`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-gw-ims-org-id': `${safeViewProps.imsOrg}`,
                        'Authorization': `Bearer ${safeViewProps.imsToken}`
                    }
                });

                const data = await response.json();
                console.debug('Agency list response:', data);

                if (response.ok && data.data) {
                    setAgencies(data.data);
                } else {
                    setError(data.error || 'Failed to load agencies');
                }
            } catch (err) {
                console.error('Error fetching agencies:', err);
                setError('An unexpected error occurred while loading agencies');
            } finally {
                setLoading(false);
            }
        };

        if (!aioEnableDemoMode) {
            fetchAgencies();
        } else {
            // Demo mode - use mock data
            setAgencies([
                {
                    agencyId: 'demo-agency-1',
                    orgId: 'org-123',
                    brandId: 'brand-456',
                    name: 'Demo Agency 1',
                    endPointUrl: 'https://demo-agency-1.example.com/api',
                    enabled: true,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    enabledAt: new Date('2024-01-01')
                },
                {
                    agencyId: 'demo-agency-2',
                    orgId: 'org-789',
                    brandId: 'brand-012',
                    name: 'Demo Agency 2',
                    endPointUrl: 'https://demo-agency-2.example.com/api',
                    enabled: false,
                    createdAt: new Date('2024-01-02'),
                    updatedAt: new Date('2024-01-02'),
                    enabledAt: null
                }
            ]);
            setLoading(false);
        }
    }, [aioEnableDemoMode, safeViewProps.imsToken, safeViewProps.aioRuntimeNamespace, safeViewProps.aioActionPackageName, safeViewProps.imsOrg]);

    // Filter and sort agencies
    const getFilteredAndSortedAgencies = useMemo(() => {
        let filtered = [...agencies];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(agency =>
                agency.name.toLowerCase().includes(query) ||
                agency.endPointUrl.toLowerCase().includes(query) ||
                agency.agencyId.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            const isEnabled = statusFilter === 'enabled';
            filtered = filtered.filter(agency => agency.enabled === isEnabled);
        }

        // Apply sorting
        if (sortDescriptor) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortDescriptor.column) {
                    case 'name':
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                        break;
                    case 'endPointUrl':
                        aValue = a.endPointUrl.toLowerCase();
                        bValue = b.endPointUrl.toLowerCase();
                        break;
                    case 'enabled':
                        aValue = a.enabled;
                        bValue = b.enabled;
                        break;
                    case 'createdAt':
                        aValue = new Date(a.createdAt).getTime();
                        bValue = new Date(b.createdAt).getTime();
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) {
                    return sortDescriptor.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortDescriptor.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [agencies, searchQuery, statusFilter, sortDescriptor]);

    if (loading) {
        return (
            <View padding="size-200">
                <Flex justifyContent="center" alignItems="center" height="size-3000">
                    <ProgressCircle aria-label="Loading agencies..." isIndeterminate />
                    <Text marginStart="size-200">Loading agencies...</Text>
                </Flex>
            </View>
        );
    }

    return (
        <View padding="size-200">
            <Content>
                <Header>
                    <Flex justifyContent="space-between" alignItems="center">
                        <Heading level={1}>
                            Agency Registrations
                            {aioEnableDemoMode && ' (Demo Mode)'}
                        </Heading>
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

                {aioEnableDemoMode && (
                    <StatusLight variant="info" marginBottom="size-200">
                        Running in demo mode with mock data
                    </StatusLight>
                )}

                {/* Search and Filter Controls */}
                <Flex gap="size-200" marginBottom="size-200" alignItems="end">
                    <SearchField
                        label="Search agencies"
                        placeholder="Search by name, URL, or ID..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        width="size-3000"
                    />
                    <ComboBox
                        label="Status"
                        selectedKey={statusFilter}
                        onSelectionChange={(key) => setStatusFilter(key as string)}
                        width="size-2000"
                    >
                        <Item key="all">All Status</Item>
                        <Item key="enabled">Enabled</Item>
                        <Item key="disabled">Disabled</Item>
                    </ComboBox>
                    <Text>
                        Showing {getFilteredAndSortedAgencies.length} of {agencies.length} agencies
                    </Text>
                </Flex>

                {getFilteredAndSortedAgencies.length === 0 ? (
                    <View padding="size-400">
                        <Text>
                            {searchQuery || statusFilter !== 'all'
                                ? 'No agencies found matching your criteria.'
                                : 'No agency registrations found. Register with an agency to get started.'
                            }
                        </Text>
                    </View>
                ) : (
                    <TableView
                        aria-label="Agencies table"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <TableHeader>
                            <Column key="logo" width={80}>Logo</Column>
                            <Column key="name" allowsSorting minWidth={150}>Agency Name</Column>
                            <Column key="agencyId" allowsSorting minWidth={120}>Agency ID</Column>
                            <Column key="endPointUrl" allowsSorting minWidth={200}>Endpoint URL</Column>
                            <Column key="enabled" allowsSorting width={120}>Status</Column>
                            <Column key="createdAt" allowsSorting width={120}>Created</Column>
                            <Column key="actions" align="center" width={150}>Actions</Column>
                        </TableHeader>
                        <TableBody>
                            {getFilteredAndSortedAgencies.map((agency) => (
                                <Row key={agency.agencyId}>
                                    <Cell>
                                        {agency.logo ? (
                                            <Image
                                                src={agency.logo}
                                                alt={agency.name}
                                                width="size-600"
                                                height="size-600"
                                                objectFit="contain"
                                            />
                                        ) : (
                                            <Text>No Logo</Text>
                                        )}
                                    </Cell>
                                    <Cell>{agency.name}</Cell>
                                    <Cell>
                                        <TooltipTrigger>
                                            <Text
                                                UNSAFE_style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                    cursor: 'help'
                                                }}
                                            >
                                                {agency.agencyId}
                                            </Text>
                                            <Tooltip>
                                                <div>
                                                    <strong>Agency ID:</strong> {agency.agencyId}<br />
                                                    <strong>Org ID:</strong> {agency.orgId}<br />
                                                    <strong>Brand ID:</strong> {agency.brandId}
                                                </div>
                                            </Tooltip>
                                        </TooltipTrigger>
                                    </Cell>
                                    <Cell>
                                        <TooltipTrigger>
                                            <Text
                                                UNSAFE_style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                    cursor: 'help'
                                                }}
                                            >
                                                {agency.endPointUrl}
                                            </Text>
                                            <Tooltip>{agency.endPointUrl}</Tooltip>
                                        </TooltipTrigger>
                                    </Cell>
                                    <Cell>
                                        <StatusLight variant={agency.enabled ? 'positive' : 'negative'}>
                                            {agency.enabled ? 'Enabled' : 'Disabled'}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>
                                        {new Date(agency.createdAt).toLocaleDateString()}
                                    </Cell>
                                    <Cell>
                                        <Flex gap="size-100">
                                            <ActionButton
                                                isQuiet
                                                aria-label="View agency details"
                                            >
                                                <ViewDetail />
                                            </ActionButton>
                                            {/* Future: Add edit and disable functionality */}
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

export default AgencyListView;

