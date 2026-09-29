# 🗂️ Guia Rápido de Navegação

## 📍 Onde encontrar o quê?

### 🏠 **Tela de Boas-vindas**
- **Arquivo:** [src/App.jsx](src/App.jsx)
- **O que faz:** Orquestra toda a aplicação
- **Principais:** State management, routing, renderização

### 📊 **Dashboard (Gráfico de Rosca)**
- **Componentes:** [PortfolioChart.jsx](src/components/Dashboard/PortfolioChart.jsx) + [PositionSummary.jsx](src/components/Dashboard/PositionSummary.jsx)
- **Página:** [DashboardPage.jsx](src/pages/DashboardPage.jsx)
- **O que faz:** Visualiza alocação de carteira em tempo real

### 💼 **Minha Carteira**
- **Componentes:** [AssetForm.jsx](src/components/Forms/AssetForm.jsx) + [AssetsTable.jsx](src/components/Portfolio/AssetsTable.jsx)
- **Página:** [PortfolioPage.jsx](src/pages/PortfolioPage.jsx)
- **O que faz:** Cadastra, edita, deleta e exporta ativos

### 🎯 **Rebalanceador**
- **Página:** [RebalancerPage.jsx](src/pages/RebalancerPage.jsx)
- **O que faz:** Sugere rebalanceamento automático

### 💰 **Proventos**
- **Página:** [ProventosPage.jsx](src/pages/ProventosPage.jsx)
- **O que faz:** Registra dividendos e rendimentos

### 📈 **Juros Compostos**
- **Página:** [CompoundInterestPage.jsx](src/pages/CompoundInterestPage.jsx)
- **O que faz:** Simula evolução patrimonial

### 🔍 **Métodos Mestres**
- **Página:** [MasterMethodsPage.jsx](src/pages/MasterMethodsPage.jsx)
- **Componente:** [MethodCard.jsx](src/components/Common/MethodCard.jsx)
- **O que faz:** Análise Bazin, Lynch & Garon

---

## 🔧 Onde está a lógica?

### 📦 **State Management**
```
src/hooks/
├── useAssets.js        → Gerencia ativos
├── useProventos.js     → Gerencia proventos
├── useTheme.js         → Gerencia tema/idioma
└── useUpdateQuotes.js  → Atualiza cotações
```

### ⚙️ **Lógica de Negócio**
```
src/services/
├── calculationService.js  → Cálculos financeiros
├── brapiService.js        → API de cotações
└── storageService.js      → Persistência
```

### 🎨 **Constantes e Configurações**
```
src/constants/
├── translations.js  → Textos (PT/EN)
└── config.js       → Cores, tipos, constantes
```

### 🛠️ **Funções Auxiliares**
```
src/utils/
├── colors.js       → Geração de cores
├── formatters.js   → Formatação de valores
└── index.js        → Re-exportações
```

---

## 🚀 Como Adicionar uma Nova Feature

### 1️⃣ Criar novo componente
```bash
# Se é um componente simples:
touch src/components/Common/MyComponent.jsx

# Se é uma página inteira:
touch src/pages/MyFeaturePage.jsx
```

### 2️⃣ Criar hook se necessário
```bash
touch src/hooks/useMyFeature.js
```

### 3️⃣ Adicionar em App.jsx
```javascript
import MyFeaturePage from './pages/MyFeaturePage';

// No return:
{activeTab === 'myfeature' && <MyFeaturePage {...props} />}
```

### 4️⃣ Adicionar em navItems
```javascript
const navItems = [
  // ... outros items
  { id: 'myfeature', label: 'Minha Feature', icon: MyIcon }
];
```

---

## 📋 Mapa de Dependências

```
App.jsx
├─ useAssets()           ─→ assetsStorage       ↔ localStorage
├─ useProventos()        ─→ proventosStorage    ↔ localStorage
├─ useTheme()            ─→ THEME_STYLES       ← constants/config
├─ useUpdateQuotes()     ─→ brapiService       ↔ Brapi API
│
├─ Sidebar
│   └─ TRANSLATIONS      ← constants/translations
│
├─ KPICards
│   └─ calculatePortfolioTotals ← calculationService
│
├─ DashboardPage
│   ├─ PortfolioChart    ─→ getChartColor      ← utils/colors
│   └─ PositionSummary
│
├─ PortfolioPage
│   ├─ AssetForm
│   ├─ AssetsTable
│   └─ exportPortfolioToCSV ← calculationService
│
├─ RebalancerPage
│
├─ ProventosPage
│
├─ CompoundInterestPage
│   └─ calculateCompoundInterest ← calculationService
│
└─ MasterMethodsPage
    └─ MethodCard
```

---

## 🎯 Workflow Típico

