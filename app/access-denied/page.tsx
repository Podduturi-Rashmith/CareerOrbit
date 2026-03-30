import Link from 'next/link'

export default async function AccessDeniedPage({ searchParams }: any) {
  const sp = (await searchParams) ?? {}

  const reasonParam = sp?.reason
  const returnUrlParam = sp?.returnUrl

  const reason = Array.isArray(reasonParam) ? reasonParam[0] : reasonParam
  const returnUrl = Array.isArray(returnUrlParam) ? returnUrlParam[0] : returnUrlParam

  const isAdminOnly = reason === 'admin-only'
  const title = isAdminOnly ? 'Access denied: Admin only' : 'Access denied'
  const description = isAdminOnly
    ? 'This account is not an admin. Please use the Student portal instead.'
    : 'Your account role does not have access to this section.'

  const goTo = returnUrl || (isAdminOnly ? '/dashboard' : '/admin')

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#090c15' }}>
      <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md w-full">
          <div
            className="mx-auto mb-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-4"
            style={{ color: '#f1f5f9' }}
          >
            <p className="text-xs uppercase tracking-[0.22em] font-bold mb-3" style={{ color: '#3d4e63' }}>
              CareerOrbit
            </p>
            <h1 className="display text-2xl sm:text-3xl font-black" style={{ color: '#f1f5f9' }}>
              {title}
            </h1>
            <p className="mt-3 text-sm" style={{ color: '#8b9ab0' }}>
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={goTo}
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
              style={{ background: '#14b8a6', color: '#042f2e' }}
            >
              Go to {isAdminOnly ? 'Student Portal' : 'Admin Dashboard'}
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
              style={{ background: '#ffffff10', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

