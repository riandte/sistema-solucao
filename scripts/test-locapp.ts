
import { consultarCliente, pesquisarPessoas } from '../src/backend/locapp/client';
import 'dotenv/config';

async function testarApiLocApp() {
    console.log("\n🔍 TESTE DE CONEXÃO COM API LOCAPP");
    console.log("===================================");

    // 1. Verificar Configuração
    const baseUrl = process.env.LOCAPP_BASE_URL;
    const cnpj = process.env.LOCAPP_CNPJ;
    
    console.log(`📡 URL Base: ${baseUrl}`);
    console.log(`🔑 CNPJ (Api-Key): ${cnpj}`);

    if (!baseUrl || !cnpj) {
        console.error("❌ ERRO: Variáveis de ambiente não configuradas.");
        return;
    }

    // 2. Teste de Consulta Específica (usando o CNPJ do próprio cliente como teste, ou um conhecido)
    // Vamos tentar buscar o próprio cliente pelo CNPJ configurado, é um teste comum que costuma funcionar
    const cnpjTeste = "76693892000115"; // CNPJ de exemplo do mock (João da Silva)
    
    console.log(`\n⏳ Testando consulta por CNPJ: ${cnpjTeste}...`);
    try {
        const resultado = await consultarCliente(cnpjTeste);
        if (resultado.sucesso) {
            console.log("✅ SUCESSO! Cliente encontrado:");
            console.log(`   Nome: ${resultado.dados?.Nome}`);
            console.log(`   Email: ${resultado.dados?.Email}`);
            console.log("   (Origem: Se os dados baterem com o real, a API respondeu)");
        } else {
            console.log("⚠️ API respondeu, mas cliente não encontrado (Isso é um resultado válido de conexão).");
            console.log(`   Mensagem: ${resultado.mensagem}`);
        }
    } catch (e: any) {
        console.error("❌ ERRO NA REQUISIÇÃO:");
        console.error(`   ${e.message}`);
        if (e.response) {
            console.error(`   Status: ${e.response.status}`);
            console.error(`   Dados: ${JSON.stringify(e.response.data)}`);
        }
    }

    // 3. Teste de Pesquisa Geral
    const termo = "João";
    console.log(`\n⏳ Testando pesquisa por termo: '${termo}'...`);
    try {
        const pesquisa = await pesquisarPessoas(termo);
        if (pesquisa.sucesso && pesquisa.dados) {
            console.log(`✅ SUCESSO! Encontrados ${pesquisa.dados.length} registros.`);
            if (pesquisa.dados.length > 0) {
                console.log(`   Primeiro resultado: ${pesquisa.dados[0].Nome}`);
            }
        } else {
            console.log("⚠️ Pesquisa não retornou resultados.");
        }
    } catch (e: any) {
        console.error("❌ ERRO NA PESQUISA:");
        console.error(`   ${e.message}`);
    }
}

testarApiLocApp();
