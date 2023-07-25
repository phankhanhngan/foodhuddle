import { Enum, Property } from '@mikro-orm/core';

export class CreateSession {
    @Property({ nullable: false })
    hostId: string;

    @Property({ nullable: false })
    title: string;

    @Property({ nullable: true, type: 'text' })
    description: string;

    @Property({ nullable: false, type: 'text' })
    shopLink: string;

    @Property({ nullable: false, type: 'text' })
    hostPaymentInfor: string

    @Property({ nullable: true, type: 'text' })
    qrImage: string;

    @Enum(() => SessionStatus)
    status!: SessionStatus;
}

export enum SessionStatus {
    OPEN = 'OPEN',
    LOCKED = 'LOCKED',
    FINISHED = 'FINISHED',
}