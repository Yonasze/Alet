import type { Project, ProjectStructure } from '@/types/erp'

import { buildings, floors, projects, units } from './project-data'

export function getProjects(): Project[] {
  return projects
}

export function getProjectById(projectId: string): Project | undefined {
  return projects.find((project) => project.id === projectId)
}

export function getProjectStructure(projectId: string): ProjectStructure | undefined {
  const project = getProjectById(projectId)

  if (!project) {
    return undefined
  }

  return {
    project,
    buildings: buildings.filter((building) => building.projectId === projectId),
    floors: floors.filter((floor) => floor.projectId === projectId),
    units: units.filter((unit) => unit.projectId === projectId),
  }
}

export function formatCurrency(amount: number, currency = 'ETB'): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
