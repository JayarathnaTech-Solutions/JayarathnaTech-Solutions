import { useParams } from 'react-router'

export function TestimonialSubmission() {
  const { token } = useParams()
  return <h1>Testimonial submission ({token})</h1>
}
