# Diário de Práticas Messiânicas

App web para acompanhar o diário das Práticas Básicas da Fé Messiânica.

Os dados ficam no próprio dispositivo (navegador). Há backup para exportar e restaurar o histórico.

## Uso

Abra a versão publicada:

- Responsável de Unidade: https://minhaspraticasmessianicas.web.app
- Ministros dedicantes/Membros: https://minhaspraticasmessianicas.web.app/?k=8f2c

Para testar localmente:

```bash
python3 -m http.server 8080 --directory public
```

Depois acesse http://127.0.0.1:8080 (Responsável de Unidade) ou http://127.0.0.1:8080/?k=8f2c (Ministros dedicantes/Membros).

## Publicar

O site usa Firebase Hosting. Na pasta do projeto:

```bash
firebase deploy --only hosting
```
