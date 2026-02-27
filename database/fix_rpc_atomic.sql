-- Arquivo para correção da RPC de criação de OS (Abordagem Atômica)
-- Remove a função antiga (assinatura incorreta) e cria a nova com todos os parâmetros

-- 1. Remover a função antiga (que aceitava apenas text)
DROP FUNCTION IF EXISTS criar_ordem_servico(text);

-- 2. Criar a nova função atômica
CREATE OR REPLACE FUNCTION criar_ordem_servico(
    p_contract_id TEXT,
    p_description TEXT,
    p_priority "Priority",
    p_scheduled_date TIMESTAMP,
    p_client_data JSONB
)
RETURNS service_orders
LANGUAGE plpgsql
AS $$
DECLARE
    v_contract_number TEXT;
    v_contract_status "ContractStatus";
    v_sequencial INTEGER;
    v_numero_os TEXT;
    v_new_os service_orders;
BEGIN
    -- A. Buscar dados do contrato e bloquear linha para consistência
    SELECT numero_contrato, status 
    INTO v_contract_number, v_contract_status
    FROM contracts 
    WHERE id = p_contract_id 
    FOR UPDATE;
    
    -- B. Validações de Negócio
    IF v_contract_number IS NULL THEN
        RAISE EXCEPTION 'Contrato não encontrado: %', p_contract_id;
    END IF;

    IF v_contract_status != 'ATIVO' THEN
        RAISE EXCEPTION 'Contrato % não está ATIVO (Status: %)', v_contract_number, v_contract_status;
    END IF;

    -- C. Calcular próximo sequencial (seguro devido ao FOR UPDATE acima)
    SELECT COALESCE(MAX(sequencial), 0) + 1 
    INTO v_sequencial 
    FROM service_orders 
    WHERE contract_id = p_contract_id;

    -- D. Formatar Numero OS (Exemplo: CONTRATO-1)
    v_numero_os := v_contract_number || '-' || v_sequencial;

    -- E. Inserir registro completo e retornar a linha
    INSERT INTO service_orders (
        id,
        contract_id,
        sequencial,
        numero_os,
        description,
        priority,
        scheduled_date,
        client_data,
        status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid()::text,
        p_contract_id,
        v_sequencial,
        v_numero_os,
        p_description,
        p_priority,
        p_scheduled_date,
        p_client_data,
        'ABERTA',
        NOW(),
        NOW()
    ) RETURNING * INTO v_new_os;

    RETURN v_new_os;
END;
$$;
