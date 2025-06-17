import { IoEvent } from '../IoEvent';
import { IBrand } from '../../types/index';

export class NewBrandRegistrationEvent extends IoEvent {
    constructor(brand: IBrand) {
        super();
        this.type = 'com.adobe.a2b.registration.received';
        this.data = brand;
        this.data.brandId = brand.bid;
    }
} 