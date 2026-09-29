# 🎯 COMPRACERTA INVEST - Aplicação de Gestão de Portfólio

Uma **aplicação moderna e profissional** para gerenciamento de carteira de investimentos, análise de ativos e simulação de juros compostos usando React + Tailwind CSS + Recharts.

---

## ✨ Características Principais

### 📊 Dashboard Interativo
- Gráfico de alocação em rosca (donut chart) responsivo
- Resumo de posicionamento scrollável
- KPIs em tempo real (patrimônio, lucro, rentabilidade)

### 💼 Gerenciamento de Carteira
- Cadastrar/editar/deletar ativos
- Suporte a múltiplos tipos (Ação BR, FII, ETF, etc.)
- Exportar carteira em CSV
- Atualizar cotações via Brapi API (gratuito)

### 🎯 Análise de Excelência
- Método Bazin (Preço-teto)
- Método Lynch (Preço justo)
- Método Garon (Preço médio)
- Indicadores de compra/espera

### 🔄 Rebalanceador Inteligente
- Sugestões automáticas de rebalanceamento
- Metas personalizáveis por ativo
- Novo aporte calculado

### 💰 Gerenciamento de Proventos
- Registre dividendos e rendimentos
- Histórico completo com datas
- Cálculo automático de totais

### 📈 Simulador de Juros Compostos
- Parametrizável (investimento inicial, aporte mensal, período, taxa)
- Evolução patrimonial ano a ano
- Projeção de renda passiva

### 🌙 Tema Moderno
- Modo claro/escuro
- Modo privacidade (ocultar valores)
- Idioma português/inglês
- Design responsivo (mobile-friendly)

---

## 🏗️ Arquitetura Profissional

Estrutura modular com separação clara de responsabilidades:

```
src/
  ├── components/    # Componentes React reutilizáveis
  ├── pages/         # Páginas/Tabs da aplicação
  ├── hooks/         # Custom hooks para gerenciamento
  ├── services/      # Lógica de negócio
  ├── constants/     # Constantes e configurações
  ├── utils/         # Funções utilitárias
  └── App.jsx        # Componente raiz
```

