import { unitLifecycle } from '@/lib/constants/erp'
import type { Unit, UnitStatus, UnitStatusSummary } from '@/types/erp'

const allowedTransitions: Record<UnitStatus, readonly UnitStatus[]> = {
  draft: ['available', 'cancelled'],
  available: ['reserved', 'contracted', 'cancelled'],
  reserved: ['available', 'contracted', 'cancelled'],
  contracted: ['under_payment', 'cancelled'],
  under_payment: ['fully_paid', 'cancelled'],
  fully_paid: ['handed_over'],
  handed_over: [],
  cancelled: ['draft'],
}

export function canTransitionUnitStatus(from: UnitStatus, to: UnitStatus): boolean {
  return allowedTransitions[from].includes(to)
}

export function getNextUnitStatuses(status: UnitStatus): readonly UnitStatus[] {
  return allowedTransitions[status]
}

export function summarizeUnitStatuses(units: readonly Unit[]): UnitStatusSummary {
  return unitLifecycle.reduce<UnitStatusSummary>((summary, status) => {
    summary[status] = units.filter((unit) => unit.status === status).length
    return summary
  }, {
    draft: 0,
    available: 0,
    reserved: 0,
    contracted: 0,
    under_payment: 0,
    fully_paid: 0,
    handed_over: 0,
    cancelled: 0,
  })
}

export function calculateUnitInventoryValue(units: readonly Unit[]): number {
  return units.reduce((total, unit) => total + unit.basePrice, 0)
}

export function isUnitSellable(unit: Unit): boolean {
  return unit.status === 'available' || unit.status === 'reserved'
}
