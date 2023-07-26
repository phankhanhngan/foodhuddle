import { Enum, Property } from '@mikro-orm/core';

export class UpdateSessionStatus {
    @Property({ nullable: false })
    id: number;

    @Enum(() => SessionStatus)
    status!: SessionStatus;
}

export enum SessionStatus {
    LOCKED = 'LOCKED',
    PENDING_PAYMENTS = 'PENDING PAYMENTS',
    FINISHED = 'FINISHED',
}