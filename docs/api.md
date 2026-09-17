# Referência da API

Todas as rotas retornam JSON. As rotas **internas** exigem o cookie de sessão
(`salalivre_session`); sem ele, o middleware responde **401** (em `/api/*`) ou
redireciona para `/login` (nas páginas). A rota **pública** (`/api/publico/*`)
não exige sessão.

Formato de data: `YYYY-MM-DD`. Formato de hora nas respostas: `HH:mm:ss`
(o front costuma exibir só `HH:mm`).

---

## Reservas (interno)

### `GET /api/reservas`

Lista reservas. O comportamento depende dos parâmetros (avaliados nesta ordem):

| Query | Efeito |
| ----- | ------ |
| `?data=YYYY-MM-DD` | Reservas daquele dia, ordenadas por `hora_inicio`. |
| `?mes=YYYY-MM` | Reservas do mês. |
| `?busca=<texto>` | Próximas reservas (de hoje em diante) filtrando `nome_responsavel`/`setor` (case-insensitive). |
| `?limite=<n>` | Limita a lista de "próximas" (padrão 50). |
| (nenhum) | Próximas reservas (de hoje em diante), padrão. |

**200** `{ "reservas": Reserva[] }` · **400** parâmetro inválido.

```jsonc
// Reserva
{
  "id": "uuid",
  "nome_responsavel": "string",
  "setor": "string",
  "matricula": "string | null",
  "data": "YYYY-MM-DD",
  "dia_inteiro": false,
  "hora_inicio": "HH:mm:ss",
  "hora_fim": "HH:mm:ss",
  "observacao": "string | null",
  "criado_em": "ISO timestamp"
}
```

### `POST /api/reservas`

Cria uma reserva. Corpo JSON (validado por `reservaInputSchema`):

```jsonc
{
  "nome_responsavel": "string (obrigatório)",
  "setor": "string (obrigatório)",
  "matricula": "string | omitido",
  "data": "YYYY-MM-DD",
  "dia_inteiro": false,
  "hora_inicio": "HH:mm",
  "hora_fim": "HH:mm",
  "observacao": "string | omitido"
}
```

- **201** `{ "reserva": Reserva }`
- **400** `{ "error": "Dados inválidos.", "issues": <zod tree> }` ou `"JSON inválido."`
- **409** `{ "error": "Esse horário se sobrepõe ao de outra reserva já existente." }` (exclusion constraint)
- **500** erro inesperado

> Regras aplicadas: expediente 08:00–17:00, `hora_fim > hora_inicio`,
> `dia_inteiro` força 08:00–17:00, e não é permitido criar em data passada.

### `GET /api/reservas/{id}`

**200** `{ "reserva": Reserva }` · **404** não encontrada.

### `PATCH /api/reservas/{id}`

Atualiza uma reserva. Mesmo corpo do `POST` (validado por `reservaUpdateSchema`,
que **não** bloqueia datas passadas).

- **200** `{ "reserva": Reserva }`
- **400** dados inválidos / JSON inválido
- **404** não encontrada
- **409** conflito de horário

### `DELETE /api/reservas/{id}`

Cancela (remove) a reserva. **200** `{ "ok": true }` · **404** não encontrada.

---

## Disponibilidade (interno)

### `GET /api/disponibilidade`

Checagem de conflito em tempo real, para feedback no formulário **antes** de
enviar. **Não** é a fonte da verdade (isso é a exclusion constraint).

| Query | Obrigatório | Descrição |
| ----- | ----------- | --------- |
| `data` | sim | `YYYY-MM-DD` |
| `hora_inicio` | sim | `HH:mm` |
| `hora_fim` | sim | `HH:mm` |
| `excluir_id` | não | Ignora esta reserva no conflito (usado ao editar). |

**200**:

```jsonc
{
  "livre": true,
  "conflitos": [
    { "id": "uuid", "nome_responsavel": "…", "setor": "…",
      "hora_inicio": "HH:mm:ss", "hora_fim": "HH:mm:ss" }
  ]
}
```

**400** parâmetro inválido.

---

## Público — tela da porta

### `GET /api/publico/agenda`

Rota **pública** (sem sessão). Alimenta a tela `/sala`. Retorna **apenas** a
ocupação, **sem** nome, setor ou matrícula — a própria query seleciona só os
campos de horário, então não há dado pessoal trafegando.

| Query | Obrigatório | Descrição |
| ----- | ----------- | --------- |
| `mes` | sim | `YYYY-MM` |

**200**:

```jsonc
{
  "ocupacao": [
    { "data": "YYYY-MM-DD", "dia_inteiro": false,
      "hora_inicio": "HH:mm:ss", "hora_fim": "HH:mm:ss" }
  ]
}
```

**400** `{ "error": "Parâmetro 'mes' inválido (use YYYY-MM)." }`

---

## Autenticação (server action)

O login **não** é uma API route, e sim uma **Server Action** (`loginAction` em
`src/app/login/actions.ts`), submetida pelo formulário de `/login`. Compara a
senha com `APP_PASSWORD` no servidor e, se correta, grava o cookie de sessão
assinado. `logoutAction` remove o cookie. Ver [Segurança e acesso](./seguranca-e-acesso.md).
