# concerta_drift

site para calibração do sistema de controles, concerto digital de drift

Página estática (HTML + CSS + JS, sem dependências) para testar controles direto no navegador usando a **Gamepad API**.

## Recursos

- Detecção de até 4 controles (P1–P4)
- Visualização de todos os botões em tempo real
- Analógicos com zona morta ajustável, detecção de drift e magnitude (circularidade)
- Gatilhos analógicos (0–1)
- Dados brutos de eixos e botões
- Teste de vibração de motor duplo (Pesado, Leve, Rajada, Pulso)
- Estimativa de taxa de polling (Hz)

## Como usar

Abra `index.html` no navegador (Chrome ou Edge recomendados), conecte o controle por USB ou Bluetooth e pressione qualquer botão.

Para servir localmente:

```bash
python -m http.server 8000
```

## Deploy

Funciona em qualquer hospedagem estática (GitHub Pages, Vercel, Netlify). No GitHub Pages: *Settings → Pages → Deploy from branch → main / root*.

## Observações

- A Gamepad API só libera os dados após o usuário pressionar um botão.
- Gatilhos adaptativos do PS5 não são controláveis pela API padrão.
- Vibração depende do navegador, do driver e do tipo de conexão.
