import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { Button, Input } from '@/components/ui'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    // No backend: the mock simply acknowledges the request.
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-success-soft">
          <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-text">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted">
          If an account exists for <span className="font-medium text-text">{sentTo}</span>, a reset
          link is on its way. In this demo no email is actually sent — sign in with{' '}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-xs">demo123</code>.
        </p>
        <Button as={Link} to="/login" variant="secondary" className="mt-6">
          <ArrowLeft className="size-4" /> Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-text">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the email on your account and we’ll send a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@apparelflow.com"
          leading={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </div>
  )
}
