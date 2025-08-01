/*
  # Criar tabelas para fichas de cadastro e negociação

  1. Novas Tabelas
    - `clientes` - Dados dos clientes
    - `fichas_negociacao` - Dados das negociações
    - `contratos` - Contratos da negociação
    - `pagamentos` - Informações de pagamento
    - `formas_pagamento_sala` - Parcelas pagas em sala

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Adicionar políticas básicas de acesso

  3. Relacionamentos
    - Chaves estrangeiras entre as tabelas
*/

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL,
  rg text,
  orgao_emissor text,
  estado_emissor text,
  profissao text,
  data_nascimento date,
  estado_civil text,
  email text,
  telefone text,
  
  -- Endereço
  logradouro text,
  numero text,
  bairro text,
  complemento text,
  cep text,
  cidade text,
  estado text,
  
  -- Dados do cônjuge
  nome_conjuge text,
  cpf_conjuge text,
  rg_conjuge text,
  orgao_emissor_conjuge text,
  estado_emissor_conjuge text,
  profissao_conjuge text,
  data_nascimento_conjuge date,
  estado_civil_conjuge text,
  email_conjuge text,
  telefone_conjuge text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de fichas de negociação
CREATE TABLE IF NOT EXISTS fichas_negociacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  
  -- Dados da negociação
  liner text,
  closer text,
  lider_sala text,
  nome_sala text,
  tipo_venda text,
  
  -- Dados do consultor
  nome_consultor text NOT NULL,
  
  -- Status da ficha
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'visualizada', 'impressa', 'em_andamento', 'concluida', 'arquivada')),
  admin_responsavel text,
  timestamp_inicio timestamptz,
  timestamp_conclusao timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid REFERENCES fichas_negociacao(id) ON DELETE CASCADE,
  
  empreendimento text NOT NULL,
  categoria_preco text,
  torre text,
  apartamento text,
  cota text NOT NULL,
  valor numeric NOT NULL,
  tipo_contrato text DEFAULT 'digital',
  
  -- Referências para futuras tabelas de empreendimentos/torres
  empreendimento_id text,
  torre_id text,
  tipo_venda_id text,
  tipo_venda_linear_id text,
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid REFERENCES fichas_negociacao(id) ON DELETE CASCADE,
  
  tipo text NOT NULL,
  total numeric,
  qtd_parcelas integer,
  valor_parcela numeric,
  forma_pagamento text,
  primeiro_vencimento date,
  
  created_at timestamptz DEFAULT now()
);

-- Tabela de formas de pagamento em sala
CREATE TABLE IF NOT EXISTS formas_pagamento_sala (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid REFERENCES fichas_negociacao(id) ON DELETE CASCADE,
  
  forma_pagamento text,
  valor_total numeric,
  valor_distribuido numeric,
  quantidade_cotas integer,
  
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_negociacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento_sala ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de acesso (permitir tudo por enquanto)
CREATE POLICY "Permitir acesso total aos clientes"
  ON clientes
  FOR ALL
  USING (true);

CREATE POLICY "Permitir acesso total às fichas"
  ON fichas_negociacao
  FOR ALL
  USING (true);

CREATE POLICY "Permitir acesso total aos contratos"
  ON contratos
  FOR ALL
  USING (true);

CREATE POLICY "Permitir acesso total aos pagamentos"
  ON pagamentos
  FOR ALL
  USING (true);

CREATE POLICY "Permitir acesso total às formas de pagamento"
  ON formas_pagamento_sala
  FOR ALL
  USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_fichas_status ON fichas_negociacao(status);
CREATE INDEX IF NOT EXISTS idx_fichas_consultor ON fichas_negociacao(nome_consultor);
CREATE INDEX IF NOT EXISTS idx_fichas_admin ON fichas_negociacao(admin_responsavel);
CREATE INDEX IF NOT EXISTS idx_fichas_created_at ON fichas_negociacao(created_at);