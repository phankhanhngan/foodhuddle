import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { GoogleAuthConfig } from '../../../config/auth.config';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super(GoogleAuthConfig);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
    };
    console.log(user);
    done(null, user);
  }
}
