import { Enum, Property } from '@mikro-orm/core';

export class CreateSession {
    @Property({ nullable: false })
    host_id: string;

    @Property({ nullable: false })
    title: string;

    @Property({ nullable: true, type: 'text' })
    description: string;

    @Property({ nullable: false, type: 'text' })
    shop_link: string;

    @Property({ nullable: false, type: 'text' })
    host_payment_info: string

    @Property({ nullable: true, type: 'text' })
    qr_images: string;

    @Enum(() => SessionStatus)
    status!: SessionStatus;
}

export enum SessionStatus {
    OPEN = 'OPEN',
    LOCKED = 'LOCKED',
    FINISHED = 'FINISHED',
}