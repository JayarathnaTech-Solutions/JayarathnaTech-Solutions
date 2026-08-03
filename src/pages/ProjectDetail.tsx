import { useParams } from 'react-router'

export function ProjectDetail() {
  const { projectId } = useParams()
  return <h1>Project {projectId}</h1>
}
