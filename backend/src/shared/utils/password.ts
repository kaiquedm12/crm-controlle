import bcrypt from 'bcryptjs';

export const hashPassword = (plainPassword: string): Promise<string> => bcrypt.hash(plainPassword, 10);
export const comparePassword = (plainPassword: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plainPassword, hash);
