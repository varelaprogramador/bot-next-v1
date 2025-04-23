# Documentação da API

## Visão Geral

Esta documentação descreve os endpoints disponíveis na API do sistema de distribuição de produtos. A API permite verificar a disponibilidade de produtos, distribuir códigos de acesso a produtos e gerenciar usuários.

## Autenticação

Todos os endpoints da API requerem autenticação através de uma chave de API (API Key) enviada no cabeçalho `x-api-key`. Esta autenticação é verificada em produção e é opcional em ambiente de desenvolvimento.

Exemplo:

```
x-api-key: sua-api-key-aqui
```

## Endpoints

### Webhooks

#### Distribuir Produto

**Endpoint:** `POST /api/webhooks/distribuir-produto`

Este endpoint permite buscar um produto pelo nome e distribuir um código de acesso ao cliente.

**Parâmetros de Requisição:**

```json
{
  "nome_produto": "Nome do Produto",
  "tipo": "mensal", // opcional: mensal ou anual
  "customer": {
    "name": "Nome do Cliente",
    "phone": "+5511987654321",
    "correlationID": "id-de-correlacao-unico"
  }
}
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "produto": {
    "id": 123,
    "nome": "Nome do Produto"
  },
  "codigo": {
    "id": 456,
    "codigo": "ABC123XYZ"
  },
  "cliente": {
    "nome": "Nome do Cliente",
    "telefone": "+5511987654321",
    "correlationID": "id-de-correlacao-unico"
  }
}
```

**Respostas de Erro:**

- Produto não encontrado:
  ```json
  {
    "success": false,
    "message": "Produto Nome do Produto não encontrado"
  }
  ```
- Produto indisponível:
  ```json
  {
    "success": false,
    "message": "Produto indisponível no momento"
  }
  ```
- Dados do cliente incompletos:
  ```json
  {
    "success": false,
    "error": "Dados do cliente incompletos"
  }
  ```

### Produtos e Combos

#### Listar Todos os Produtos e Combos

**Endpoint:** `GET /api/products`

Este endpoint retorna a lista completa de todos os produtos e combos disponíveis no sistema.

**Parâmetros de Consulta (opcionais):**

- `?tipo=produto` - Filtra apenas produtos
- `?tipo=combo` - Filtra apenas combos
- `?status=ativo` - Filtra por status (ativo, inativo)

**Resposta de Sucesso:**

```json
{
  "success": true,
  "produtos": [
    {
      "id": 123,
      "nome": "Produto A",
      "descricao": "Descrição do Produto A",
      "tipo": "produto",
      "preco": 99.9,
      "status": "ativo",
      "periodo": "mensal"
    },
    {
      "id": 456,
      "nome": "Combo Premium",
      "descricao": "Combo que inclui vários produtos",
      "tipo": "combo",
      "preco": 199.9,
      "itens": [
        {
          "id": 123,
          "nome": "Produto A"
        },
        {
          "id": 124,
          "nome": "Produto B"
        }
      ],
      "status": "ativo",
      "periodo": "anual"
    }
  ],
  "total": 2,
  "pagina": 1,
  "totalPaginas": 1
}
```

**Respostas de Erro:**

- Erro de autenticação:
  ```json
  {
    "success": false,
    "message": "Autenticação inválida"
  }
  ```

### Usuários

#### Criar Usuário

**Endpoint:** `POST /api/users`

Este endpoint permite criar um novo usuário.

**Parâmetros de Requisição:**

```json
{
  "nome": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "senha": "senha-segura",
  "telefone": "+5511987654321"
}
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "user_id": "user-123",
  "message": "Usuário criado com sucesso"
}
```

### Produtos do Cliente

#### Listar Produtos do Cliente

**Endpoint:** `GET /api/customer-products`

Este endpoint retorna os produtos associados ao cliente autenticado.

**Headers Necessários:**

```
Authorization: Bearer seu-token-jwt
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "produtos": [
    {
      "id": 123,
      "nome": "Produto A",
      "descricao": "Descrição do Produto A",
      "codigo": "ABC123XYZ",
      "data_ativacao": "2023-06-15T10:30:00Z",
      "data_expiracao": "2024-06-15T10:30:00Z",
      "status": "ativo"
    }
  ]
}
```

## Exemplos de Uso

### Distribuir um Produto usando cURL

```bash
curl -X POST https://seu-dominio.com/api/webhooks/distribuir-produto \
  -H "Content-Type: application/json" \
  -H "x-api-key: sua-api-key-aqui" \
  -d '{
    "nome_produto": "Nome do Produto",
    "tipo": "mensal",
    "customer": {
      "name": "Nome do Cliente",
      "phone": "+5511987654321",
      "correlationID": "id-de-correlacao-unico"
    }
  }'
```

### Listar Todos os Produtos usando cURL

```bash
curl -X GET https://seu-dominio.com/api/products \
  -H "x-api-key: sua-api-key-aqui"
```

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `400 Bad Request`: Parâmetros inválidos ou ausentes
- `401 Unauthorized`: Autenticação necessária
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Notas Importantes

1. Todas as requisições devem usar o formato JSON.
2. Todos os timestamps são retornados no formato ISO 8601 (UTC).
3. A API utiliza UTF-8 para codificação de caracteres.
4. Certifique-se de que o `correlationID` seja único para cada transação para facilitar o rastreamento.

---

Para mais informações ou suporte, entre em contato com nossa equipe técnica.
