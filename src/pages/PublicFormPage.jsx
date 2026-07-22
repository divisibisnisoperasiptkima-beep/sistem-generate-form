import { useParams } from 'react-router-dom'
import PublicForm from '@/components/form/PublicForm'

export default function PublicFormPage() {
  const { shareToken } = useParams()

  return <PublicForm shareToken={shareToken} />
}
