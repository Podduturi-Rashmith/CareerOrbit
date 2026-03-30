'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

type ExpectedRole = 'admin' | 'student'

function getNormalizedRole(role: unknown): string | undefined {
  if (typeof role !== 'string') return undefined
  return role.toLowerCase()
}

function getNormalizedRoles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => getNormalizedRole(v))
      .filter((v): v is string => !!v)
  }
  const single = getNormalizedRole(value)
  return single ? [single] : []
}

export default function RoleGate({
  expectedRole,
  children,
}: {
  expectedRole: ExpectedRole
  children: ReactNode
}) {
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const rolesFromUser =
    getNormalizedRoles((user?.publicMetadata as any)?.roles).length > 0
      ? getNormalizedRoles((user?.publicMetadata as any)?.roles)
      : getNormalizedRoles((user?.publicMetadata as any)?.role)

  const testDualEmail = (process.env.NEXT_PUBLIC_TEST_DUAL_ROLE_EMAIL || '').toLowerCase().trim()
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase()
  const isTestDual = !!testDualEmail && !!email && email === testDualEmail

  const roles = isTestDual ? Array.from(new Set([...rolesFromUser, 'admin', 'student'])) : rolesFromUser

  const isAdmin = roles.includes('admin') || roles.includes('sub-admin')
  const isStudent = roles.includes('student') || (!isAdmin && roles.length === 0)

  const isAllowed =
    expectedRole === 'admin'
      ? isAdmin
      : // Student portal: allow anyone who is NOT admin.
        isStudent || (!isAdmin)

  React.useEffect(() => {
    if (!isLoaded) return
    if (isAllowed) return

    if (expectedRole === 'admin') {
      router.replace('/access-denied?reason=admin-only&returnUrl=%2Fdashboard')
    } else {
      router.replace('/admin')
    }
  }, [expectedRole, isAllowed, isLoaded, router])

  if (!isLoaded || !isAllowed) return null
  return <>{children}</>
}

