import { useState, useEffect } from 'react'
import { User } from 'lucide-react'

const UserInfo = () => {
    const [userInfo, setUserInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                console.log('🔍 Fetching user info...')
                const response = await fetch('/api/user')
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                const data = await response.json()
                console.log('👤 User info received:', data)
                setUserInfo(data)
            } catch (err) {
                console.error('❌ Failed to fetch user info:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchUserInfo()
    }, [])

    if (loading) {
        console.log('⏳ UserInfo: Loading...')
        return (
            <div className="user-info">
                <User size={20} />
                <span>Loading...</span>
            </div>
        )
    }

    if (error) {
        console.log('❌ UserInfo: Error state -', error)
        return (
            <div className="user-info">
                <User size={20} />
                <span>Error</span>
            </div>
        )
    }

    const hasUserData = userInfo && (userInfo.name || userInfo.email || userInfo.user)

    if (!hasUserData) {
        console.log('👻 UserInfo: No authentication - showing Guest')
        return (
            <div className="user-info">
                <User size={20} />
                <span className="user-name">Guest</span>
            </div>
        )
    }

    const displayName = userInfo.name || userInfo.email || userInfo.user
    console.log('✅ UserInfo: Authenticated user -', displayName)

    return (
        <div className="user-info" title={`${userInfo.name || 'Unknown'} (${userInfo.email || 'No email'})`}>
            <User size={20} />
            <span className="user-name">{displayName}</span>
        </div>
    )
}

export default UserInfo 