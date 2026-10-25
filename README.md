# concerta_drift

site para calibração do sistema de controles, concerto digital de drift

Site estático (HTML + CSS + JavaScript, sem dependências e sem etapa de build) para testar, diagnosticar e calibrar controles direto no navegador, usando a **Gamepad API**. Todo o processamento acontece localmente.

## Páginas

| Página | O que faz |
|---|---|
| `index.html` | Visualizador: até 4 controles, botões, analógicos, gatilhos (com máximo atingido) e dados brutos |
| `drift.html` | Medição de repouso: offset, ruído, zona morta sugerida e diagnóstico por analógico |
| `calibration.html` | Calibração guiada por software (centro, alcance, zona morta), com exportação em JSON e código pronto |
| `circularity.html` | Erro de circularidade pela borda do portão, em 36 setores |
| `polling.html` | Estimativa da taxa de polling (Hz), intervalo médio, jitter e distribuição |
| `vibration.html` | Motores esquerdo/direito com intensidade e duração, padrões prontos e teste experimental de gatilhos |
| `buttons.html` | Contagem de acionamentos, tempo de pressão e detecção de cliques duplos falsos (chattering) |
| `mapping.html` | Mapeamento guiado de botões e eixos, comparado ao padrão, com exportação em JSON |
| `latency.html` | Teste de reação para comparar conexões (cabo, Bluetooth, 2.4G) |
| `guides.html` | Guias por tipo de controle, glossário, perguntas frequentes e manutenção |
| `embed.html` / `widget.html` | Widget compacto para incorporar em outro site via `<iframe>` |

Os rótulos dos botões podem ser alternados entre Xbox, PlayStation e Nintendo em qualquer página, e a escolha do controle (P1–P4) é lembrada ao navegar.

## Estrutura

```
index.html, drift.html, calibration.html, ...   páginas
assets/style.css                                 estilos (tema escuro/claro)
assets/common.js                                 utilitários compartilhados (window.GP)
assets/<pagina>.js                               lógica de cada página
```

## Como usar

Abra `index.html` no navegador (Chrome ou Edge recomendados), conecte o controle por USB ou Bluetooth e pressione qualquer botão.

Para servir localmente:

```bash
python -m http.server 8000
```

## Publicação

Funciona em qualquer hospedagem estática. No GitHub Pages: *Settings → Pages → Deploy from branch → main / root*. A Gamepad API exige contexto seguro (HTTPS ou `localhost`).

## Observações

- A Gamepad API só libera os dados depois que o usuário pressiona um botão.
- O navegador não grava calibração no controle; a calibração gerada aqui é por software.
- Gatilhos adaptativos e háptica avançada do PS5 não são controláveis pela API padrão.
- Vibração depende do navegador, do driver e do tipo de conexão.
- Taxa de polling e teste de reação servem principalmente para comparar conexões no mesmo equipamento.