Veja [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes completos.

---

## 🚀 Como Começar

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```
Abre em `http://localhost:5173`

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

---

## 📋 Dependências

- **React** 18.3.1 - Framework UI
- **React DOM** 18.3.1 - Renderização
- **Lucide React** 0.483.0 - Ícones
- **Recharts** 2.8.0 - Gráficos
- **Tailwind CSS** 3.4.4 - Estilos

---

## 🎮 Como Usar

### 1️⃣ **Dashboard**
- Visualize seu portfolio em um gráfico interativo
- Veja o resumo de cada posição
- Monitore KPIs em tempo real

### 2️⃣ **Minha Carteira**
- Clique em "Cadastrar Novo Ativo"
- Preencha ticker, tipo, quantidade, preços
- Salve alterações
- Edite ou delete conforme necessário
- Exporte CSV com Ctrl+Shift+C

### 3️⃣ **Rebalanceador**
- Defina novas alocações (META %)
- Receba sugestões de compra
- Acompanhe o progresso

### 4️⃣ **Proventos**
- Registre dividendos recebidos
- Veja o histórico completo
- Acompanhe total acumulado

### 5️⃣ **Juros Compostos**
- Configure investimento inicial
- Defina aporte mensal e taxa esperada
- Projete resultado em X anos
- Visualize evolução ano a ano

### 6️⃣ **Métodos Mestres**
- Análise automática de cada ativo
- Recomendações de compra/espera
- Baseado em 3 metodologias reconhecidas

---

## 🔧 Recursos Técnicos

### Performance
- ✅ Memoização de cálculos complexos
- ✅ Re-renders otimizados
- ✅ Lazy loading de componentes

### Persistência
- ✅ Contas e ativos persistidos pelo backend em MySQL (UOL Host)
- ✅ Proventos, detalhes complementares dos ativos e preferências mantidos no LocalStorage
- ✅ Autenticação de usuários com JWT

### API Integration
- ✅ Banco Central do Brasil (BCB) e Yahoo Finance
- ✅ brapi para cotações brasileiras
- ✅ CoinGecko para dados de criptomoedas
- ✅ AwesomeAPI para cotações de moedas

### Responsividade
- ✅ Mobile-first design
- ✅ Adaptável a todos os tamanhos
- ✅ Toque otimizado

---

## 🎨 Temas

### Cores
- **Emerald** (padrão) - Verde moderno
- **Blue** - Azul profissional
- **Purple** - Roxo vibrante

### Modos
- **Modo Escuro** - Ideal para noite
- **Modo Claro** - Ideal para dia
- **Modo Privacidade** - Oculta valores (R$ ••••••)

---

## 🌍 Idiomas

- **Português** 🇧🇷 (padrão)
- **English** 🇺🇸

Fácil adicionar novos idiomas em `src/constants/translations.js`.

---

## 💾 Dados

Contas e dados principais dos ativos são processados pelo backend Node.js e armazenados no **MySQL da UOL Host**. A autenticação usa tokens JWT.

Proventos, detalhes complementares dos ativos e preferências da interface ainda são salvos no **LocalStorage** do navegador. Esses dados locais são específicos do navegador e dispositivo; faça backup regular dos itens aplicáveis exportando CSV.

---

## 🐛 Troubleshooting

### Cotações não atualizam
- Verifique conexão com internet
- Brapi pode estar indisponível (raro)
- Tickers devem ser válidos (ex: TAEE11)

### Dados desapareceram
- Verifique se navegador permite LocalStorage
- Tente limpar cache e recarregar
- Se perder dados, use backup CSV

### Gráfico não aparece
- Adicione pelo menos 1 ativo
- Verifique se preço > 0
- Recarregue página se travado

---

## 📚 Documentação

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura detalhada
- [package.json](./package.json) - Dependências
- [vite.config.js](./vite.config.js) - Configuração Vite

---

## 🤝 Contribuindo

Esta é uma aplicação educacional e profissional. Sugestões de melhoria são bem-vindas!

---

## 📝 Notas Importantes

### ⚠️ Aviso Legal
- Dados de contas e ativos são enviados ao backend e armazenados no MySQL
- Proventos e algumas preferências permanecem armazenados localmente no navegador
- Não é aconselhamento financeiro
- Use informações por sua conta e risco

### 📌 Boas Práticas
- Mantenha backups regulares (CSV)
- Valide cotações em múltiplas fontes
- Não confie cegamente em análises automáticas

---

## 🔐 Privacidade

- Contas e ativos são enviados ao backend Node.js e armazenados no MySQL
- Proventos e preferências da interface são processados localmente no navegador
- Cotações e indicadores podem ser consultados em BCB, Yahoo Finance, brapi, CoinGecko e AwesomeAPI

---

## 📞 Suporte

Para dúvidas sobre a aplicação:
1. Consulte [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Verifique código-fonte comentado
3. Teste funcionalidades com dados exemplo

---

## 🎓 Stack Técnico

- **Frontend Framework:** React 18
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Backend:** Node.js com `node:http`
- **Banco de dados:** MySQL (UOL Host)
- **Autenticação:** JWT
- **Charts:** Recharts
- **Icons:** Lucide React
- **APIs integradas:** BCB, Yahoo Finance, brapi, CoinGecko e AwesomeAPI
- **Armazenamento local:** LocalStorage para proventos, detalhes complementares e preferências

---

## ✅ Checklist de Qualidade

- [x] Arquitetura modular
- [x] Código limpo e comentado
- [x] Performance otimizada
- [x] Design responsivo
- [x] i18n (PT/EN)
- [x] Tema claro/escuro
- [x] Persistência de dados
- [x] Tratamento de erros
- [x] Documentação completa
- [x] Pronto para produção

---

**Desenvolvido com ❤️ usando React + Tailwind + ❤️**

Status: ✅ Production Ready

## Portas
- Backend: 3001 (forçado via `API_PORT=3001` no script `dev`)
- Vite dev server: 5173
- Se `EADDRINUSE` aparecer: `netstat -ano | findstr :3001` e mate o PID
