import { NextResponse } from 'next/server'
import { listarContratosPorCnpj } from '../../../../lib/locapp/client'

function validate(req: Request) {
  const expected = process.env.API_SECRET_KEY
  if (!expected) return true
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === expected
}

export async function GET(req: Request) {
  // if (!validate(req)) return NextResponse.json({ Sucesso: false, Mensagem: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const cpfcnpj = (url.searchParams.get('cpfcnpj') || '').trim()
  
  if (cpfcnpj) {
    console.log(`[API] Buscando contratos para CNPJ: ${cpfcnpj}`)
    try {
      const result = await listarContratosPorCnpj(cpfcnpj)
      console.log(`[API] Contratos encontrados:`, result)
      return NextResponse.json(result)
    } catch (err: any) {
      console.error(`[API] Erro ao buscar contratos:`, err)
      return NextResponse.json({ Sucesso: false, Mensagem: 'erro interno ao buscar contratos por cnpj' }, { status: 500 })
    }
  }

  return NextResponse.json({ Sucesso: false, Mensagem: 'Parâmetro cpfcnpj obrigatório' }, { status: 400 })
}
