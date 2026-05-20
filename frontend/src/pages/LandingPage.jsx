import { useEffect, useState } from 'react'
import LandingClientView from './LandingClientView'
import axiosClient from '../api/axiosClient'

export default function LandingPage() {
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axiosClient.get('/v1/projects/search?status=open')
        if (response?.data?.success && Array.isArray(response?.data?.data)) {
          setRecentProjects(response.data.data.slice(0, 4))
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return <LandingClientView recentProjects={recentProjects} />
}

