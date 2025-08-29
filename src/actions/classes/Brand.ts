import { IBrand } from '../types';

export class Brand implements IBrand {
  bid: string;
  secret: string;
  name: string;
  endPointUrl: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  enabledAt: Date | null;

  constructor(params: Partial<IBrand> = {}) {
    this.bid = params.bid || '';
    this.secret = params.secret || '';
    this.name = params.name || '';
    this.endPointUrl = params.endPointUrl || '';
    this.enabled = params.enabled || false;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : new Date();
    this.updatedAt = params.updatedAt ? new Date(params.updatedAt) : new Date();
    this.enabledAt = params.enabledAt ? new Date(params.enabledAt) : null;
  }
}
