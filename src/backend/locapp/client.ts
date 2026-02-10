import axios from 'axios'
import type { PessoaResponse, Pessoa, InserirPessoaResponse } from './types'

import { env } from '@/shared/env'
import { supabase } from '@/lib/supabase'

function cfg() {
  const base = env.LOCAPP_BASE_URL
  const cnpj = env.LOCAPP_CNPJ
  const secret = env.LOCAPP_SECRET
  return { base, cnpj, secret }
}

function headers() {
  const { cnpj, secret } = cfg()
  const h: Record<string, string> = {}
  if (cnpj) h['x-api-key'] = cnpj
  if (secret) h['x-api-secret'] = secret
  return h
}

// Helper para converter dados do Supabase para Pessoa
function mapSupabaseToPessoa(row: any): Pessoa {
  // Se a coluna 'dados' existir e tiver o JSON completo, usamos ela
  // Mas garantimos que os campos principais batam
  if (row.dados) {
    return row.dados as Pessoa;
  }
  // Fallback se a estrutura for diferente
  return {
    CpfCnpj: row.cpf_cnpj,
    Nome: row.nome,
    NomeFantasia: row.nome_fantasia,
    Email: row.email,
    Id: row.id
  } as Pessoa;
}

export async function consultarCliente(cpfcnpj: string) {
  const { base } = cfg()
  
  // 1. Se API configurada, tenta buscar nela (Prioridade Máxima para Dados Reais)
  if (base) {
    try {
      const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?cpfcnpj=${encodeURIComponent(cpfcnpj)}`
      const resp = await axios.get<PessoaResponse>(url, { headers: headers(), timeout: 10000 })
      
      if (resp.data?.Sucesso && resp.data?.Pessoa) {
        return { sucesso: true, dados: resp.data.Pessoa as Pessoa }
      }
    } catch (err) {
      console.warn(`Erro ao consultar API LocApp (${cpfcnpj}):`, err)
      // Se falhar na API, continua para tentar Supabase/Mock como fallback
    }
  }

  // 2. Tentar buscar do Supabase (Cache/Réplica)
  if (supabase) {
    try {
      // Remove caracteres não numéricos para garantir match
      const doc = cpfcnpj.replace(/\D/g, '')
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf_cnpj', doc)
        .single()
      
      if (data) {
        return { sucesso: true, dados: mapSupabaseToPessoa(data) }
      }
    } catch (err) {
      console.warn('Erro ao consultar Supabase:', err)
    }
  }

  // 3. Fallback para Mock removido para produção
  // Se tinha base configurada mas falhou/não achou, retorna erro ou vazio
  return { sucesso: false, mensagem: 'Cliente não encontrado' }
}

export async function pesquisarPessoas(termo: string) {
  const { base } = cfg()
  let apiResults: Pessoa[] = []
  let apiError = false

  // 1. Tentar buscar na API Real (Prioridade)
  if (base) {
    try {
      const isDoc = /^\d+$/.test(termo)
      const param = isDoc ? 'cpfcnpj' : 'nome'
      
      const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?${param}=${encodeURIComponent(termo)}`
      const resp = await axios.get<any>(url, { headers: headers(), timeout: 10000 })
      
      const data = resp.data
      if (data.Pessoas && Array.isArray(data.Pessoas)) {
        apiResults = data.Pessoas
      } else if (data.Pessoa && !Array.isArray(data.Pessoa)) {
        apiResults = [data.Pessoa]
      } else if (Array.isArray(data)) {
        apiResults = data
      }
    } catch (err) {
      console.error('Erro na pesquisa API LocApp:', err)
      apiError = true
    }
  }

  // 2. Tentar buscar do Supabase (Complemento/Fallback)
  let supabaseResults: Pessoa[] = []
  if (supabase) {
    try {
      const tDoc = termo.replace(/\D/g, '')
      let query = supabase.from('clientes').select('*').limit(20)

      if (tDoc.length >= 3) {
         query = query.ilike('cpf_cnpj', `%${tDoc}%`)
      } else {
         query = query.or(`nome.ilike.%${termo}%,nome_fantasia.ilike.%${termo}%`)
      }

      const { data } = await query
      if (data && data.length > 0) {
        supabaseResults = data.map(mapSupabaseToPessoa)
      }
    } catch (err) {
      console.warn('Erro ao pesquisar Supabase:', err)
    }
  }

  // Combinar Resultados (API > Supabase)
  // Remove duplicatas por CPF/CNPJ
  const combined = [...apiResults, ...supabaseResults]
  const seen = new Set()
  const uniqueResults: Pessoa[] = []

  for (const p of combined) {
    if (p.CpfCnpj && !seen.has(p.CpfCnpj)) {
      seen.add(p.CpfCnpj)
      uniqueResults.push(p)
    }
  }

  return { sucesso: true, dados: uniqueResults }
}


export async function listarContratosPorCnpj(cpfCnpj: string) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  // Try filtering by CpfCnpj if the API supports it
  const url = `${base.replace(/\/$/, '')}/api/Contrato/Get?CpfCnpj=${encodeURIComponent(cpfCnpj)}`
  const resp = await axios.get(url, { headers: headers(), timeout: 10000 })
  return resp.data
}

export async function inserirOuAtualizarPessoa(pessoas: Pessoa[]) {
  const { base } = cfg()
  if (!base) throw new Error('LOCAPP_BASE_URL ausente')
  const url = `${base.replace(/\/$/, '')}/api/Pessoa/InsertOrUpdate`
  const resp = await axios.post<InserirPessoaResponse>(url, pessoas, { headers: { ...headers(), 'Content-Type': 'application/json' }, timeout: 15000 })
  return resp.data
}

export async function checkApiStatus() {
  const { base } = cfg()
  const start = performance.now()
  
  if (!base) {
    return { status: 'error' as const, message: 'URL não configurada', latency: 0 }
  }

  try {
    // Tenta um endpoint leve ou uma busca que sabemos que falhará rápido mas testará a conexão
    // Usando um nome impossível para garantir retorno vazio rápido se conectar
    const url = `${base.replace(/\/$/, '')}/api/Pessoa/Get?nome=HealthCheckPing`
    await axios.get(url, { headers: headers(), timeout: 5000 })
    
    // Se passar (200 OK), está ótimo
    return { status: 'connected' as const, message: 'Online', latency: Math.round(performance.now() - start) }
  } catch (err: any) {
    const latency = Math.round(performance.now() - start)
    
    if (err.response) {
      // 403/401 significa que CONECTOU no servidor, mas a chave é inválida.
      // Para fins de status de REDE, isso é "conectado" (o servidor está lá), 
      // mas operacionalmente é um erro.
      // O usuário pediu para ver a "comunicação", então vou distinguir.
      if (err.response.status === 401 || err.response.status === 403) {
         return { status: 'auth_error' as const, message: 'Autenticação Inválida', latency }
      }
      // Outros erros de servidor (500)
      return { status: 'error' as const, message: `Erro ${err.response.status}`, latency }
    } else if (err.code === 'ECONNABORTED') {
       return { status: 'timeout' as const, message: 'Tempo Esgotado', latency }
    }
    
    return { status: 'error' as const, message: 'Sem Conexão', latency }
  }
}