### Adicionar novo ativo
1. Acesse "Minha Carteira"
2. Preencha [AssetForm](src/components/Forms/AssetForm.jsx)
3. Clique "Adicionar à Carteira"
4. Dados salvos via [useAssets](src/hooks/useAssets.js) → [storageService](src/services/storageService.js) → localStorage

### Atualizar cotações
1. Clique "Atualizar Cotas" na Sidebar
2. [useUpdateQuotes](src/hooks/useUpdateQuotes.js) chama [brapiService](src/services/brapiService.js)
3. API retorna preços
4. Estado atualizado automaticamente

### Calcular patrimônio
1. [calculatePortfolioTotals](src/services/calculationService.js) é chamado
2. Itera sobre todos os ativos
3. Calcula: patrimônio, lucro, rentabilidade, percentuais
4. Retorna objeto `totals` usado em toda aplicação

---

## 🔍 Como Debugar

### Ver dados em localStorage
```javascript
// No console do navegador:
localStorage.getItem('goes_compra_certa_assets')
localStorage.getItem('goes_compra_certa_proventos')
```

### Resetar dados
```javascript
// No console:
localStorage.clear()
// Recarregue página
```

### Debugar cálculos
```javascript
// Em calculationService.js, adicione:
console.log('Totals:', totals);
```

### Debugar API
```javascript
// Em brapiService.js, adicione:
console.log('Brapi response:', data);
```

---

## 📊 Estrutura de Dados

### Asset (Ativo)
```javascript
{
  id: "1694701234567",
  ticker: "TAEE11",
  type: "Ação BR",
  qty: 100,
  pm: 35.50,      // Preço médio (entrada)
  price: 36.00,   // Preço atual
  metaPercent: 10 // Meta de alocação
}
```

### Provento (Dividendo)
```javascript
{
  id: "1694701234567",
  ticker: "TAEE11",
  value: 50.00,
  date: "2023-09-15"
}
```

### Portfolio Totals
```javascript
{
  patrimonio: 10000.00,
  investido: 9500.00,
  lucroTotal: 500.00,
  rentabilidadeTotal: 5.26,
  totalProventos: 150.00,
  list: [ /* assets expandido */ ]
}
```

---

## 🎨 Temas Disponíveis

### Cores
- Emerald (padrão) ✅
- Blue
- Purple

### Modos
- Light
- Dark (padrão)
- Privacy (oculta valores)

### Idiomas
- Português (padrão) 🇧🇷
- English 🇺🇸

---

## ⚡ Performance Tips

1. **Usamos useMemo** para cálculos pesados
2. **Usamos useCallback** para funções estáveis
3. **Componentes são puros** (sem side effects)
4. **Re-renders mínimos** (props bem estruturadas)

---

## 🧪 Testes

Estrutura pronta para:
- Jest (unit tests)
- React Testing Library (component tests)
- Cypress (e2e tests)

Exemplo futura teste:
```javascript
describe('useAssets', () => {
  it('should add asset', () => {
    const { result } = renderHook(() => useAssets());
    act(() => {
      result.current.addAsset({ ticker: 'TEST11' });
    });
    expect(result.current.assets).toHaveLength(1);
  });
});
```

---

## 📚 Arquivos Importantes

| Arquivo | Propósito | Linhas |
|---------|-----------|--------|
| [App.jsx](src/App.jsx) | Orquestrador principal | 180 |
| [useAssets.js](src/hooks/useAssets.js) | Hook de ativos | 35 |
| [useTheme.js](src/hooks/useTheme.js) | Hook de tema | 50 |
| [calculationService.js](src/services/calculationService.js) | Cálculos | 100 |
| [brapiService.js](src/services/brapiService.js) | API Brapi | 60 |
| [translations.js](src/constants/translations.js) | Textos PT/EN | 200 |

---

## 🔗 Links Úteis

- **Brapi API:** https://brapi.dev
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Recharts:** https://recharts.org
- **Lucide Icons:** https://lucide.dev

---

## 💡 Dicas Práticas

### ✅ Adicionar novo idioma
1. Abra [translations.js](src/constants/translations.js)
2. Adicione chaves em novo idioma
3. Use `TRANSLATIONS[lang]` em componentes

### ✅ Adicionar novo tema
1. Abra [config.js](src/constants/config.js)
2. Adicione em `THEME_STYLES`
3. Use em componentes via `themeStyle`

### ✅ Adicionar novo tipo de ativo
1. Abra [config.js](src/constants/config.js)
2. Adicione em `ASSET_TYPES`
3. Automaticamente aparece no formulário

### ✅ Adicionar novo cálculo
1. Crie função em [calculationService.js](src/services/calculationService.js)
2. Importe em Hook necessário
3. Use via estado/props

---

**Ficou claro? Qualquer dúvida, consulte os arquivos específicos! 🚀**
