-- Tabela para controlar o número de mensagens enviadas por usuário
CREATE TABLE IF NOT EXISTS messages_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  platform TEXT NOT NULL DEFAULT 'telegram',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas rápidas por user_id e timestamp
CREATE INDEX IF NOT EXISTS idx_messages_sent_user_id_created_at ON messages_sent (user_id, created_at);

-- Função para limpeza automática de registros antigos
CREATE OR REPLACE FUNCTION clean_old_messages_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove registros com mais de 1 dia
  DELETE FROM messages_sent WHERE created_at < NOW() - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpeza diária
DROP TRIGGER IF EXISTS trigger_clean_old_messages_sent ON messages_sent;
CREATE TRIGGER trigger_clean_old_messages_sent
AFTER INSERT ON messages_sent
EXECUTE PROCEDURE clean_old_messages_sent(); 