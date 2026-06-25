export type UserRole = 'admin' | 'finance' | 'sales' | 'engineer' | 'procurement' | 'contractor'

export type Permission =
  | 'create_unit'
  | 'reserve_unit'
  | 'approve_payment'
  | 'view_financial_reports'
  | 'manage_inventory'
  | 'approve_milestone'
  | 'manage_procurement'
  | 'manage_documents'

export type UnitStatus =
  | 'draft'
  | 'available'
  | 'reserved'
  | 'contracted'
  | 'under_payment'
  | 'fully_paid'
  | 'handed_over'
  | 'cancelled'

export type UnitType = 'studio' | '1br' | '2br' | '3br' | '4br'

export type ConstructionStage = 'foundation' | 'structural' | 'roofing' | 'finishing' | 'handover'

export type LedgerTransactionType =
  | 'income'
  | 'expense'
  | 'commission'
  | 'procurement'
  | 'contractor_payment'

export type BusinessEventType =
  | 'UNIT_RESERVED'
  | 'UNIT_CONTRACTED'
  | 'PAYMENT_RECEIVED'
  | 'FLOOR_COMPLETED'
  | 'MATERIAL_DELIVERED'
  | 'MILESTONE_APPROVED'
  | 'UNIT_HANDED_OVER'

export type Organization = {
  id: string
  name: string
  createdAt: string
}

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed'

export type Project = {
  id: string
  organizationId: string
  name: string
  code: string
  status: ProjectStatus
  location?: string
  activeUnitCount?: number
  soldUnitCount?: number
  reservedUnitCount?: number
  createdAt: string
  updatedAt: string
}

export type Building = {
  id: string
  organizationId: string
  projectId: string
  name: string
  floorCount: number
  unitCount: number
  createdAt: string
  updatedAt: string
}

export type Floor = {
  id: string
  organizationId: string
  projectId: string
  buildingId: string
  floorNumber: number
  unitCount: number
  createdAt: string
  updatedAt: string
}

export type Unit = {
  id: string
  organizationId: string
  projectId: string
  buildingId: string
  floorId: string
  unitNumber: string
  type: UnitType
  sizeSqm: number
  basePrice: number
  status: UnitStatus
  createdAt: string
  updatedAt: string
}

export type ProjectStructure = {
  project: Project
  buildings: Building[]
  floors: Floor[]
  units: Unit[]
}

export type UnitStatusSummary = Record<UnitStatus, number>

export type BusinessEvent = {
  id: string
  type: BusinessEventType
  organizationId: string
  projectId: string
  referenceType: string
  referenceId: string
  payload: Record<string, unknown>
  createdAt: string
}

export type FinancialTransaction = {
  id: string
  organizationId: string
  projectId: string
  unitId?: string
  type: LedgerTransactionType
  amount: number
  currency: string
  description: string
  eventId?: string
  createdAt: string
}
