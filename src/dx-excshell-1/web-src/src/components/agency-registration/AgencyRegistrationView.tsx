import { useCallback, useState } from 'react';
import { View } from '@adobe/react-spectrum';

import AgencyList from './AgencyList';
import AgencyRegistrationForm from './AgencyRegistationForm';

import type { IBrand } from '../../../../../actions/types';
import { ViewType } from '../../types/enums';


const AgencyRegistrationView = (props) => {
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [viewType, setViewType] = useState<ViewType>(ViewType.LIST);

  const changeViewType = useCallback(() => {
    setViewType((prev) => (prev === ViewType.LIST ? ViewType.REGISTRATION : ViewType.LIST));
  }, []);

  const updateBrands = useCallback((brand: IBrand,index?:number) => {
    if(index!==undefined){
        const newList = [...brands];
        newList[index] = brand;
        setBrands(newList);
    }else{
        console.log('brand',brand);
        setBrands([...brands, brand]);
    }
  }, [brands]);

  const isListView = viewType === ViewType.LIST;

  return (
    <View>
      {isListView ? (
        <AgencyList
          {...props}
          brands={brands}
          updateBrands={updateBrands}
          changeViewType={changeViewType}
        />
      ) : (
        <AgencyRegistrationForm
          {...props}
          updateBrands={updateBrands}
          changeViewType={changeViewType}
        />
      )}
    </View>
  );
};

export default AgencyRegistrationView;
