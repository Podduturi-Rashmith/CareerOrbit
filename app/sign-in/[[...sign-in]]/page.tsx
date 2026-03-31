import { SignIn } from '@clerk/nextjs'

const appearance = {
  variables: {
    colorBackground: '#ffffff',
    colorInputBackground: '#f1f5f9',
    colorInputText: '#0f172a',
    colorText: '#0f172a',
    colorTextSecondary: '#475569',
    colorNeutral: '#475569',
    colorPrimary: '#14b8a6',
    colorTextOnPrimaryBackground: '#042f2e',
    colorDanger: '#ef4444',
    borderRadius: '12px',
    fontFamily: 'var(--font-sans, inherit)',
    fontSize: '14px',
  },
  elements: {
    card: {
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
      borderRadius: '20px',
    },
    headerTitle: { color: '#0f172a', fontWeight: '700' },
    headerSubtitle: { color: '#475569' },
    socialButtonsBlockButton: {
      background: '#f8fafc',
      border: '1px solid rgba(0,0,0,0.10)',
      color: '#1e293b',
      borderRadius: '10px',
    },
    socialButtonsBlockButtonText: { color: '#1e293b' },
    dividerLine: { background: 'rgba(0,0,0,0.08)' },
    dividerText: { color: '#94a3b8', background: '#ffffff' },
    formFieldLabel: {
      color: '#475569',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    formFieldInput: {
      background: '#f1f5f9',
      border: '1px solid rgba(0,0,0,0.10)',
      color: '#0f172a',
      borderRadius: '10px',
    },
    formButtonPrimary: {
      background: '#14b8a6',
      color: '#042f2e',
      fontWeight: '800',
      borderRadius: '12px',
    },
    footerActionText: { color: '#64748b' },
    footerActionLink: { color: '#0d9488' },
    identityPreviewText: { color: '#0f172a' },
    identityPreviewEditButton: { color: '#0d9488' },
    formResendCodeLink: { color: '#0d9488' },
    otpCodeFieldInput: {
      background: '#f1f5f9',
      border: '1px solid rgba(0,0,0,0.10)',
      color: '#0f172a',
      borderRadius: '10px',
    },
    phoneInputBox: {
      background: '#f1f5f9',
      border: '1px solid rgba(0,0,0,0.10)',
      borderRadius: '10px',
      color: '#0f172a',
    },
    selectButton: {
      background: '#f1f5f9',
      color: '#1e293b',
      border: 'none',
    },
    selectOptionsContainer: {
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.10)',
      borderRadius: '12px',
    },
    selectOption: { color: '#1e293b' },
  },
}

export default function SignInPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#090c15' }}>
      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />

      {/* Ambient glow orbs */}
      <div
        className="absolute top-[-180px] right-[-80px] w-[560px] h-[560px] rounded-full pointer-events-none orb-a"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.13) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-150px] left-[-80px] w-[480px] h-[480px] rounded-full pointer-events-none orb-b"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)' }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        {/* Branding */}
        <div className="mb-8 text-center">
          <p
            className="text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ color: '#3d4e63' }}
          >
            CareerOrbit
          </p>
          <h1
            className="display text-3xl sm:text-4xl"
            style={{ color: '#f1f5f9' }}
          >
            Welcome back
          </h1>
          <p className="mt-3 text-sm max-w-xs mx-auto" style={{ color: '#8b9ab0' }}>
            Sign in to check your applications and latest updates.
          </p>
        </div>

        <SignIn forceRedirectUrl="/dashboard" appearance={appearance} />

        <p className="mt-8 text-[11px]" style={{ color: '#3d4e63' }}>
          Secured by Clerk · CareerOrbit Inc.
        </p>
      </div>
    </div>
  )
}
