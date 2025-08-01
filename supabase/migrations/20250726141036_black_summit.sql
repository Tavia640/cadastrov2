/*
  # Criar tabela de configurações

  1. Nova Tabela
    - `configuracoes`
      - `id` (uuid, primary key)
      - `chave` (text, unique) - Nome da configuração
      - `valor` (text) - Valor da configuração
      - `descricao` (text) - Descrição da configuração
      - `ativo` (boolean) - Se a configuração está ativa
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `configuracoes`
    - Adicionar políticas para leitura das configurações

  3. Dados Iniciais
    - Inserir a chave API do Resend
*/

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura das configurações ativas
CREATE POLICY "Permitir leitura de configurações ativas"
  ON configuracoes
  FOR SELECT
  USING (ativo = true);

-- Inserir a chave API do Resend
INSERT INTO configuracoes (chave, valor, descricao, ativo) 
VALUES (
  'RESEND_API_KEY',
  're_SmQE7h9x_8gJ7nxVBZiv81R4YWEamyVTs',
  'Chave API do Resend para envio de emails',
  true
) ON CONFLICT (chave) DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = now();

-- Inserir email de destino configurável
INSERT INTO configuracoes (chave, valor, descricao, ativo) 
VALUES (
  'EMAIL_DESTINO',
  'admudrive2025@gavresorts.com.br',
  'Email de destino para receber as fichas de negociação',
  true
) ON CONFLICT (chave) DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = now();

-- Inserir configuração do remetente
INSERT INTO configuracoes (chave, valor, descricao, ativo) 
VALUES (
  'EMAIL_REMETENTE',
  'GAV Resorts <onboarding@resend.dev>',
  'Email e nome do remetente para os emails enviados',
  true
) ON CONFLICT (chave) DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = now();