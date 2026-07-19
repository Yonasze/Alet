const defaultErpPath = '/erp'

export function getSafeErpNextPath(candidate: string | null | undefined): string {
  if (!candidate || candidate.includes('\\')) return defaultErpPath

  try {
    const base = new URL('https://alet.invalid')
    const url = new URL(candidate, base)
    const isInternal = url.origin === base.origin
    const isErpPath = url.pathname === '/erp' || url.pathname.startsWith('/erp/')

    return isInternal && isErpPath ? `${url.pathname}${url.search}${url.hash}` : defaultErpPath
  } catch {
    return defaultErpPath
  }
}
