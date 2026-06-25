import type { Permission, UserRole } from '@/types/erp'

export const rolePermissions: Record<UserRole, readonly Permission[]> = {
  admin: [
    'create_unit',
    'reserve_unit',
    'approve_payment',
    'view_financial_reports',
    'manage_inventory',
    'approve_milestone',
    'manage_procurement',
    'manage_documents',
  ],
  finance: ['approve_payment', 'view_financial_reports'],
  sales: ['reserve_unit', 'create_unit'],
  engineer: ['approve_milestone'],
  procurement: ['manage_procurement', 'manage_inventory'],
  contractor: ['approve_milestone'],
}

export const unitLifecycle = [
  'draft',
  'available',
  'reserved',
  'contracted',
  'under_payment',
  'fully_paid',
  'handed_over',
  'cancelled',
] as const

export const erpModules = [
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

export const commissionRules = {
  fullCommissionThreshold: 60,
  fullCommissionRate: 0.03,
  reducedCommissionRate: 0.015,
} as const
