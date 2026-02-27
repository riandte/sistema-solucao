import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Garante que a rota não seja cacheada estaticamente

export async function GET() {
  const startTime = performance.now();
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      LOCAPP_BASE_URL: process.env.LOCAPP_BASE_URL || 'UNDEFINED',
      LOCAPP_CNPJ: process.env.LOCAPP_CNPJ || 'UNDEFINED',
      LOCAPP_SECRET: process.env.LOCAPP_SECRET 
        ? `DEFINED (${process.env.LOCAPP_SECRET.length} chars)` 
        : 'UNDEFINED',
      NODE_ENV: process.env.NODE_ENV,
    },
    tests: []
  };

  const baseURL = process.env.LOCAPP_BASE_URL;
  if (!baseURL) {
    return NextResponse.json({ 
      error: 'LOCAPP_BASE_URL is not defined in environment variables',
      config: results.environment 
    }, { status: 500 });
  }

  // Helper para formatar erros
  const formatError = (error: any) => {
    return {
      message: error.message,
      name: error.name,
      code: error.code,
      cause: error.cause ? formatError(error.cause) : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      type: error.name === 'AbortError' ? 'Timeout' : 
            error.code === 'ENOTFOUND' ? 'DNS Error' :
            error.code === 'ECONNREFUSED' ? 'Connection Refused' :
            error.code === 'ETIMEDOUT' ? 'Connection Timeout' :
            'Network/Unknown Error'
    };
  };

  // Teste 1: Requisição Simples (Health Check ou Root)
  try {
    const t1Start = performance.now();
    console.log(`[Debug] Test 1: Fetching ${baseURL}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res1 = await fetch(baseURL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SistemaArara-Debug/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    const text1 = await res1.text();
    const t1End = performance.now();

    results.tests.push({
      name: 'Simple GET Request',
      url: baseURL,
      status: res1.status,
      statusText: res1.statusText,
      duration: `${(t1End - t1Start).toFixed(2)}ms`,
      headers: Object.fromEntries(res1.headers.entries()),
      bodyPreview: text1.substring(0, 1000) + (text1.length > 1000 ? '... [TRUNCATED]' : ''),
      success: res1.ok
    });

  } catch (error: any) {
    results.tests.push({
      name: 'Simple GET Request',
      url: baseURL,
      error: formatError(error),
      success: false
    });
  }

  // Teste 2: Requisição Autenticada (Simulada com Headers)
  try {
    const t2Start = performance.now();
    // Tenta acessar um endpoint que provavelmente exige autenticação ou pelo menos responde aos headers
    // Se a API base for apenas a raiz, usamos ela. Se tiver um endpoint específico de teste, seria melhor.
    // Assumindo a raiz ou um endpoint comum de validação se soubéssemos.
    // Vamos tentar bater na raiz mesmo, mas enviando as credenciais para ver se muda algo (ex: 200 vs 401/403)
    // ou se a API espera um path específico. Como o usuário pediu "GET simples para LOCAPP_BASE_URL", seguimos isso.
    
    console.log(`[Debug] Test 2: Fetching ${baseURL} with Auth Headers...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res2 = await fetch(baseURL, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'cnpj': process.env.LOCAPP_CNPJ || '',
        'secret': process.env.LOCAPP_SECRET || '',
        'User-Agent': 'SistemaArara-Debug/1.0'
      }
    });

    clearTimeout(timeoutId);

    const text2 = await res2.text();
    const t2End = performance.now();

    results.tests.push({
      name: 'Authenticated GET Request (Headers)',
      url: baseURL,
      requestHeaders: {
        'cnpj': process.env.LOCAPP_CNPJ,
        'secret': process.env.LOCAPP_SECRET ? '***HIDDEN***' : 'UNDEFINED'
      },
      status: res2.status,
      statusText: res2.statusText,
      duration: `${(t2End - t2Start).toFixed(2)}ms`,
      headers: Object.fromEntries(res2.headers.entries()),
      bodyPreview: text2.substring(0, 1000) + (text2.length > 1000 ? '... [TRUNCATED]' : ''),
      success: res2.ok
    });

  } catch (error: any) {
    results.tests.push({
      name: 'Authenticated GET Request (Headers)',
      url: baseURL,
      error: formatError(error),
      success: false
    });
  }

  const totalTime = performance.now() - startTime;
  results.totalDuration = `${totalTime.toFixed(2)}ms`;

  return NextResponse.json(results, { status: 200 });
}
