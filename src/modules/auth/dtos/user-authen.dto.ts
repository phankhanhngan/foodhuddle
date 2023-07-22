import { IUser } from '../interfaces/user.interface';

export class UserAuthenDTO implements IUser {
  googleId: string;
  email: string;
  name: string;
}
