# tcc-bacutia

Aplicação interativa do TCC de Pablo Salvato com front-end estático e backend Node/Express para integração segura com o Gemini.

## O que mudou na arquitetura

- A chave da API **não fica mais no navegador**.
- O front-end envia `POST /api/chat` com `{ mode, text }`.
- O backend lê `GEMINI_API_KEY` via variável de ambiente e chama o Gemini no servidor.
- O front-end recebe apenas `{ answer, metadata? }`.

## Requisitos

- Node.js 18+
- npm

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Defina a variável de ambiente com sua chave Gemini:

```bash
export GEMINI_API_KEY="SUA_CHAVE_AQUI"
```

3. Inicie o servidor:

```bash
npm start
```

4. Abra no navegador:

```text
http://localhost:3000
```

## Configuração em produção

Defina `GEMINI_API_KEY` no ambiente de execução da aplicação (plataforma cloud, container, CI/CD, etc.).

Exemplos:

- Docker/Kubernetes: configure como `env`/`secret` do container.
- Render/Railway/Heroku: configure em **Environment Variables**.
- VM/Linux: exporte no serviço (systemd, supervisor) sem commitar em arquivos versionados.

> Nunca exponha `GEMINI_API_KEY` no front-end, HTML público ou repositório Git.

## Endpoint backend

### `POST /api/chat`

Payload de entrada:

```json
{
  "mode": "academic",
  "text": "O que é Grt1?"
}
```

Resposta de sucesso:

```json
{
  "answer": "...",
  "metadata": {
    "model": "gemini-2.0-flash"
  }
}
```

## Tratamento de erros

O backend retorna mensagens explícitas para facilitar diagnóstico:

- `401`: falha de autenticação (chave inválida/ausente no provedor).
- `403`: acesso negado/permissões da chave.
- `429`: limite de requisições excedido.
- `5xx` do provedor Gemini: indisponibilidade temporária do serviço externo.
- `500` local: variável `GEMINI_API_KEY` ausente no servidor.
