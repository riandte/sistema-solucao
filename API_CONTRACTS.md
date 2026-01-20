# Contratos de API e Regras de Segurança: Módulo Pendências

## 1. Perfis de Usuário e Permissões

O sistema define dois perfis fundamentais para controle de acesso (RBAC simplificado).

| Perfil | Descrição | Permissões Chave |
| :--- | :--- | :--- |
| **ADMIN** | Gestor ou Administrador do Sistema | • Ver TODAS as pendências<br>• Criar pendências manuais<br>• Atribuir/Reatribuir responsáveis<br>• Alterar status de qualquer pendência<br>• Editar dados descritivos |
| **USER** | Usuário Operacional Padrão | • Ver pendências que CRIOU<br>• Ver pendências ATRIBUÍDAS a ele<br>• Criar pendências manuais<br>• Alterar status APENAS das suas pendências<br>• NÃO pode reatribuir responsáveis |

---

## 2. Endpoints REST (Contratos)

Todos os endpoints são protegidos e requerem autenticação (Bearer Token).

| Ação | Método | Endpoint | Descrição |
| :--- | :--- | :--- | :--- |
| **Listar** | `GET` | `/api/pendencias` | Lista pendências com filtros. Aplica regras de visibilidade automaticamente. |
| **Obter** | `GET` | `/api/pendencias/:id` | Retorna detalhes de uma pendência específica. Valida acesso. |
| **Criar** | `POST` | `/api/pendencias` | Cria uma nova pendência manual. |
| **Atualizar** | `PATCH` | `/api/pendencias/:id` | Atualiza campos permitidos (título, descrição, prioridade). |
| **Status** | `PATCH` | `/api/pendencias/:id/status` | Transição de estado (workflow). |
| **Atribuir** | `PATCH` | `/api/pendencias/:id/assign` | Define ou altera o responsável. |

---

## 3. Detalhamento dos Payloads

### 3.1. Criar Pendência (POST)
**Request:**
```json
{
  "titulo": "string (required, min: 5)",
  "descricao": "string (optional)",
  "tipo": "ADMINISTRATIVO | FINANCEIRO | OUTRO (required)",
  "prioridade": "BAIXA | MEDIA | ALTA (optional, default: MEDIA)",
  "dataPrevisao": "ISO8601 (optional)"
}
```
*Nota: Campos como `status` (sempre PENDENTE), `criadoPor` (token) e `dataCriacao` são definidos pelo backend.*

### 3.2. Listar Pendências (GET)
**Query Params:**
- `status`: Filtro por estado.
- `responsavelId`: Filtro por responsável (apenas Admin).
- `minha`: `true` (atalho para filtrar atribuídas ao usuário logado).

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "titulo": "...",
    "status": "PENDENTE",
    "prioridade": "ALTA",
    "responsavelId": "user-123",
    "criadoPor": "user-456",
    "dataCriacao": "2024-01-20T10:00:00Z"
  }
]
```

### 3.3. Alterar Status (PATCH)
**Request:**
```json
{
  "status": "EM_ANDAMENTO | CONCLUIDO | CANCELADO"
}
```
**Regras de Validação:**
- Se status for `CONCLUIDO`, a pendência DEVE ter um `responsavelId` definido.

### 3.4. Atribuir Responsável (PATCH)
**Request:**
```json
{
  "responsavelId": "uuid-do-usuario"
}
```

---

## 4. Regras de Visibilidade e Autorização

### 4.1. Visibilidade (Quem vê o quê)
1.  **Regra Geral (Admin)**: Usuários com role `ADMIN` visualizam 100% das pendências do banco de dados, sem restrições.
2.  **Regra Geral (User)**: Usuários com role `USER` visualizam **apenas**:
    - Pendências onde `criadoPor` == `seu_id`.
    - Pendências onde `responsavelId` == `seu_id`.
3.  **Filtro no Backend**: A filtragem deve ocorrer na **query do banco de dados**, nunca na memória da aplicação, para garantir performance e segurança.

### 4.2. Autorização de Escrita (Quem altera o quê)
1.  **Edição Básica**: Apenas o **Criador** (se status != CONCLUIDO) ou **Admin** podem editar título/descrição.
2.  **Transição de Status**:
    - `PENDENTE` -> `EM_ANDAMENTO`: Qualquer usuário com visibilidade pode "puxar" a tarefa para si (auto-atribuição).
    - `EM_ANDAMENTO` -> `CONCLUIDO`: Apenas o **Responsável Atual** ou **Admin**.
    - Qualquer -> `CANCELADO`: Apenas **Admin** ou **Criador**.
3.  **Atribuição**:
    - **User**: Pode apenas realizar **auto-atribuição** (definir `responsavelId` = si mesmo) se o campo estiver vazio.
    - **Admin**: Pode atribuir ou alterar `responsavelId` para qualquer usuário do sistema.

---

## 5. Considerações de Segurança Obrigatórias

1.  **Validação de ID (IDOR Prevention)**:
    - Todo acesso por ID (`GET /api/pendencias/:id`) deve verificar explicitamente se o usuário logado tem permissão de visualização sobre aquele registro específico.
    - Se não tiver permissão, o sistema deve retornar **404 Not Found** (para não revelar a existência do registro) em vez de 403 Forbidden.

2.  **Ownership no Token**:
    - A identificação do usuário (`userId`, `role`) deve vir exclusivamente do **Token JWT** decodificado no servidor. Jamais confiar em IDs enviados no corpo da requisição ou headers customizados para identificar o autor da ação.

3.  **Imutabilidade de Auditoria**:
    - Os campos `criadoPor` e `dataCriacao` são definidos no momento do `INSERT` e ignorados em qualquer operação de `UPDATE`.

4.  **Sanitização**:
    - Todos os inputs de texto (título, descrição) devem ser sanitizados para evitar injeção de scripts (XSS), embora o React já trate isso na renderização, a API deve garantir a integridade.

5.  **Tratamento de Erros**:
    - **401 Unauthorized**: Token ausente ou inválido.
    - **403 Forbidden**: Token válido, mas sem permissão para a ação (ex: User tentando reatribuir tarefa de outro).
    - **404 Not Found**: Recurso não existe ou usuário não tem visibilidade.
    - **422 Unprocessable Entity**: Erro de validação de negócio (ex: Concluir sem responsável).
