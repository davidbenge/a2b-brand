import React, { useState, useMemo } from 'react';
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
    AlertDialog
} from '@adobe/react-spectrum';
import Edit from '@spectrum-icons/workflow/Edit';
import Delete from '@spectrum-icons/workflow/Delete';
import {
    ENABLE_DEMO_MODE,
    mockCompanyRegistrations,
    CompanyRegistrationData,
    logDemoMode
} from '../../utils/demoMode';

interface CompanyRegistrationListProps {
    viewProps?: any;
}

const CompanyRegistrationList: React.FC<CompanyRegistrationListProps> = ({ viewProps }) => {
    const [registrations, setRegistrations] = useState<CompanyRegistrationData[]>(
        ENABLE_DEMO_MODE ? mockCompanyRegistrations : []
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [loading, setLoading] = useState(!ENABLE_DEMO_MODE);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter registrations based on search and status
    const filteredRegistrations = useMemo(() => {
        let filtered = [...registrations];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(reg =>
                reg.name.toLowerCase().includes(query) ||
                reg.primaryContact.toLowerCase().includes(query) ||
                reg.phoneNumber.includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(reg => reg.status === statusFilter);
        }

        return filtered;
    }, [registrations, searchQuery, statusFilter]);

    const handleStatusUpdate = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('Updating registration status', { id, newStatus });
            
            setRegistrations(prev => prev.map(reg =>
                reg.id === id 
                    ? { ...reg, status: newStatus, updatedAt: new Date() }
                    : reg
            ));
            setSuccess(`Registration ${newStatus} successfully (Demo Mode)`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } else {
            // TODO: Implement real API call for status update
            setError('Status update not implemented in production mode');
        }
    };

    const handleDelete = async (id: string) => {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('Deleting registration', { id });
            
            setRegistrations(prev => prev.filter(reg => reg.id !== id));
            setSuccess('Registration deleted successfully (Demo Mode)');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } else {
            // TODO: Implement real API call for deletion
            setError('Delete functionality not implemented in production mode');
        }
    };

    const getStatusVariant = (status: string): 'positive' | 'negative' | 'info' => {
        switch (status) {
            case 'approved': return 'positive';
            case 'rejected': return 'negative';
            case 'pending': 
            default: return 'info';
        }
    };

    if (loading) {
        return (
            <View padding="size-200">
                <Content>
                    <Header>
                        <Heading level={1}>Loading Company Registrations...</Heading>
                    </Header>
                </Content>
            </View>
        );
    }

    return (
        <View padding="size-200">
            <Content>
                <Header>
                    <Flex justifyContent="space-between" alignItems="center">
                        <Heading level={1}>Company Registrations</Heading>
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

                <Flex direction="row" gap="size-200" marginBottom="size-300">
                    <SearchField
                        label="Search registrations"
                        placeholder="Search by company name, contact, or phone..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        width="size-3000"
                    />
                    
                    <ButtonGroup>
                        <Button 
                            variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                            onPress={() => setStatusFilter('all')}
                        >
                            All ({registrations.length})
                        </Button>
                        <Button 
                            variant={statusFilter === 'pending' ? 'primary' : 'secondary'}
                            onPress={() => setStatusFilter('pending')}
                        >
                            Pending ({registrations.filter(r => r.status === 'pending').length})
                        </Button>
                        <Button 
                            variant={statusFilter === 'approved' ? 'primary' : 'secondary'}
                            onPress={() => setStatusFilter('approved')}
                        >
                            Approved ({registrations.filter(r => r.status === 'approved').length})
                        </Button>
                        <Button 
                            variant={statusFilter === 'rejected' ? 'primary' : 'secondary'}
                            onPress={() => setStatusFilter('rejected')}
                        >
                            Rejected ({registrations.filter(r => r.status === 'rejected').length})
                        </Button>
                    </ButtonGroup>
                </Flex>

                {filteredRegistrations.length === 0 ? (
                    <View padding="size-400">
                        <Text>
                            {searchQuery || statusFilter !== 'all' 
                                ? 'No registrations found matching your criteria.'
                                : ENABLE_DEMO_MODE 
                                    ? 'No company registrations found. In demo mode, mock data is available.'
                                    : 'No company registrations found.'
                            }
                        </Text>
                    </View>
                ) : (
                    <TableView 
                        aria-label="Company registrations table"
                        selectionMode="none"
                        density="compact"
                    >
                        <TableHeader>
                            <Column key="name" allowsSorting>Company Name</Column>
                            <Column key="contact" allowsSorting>Primary Contact</Column>
                            <Column key="phone">Phone Number</Column>
                            <Column key="status" allowsSorting>Status</Column>
                            <Column key="created" allowsSorting>Created</Column>
                            <Column key="actions">Actions</Column>
                        </TableHeader>
                        <TableBody>
                            {filteredRegistrations.map((registration) => (
                                <Row key={registration.id}>
                                    <Cell>{registration.name}</Cell>
                                    <Cell>{registration.primaryContact}</Cell>
                                    <Cell>{registration.phoneNumber}</Cell>
                                    <Cell>
                                        <StatusLight variant={getStatusVariant(registration.status)}>
                                            {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>{registration.createdAt.toLocaleDateString()}</Cell>
                                    <Cell>
                                        <Flex gap="size-100">
                                            {registration.status === 'pending' && (
                                                <>
                                                    <ActionButton
                                                        onPress={() => handleStatusUpdate(registration.id, 'approved')}
                                                        isQuiet
                                                        aria-label="Approve registration"
                                                    >
                                                        <Text slot="label">Approve</Text>
                                                    </ActionButton>
                                                    <ActionButton
                                                        onPress={() => handleStatusUpdate(registration.id, 'rejected')}
                                                        isQuiet
                                                        aria-label="Reject registration"
                                                    >
                                                        <Text slot="label">Reject</Text>
                                                    </ActionButton>
                                                </>
                                            )}
                                            {ENABLE_DEMO_MODE && (
                                                <DialogTrigger type="modal">
                                                    <ActionButton isQuiet aria-label="Delete registration">
                                                        <Delete />
                                                    </ActionButton>
                                                    <AlertDialog
                                                        title="Delete Registration"
                                                        variant="destructive"
                                                        primaryActionLabel="Delete"
                                                        cancelLabel="Cancel"
                                                        onPrimaryAction={() => handleDelete(registration.id)}
                                                    >
                                                        Are you sure you want to delete the registration for "{registration.name}"? 
                                                        This action cannot be undone.
                                                        {ENABLE_DEMO_MODE && ' (Demo Mode - no real data will be affected)'}
                                                    </AlertDialog>
                                                </DialogTrigger>
                                            )}
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

export default CompanyRegistrationList;
