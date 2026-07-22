import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserMinus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Trash2, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminUserManagement() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])

  const fetchProfiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw new Error(profilesError.message)

      const { data: templates } = await supabase
        .from('templates')
        .select('id, user_id')

      const templateCounts = (templates || []).reduce((acc, t) => {
        acc[t.user_id] = (acc[t.user_id] || 0) + 1
        return acc
      }, {})

      const { data: submissions } = await supabase
        .from('submissions')
        .select('id, submitted_by')

      const submissionCounts = (submissions || []).reduce((acc, s) => {
        if (s.submitted_by) {
          acc[s.submitted_by] = (acc[s.submitted_by] || 0) + 1
        }
        return acc
      }, {})

      const mappedUsers = (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        role: p.role,
        status: p.status,
        created_at: p.created_at,
        templateCount: templateCounts[p.id] || 0,
        pdfCount: submissionCounts[p.id] || 0,
      }))

      setUsers(mappedUsers)
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfiles()
    }
  }, [user])

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active'
    
    const { error } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('id', id)
    
    if (error) {
      alert("Failed to update status: " + error.message)
      return
    }
    
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: nextStatus } : u))
  }

  const handleChangeRole = async (id, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)
    
    if (error) {
      alert("Failed to update role: " + error.message)
      return
    }
    
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u))
  }

  const handleDeleteUser = async (id) => {
    if (confirm('Are you sure you want to remove this user profile? All associated templates and submissions will be unlinked.')) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      
      if (error) {
        alert("Failed to remove user profile: " + error.message)
        return
      }
      
      setUsers(prev => prev.filter(u => u.id !== id))
    }
  }

  const totalUsersCount = users.length
  const activeUsersCount = users.filter(u => u.status === 'Active').length
  const totalTemplatesCount = users.reduce((sum, u) => sum + u.templateCount, 0)
  const totalPdfsCount = users.reduce((sum, u) => sum + u.pdfCount, 0)

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
      {/* Error Banner */}
      {error && !loading && (
        <div className="mb-6 flex items-start gap-3 bg-red-50/80 border border-red-100/80 rounded-2xl p-4 shadow-sm animate-scale-in">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-800">Failed to Load User Data</h4>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              {error}
            </p>
            <p className="text-xs text-red-600 mt-2 leading-relaxed">
              Ensure the <code className="bg-red-100/50 px-1.5 py-0.5 rounded font-mono font-bold text-red-900">public.profiles</code> table exists and admin RLS policies are applied. Run <code className="bg-red-100/50 px-1.5 py-0.5 rounded font-mono font-bold text-red-900">supabase/migrations/002_profiles.sql</code> and <code className="bg-red-100/50 px-1.5 py-0.5 rounded font-mono font-bold text-red-900">supabase/migrations/003_admin_rls.sql</code> in the Supabase SQL Editor.
            </p>
          </div>
          <button
            onClick={fetchProfiles}
            className="shrink-0 p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-200 cursor-pointer"
            title="Retry"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <Link to="/" className="p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-all duration-200 mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
              {!loading && !error && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Live Connected
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">Audit active accounts, change permission levels, and monitor system metrics</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
          <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Unable to Load Data</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            An error occurred while fetching user data from the database. Please check your Supabase configuration and try again.
          </p>
          <Button onClick={fetchProfiles} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Accounts</span>
                <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800">{totalUsersCount}</h3>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">All time</span>
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sessions</span>
                <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800">{activeUsersCount}</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                <span className="text-emerald-500 font-semibold">{totalUsersCount > 0 ? Math.round((activeUsersCount/totalUsersCount)*100) : 0}%</span> active usage rate
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Templates Built</span>
                <div className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800">{totalTemplatesCount}</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Avg <span className="font-semibold text-slate-600">{totalUsersCount > 0 ? (totalTemplatesCount/totalUsersCount).toFixed(1) : 0}</span> per user account
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PDFs Generated</span>
                <div className="h-9 w-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800">{totalPdfsCount}</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                Across all template forms
              </p>
            </div>
          </div>

          {/* Filter and Table Container */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-10">
            {/* Search & Filters */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter By:</span>
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* User Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">User</th>
                    <th scope="col" className="px-6 py-4">Role</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Templates</th>
                    <th scope="col" className="px-6 py-4">PDFs Gen</th>
                    <th scope="col" className="px-6 py-4">Joined</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400 italic">
                        No matching user records found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{u.email}</td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                              u.role === 'Admin' 
                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                : u.role === 'Editor'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : u.status === 'Suspended'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{u.templateCount}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{u.pdfCount}</td>
                        <td className="px-6 py-4 text-xs text-slate-400">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                u.status === 'Active'
                                  ? 'border-red-100 text-red-500 hover:bg-red-50'
                                  : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                            >
                              {u.status === 'Active' ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4 text-emerald-600" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
