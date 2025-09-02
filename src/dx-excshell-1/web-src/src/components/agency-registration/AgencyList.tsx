import { useCallback } from 'react';

import {
  Row,
  Cell,
  View,
  Flex,
  Column,
  Button,
  Switch,
  Content,
  Heading,
  TableView,
  TableBody,
  TableHeader,
  IllustratedMessage
} from '@adobe/react-spectrum';
import NotFound from '@spectrum-icons/illustrations/NotFound';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';
import Delete from '@spectrum-icons/workflow/Delete';
import Edit from '@spectrum-icons/workflow/Edit';

import type { IBrand } from '../../../../../actions/types';
import { columns } from '../../constants/viewConstants';


interface IAgencyList {
  brands: IBrand[];
  updateBrands: (brand: IBrand, index?: number) => void;
  changeViewType: () => void;
}

const AgencyList: React.FC<IAgencyList> = ({
  brands = [],
  updateBrands,
  changeViewType
}) => {
  const changeBrandStatus = useCallback(
    (index: number) => {
      const selectedBrand = { ...brands[index] };
      selectedBrand.enabled = !selectedBrand.enabled;

      updateBrands(selectedBrand, index);
    },
    [brands, updateBrands]
  );

  const isListNotEmpty = brands.length !== 0;

  return (
    <View>
      {isListNotEmpty && (
        <Button width={'size-2400'} variant="primary" onPress={changeViewType}>
          Register New Agency
        </Button>
      )}

      <View>
        {isListNotEmpty ? (
          <TableView aria-label="Brands table" selectionMode="single">
            <TableHeader>
              {columns.map((column) => (
                <Column key={column.key} allowsSorting>
                  {column.name}
                </Column>
              ))}
            </TableHeader>
            <TableBody>
              {brands.map((brand, index) => (
                <Row key={brand.bid}>
                  <Cell>{brand.name}</Cell>
                  <Cell>{brand.endPointUrl}</Cell>
                  <Cell>
                    <Switch
                      isEmphasized
                      isSelected={brand.enabled}
                      onChange={() => {
                        changeBrandStatus(index);
                      }}
                    >
                      {brand.enabled ? 'Enabled' : 'Disabled'}
                    </Switch>
                  </Cell>
                  <Cell>{brand.createdAt.toLocaleDateString()}</Cell>
                  <Cell>
                    <Flex gap="size-100">
                      <Button variant="primary">
                        <ViewDetail />
                      </Button>
                      <Button variant="primary">
                        <Edit />
                      </Button>
                      <Button variant="negative">
                        <Delete />
                      </Button>
                    </Flex>
                  </Cell>
                </Row>
              ))}
            </TableBody>
          </TableView>
        ) : (
          <IllustratedMessage>
            <NotFound />
            <Heading>No agencies registered yet</Heading>
            <Content>
              <Button
                width={'size-2400'}
                variant="primary"
                margin={"size-200"}
                onPress={changeViewType}
              >
                Register New Agency
              </Button>
            </Content>
          </IllustratedMessage>
        )}
      </View>
    </View>
  );
};

export default AgencyList;
