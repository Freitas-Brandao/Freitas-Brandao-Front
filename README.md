# Freitas-Brandao-Front

Frontend em React + Vite para o registro digital de hóspedes da Casa de Passagem Freitas Brandão.

## O que a tela faz

- Cadastro baseado na ficha manual recebida: acolhimento, dados pessoais, documentos, benefícios, saúde, referências, termo de orientação, desligamentos, evolução e encaminhamentos.
- Uso das logos da Prefeitura de Aracaju e Assistência Social.
- Salvamento local no navegador, útil enquanto o backend ainda está no início.
- Impressão da ficha pela própria tela.
- Tentativa de envio para o backend em `http://localhost:8080/api/hospedes`.

## Como executar o front

Instale as dependências:

```bash
npm.cmd install
```

Execute em modo desenvolvimento:

```bash
npm.cmd run dev
```

Depois abra a URL mostrada no terminal, normalmente:

```text
http://localhost:5173
```

Se o PowerShell permitir `npm` normalmente, estes comandos também funcionam:

```bash
npm install
npm run dev
```

## Como gerar build

```bash
npm.cmd run build
```

Para testar o build:

```bash
npm.cmd run preview
```

## Integração esperada com o back

O front usa a variável `VITE_API_URL`. Sem configuração, ela aponta para:

```text
http://localhost:8080/api
```

Para mudar:

```bash
VITE_API_URL=http://localhost:8080/api npm.cmd run dev
```

No Windows PowerShell:

```powershell
$env:VITE_API_URL="http://localhost:8080/api"
npm.cmd run dev
```

Endpoint mínimo esperado:

```http
POST /api/hospedes
Content-Type: application/json
```

O corpo enviado é o objeto completo do cadastro. Para edição futura, o front também tenta:

```http
PUT /api/hospedes
Content-Type: application/json
```

## Observação sobre o backend

O backend em `C:\Users\Renata\Downloads\Freitas-Brandao-Back\Freitas-Brandao-Back` ainda está praticamente no esqueleto Spring Boot. Para integrar de verdade, ele precisa pelo menos de:

- Controller REST para `/api/hospedes`.
- DTO ou entidade com os campos do formulário.
- Configuração de CORS liberando `http://localhost:5173`.
- Ajuste de segurança, porque o projeto inclui Spring Security.
- Configuração de banco, já que o projeto inclui JPA e driver PostgreSQL.
