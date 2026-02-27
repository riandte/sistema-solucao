-- Função atualizada para criar Ordem de Serviço de forma atômica
-- Recebe todos os dados necessários e evita updates posteriores

CREATE OR REPLACE FUNCTION criar_ordem_servico(
    p_contract_id TEXT,
    p_description TEXT,
    p_priority "Priority",
    p_scheduled_date TIMESTAMP,
    p_client_data JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_sequencial INTEGER;
    v_numero_os TEXT;
    v_contract_number TEXT;
    v_new_id TEXT;
BEGIN
    -- 1. Obter o número do contrato para formatar a OS
    SELECT numero_contrato INTO v_contract_number FROM contracts WHERE id = p_contract_id;
    
    IF v_contract_number IS NULL THEN
        RAISE EXCEPTION 'Contrato não encontrado: %', p_contract_id;
    END IF;

    -- 2. Locking para garantir sequencial correto (evita duplicidade em concorrência)
    PERFORM 1 FROM contracts WHERE id = p_contract_id FOR UPDATE;
    
    -- 3. Calcular próximo sequencial
    SELECT COALESCE(MAX(sequencial), 0) + 1 
    INTO v_sequencial 
    FROM service_orders 
    WHERE contract_id = p_contract_id;

    -- 4. Formatar Numero OS (Exemplo: 1234-1)
    v_numero_os := v_contract_number || '-' || v_sequencial;

    -- 5. Inserir registro completo
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
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;
