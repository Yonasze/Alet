import type { BusinessEvent, BusinessEventType } from '@/types/erp'

type CreateBusinessEventInput = {
  type: BusinessEventType
  organizationId: string
  projectId: string
  referenceType: string
  referenceId: string
  payload?: Record<string, unknown>
}

export function createBusinessEvent(input: CreateBusinessEventInput): Omit<BusinessEvent, 'id'> {
  return {
    type: input.type,
    organizationId: input.organizationId,
    projectId: input.projectId,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    payload: input.payload ?? {},
    createdAt: new Date().toISOString(),
  }
}

export function shouldTriggerPaymentStage(eventType: BusinessEventType): boolean {
  return eventType === 'FLOOR_COMPLETED' || eventType === 'MILESTONE_APPROVED'
}

export function shouldRecalculateCommission(eventType: BusinessEventType): boolean {
  return eventType === 'PAYMENT_RECEIVED' || eventType === 'UNIT_CONTRACTED'
}
