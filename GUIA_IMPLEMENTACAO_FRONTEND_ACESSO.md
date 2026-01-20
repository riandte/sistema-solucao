# Guia de Implementação Frontend: Consumo de Acesso

Este documento define como o frontend deve se comportar em relação às permissões, garantindo uma UX fluida mas reconhecendo que **não existe segurança no cliente**.

## 1. Contrato de Dados (Session)

O frontend deve receber, no momento do login ou check de sessão, a lista de `roles` do usuário.

```typescript
// Exemplo de objeto de sessão no Client
interface ClientSession {
  user: {
    name: string;
    email: string;
    id: string;
    roles: ('ADMIN' | 'OPERADOR' | 'USUARIO')[];
  }
}
```

## 2. Componentes de Proteção (HOC/Wrapper)

Criar componentes utilitários para exibir/ocultar elementos da UI baseados em roles.

### `RoleGuard`
Renderiza o conteúdo apenas se o usuário tiver um dos papéis exigidos.

```tsx
<RoleGuard roles={['ADMIN', 'OPERADOR']}>
  <button onClick={handleMover}>Mover Card</button>
</RoleGuard>
```

### `PermissionGuard` (Opcional)
Se o frontend tiver conhecimento do mapa de permissões (espelhado do backend), pode-se usar permissões granulares.

```tsx
<Can I="PENDENCIA:CRIAR">
  <BotaoNovaPendencia />
</Can>
```

*Recomendação:* Para simplicidade inicial, use verificação por Roles no frontend e Permissões granulares no backend.

## 3. O que o Frontend PODE fazer
*   **Ocultar Botões:** Se o usuário é `USUARIO`, não mostrar o botão de "Excluir Usuário" ou "Configurações".
*   **Desabilitar Inputs:** Se o usuário não tem permissão de edição, renderizar formulários em modo `readOnly`.
*   **Redirecionar:** Se tentar acessar `/admin`, redirecionar para `/home` ou `/login`.

## 4. O que o Frontend NÃO PODE fazer (Limites)
*   **Validar Segurança:** Esconder um botão não impede que o usuário chame a API via `curl`. A validação real **sempre** é o retorno `403 Forbidden` da API.
*   **Decidir Acesso:** Nunca confie em dados armazenados em `localStorage` para decidir se mostra uma tela sensível. Dados sensíveis só devem vir do servidor após validação do token.

## 5. Tratamento de Erros de Acesso (UX)

Quando a API retornar `403 Forbidden`:

1.  **Toast/Notificação:** Exibir mensagem clara: *"Você não tem permissão para realizar esta ação."*
2.  **Não Deslogar:** Um erro 403 não significa token inválido (401), apenas falta de privilégio. Mantenha o usuário logado.
3.  **Reversão Otimista:** Se for uma ação de Kanban (Drag & Drop), reverta o card para a posição original imediatamente.

## 6. Checklist de Implementação Frontend

- [ ] O objeto de sessão/contexto inclui a lista de `roles`.
- [ ] Componente `<RoleGuard>` criado e testado.
- [ ] Telas administrativas (`/admin/**`) protegidas por verificação de role no `layout.tsx` ou middleware do Next.js.
- [ ] Tratamento global de erros interceptando status `401` (Redirecionar Login) e `403` (Toast de Erro).
