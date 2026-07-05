# Agent Claim MCP

[![npm](https://img.shields.io/npm/v/@vk0/agent-claim-mcp)](https://www.npmjs.com/package/@vk0/agent-claim-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Idiomas:** [English](./README.md) · [日本語](./README.ja.md) · [简体中文](./README.zh-CN.md) · [Русский](./README.ru.md) · Español

Usa Agent Claim MCP cuando varios agentes de código comparten un mismo worktree y necesitas una primitiva local de coordinación diminuta antes de editar, no un framework de orquestación completo. Da a los agentes un único trabajo: hacer claim de rutas, detectar colisiones y liberar (release) la propiedad, para que el trabajo en paralelo deje de pisotear los mismos archivos.

Agent Claim MCP es un servidor MCP local-first para Claude Code, Cursor, Cline y otros clientes MCP que necesitan coordinación de propiedad de archivos sin colas, planificadores ni convenciones propias de AGENTS.md. La superficie actual del release se centra solo en tres acciones acotadas: hacer claim de rutas normalizadas, inspeccionar quién las posee y hacer release por ruta o por claim id, con reporte explícito de conflictos entre sesiones separadas.

> Estado del release: `@vk0/agent-claim-mcp@1.0.0` está publicado en npm, así que la ruta de instalación `npx -y @vk0/agent-claim-mcp` es ahora el valor por defecto veraz para usuarios externos. La prueba externa de la Phase 5 puede satisfacerse con la validación del Official MCP Registry o con un listado activo en Smithery, pero el estado actual de la prueba sigue pendiente hasta que uno de esos artefactos públicos sea verificado explícitamente. La validación del Official MCP Registry sigue pendiente, así que no describas el paquete como registry-accepted ni marketplace-listed hasta que se pueda citar una URL de prueba real del registry o de Smithery.
>
> La verdad del hito: la cuña de producto se mantiene estrecha — 3 tools más un ledger JSON local para prevenir colisiones en worktrees compartidos, no una plataforma de orquestación más amplia.
>
> Siguiente paso manual actual: completar el rerun humano pendiente y la ruta de verificación para la prueba del Official MCP Registry, y luego registrar el veredicto de esa ejecución en lugar de asumir la aceptación a partir de la disponibilidad en npm.

## Registry rerun quickstart

Estado veraz actual:
- npm `1.0.0` está publicado
- la aceptación en el Official MCP Registry sigue pendiente
- el workflow `25282612113` no completó la ruta de validación del registry
- el repo ya superó el paso anterior de arreglo del secret `NPM_TOKEN`, pero la prueba del registry todavía necesita un rerun humano más verificación antes de poder tratarse como aceptada

Comando exacto de rerun:

```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```

Después del rerun, verifica en este orden:
1. confirma que el rerun terminó con éxito en GitHub Actions
2. ejecuta `npm run preflight:registry`
3. sigue `docs/official-registry-validation-runbook.md`
4. solo entonces registra la aceptación del registry como probada

Atajo para el operador: usa la [Quick operator path](./docs/official-registry-validation-runbook.md#quick-operator-path) del runbook para el orden exacto desde el rerun hasta la verificación, y trata el estado npm-live como algo separado del estado registry-proof.

## Why / When to use

Elige este servidor cuando tu flujo de trabajo ya tiene enrutamiento de tareas, pero todavía necesita una primitiva sencilla, tipo lock, en el momento de editar:

- dos o más agentes pueden tocar el mismo repositorio en paralelo
- quieres detección de colisiones antes de editar archivos, no después de los conflictos de merge
- quieres que los claims expiren automáticamente con TTLs
- quieres una primitiva estrecha que otro agente pueda entender solo con name + description
- **no** quieres un motor de reglas empaquetado, un ejecutor de colas ni una plataforma de orquestación

## Installation

La ruta canónica de instalación externa es ahora el paquete npm publicado:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

Nota de estado: la instalación desde npm ya funciona hoy, pero la validación del Official MCP Registry y las pruebas de Smithery u otros marketplaces todavía no están establecidas, así que trata el paquete primero como npm-available en lugar de marketplace-verified.

Si estás desarrollando desde un checkout local en lugar del paquete publicado, todavía puedes apuntar tu cliente MCP directamente al `dist/server.js` compilado.

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "node",
      "args": ["/absolute/path/to/agent-claim-mcp/dist/server.js"]
    }
  }
}
```

Ese segundo ejemplo es solo para desarrollo local. En Windows, apunta tu cliente MCP a la ruta del `dist/server.js` compilado en tu propia máquina, en lugar de copiar literalmente una ruta POSIX.

Compila una vez antes de usar la ruta local:

```bash
cd /Users/vkdev/projects/agent-claim-mcp
npm ci
npm run build
```

### Claude Code

Añade el servidor stdio a tu configuración MCP de Claude Code:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

### Claude Desktop

Claude Desktop usa `~/Library/Application Support/Claude/claude_desktop_config.json` en macOS y `%APPDATA%\Claude\claude_desktop_config.json` en Windows:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

Después de guardar `claude_desktop_config.json`, reinicia Claude Desktop por completo para que recargue la configuración del servidor MCP.

### Cursor

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

### Cline

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

## Limitations

Este servidor es intencionadamente estrecho y local-first. Instálalo cuando tus agentes compartan una misma vista del sistema de archivos, no cuando necesites coordinación distribuida.

- Los claims viven en un ledger local en disco, así que solo coordinan sesiones que puedan leer y escribir el mismo worktree.
- No es un servicio de locks alojado, ni una cola, ni un planificador, y no replica claims entre máquinas por sí mismo.
- La expiración por TTL es una limpieza protectora, no un sustituto de la propiedad de tareas de nivel superior ni de la revisión humana.
- La normalización de rutas reduce los desajustes de forma, pero los agentes todavía necesitan apuntar al mismo raíz del repo o `cwd` para que los claims coincidan.
- Si tu flujo de trabajo necesita coordinación entre hosts, política de auditoría central o aprobaciones obligatorias, combina este servidor con una capa de orquestación separada en lugar de estirar el claim ledger más allá de su alcance.

Para una ejecución multi-agente real antes de publicar, consulta [DOGFOOD.md](./DOGFOOD.md) y los artefactos de prueba en [docs/dogfood-report.md](./docs/dogfood-report.md).

## Tools

### `claim_files`

Crea o refresca una entrada local de file-claim para que los agentes en paralelo puedan ver la propiedad antes de editar y evitar pisotear las mismas rutas del worktree durante tareas activas. Las respuestas de conflicto son explícitas, de modo que los claims superpuestos entre sesiones separadas no se quedan implícitos ni solo en memoria.

**Input**

```json
{
  "agentId": "coder-a",
  "taskId": "task-123",
  "paths": ["src/foo.ts", "src/bar.ts"],
  "ttlSeconds": 3600,
  "note": "working on parser cleanup",
  "cwd": "/repo"
}
```

**Output**

```json
{
  "ok": true,
  "claimed": ["/repo/src/bar.ts", "/repo/src/foo.ts"],
  "conflicts": [],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

Si cualquiera de las rutas solicitadas ya tiene claim de otro propietario activo, el tool devuelve `ok: false` y no escribe nada.

### `release_claim`

Elimina un claim existente propiedad del agente actual, para que el trabajo terminado, pausado o reasignado deje de bloquear a otros agentes que quieren editar con seguridad las mismas rutas.

**Input**

```json
{
  "agentId": "coder-a",
  "paths": ["src/foo.ts"],
  "cwd": "/repo"
}
```

**Output**

```json
{
  "ok": true,
  "released": ["/repo/src/foo.ts"],
  "missing": [],
  "ledgerVersion": 1
}
```

Solo el propietario actual puede hacer release de un claim activo, tanto si lo apuntas por `claimId` como por `paths` normalizados, de modo que la limpieza funciona después de ejecuciones multi-agente reales y las variantes de forma de ruta se resuelven de manera consistente.

### `whose_claim`

Lee el ledger local y explica si una ruta de archivo está libre o actualmente con claim, incluyendo metadatos de propietario, tarea, note y expiración, para una coordinación segura entre sesiones separadas que comparten el mismo worktree.

**Input**

```json
{
  "paths": ["src/foo.ts", "src/bar.ts"],
  "cwd": "/repo",
  "includeExpired": false
}
```

**Output**

```json
{
  "results": [
    {
      "path": "/repo/src/bar.ts",
      "claimed": false
    },
    {
      "path": "/repo/src/foo.ts",
      "claimed": true,
      "ownerAgentId": "coder-a",
      "taskId": "task-123",
      "note": "working on parser cleanup",
      "expiresAt": "2026-05-03T16:00:00.000Z",
      "claimId": "2a08b70c-4203-44a2-b833-31592472de1e"
    }
  ],
  "ledgerVersion": 1
}
```

## Real samples

### 1. coder-A hace claim de `foo.ts`

```json
{
  "tool": "claim_files",
  "arguments": {
    "agentId": "coder-A",
    "taskId": "task-42",
    "paths": ["src/foo.ts"],
    "note": "refactoring the claim parser",
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": true,
  "claimed": ["/repo/src/foo.ts"],
  "conflicts": [],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

### 2. coder-B colisiona en el mismo archivo

```json
{
  "tool": "claim_files",
  "arguments": {
    "agentId": "coder-B",
    "paths": ["src/foo.ts", "src/new.ts"],
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": false,
  "claimed": [],
  "conflicts": [
    {
      "path": "/repo/src/foo.ts",
      "ownerAgentId": "coder-A",
      "expiresAt": "2026-05-03T16:00:00.000Z"
    }
  ],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

### 3. coder-A hace release del archivo

```json
{
  "tool": "release_claim",
  "arguments": {
    "agentId": "coder-A",
    "paths": ["src/foo.ts"],
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": true,
  "released": ["/repo/src/foo.ts"],
  "missing": [],
  "ledgerVersion": 1
}
```

## Troubleshooting

### `claim_files` devuelve `ok: false`

Significa que al menos una de las rutas solicitadas ya tiene claim de otro propietario activo, así que no se escribió nada nuevo. Revisa el array `conflicts` para ver las rutas normalizadas exactas que se superponen y el `ownerAgentId` actual, y luego inspecciona las mismas rutas con `whose_claim` antes de reintentar.

```json
{
  "tool": "whose_claim",
  "arguments": {
    "paths": ["src/foo.ts", "src/new.ts"],
    "cwd": "/repo"
  }
}
```

Si una ruta colisiona, una petición mixta sigue siendo all-or-nothing. Divide el trabajo o espera a que el propietario actual libere la ruta en conflicto.

### `release_claim` con un claim id devuelve `missing: ["..."]`

Ese claim id no estaba activo en el ledger local en el momento del release. Puede que ya se haya liberado, que haya expirado o que nunca haya existido en esta máquina. Esto no se trata como un éxito parcial.

### `release_claim` con paths devuelve `released: []`

Si `ok` sigue siendo `true` pero `released` está vacío, las rutas normalizadas solicitadas no coincidieron con ningún claim activo propiedad del llamador. El array `missing` te dice qué rutas normalizadas no se pudieron emparejar.

Usa `whose_claim` primero cuando no estés seguro de si la ruta está libre, pertenece a otro agente o ya desapareció del ledger.

### Liberar el claim de otro

Solo el propietario actual puede hacer release de un claim activo. Si otro agente todavía posee la ruta, inspecciónala con `whose_claim`, coordínate con ese propietario o espera a que expire el TTL.

## Comparison

| Tool | Su punto fuerte | En qué se diferencia Agent Claim MCP |
| --- | --- | --- |
| **Agent Claim MCP** | Una única primitiva estrecha de coordinación para worktrees compartidos | Solo responde a: ¿quién posee esta ruta, puedo hacer claim de ella y puedo hacer release? |
| **madebyaris/agent-orchestration** | Patrones de orquestación más amplios, reglas, enrutamiento, colas y coordinación al estilo AGENTS.md | Agent Claim MCP hace mucho menos a propósito. No empaqueta colas, comportamiento de planificador ni política de repositorio. Es la primitiva local más pequeña que puedes componer dentro de otro flujo de trabajo. |

**Elige Agent Claim MCP** cuando ya tienes tu propia capa de tareas y solo necesitas coordinación de propiedad de rutas.

**Elige un proyecto de orquestación más amplio** cuando quieras que un solo paquete defina reglas de agentes, colas de trabajo, política de coordinación y un flujo de ejecución de nivel superior.

## FAQ

<details>
<summary><strong>¿Cuándo debería un agente elegir esto en lugar de un git branch o worktree por agente?</strong></summary>

Elige claims cuando varios agentes comparten intencionadamente un mismo checkout y una misma vista del sistema de archivos — porque reutilizan el mismo `node_modules`, los mismos artefactos de build o un dev server en ejecución, o porque la capa de tareas ya divide el trabajo por archivos en lugar de por ramas. Branch-per-agent y worktree-per-agent previenen colisiones copiando estado y aplazando los conflictos hasta el momento del merge; los claims previenen colisiones declarando la propiedad de las rutas antes de la primera edición, sin checkouts adicionales y sin paso de merge. Si tu flujo de trabajo ya aísla a cada agente en su propia rama o worktree, puede que no necesites este servidor en absoluto.
</details>

<details>
<summary><strong>¿En qué se diferencia un claim de un lock real o del aislamiento con git worktree?</strong></summary>

Un claim es un registro de propiedad consultivo (advisory), no un lock de sistema de archivos impuesto por la fuerza. Nada impide físicamente que un proceso que se porta mal escriba en una ruta con claim; la aplicación es cooperativa, que es exactamente el contrato que los agentes MCP pueden cumplir: llamar a `claim_files` antes de editar, respetar `ok: false` y hacer release al terminar. El aislamiento con worktrees es más fuerte pero más pesado — checkouts separados, estado duplicado y conflictos que solo afloran en el merge. Ambos enfoques se componen: usa worktrees para flujos paralelos de larga vida, y claims dentro de cualquier worktree individual que toque más de un agente.
</details>

<details>
<summary><strong>¿Qué hacen realmente los TTLs y qué pasa cuando un claim expira?</strong></summary>

Cada claim lleva un TTL (`ttlSeconds`, por defecto 3600), y los claims expirados se limpian automáticamente en la siguiente lectura o escritura del ledger. Eso significa que una sesión que se cayó, fue matada o quedó abandonada nunca puede bloquear una ruta para siempre — el peor caso es una ventana de TTL. La expiración es limpieza protectora, no traspaso de tareas: un agente que todavía está trabajando activamente debería refrescar su propio claim (volver a hacer claim de las mismas rutas con el mismo `agentId`) en lugar de pedir un TTL muy largo desde el principio.
</details>

<details>
<summary><strong>¿Qué ocurre exactamente en un conflicto?</strong></summary>

`claim_files` es all-or-nothing. Si cualquiera de las rutas solicitadas ya pertenece a otro claim activo, el tool devuelve `ok: false`, no escribe nada — incluidas las rutas sin conflicto de la misma petición — y lista cada ruta normalizada en colisión con su `ownerAgentId` y `expiresAt` actuales en el array `conflicts`. No hay colas, no hay reintentos y no hay toma de control forzada. El agente llamador decide qué hacer a continuación: dividir el lote, inspeccionar al propietario con `whose_claim`, coordinarse a través de su propia capa de tareas, o esperar al release o a la expiración del TTL.
</details>

<details>
<summary><strong>¿Funciona entre clientes MCP distintos al mismo tiempo, como Claude Code más Cursor?</strong></summary>

Sí, siempre que todos los clientes corran en la misma máquina con el mismo usuario. Cada cliente MCP lanza su propio proceso de servidor, pero todos los procesos convergen en el mismo ledger en disco mediante escrituras atómicas temp-file-plus-rename, de modo que un claim hecho desde una sesión de Claude Code es visible de inmediato para una sesión de Cursor o Cline. Lo único que los agentes deben mantener consistente es la forma de las rutas: pasa un `cwd` o rutas absolutas que resuelvan al mismo raíz del repo, para que la normalización coincida entre clientes.
</details>

<details>
<summary><strong>¿Dónde se guarda el estado y sale algo de mi máquina?</strong></summary>

Todo el estado vive en un único ledger JSON local en `~/.agent-claim-mcp/ledger.json`. No hay daemon, ni proceso en segundo plano, ni listener de red, ni telemetría, ni sincronización en la nube — el servidor solo lee y escribe ese archivo cuando se llama a un tool. Esa es también la frontera del producto: los claims coordinan sesiones que comparten una misma vista del sistema de archivos, y la coordinación entre hosts queda explícitamente fuera de alcance.
</details>

<details>
<summary><strong>¿Puedo liberar o robar un claim que pertenece a otro agente?</strong></summary>

No. `release_claim` solo elimina claims activos propiedad del `agentId` llamador, tanto si se apuntan por `claimId` como por rutas normalizadas. Si otro agente todavía posee una ruta, tus opciones son inspeccionarla con `whose_claim`, coordinarte con ese propietario a través de tu capa de tareas, o esperar a que expire el TTL. Esto mantiene la primitiva predecible: la propiedad solo cambia por un release explícito o por expiración, nunca por una toma de control silenciosa.
</details>

## How it works

- los claims se guardan en un ledger JSON local en `~/.agent-claim-mcp/ledger.json`
- las rutas se normalizan a rutas absolutas, de modo que distintos agentes no pueden esquivar las colisiones con trucos de rutas relativas o variantes de forma de ruta
- los claims superpuestos entre sesiones separadas se resuelven a través del mismo ledger en lugar de depender de coordinación en memoria
- los claims expirados se limpian automáticamente en lecturas y escrituras
- las escrituras usan semántica de temp-file plus rename para actualizaciones atómicas

## Development

```bash
npm ci
npm run build
npm test
npm run smoke
```

## Packaging

Se espera que el paquete npm incluya al menos:

- `README.md`
- `server.json`
- el `dist/` compilado

Usa esta comprobación antes del release:

```bash
npm pack --dry-run
```

## Publish prerequisites

La ruta de publicación esperada es el job de release de GitHub Actions que se ejecuta tras el push de un tag de versión. Para que el paso desatendido de npm publish tenga éxito, el workflow debe recibir un `NODE_AUTH_TOKEN` no vacío desde el secret del repositorio configurado para la publicación en npm.

Si `NODE_AUTH_TOKEN` falta o está vacío en CI, el primer intento de npm publish falla con `ENEEDAUTH` incluso cuando el paquete en sí está listo. Antes de reintentar un release, confirma que el secret del repositorio de GitHub existe y está mapeado dentro del job de publish, en lugar de intentar volver a ejecutar los pasos de publicación en local.

Para la ruta de prueba local antes de etiquetar, ejecuta la breve checklist de smoke en [`docs/smoke-proof.md`](./docs/smoke-proof.md).

Para la primera comprobación externa de aceptación tras la publicación, usa el runbook del mantenedor en [`docs/official-registry-validation-runbook.md`](./docs/official-registry-validation-runbook.md) y la breve plantilla de registro en [`docs/official-registry-validation-checklist.md`](./docs/official-registry-validation-checklist.md).

## License

[MIT](./LICENSE)
