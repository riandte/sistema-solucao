import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import AppShell from '@/components/AppShell'

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  let user = { name: 'Usuário', email: '' }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod')
      const { payload } = await jwtVerify(token, secret)
      user = { name: (payload.name as string) || 'Usuário', email: (payload.email as string) || '' }
    } catch {}
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}
