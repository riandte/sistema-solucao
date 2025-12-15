import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

// Mock authentication function - Replace this with actual AD/LDAP logic
async function authenticateUser(username: string, pass: string) {
  // -------------------------------------------------------------------------
  // AD Integration Example (using 'activedirectory2' or 'ldapjs'):
  // -------------------------------------------------------------------------
  // const ActiveDirectory = require('activedirectory2');
  // const config = {
  //   url: process.env.LDAP_URL || 'ldap://dc.domain.com',
  //   baseDN: process.env.LDAP_BASE_DN || 'dc=domain,dc=com',
  //   username: process.env.LDAP_USER, // Service account to bind
  //   password: process.env.LDAP_PASSWORD
  // };
  // const ad = new ActiveDirectory(config);
  // 
  // return new Promise((resolve) => {
  //   ad.authenticate(username + '@domain.com', pass, function(err, auth) {
  //     if (err) {
  //       console.error('AD Auth Error:', err);
  //       resolve(null);
  //       return;
  //     }
  //     if (auth) {
  //       // Optional: Get user details
  //       // ad.findUser(username, function(err, user) { resolve(user); });
  //       resolve({ name: username, email: `${username}@domain.com` });
  //     } else {
  //       resolve(null);
  //     }
  //   });
  // });
  // -------------------------------------------------------------------------

  // For now, accept a default test user or any user with password '123456'
  // Or match against an env var
  const validUser = 'admin'
  const validPass = process.env.ADMIN_PASSWORD || '123456'

  if ((username === validUser && pass === validPass) || (pass === '123456')) {
     return { name: username, email: 'admin@solucao.com.br', role: 'admin' }
  }

  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Usuário e senha obrigatórios' }, { status: 400 })
    }

    const user = await authenticateUser(username, password)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    // Create JWT Token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod'
    )

    const token = await new SignJWT({ ...user })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h') // Token expires in 8 hours
      .sign(secret)

    // Set cookie
    const response = NextResponse.json({ success: true })
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })

    return response

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ success: false, message: 'Erro interno no servidor' }, { status: 500 })
  }
}
