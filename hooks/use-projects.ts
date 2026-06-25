import { getProjects, getProjectStructure } from '@/services/projects/project-service'

export function useProjects() {
  return {
    projects: getProjects(),
  }
}

export function useProjectStructure(projectId: string) {
  return {
    structure: getProjectStructure(projectId),
  }
}
