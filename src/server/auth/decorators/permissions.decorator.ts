import { SetMetadata } from '@nestjs/common';
import { Permission } from '../interfaces/jwt-payload.interface';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator para controle de permissões granulares.
 * Exemplo: @RequirePermissions('fiscal:write', 'siconfi:sync')
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
