import { ExtractJwt } from 'passport-jwt';
const GOOGLE_AUTH_CLIENT_ID =
  '34555621683-8bql9eq7e1lcoqdbio4tdd5hkref3fbv.apps.googleusercontent.com';
const GOOGLE_AUTH_CLIENT_SECRET = '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';
const GOOGLE_AUTH_CALLBACK_URL = 'http://localhost:3003/google/callback';
const GoogleAuthConfig = {
  clientID: GOOGLE_AUTH_CLIENT_ID,
  clientSecret: GOOGLE_AUTH_CLIENT_SECRET,
  callbackURL: GOOGLE_AUTH_CALLBACK_URL,
  scope: ['profile', 'email'],
};

const JWTAuthConfig = (() => {
  const extractJwtFromCookie = (req) => {
    let token = null;
    if (req && req.cookies) {
      token = req.cookies['access_token'];
    }
    return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  };
  return {
    ignoreExpiration: false,
    secretOrKey: process.env.PRIVATE_KEY,
    jwtFromRequest: extractJwtFromCookie,
  };
})();

export { GoogleAuthConfig, JWTAuthConfig };
