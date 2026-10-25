# Orbit — Personal AI Agent

Agente pessoal com interface React/Vite e orquestração pelo n8n. O repositório inclui uma configuração Docker para n8n e PostgreSQL e um workflow exportado.

> **Status:** melhorias de segurança e integração em andamento. As integrações externas (Google Workspace, GitHub e provedores de modelos) ainda precisam ser configuradas e testadas no seu ambiente n8n.

## Arquitetura

- **Orbit UI:** interface React/Vite.
- **n8n:** recebe mensagens, executa o agente e devolve o resultado.
- **Modelos e ferramentas:** configurados por credenciais e nós do n8n.
- **PostgreSQL:** banco usado pelo n8n para persistência operacional.
- **pgAdmin:** interface opcional para administração do PostgreSQL.

## Pré-requisitos

- Docker Desktop com Docker Compose.
- Node.js LTS e npm para executar o frontend localmente.
- Credenciais de provedor de modelo configuradas no n8n.

## Configuração segura

1. Copie `.env.example` para `.env` na raiz.
2. Substitua todos os valores `CHANGE_ME` por valores aleatórios e fortes.
3. **Nunca faça commit do arquivo `.env`.** O repositório ignora esse arquivo.
4. Se você já usou as credenciais que estavam no arquivo versionado, trate-as como expostas e substitua as senhas de PostgreSQL/pgAdmin. Faça backup antes de alterar a chave de criptografia do n8n: alterar essa chave pode impedir a leitura das credenciais armazenadas.
5. Inicie os serviços:

```bash
docker compose up -d
```

O n8n ficará disponível em `http://localhost:5678`; o pgAdmin usa a porta definida por `PGADMIN_PORT` (por padrão, `8080`).

## Configurar o frontend

1. Entre na pasta `frontend`.
2. Copie `.env.example` para `.env`.
3. Configure `VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook/orbit-chat` para o webhook de produção/ativo. Durante testes manuais, use a URL de teste fornecida pelo editor do n8n, se aplicável.
4. Execute:

```bash
npm install
npm run dev
```

O Vite inicia normalmente em `http://localhost:5173`.

O frontend envia JSON com `message` e `chatInput` e espera que o workflow devolva texto ou JSON com um campo `output`, `text`, `response` ou `message`. As respostas são exibidas após o workflow terminar; o frontend não simula streaming real. Há um limite de espera de 120 segundos.

## Importar o workflow

Importe `Mente de IAs - Estrutura Oficial Corrigida.json` pelo editor do n8n e confira antes de ativar:

- Se as credenciais dos nós de modelo estão selecionadas no ambiente.
- Se cada subagente tem nome, descrição, prompt e modelo configurados de acordo com sua versão do n8n.
- Se as ferramentas Google Docs, Gmail, Drive e GitHub têm credenciais e parâmetros completos.
- Se o webhook está ativo e usa o caminho `orbit-chat`.
- Se a origem do frontend está permitida na configuração de CORS.
- Se nenhuma ação externa é executada sem autorização adequada.

O JSON exportado não transporta as credenciais do seu ambiente. Alguns nós podem precisar ser completados diretamente no editor do n8n; não presuma que as ferramentas externas funcionem apenas porque aparecem no workflow.

## Testes recomendados

1. Envie uma mensagem simples e confirme que o frontend recebe a resposta.
2. Teste uma resposta longa e confirme que não é truncada.
3. Teste webhook desligado, URL incorreta e tempo limite.
4. Confirme que o navegador não apresenta erros de CORS.
5. Teste cada ferramenta externa individualmente antes de permitir ações reais.

## Segurança e limitações

- Não exponha o editor n8n ou pgAdmin diretamente à internet sem autenticação e controles de rede apropriados.
- Restrinja as origens CORS ao endereço real do frontend; CORS não substitui autenticação.
- O histórico da interface fica na memória da página e é perdido ao recarregar. O PostgreSQL do n8n não persiste automaticamente o histórico de chat do frontend.
- A remoção do `.env` desta versão não elimina cópias em commits antigos. Se valores reais foram commitados, rotacione-os. Para apagar o segredo do histórico, será necessária uma limpeza do histórico Git coordenada com todos os clones/colaboradores.
