# Sistema de Atualização Automática de Cache

## Como funciona

O sistema detecta automaticamente quando há uma nova versão do site e força o navegador a limpar o cache e recarregar.

## Para forçar uma atualização

Basta editar o arquivo `public/js/version.js` e incrementar o número da versão:

```javascript
const APP_VERSION = '1.4.0'; // Alterar para '1.5.0', por exemplo
```

### Passos:

1. Abrir `public/js/version.js`
2. Alterar a versão (ex: de '1.4.0' para '1.5.0')
3. Fazer commit e push
4. O Vercel fará deploy automático
5. Usuários serão automaticamente redirecionados para a nova versão

## Arquivos afetados

- ✅ `public/index.html` - Página principal
- ✅ `public/ranking.html` - Página de ranking
- ✅ `public/js/version.js` - Controle de versão centralizado
- ✅ `public/sw.js` - Service Worker

## O que acontece no navegador do usuário

1. A página carrega o `version.js`
2. Compara a versão armazenada com a nova versão
3. Se diferente:
   - Limpa Service Workers
   - Limpa todos os caches
   - Atualiza versão no localStorage
   - Recarrega a página automaticamente
4. Se igual: continua normalmente

## Logs no Console

- `✅ Versão X.X.X inicializada` - Primeira visita
- `🔄 Nova versão detectada: X.X.X → Y.Y.Y` - Atualização detectada
- `🧹 Limpando cache e recarregando...` - Processo de limpeza

## Versionamento sugerido

- **1.0.0** → **1.0.1**: Pequenas correções
- **1.0.0** → **1.1.0**: Novas funcionalidades
- **1.0.0** → **2.0.0**: Mudanças importantes

---

Criado em: 17/11/2025
Última atualização: v1.4.0
