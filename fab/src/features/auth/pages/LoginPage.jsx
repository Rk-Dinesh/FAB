import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { roleHome } from '@/config/roles'
import { toast } from '@/store/toastStore'
import { RoleQuickLogin } from '../components/RoleQuickLogin'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const loginAs = useAuthStore((state) => state.loginAs)
  const [formError, setFormError] = useState(null)
  const [pendingRole, setPendingRole] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: 'merch@apparelflow.com', password: 'demo123' },
  })

  const finish = (result) => {
    if (!result.ok) {
      setFormError(result.error)
      setPendingRole(null)
      return
    }
    toast.success(`Welcome back, ${result.user.name.split(' ')[0]}`)
    const target = location.state?.from ?? roleHome(result.user.role)
    navigate(target, { replace: true })
  }

  const onSubmit = async (values) => {
    setFormError(null)
    finish(await login(values))
  }

  const onQuickLogin = async (roleId) => {
    setFormError(null)
    setPendingRole(roleId)
    finish(await loginAs(roleId))
  }

  const busy = isSubmitting || pendingRole !== null

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-text">Sign in</h1>
      <p className="mt-1 text-sm text-muted">
        Demo environment — every account uses the password{' '}
        <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">demo123</code>.
      </p>

      {formError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          leading={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          leading={<Lock className="size-4" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex items-center justify-between">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={isSubmitting} disabled={busy}>
          Sign in
        </Button>
      </form>

      <RoleQuickLogin onSelect={onQuickLogin} pending={pendingRole} disabled={busy} />

      <p className="mt-6 text-center text-xs text-muted">
        Looking for the public site?{' '}
        <Link to="/" className="font-medium text-primary hover:underline">
          Back to apparelflow.com
        </Link>
      </p>
    </div>
  )
}
