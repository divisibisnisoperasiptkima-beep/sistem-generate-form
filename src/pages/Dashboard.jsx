import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import useTemplateStore from '@/stores/useTemplateStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { FileText, Plus, Share2, ExternalLink, Trash2, Calendar, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const { user, signIn, signUp } = useAuthStore()
  const { templates, fetchTemplates, deleteTemplate, publishTemplate, unpublishTemplate, loading } = useTemplateStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [user, fetchTemplates])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError(null)

    if (isForgotPassword) {
      if (!email.trim()) return
      setAuthLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/reset-password',
      })
      setAuthLoading(false)
      if (error) {
        setAuthError(error.message)
      } else {
        setForgotPasswordSent(true)
      }
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address')
      return
    }
    if (!password) {
      setAuthError('Password is required')
      return
    }
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters')
      return
    }
    if (isSignUp && password !== confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }

    setAuthLoading(true)

    const { error } = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password)

    setAuthLoading(false)
    if (error) {
      setAuthError(error.message)
    }
  }

  const handleCopyLink = (template) => {
    const url = `${window.location.origin}/f/${template.share_token}`
    navigator.clipboard.writeText(url)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
        {/* Soft background glow circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '-3s' }} />

        <div className="max-w-md w-full animate-slide-up">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2.5">
              FormCraft PDF
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Upload PDF templates, build fillable forms, and automatically generate polished documents.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-xl shadow-slate-100/50">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isForgotPassword ? 'Enter your email to receive a password reset link.' : isSignUp ? 'Register to start building document forms.' : 'Enter your credentials to access your workspace.'}
              </p>
            </div>
            {forgotPasswordSent ? (
              <div className="text-center py-4">
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm text-emerald-700 font-medium bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100 mb-4">
                  If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setForgotPasswordSent(false); setAuthError(null) }}
                  className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="signin-email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {!isForgotPassword && (
                <>
              <Input
                type="password"
                label="Password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              {isSignUp && (
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              )}
                </>
              )}
              {authError && (
                <p className="text-sm text-red-500 font-medium bg-red-50/50 px-3 py-2 rounded-lg border border-red-100">{authError}</p>
              )}
              <Button type="submit" loading={authLoading} className="w-full py-2.5 rounded-xl text-sm">
                {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>
            )}
            {!isForgotPassword && !forgotPasswordSent && (
              <p className="text-xs text-slate-400 mt-5 text-center">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); setConfirmPassword('') }}
                  className="text-blue-600 font-medium hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            )}
            {!isForgotPassword && !isSignUp && !forgotPasswordSent && (
              <p className="text-xs text-slate-400 mt-3 text-center">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setAuthError(null); setPassword(''); setConfirmPassword('') }}
                  className="text-blue-600 font-medium hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </p>
            )}
            {isForgotPassword && !forgotPasswordSent && (
              <p className="text-xs text-slate-400 mt-5 text-center">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setForgotPasswordSent(false); setAuthError(null) }}
                  className="text-blue-600 font-medium hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Templates</h1>
            <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {templates.length} Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Design, publish, and share your PDF generation forms</p>
        </div>
        <Link to="/templates/new">
          <Button size="md" className="rounded-xl px-5 py-2.5 gap-2">
            <Plus className="h-4.5 w-4.5" />
            New Template
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Spinner size="lg" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <EmptyState
            icon={
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
            }
            title="Create your first template"
            description="Upload a PDF and map form inputs onto it to create a shareable, fillable digital document template."
            action={
              <Link to="/templates/new">
                <Button className="rounded-xl mt-2">
                  <Plus className="h-4 w-4" />
                  Create First Template
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-slate-100 p-6 card-hover flex flex-col justify-between shadow-sm relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/5">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    {template.is_published ? (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Published
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                <Link to={`/templates/${template.id}`} className="group block mb-2">
                  <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors leading-tight">
                    {template.name}
                  </h3>
                </Link>
                {template.description ? (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{template.description}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic mb-4">No description provided</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4 bg-slate-50/50 py-1.5 px-2.5 rounded-lg border border-slate-50 w-fit">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Updated {formatDate(template.updated_at)}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <Link to={`/templates/${template.id}`}>
                    <Button variant="outline" size="sm" className="text-xs px-3.5 py-1.5">
                      Configure
                    </Button>
                  </Link>
                  <div className="flex items-center gap-1">
                    {template.is_published && template.share_token && (
                      <button
                        onClick={() => handleCopyLink(template)}
                        className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                        title="Copy share link"
                      >
                        {copiedId === template.id ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (template.is_published) {
                          await unpublishTemplate(template.id)
                        } else {
                          await publishTemplate(template.id)
                        }
                        fetchTemplates()
                      }}
                      className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                      title={template.is_published ? 'Unpublish Form' : 'Publish Form'}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this template? All placements and fields will be removed.')) {
                          await deleteTemplate(template.id)
                          fetchTemplates()
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border border-transparent hover:border-red-100"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
