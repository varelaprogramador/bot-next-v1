# Docker Setup - Bot Next.js

Este projeto está configurado para rodar com Docker usando multi-stage builds para otimização.

## 📋 Pré-requisitos

- Docker
- Docker Compose

## 🚀 Como usar

### 1. Build e execução básica

```bash
# Build da imagem
docker build -t bot-next .

# Executar container
docker run -p 3000:3000 bot-next
```

### 2. Usando Docker Compose

#### Produção

```bash
# Build e iniciar em produção
docker-compose up --build

# Executar em background
docker-compose up -d --build
```

#### Desenvolvimento

```bash
# Iniciar ambiente de desenvolvimento
docker-compose --profile dev up --build

# Acessar logs
docker-compose logs -f app-dev
```

#### Produção com Nginx

```bash
# Iniciar com proxy reverso
docker-compose --profile production up --build
```

### 3. Comandos úteis

```bash
# Parar todos os containers
docker-compose down

# Remover volumes (cuidado!)
docker-compose down -v

# Rebuild sem cache
docker-compose build --no-cache

# Ver logs
docker-compose logs -f app

# Executar comandos no container
docker-compose exec app npm run lint
```

## 🔧 Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_do_supabase

# Clerk
CLERK_SECRET_KEY=sua_chave_secreta_do_clerk
CLERK_PUBLISHABLE_KEY=sua_chave_publica_do_clerk

# Outras variáveis
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 📁 Estrutura dos Arquivos Docker

- `Dockerfile` - Configuração multi-stage para build otimizado
- `docker-compose.yml` - Orquestração dos serviços
- `.dockerignore` - Arquivos ignorados no build
- `nginx.conf` - Configuração do proxy reverso
- `app/api/health/route.ts` - Endpoint de health check

## 🏗️ Multi-stage Build

O Dockerfile usa 4 stages:

1. **base** - Imagem base com Node.js
2. **deps** - Instalação de dependências
3. **builder** - Build da aplicação Next.js
4. **runner** - Imagem final otimizada para produção

## 🔍 Health Check

O container inclui health check automático:

```bash
# Verificar status
curl http://localhost:3000/api/health

# Resposta esperada
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

## 🛡️ Segurança

- Usuário não-root (`nextjs`)
- Imagem Alpine Linux (menor footprint)
- Headers de segurança no Nginx
- Health checks automáticos

## 📊 Monitoramento

### Logs

```bash
# Logs em tempo real
docker-compose logs -f app

# Logs com timestamps
docker-compose logs -t app
```

### Métricas

```bash
# Uso de recursos
docker stats

# Informações do container
docker inspect bot-next-app-1
```

## 🔄 Deploy

### Produção

```bash
# Build para produção
docker-compose --profile production up --build -d

# Verificar status
docker-compose ps
```

### Desenvolvimento

```bash
# Ambiente de desenvolvimento
docker-compose --profile dev up --build

# Hot reload ativo
# Acesse: http://localhost:3001
```

## 🐛 Troubleshooting

### Problemas comuns

1. **Porta já em uso**

   ```bash
   # Verificar portas em uso
   netstat -tulpn | grep :3000

   # Parar processo
   sudo kill -9 <PID>
   ```

2. **Permissões de arquivo**

   ```bash
   # Corrigir permissões
   sudo chown -R $USER:$USER .
   ```

3. **Cache do Docker**

   ```bash
   # Limpar cache
   docker system prune -a
   ```

4. **Logs de erro**
   ```bash
   # Ver logs detalhados
   docker-compose logs app
   ```

## 📝 Notas

- O Next.js está configurado com `output: 'standalone'` para otimização
- O Nginx serve como proxy reverso opcional
- Health checks são executados a cada 30 segundos
- Volumes são usados para desenvolvimento (hot reload)
- SSL/TLS deve ser configurado manualmente no `nginx.conf`
