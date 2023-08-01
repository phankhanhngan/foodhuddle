import { User } from 'src/entities';

const addRemainingUserRequestPayment = (users: User[]) => {
  return users.reduce((prev, curr) => {
    const { email, googleId, name, photo } = curr;
    return [
      ...prev,
      {
        id: null,
        user: {
          email,
          googleId,
          name,
          photo,
        },
        status: null,
        note: null,
        evidence: null,
      },
    ];
  }, []);
};

export { addRemainingUserRequestPayment };
