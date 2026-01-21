import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { RoleName } from '@/lib/types'
import { MockUserStore } from '@/lib/auth/mockUsers'
import { MockFuncionarioStore } from '@/lib/org/funcionarios'
import { MockCargoStore } from '@/lib/org/cargos'

// Mock authentication function - Replace this with actual AD/LDAP logic
async function authenticateUser(username: string, pass: string) {
  const users = await MockUserStore.getAll();
  
  // Busca por email ou nome (case insensitive simples)
  const user = users.find(u => 
    (u.email.toLowerCase() === username.toLowerCase() || u.name.toLowerCase() === username.toLowerCase())
  );

  if (!user) return null;

  // Validação de senha (mock: aceita a senha do usuário ou '123456' como master pass de dev)
  const isPasswordValid = user.password === pass || pass === '123456';
  
  if (!isPasswordValid) return null;

  // Validação de Status
  if (!user.active) {
    console.warn(`Tentativa de login de usuário inativo: ${username}`);
    return 'INACTIVE';
  }

  // Buscar dados do funcionário vinculado
  const funcionario = await MockFuncionarioStore.getByUserId(user.id);
  let funcionarioData = undefined;

  if (funcionario && funcionario.ativo) {
    const cargo = await MockCargoStore.getById(funcionario.cargoId);
    if (cargo) {
        funcionarioData = {
            id: funcionario.id,
            setorId: funcionario.setorId,
            cargoId: funcionario.cargoId,
            escopo: cargo.escopo
        };
    }
  }

  return { 
    id: user.id,
    name: user.name, 
    email: user.email, 
    roles: user.roles,
    funcionario: funcionarioData
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Usuário e senha obrigatórios' }, { status: 400 })
    }

    const result = await authenticateUser(username, password)

    if (!result) {
      return NextResponse.json({ success: false, message: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    if (result === 'INACTIVE') {
      return NextResponse.json({ success: false, message: 'Conta desativada. Contate o administrador.' }, { status: 403 })
    }

    const user = result;

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
