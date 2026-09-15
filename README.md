# Diário de Práticas Messiânicas

App web para acompanhar o diário das Práticas Básicas da Fé Messiânica.

Os dados ficam no próprio dispositivo (navegador). Há backup para exportar e restaurar o histórico.

## Uso

Abra a versão publicada:

- https://minhaspraticasmessianicas.web.app

Para testar localmente:

```bash
python3 -m http.server 8080 --directory public
```

Depois acesse http://127.0.0.1:8080

## Publicar

O site usa Firebase Hosting. Na pasta do projeto:

```bash
firebase deploy --only hosting
```
