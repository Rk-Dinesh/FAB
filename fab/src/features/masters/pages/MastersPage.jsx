import { Navigate, useParams } from 'react-router-dom'
import { mastersConfig } from '../config'
import { MastersCRUD } from '../components/MastersCRUD'

/** Route `/app/masters/:entity` — resolves the config and renders the CRUD screen. */
export function MastersPage() {
  const { entity } = useParams()
  const config = mastersConfig[entity]

  if (!config) return <Navigate to="/app/masters/company" replace />

  return <MastersCRUD key={entity} configKey={entity} config={config} />
}
