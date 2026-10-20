# Orbit — Personal AI Agent & Multi-Agent Network (`ia_agente`)

Sistema de agente pessoal e rede multi-agente orquestrada pelo **n8n** com modelos **OpenRouter**, banco de dados **PostgreSQL**, gestão via **pgAdmin** e interface gráfica web **Orbit UI** (React/Vite).

---

## 🏗️ Arquitetura do Sistema

```text
                          +-------------------------------+
                          |    Orbit UI (React / Vite)    |
                          |     http://localhost:5173     |
                          +---------------+---------------+
                                          |
                                 POST /webhook/orbit-chat
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                            Docker Stack (n8n Engine)                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                       AI Agent (Orquestrador Central)                       |  |
|  |                            [NVIDIA Nemotron 3 Super]                        |  |
|  +----+-------------------+--------------------+--------------------+----------+  |
|       |                   |                    |                    |             |
|       v                   v                    v                    v             |
|  +----+--------+   +------+-------+   +--------+-----+   +----------+----------+  |
|  | Sub-Agente  |   | Sub-Agente   |   | Sub-Agente   |   | Sub-Agente          |  |
|  | Exatas      |   | Dev Fullstack|   | UI/UX Design |   | Workspace & Docs    |  |
|  | [Dots3-Note]|   | [Cohere Code]|   | [Nemotron]   |   | [MiniMax Flash]     |  |
|  +----+--------+   +------+-------+   +--------------+   +----------+----------+  |
|       |                   |                                         |             |
|       v                   v                                         v             |
|  [Tavily Search]   [GitHub / Git API]                       [Google Workspace]    |
|                                                              (Docs, Drive, Sheets)|
+-----------------------------------------------------------------------------------+
        |
        v
+---------------+
|  PostgreSQL   |
| (Persistência)|
+---------------+