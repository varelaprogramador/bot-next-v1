"use client";

import { useState } from "react";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Componente para exibir blocos de código com syntax highlighting
const CodeBlock = ({ language, code }: { language: string; code: string }) => {
  return (
    <div className="my-4 rounded-md overflow-hidden">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: '0.375rem' }}
        showLineNumbers={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// Componente para exibir código inline
const InlineCode = ({ children }: { children: React.ReactNode }) => {
  return (
    <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm text-pink-600">
      {children}
    </code>
  );
};

// Componente para exibir exemplos de requisição/resposta
const ApiExample = ({ title, json }: { title: string; json: string }) => {
  return (
    <div className="my-3">
      <p className="font-medium text-gray-700 mb-1">{title}</p>
      <CodeBlock language="json" code={json} />
    </div>
  );
};

// Componente para seção de endpoint
const Endpoint = ({
  name,
  method,
  url,
  description,
  requestParams,
  successResponse,
  errorResponses = []
}: {
  name: string;
  method: string;
  url: string;
  description: string;
  requestParams?: string;
  successResponse: string;
  errorResponses?: Array<{ title: string; json: string }>
}) => {
  return (
    <div className="mb-10 pb-6 border-b border-gray-200">
      <h4 className="text-lg font-bold mt-4 mb-2">{name}</h4>
      <div className="flex items-center mb-3">
        <span className={`px-2 py-1 rounded-md text-xs font-bold mr-2 ${method === 'GET'
          ? 'bg-green-100 text-green-800'
          : method === 'POST'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
          }`}>
          {method}
        </span>
        <InlineCode>{url}</InlineCode>
      </div>
      <p className="mb-4 text-gray-700">{description}</p>

      {requestParams && (
        <ApiExample title="Parâmetros de Requisição:" json={requestParams} />
      )}

      <ApiExample title="Resposta de Sucesso:" json={successResponse} />

      {errorResponses.length > 0 && (
        <div className="mt-4">
          <p className="font-medium text-gray-700 mb-2">Respostas de Erro:</p>
          {errorResponses.map((error, index) => (
            <div key={index} className="mb-3">
              <p className="text-sm text-gray-600 mb-1">• {error.title}</p>
              <CodeBlock language="json" code={error.json} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DocPage = () => {
  const [activeTab, setActiveTab] = useState("pt-br");

  const renderPortugueseContent = () => (
    <>
      <h1 className="text-3xl font-bold mt-0 mb-6">Documentação da API</h1>

      <h2 className="text-2xl font-bold mt-8 mb-4">Visão Geral</h2>
      <p className="my-3">
        Esta documentação descreve os endpoints disponíveis na API do sistema de distribuição de produtos.
        A API permite verificar a disponibilidade de produtos, distribuir códigos de acesso a produtos e gerenciar usuários.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">Autenticação</h2>
      <p className="my-3">
        Todos os endpoints da API requerem autenticação através de uma chave de API (API Key) enviada no cabeçalho <InlineCode>x-api-key</InlineCode>.
        Esta autenticação é verificada em produção e é opcional em ambiente de desenvolvimento.
      </p>

      <p className="font-medium mt-4 mb-1">Exemplo:</p>
      <CodeBlock language="bash" code="x-api-key: sua-api-key-aqui" />

      <h2 className="text-2xl font-bold mt-10 mb-4">Endpoints</h2>

      <h3 className="text-xl font-bold mt-8 mb-4">Webhooks</h3>

      <Endpoint
        name="Distribuir Produto"
        method="POST"
        url="/api/webhooks/distribuir-produto"
        description="Este endpoint permite buscar um produto pelo nome e distribuir um código de acesso ao cliente."
        requestParams={`{
  "nome_produto": "Nome do Produto",
  "tipo": "mensal", // opcional: mensal ou anual
  "customer": {
    "name": "Nome do Cliente",
    "phone": "+5511987654321",
    "correlationID": "id-de-correlacao-unico"
  }
}`}
        successResponse={`{
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
}`}
        errorResponses={[
          {
            title: "Produto não encontrado:",
            json: `{
  "success": false,
  "message": "Produto Nome do Produto não encontrado"
}`
          },
          {
            title: "Produto indisponível:",
            json: `{
  "success": false,
  "message": "Produto indisponível no momento"
}`
          },
          {
            title: "Dados do cliente incompletos:",
            json: `{
  "success": false,
  "error": "Dados do cliente incompletos"
}`
          }
        ]}
      />

      <h3 className="text-xl font-bold mt-8 mb-4">Usuários</h3>

      <Endpoint
        name="Criar Usuário"
        method="POST"
        url="/api/users"
        description="Este endpoint permite criar um novo usuário."
        requestParams={`{
  "nome": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "senha": "senha-segura",
  "telefone": "+5511987654321"
}`}
        successResponse={`{
  "success": true,
  "user_id": "user-123",
  "message": "Usuário criado com sucesso"
}`}
      />

      <h3 className="text-xl font-bold mt-8 mb-4">Produtos do Cliente</h3>

      <Endpoint
        name="Listar Produtos do Cliente"
        method="GET"
        url="/api/customer-products"
        description="Este endpoint retorna os produtos associados ao cliente autenticado."
        successResponse={`{
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
}`}
      />
    </>
  );

  const renderEnglishContent = () => (
    <>
      <h1 className="text-3xl font-bold mt-0 mb-6">API Documentation</h1>

      <h2 className="text-2xl font-bold mt-8 mb-4">Overview</h2>
      <p className="my-3">
        This documentation describes the available endpoints in the product distribution system API.
        The API allows you to check product availability, distribute product access codes, and manage users.
      </p>

      <h2 className="text-2xl font-bold mt-8 mb-4">Authentication</h2>
      <p className="my-3">
        All API endpoints require authentication through an API Key sent in the <InlineCode>x-api-key</InlineCode> header.
        This authentication is verified in production and is optional in the development environment.
      </p>

      <p className="font-medium mt-4 mb-1">Example:</p>
      <CodeBlock language="bash" code="x-api-key: your-api-key-here" />

      <h2 className="text-2xl font-bold mt-10 mb-4">Endpoints</h2>

      <h3 className="text-xl font-bold mt-8 mb-4">Webhooks</h3>

      <Endpoint
        name="Distribute Product"
        method="POST"
        url="/api/webhooks/distribuir-produto"
        description="This endpoint allows you to retrieve a product by name and distribute an access code to the customer."
        requestParams={`{
  "nome_produto": "Product Name",
  "tipo": "mensal", // optional: mensal (monthly) or anual (yearly)
  "customer": {
    "name": "Customer Name",
    "phone": "+5511987654321",
    "correlationID": "unique-correlation-id"
  }
}`}
        successResponse={`{
  "success": true,
  "produto": {
    "id": 123,
    "nome": "Product Name"
  },
  "codigo": {
    "id": 456,
    "codigo": "ABC123XYZ"
  },
  "cliente": {
    "nome": "Customer Name",
    "telefone": "+5511987654321",
    "correlationID": "unique-correlation-id"
  }
}`}
        errorResponses={[
          {
            title: "Product not found:",
            json: `{
  "success": false,
  "message": "Product Product Name not found"
}`
          },
          {
            title: "Product unavailable:",
            json: `{
  "success": false,
  "message": "Product currently unavailable"
}`
          },
          {
            title: "Incomplete customer data:",
            json: `{
  "success": false,
  "error": "Incomplete customer data"
}`
          }
        ]}
      />

      <h3 className="text-xl font-bold mt-8 mb-4">Users</h3>

      <Endpoint
        name="Create User"
        method="POST"
        url="/api/users"
        description="This endpoint allows you to create a new user."
        requestParams={`{
  "nome": "User Name",
  "email": "user@example.com",
  "senha": "secure-password",
  "telefone": "+5511987654321"
}`}
        successResponse={`{
  "success": true,
  "user_id": "user-123",
  "message": "User created successfully"
}`}
      />

      <h3 className="text-xl font-bold mt-8 mb-4">Customer Products</h3>

      <Endpoint
        name="List Customer Products"
        method="GET"
        url="/api/customer-products"
        description="This endpoint returns the products associated with the authenticated customer."
        successResponse={`{
  "success": true,
  "produtos": [
    {
      "id": 123,
      "nome": "Product A",
      "descricao": "Description of Product A",
      "codigo": "ABC123XYZ",
      "data_ativacao": "2023-06-15T10:30:00Z",
      "data_expiracao": "2024-06-15T10:30:00Z",
      "status": "active"
    }
  ]
}`}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Cabeçalho */}
          <div className="px-6 py-4 bg-blue-600 text-white">
            <h1 className="text-2xl font-bold">Documentação da API</h1>
            <p className="mt-1 text-blue-100">Sistema de Distribuição de Produtos</p>
          </div>

          {/* Abas de língua */}
          <div className="bg-gray-100 px-6 py-3 border-b flex">
            <button
              onClick={() => setActiveTab("pt-br")}
              className={`px-4 py-2 mr-2 rounded-md ${activeTab === "pt-br"
                ? "bg-blue-600 text-white font-medium"
                : "bg-white hover:bg-gray-50"
                }`}
            >
              Português (BR)
            </button>
            <button
              onClick={() => setActiveTab("en")}
              className={`px-4 py-2 rounded-md ${activeTab === "en"
                ? "bg-blue-600 text-white font-medium"
                : "bg-white hover:bg-gray-50"
                }`}
            >
              English
            </button>
          </div>

          {/* Conteúdo da documentação */}
          <div className="p-6 documentation-content">
            {activeTab === "pt-br" ? renderPortugueseContent() : renderEnglishContent()}
          </div>

          {/* Rodapé */}
          <div className="bg-gray-50 px-6 py-4 border-t text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Next Gift Cards. Todos os direitos reservados.</p>
            <p className="mt-1">
              <Link href="/" className="text-blue-600 hover:underline">
                Voltar para a página inicial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocPage; 