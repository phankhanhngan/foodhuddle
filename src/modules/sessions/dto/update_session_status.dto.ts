import { Enum, Property } from '@mikro-orm/core';

export class UpdateSessionStatus {
    
    @Enum(() => SessionStatus)
    status!: SessionStatus;
}

export enum SessionStatus {
    LOCKED = 'LOCKED',
    PENDING_PAYMENTS = 'PENDING PAYMENTS',
    FINISHED = 'FINISHED',
}