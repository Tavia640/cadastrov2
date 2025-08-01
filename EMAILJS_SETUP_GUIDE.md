# Guia de Configuração do EmailJS

Este guia explica como configurar o sistema de envio de emails via EmailJS para a aplicação GAV Resorts.

## 1. Configuração no EmailJS

### 1.1. Criar Conta
1. Acesse [https://emailjs.com](https://emailjs.com)
2. Crie uma conta gratuita ou faça login
3. Acesse o dashboard

### 1.2. Configurar Serviço de Email
1. Vá em "Email Services"
2. Clique em "Add New Service"
3. Escolha seu provedor (Gmail, Outlook, SendGrid, etc.)
4. Siga as instruções para conectar sua conta
5. Anote o **Service ID** gerado

### 1.3. Criar Template de Email
1. Vá em "Email Templates"
2. Clique em "Create New Template"
3. Use o conteúdo do arquivo `emailjs-template-example.html` como base
4. Configure as seguintes variáveis:
   - `{{to_name}}` - Nome do destinatário
   - `{{client_name}}` - Nome do cliente
   - `{{client_cpf}}` - CPF do cliente
   - `{{client_phone}}` - Telefone do cliente
   - `{{closer}}` - Nome do closer
   - `{{liner}}` - Nome do liner
   - `{{tipo_venda}}` - Tipo de venda
   - `{{message}}` - Mensagem principal
5. Para os anexos PDF, configure:
   - Attachment 1: `{{pdf_cadastro}}` (nome: `{{attachment_name_1}}`)
   - Attachment 2: `{{pdf_negociacao}}` (nome: `{{attachment_name_2}}`)
6. Anote o **Template ID** gerado

### 1.4. Obter Chave Pública
1. Vá em "Account" > "General"
2. Copie a **Public Key**

## 2. Configuração no Sistema

### 2.1. Via Supabase (Recomendado)
Adicione as seguintes configurações na tabela `configuracoes`:

```sql
INSERT INTO configuracoes (chave, valor, descricao, ativo) VALUES
('EMAILJS_SERVICE_ID', 'seu_service_id', 'ID do serviço EmailJS', true),
('EMAILJS_TEMPLATE_ID', 'seu_template_id', 'ID do template EmailJS', true),
('EMAILJS_PUBLIC_KEY', 'sua_public_key', 'Chave pública EmailJS', true),
('EMAILJS_DESTINATION_EMAIL', 'destino@empresa.com', 'Email para receber as fichas', true),
('EMAILJS_FROM_EMAIL', 'noreply@empresa.com', 'Email remetente (opcional)', true);
```

### 2.2. Via Código (Alternativa)
No arquivo `src/lib/emailJsService.ts`, atualize as configurações padrão:

```typescript
private static config: EmailJsConfig = {
  serviceId: "seu_service_id",
  templateId: "seu_template_id", 
  publicKey: "sua_public_key",
  destinationEmail: "destino@empresa.com",
  fromEmail: "noreply@empresa.com"
};
```

## 3. Como Usar

### 3.1. No Formulário de Negociação
1. Preencha todos os dados do cliente e da negociação
2. Clique no botão "Enviar por Email"
3. O sistema irá:
   - Gerar os PDFs automaticamente
   - Enviar por email para o destinatário configurado
   - Exibir mensagem de sucesso ou erro

### 3.2. Validação
O sistema valida automaticamente:
- Dados obrigatórios do cliente
- Configurações do EmailJS
- Geração dos PDFs
- Limites de tamanho dos anexos

## 4. Solução de Problemas

### 4.1. Erros Comuns
- **401 - Não autorizado**: Chave pública inválida
- **404 - Não encontrado**: Service ID ou Template ID incorretos
- **413 - Arquivo muito grande**: PDFs excedem limite do EmailJS
- **429 - Muitas tentativas**: Limite de envios excedido

### 4.2. Verificação
1. Verifique se todas as configurações estão corretas
2. Teste o template no dashboard do EmailJS
3. Verifique os logs do console do navegador
4. Confirme se a conta EmailJS está ativa

## 5. Limites do EmailJS

### Plano Gratuito:
- 200 emails por mês
- Attachments até 1MB por email
- Suporte básico

### Planos Pagos:
- Mais emails por mês
- Attachments maiores
- Suporte prioritário
- Sem marca EmailJS

## 6. Exemplo de Template HTML

Veja o arquivo `emailjs-template-example.html` para um exemplo completo de template que pode ser usado no EmailJS.

## 7. Suporte

Para problemas relacionados ao EmailJS:
- Documentação: [https://docs.emailjs.com](https://docs.emailjs.com)
- Suporte: [https://emailjs.com/contact](https://emailjs.com/contact)

Para problemas no sistema GAV Resorts:
- Verifique os logs do console
- Confirme as configurações no Supabase
- Teste com dados de exemplo
