import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import { FileText, LogOut, User } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Navbar() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  return (
    <nav className="glass-nav sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-extrabold text-base tracking-tight leading-tight">
                FormCraft PDF
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
                Workspace
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/templates">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                    Templates
                  </Button>
                </Link>
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 text-xs text-slate-600 font-medium">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>{user.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { signOut(); navigate('/') }}
                  className="text-slate-400 hover:text-red-500 gap-1.5"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Link
                to="/"
                onClick={() => {
                  setTimeout(() => {
                    const input = document.getElementById('signin-email')
                    if (input) {
                      input.focus()
                      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }, 100)
                }}
              >
                <Button size="sm" className="rounded-full px-5">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
