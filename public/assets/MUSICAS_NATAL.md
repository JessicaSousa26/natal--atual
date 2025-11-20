# 🎵 Músicas Natalinas - Instruções

## Músicas Configuradas na Playlist

O sistema está configurado para tocar 5 músicas em loop. Adicione os arquivos MP3 nesta pasta:

### Lista de Músicas:
1. **jingle-bells.mp3** ✅ (já existe)
2. **we-wish-you.mp3** ⏳ (adicionar)
3. **deck-the-halls.mp3** ⏳ (adicionar)
4. **silent-night.mp3** ⏳ (adicionar)
5. **feliz-navidad.mp3** ⏳ (adicionar)

## 🎼 Sugestões de Músicas Animadas

### Sites para Download Gratuito (Domínio Público/Royalty Free):

1. **YouTube Audio Library** (https://studio.youtube.com/channel/UC/music)
   - Filtro: Gênero "Holiday" ou "Christmas"
   - Download gratuito para uso comercial

2. **Pixabay Music** (https://pixabay.com/music/)
   - Buscar: "christmas", "jingle bells", "deck the halls"
   - 100% gratuito e sem direitos autorais

3. **Free Music Archive** (https://freemusicarchive.org/)
   - Categoria: Holiday
   - Licenças Creative Commons

4. **Bensound** (https://www.bensound.com/)
   - Seção Christmas
   - Gratuito com atribuição

### Músicas Natalinas Animadas Sugeridas:

- ✨ **Jingle Bells** (Rock/Upbeat version)
- 🎄 **We Wish You a Merry Christmas** (versão animada)
- 🎁 **Deck the Halls** (versão alegre)
- 🌟 **Feliz Navidad** (José Feliciano style - muito animada!)
- 🔔 **Jingle Bell Rock**
- ⭐ **Rockin' Around the Christmas Tree**
- 🎅 **Santa Claus Is Coming to Town**
- ❄️ **Let It Snow** (versão swing)

## 📝 Como Adicionar Mais Músicas

Se quiser adicionar mais músicas, edite o arquivo:
`public/js/theme.js`

Procure pela seção:
```javascript
const playlist = [
  './assets/jingle-bells.mp3',
  './assets/we-wish-you.mp3',
  './assets/deck-the-halls.mp3',
  './assets/silent-night.mp3',
  './assets/feliz-navidad.mp3'
];
```

E adicione mais linhas com os nomes dos arquivos.

## ⚠️ Importante

- **Formato**: Use MP3 (melhor compatibilidade)
- **Tamanho**: Máximo 5MB por arquivo (para carregamento rápido)
- **Taxa de bits**: 128kbps é suficiente para música de fundo
- **Licença**: Use apenas músicas royalty-free ou domínio público

## 🎮 Como Funciona

- As músicas tocam em ordem sequencial
- Quando uma termina, a próxima começa automaticamente
- Após a última música, volta para a primeira (loop infinito)
- O usuário pode pausar/retomar usando o botão 🔔 no topo da página
