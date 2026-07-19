export const erpSessionCookieName = 'alet-erp-session'

export const erpRoleCodes = [
  'admin',
  'project_manager',
  'marketing',
  'sales',
  'finance',
  'engineer',
  'procurement',
  'inventory',
  'hr',
  'viewer',
] as const

export type ErpRoleCode = (typeof erpRoleCodes)[number]

export const erpModuleCodes = [
  'dashboard',
  'projects',
  'sales',
  'finance',
  'construction',
  'procurement',
  'inventory',
  'contractors',
  'documents',
  'events',
] as const

export type ErpModuleCode = (typeof erpModuleCodes)[number]

const moduleRoles: Record<ErpModuleCode, readonly ErpRoleCode[]> = {
  dashboard: erpRoleCodes,
  projects: erpRoleCodes,
  sales: ['admin', 'project_manager', 'sales', 'finance'],
  finance: ['admin', 'project_manager', 'finance'],
  construction: ['admin', 'project_manager', 'engineer'],
  procurement: ['admin', 'project_manager', 'procurement', 'finance', 'engineer', 'inventory'],
  inventory: ['admin', 'project_manager', 'procurement', 'finance', 'engineer', 'inventory'],
  contractors: ['admin', 'project_manager', 'procurement', 'finance', 'engineer'],
  documents: ['admin', 'project_manager', 'procurement', 'finance', 'engineer', 'inventory', 'sales', 'marketing', 'viewer'],
  events: erpRoleCodes,
}

export function isErpRoleCode(value: string): value is ErpRoleCode {
  return erpRoleCodes.includes(value as ErpRoleCode)
}

export function getModuleFromErpPath(pathname: string): ErpModuleCode {
  const segment = pathname.split('/').filter(Boolean)[1]
  return erpModuleCodes.includes(segment as ErpModuleCode) ? segment as ErpModuleCode : 'dashboard'
}

export function getAllowedErpModules(roles: readonly ErpRoleCode[]): ErpModuleCode[] {
  return erpModuleCodes.filter((module) => moduleRoles[module].some((role) => roles.includes(role)))
}

export function canAccessErpPath(pathname: string, roles: readonly ErpRoleCode[]): boolean {
  return getAllowedErpModules(roles).includes(getModuleFromErpPath(pathname))
}
