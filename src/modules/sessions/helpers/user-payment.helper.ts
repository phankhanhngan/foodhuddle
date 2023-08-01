import { UserPaymentStatus } from 'src/entities';
import { UserPaymentAction } from '../enums/user-payment-action.enum';

const actionToStatusMapper = (action: UserPaymentAction): UserPaymentStatus => {
  switch (action) {
    case UserPaymentAction.APPROVE:
      return UserPaymentStatus.APPROVED;
    case UserPaymentAction.REJECT:
      return UserPaymentStatus.REJECTED;
  }
};

export { actionToStatusMapper };
