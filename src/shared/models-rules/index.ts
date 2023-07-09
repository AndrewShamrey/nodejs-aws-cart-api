import { validate } from 'uuid';
import { AppRequest } from '../models';
import { User } from 'src/users';

/**
 * @param {AppRequest} request
 * @returns {string}
 */
export function getUserIdFromRequest(request: AppRequest): string {
  const authUserSource: Omit<User, 'password'> = request.user;
  const userId = authUserSource?.id;
  const isValid = validate(userId); 
  if (!isValid) throw new Error('Invalid data format! User ID should be a valid uuid');

  return userId;
}

export const mapRequiredField = <T, K extends keyof T, V extends T[K]>(obj: T, key: K, value: V): void => {
  if (!value && value !== 0) throw new Error(`${String(key)} is required!`);

  obj[key] = value;
};
