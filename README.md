# Votação de Fotos de Natal — Vercel + Firebase

Projeto pronto para deploy na **Vercel (plano gratuito)** com backend **Firebase** (Auth, Firestore, Storage).

## 📁 Estrutura
```
natal-votacao-vercel/
├─ public/
│  ├─ index.html         # Upload + Galeria + Votação + Música + Neve
│  ├─ ranking.html       # Ranking com música/neve
│  ├─ js/
│  │  ├─ firebase.js     # Cole sua config do Firebase aqui
│  │  ├─ app.js          # Lógica (upload, voto único, filtros)
│  │  └─ theme.js        # Música + neve + modal de consentimento
│  └─ assets/
│     ├─ jingle-bells.wav
│     └─ ornament.svg
├─ rules/
│  ├─ firestore.rules
│  └─ storage.rules
└─ vercel.json
```

## 🚀 Deploy rápido na Vercel
1. Crie um repo no GitHub e suba esta pasta inteira.
2. Acesse **vercel.com → New Project** e importe seu repo.
3. **Framework Preset:** `Other`
4. **Build & Output Settings:** Vercel vai servir a pasta `public/` automaticamente.
5. Deploy.

> Dica: Se quiser testar local, basta um servidor estático (ex.: `npx serve public`).

## 🔑 Firebase (obrigatório)
- **Authentication** → Provedores → **Google** → Habilitar. Adicione seu domínio `*.vercel.app` em **Domínios autorizados**.
- **Firestore** → Cole as regras de `rules/firestore.rules` e publique.
- **Storage** → Cole as regras de `rules/storage.rules` e publique.
- **Firestore** → Coleção `settings` → doc `votacao` → Campos Timestamp:
  - `inicio`: ex. 2025-11-05 00:00:00
  - `fim`: ex. 2025-12-20 23:59:59
- **Config do App Web** → copie a configuração do Firebase e cole em `public/js/firebase.js`.

## 📝 Observações
- **Voto único por foto por usuário** garantido por transação + regras.
- **Período de votação** respeitado por client e regras.
- **Música**: arquivo WAV sintético livre de royalties. Você pode trocar por um MP3 seu em `public/assets` e ajustar o `src` nos HTMLs.
- **Limite de upload**: 10MB por imagem (ajuste em `storage.rules`).

Boas festas! 🎄
