import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-1">CareerOrbit</p>
          <h1 className="text-2xl font-black text-slate-900">Create your account</h1>
        </div>
        <SignUp forceRedirectUrl="/dashboard" />
      </div>
    </div>
  )
}
