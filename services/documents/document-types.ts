export const documentCategories = [
  'legal',
  'design',
  'procurement',
  'inventory',
  'construction',
  'sales',
  'finance',
  'contractor',
  'compliance',
  'handover',
  'other',
] as const

export type DocumentCategory = (typeof documentCategories)[number]
export type DocumentStatus = 'draft' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'archived'

export type DocumentProject = {
  id: string
  name: string
  code: string
}

