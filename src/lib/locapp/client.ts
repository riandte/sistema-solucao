import axios from 'axios'
import { formatDateBR } from './utils'
import type { PessoaResponse, Pessoa, InserirPessoaResponse, TitulosPeriodoResponse, TituloPorIdResponse } from './types'
import clientesPostman from './clientes_postman.json'

function cfg() {
  const base = process.env.LOCAPP_BASE_URL
  const cnpj = process.env.LOCAPP_CNPJ
  const secret = process.env.LOCAPP_SECRET
  return { base, cnpj, secret }
}

function headers() {
  const { cnpj, secret } = cfg()
  const h: Record<string, string> = {}
  if (cnpj) h['x-api-key'] = cnpj
  if (secret) h['x-api-secret'] = secret
  return h
}

export async function consultarCliente(cpfcnpj: string) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?cpfcnpj=${encodeURIComponent(cpfcnpj)}`
  const resp = await axios.get<PessoaResponse>(url, { headers: headers(), timeout: 10000 })
  const ok = !!resp.data?.Sucesso && !!resp.data?.Pessoa
  return { sucesso: ok, dados: ok ? (resp.data.Pessoa as Pessoa) : undefined, mensagem: ok ? undefined : 'Cliente não encontrado' }
}

export async function pesquisarPessoas(termo: string) {
  const { base } = cfg()
  
  // Search in local mock data
  const tLower = termo.toLowerCase()
  const localResults = (clientesPostman as any[]).filter(p => {
    const nome = (p.Nome || '').toLowerCase()
    const fantasia = (p.NomeFantasia || '').toLowerCase()
    const doc = (p.CpfCnpj || '').replace(/\D/g, '')
    const tDoc = termo.replace(/\D/g, '')

    return nome.includes(tLower) || 
           fantasia.includes(tLower) || 
           (tDoc.length >= 3 && doc.includes(tDoc))
  }) as Pessoa[]

  if (!base) {
    // If no API configured, return local results
    return { sucesso: true, dados: localResults }
  }

  // Try searching by generic 'q' parameter or 'nome'/'cpfcnpj' based on input
  // Assuming the API supports a generic search or filter
  const isDoc = /^\d+$/.test(termo)
  const param = isDoc ? 'cpfcnpj' : 'nome'
  
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?${param}=${encodeURIComponent(termo)}`
  
  try {
    const resp = await axios.get<any>(url, { headers: headers(), timeout: 10000 })
    
    // Normalize response: API might return { Pessoa: {...} } or { Pessoas: [...] } or { Dados: [...] }
    const data = resp.data
    let lista: Pessoa[] = []
    
    if (data.Pessoas && Array.isArray(data.Pessoas)) {
      lista = data.Pessoas
    } else if (data.Pessoa && !Array.isArray(data.Pessoa)) {
      lista = [data.Pessoa]
    } else if (Array.isArray(data)) {
      lista = data
    }

    // Merge with local results, avoiding duplicates by CpfCnpj
    const seen = new Set(lista.map(p => p.CpfCnpj))
    for (const p of localResults) {
      if (!seen.has(p.CpfCnpj)) {
        lista.push(p)
        seen.add(p.CpfCnpj)
      }
    }

    return { sucesso: true, dados: lista }
  } catch (err) {
    console.error('Erro na pesquisa (API falhou, retornando local):', err)
    // If API fails, return local results
    return { sucesso: true, dados: localResults }
  }
}

export async function listarTitulos(dataInicial: Date, dataFinal: Date) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Titulo/Get?DataInicial=${encodeURIComponent(formatDateBR(dataInicial))}&DataFinal=${encodeURIComponent(formatDateBR(dataFinal))}`
  const resp = await axios.get<TitulosPeriodoResponse>(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function listarContratos(params: { numero?: string; dataInicial?: Date; dataFinal?: Date }) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const baseUrl = `${base.replace(/\/$/, '')}/api/Contrato/`
  const qs: string[] = []
  if (params.numero) qs.push(`Numero=${encodeURIComponent(params.numero)}`)
  if (params.dataInicial && params.dataFinal) {
    qs.push(`DataEmissaoInicial=${encodeURIComponent(formatDateBR(params.dataInicial))}`)
    qs.push(`DataEmissaoFinal=${encodeURIComponent(formatDateBR(params.dataFinal))}`)
  }
  const url = `${baseUrl}?${qs.join('&')}`
  const resp = await axios.get(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function consultarTituloPorId(id: string) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Titulo/Get/${encodeURIComponent(id)}`
  const resp = await axios.get<TituloPorIdResponse>(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function inserirOuAtualizarPessoa(pessoas: Pessoa[]) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/InsertOrUpdate`
  const resp = await axios.post<InserirPessoaResponse>(url, pessoas, { headers: { ...headers(), 'Content-Type': 'application/json' }, timeout: 15000 })
  return resp.data
}
