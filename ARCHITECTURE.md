# 🏗️ COMPRACERTA INVEST - Arquitetura Refatorada

## 📋 Visão Geral

O projeto foi completamente refatorado de uma estrutura monolítica para uma **arquitetura modular profissional**, seguindo as melhores práticas de desenvolvimento React e engenharia de software sênior.

### Antes vs Depois

**Antes:**
- ❌ Único arquivo `App.jsx` com ~2000+ linhas
- ❌ Código duplicado em diferentes locais
- ❌ Sem separação de responsabilidades
- ❌ Difícil de manter e escalar

**Depois:**
- ✅ Estrutura modular com ~30 componentes pequenos
- ✅ Services reutilizáveis para lógica de negócio
- ✅ Custom hooks para gerenciamento de estado
- ✅ Separação clara de responsabilidades
- ✅ Fácil manutenção e escalabilidade

---

## 📁 Estrutura de Pastas (Professional)

```
src/
├── components/                 # Componentes React reutilizáveis
│   ├── Layout/
│   │   └── Sidebar.jsx        # Navegação principal
│   ├── Dashboard/
│   │   ├── PortfolioChart.jsx # Gráfico de alocação (rosca)
│   │   └── PositionSummary.jsx # Resumo de posições
│   ├── Portfolio/
│   │   └── AssetsTable.jsx    # Tabela de ativos
│   ├── Forms/
│   │   └── AssetForm.jsx      # Formulário de cadastro
│   └── Common/
│       ├── KPICards.jsx       # Cards de KPIs
│       └── MethodCard.jsx     # Card de análise Bazin/Lynch/Garon
│
├── pages/                      # Páginas/Seções (tabs)
│   ├── DashboardPage.jsx      # Dashboard principal
│   ├── PortfolioPage.jsx      # Gerenciamento de carteira
│   ├── RebalancerPage.jsx     # Rebalanceador inteligente
│   ├── ProventosPage.jsx      # Gerenciamento de proventos
│   ├── CompoundInterestPage.jsx # Simulador de juros compostos
│   └── MasterMethodsPage.jsx  # Análise de excelência (Bazin, Lynch, Garon)
│
├── hooks/                      # Custom React Hooks
│   ├── useAssets.js           # Gerenciamento de ativos
│   ├── useProventos.js        # Gerenciamento de proventos
│   ├── useTheme.js            # Temas e formatação
│   └── useUpdateQuotes.js     # Atualização de cotações via Brapi
│
├── services/                   # Lógica de negócio e integração
│   ├── brapiService.js        # Integração com API Brapi
│   ├── calculationService.js  # Cálculos financeiros
│   └── storageService.js      # Gerenciamento de LocalStorage
│
├── constants/                  # Constantes da aplicação
│   ├── translations.js        # Traduções (PT/EN)
│   └── config.js              # Configurações, temas, tipos
│
├── utils/                      # Utilitários gerais
│   ├── colors.js              # Geração de cores (golden angle)
│   ├── formatters.js          # Formatação (moeda, datas)
│   └── index.js               # Exportações centralizadas
│
├── App.jsx                     # Componente raiz (limpo e enxuto)
├── main.jsx                    # Ponto de entrada
└── index.css                   # Estilos globais (Tailwind)
```

---

## 🧩 Componentes Principais

### **Componentes de Layout**
- `Sidebar.jsx` - Navegação, idioma, modo escuro, modo privacidade, atualizar cotações

### **Componentes de Dashboard**
- `PortfolioChart.jsx` - Visualização em rosca (donut) da alocação
- `PositionSummary.jsx` - Resumo scrollável de posições

### **Componentes de Portfolio**
- `AssetForm.jsx` - Formulário para cadastrar/editar ativos
- `AssetsTable.jsx` - Tabela completa de ativos com ações (editar/deletar)

### **Componentes Comuns**
- `KPICards.jsx` - Cards com patrimônio, lucro, proventos
- `MethodCard.jsx` - Card compacto para análises (Bazin, Lynch, Garon)

---

## 🎯 Páginas (Tabs)

1. **DashboardPage** - Visualização geral com gráfico + resumo
2. **PortfolioPage** - Cadastro e gerenciamento de ativos
3. **RebalancerPage** - Sugestões de rebalanceamento
4. **ProventosPage** - Registro de dividendos/rendimentos
5. **CompoundInterestPage** - Simulador de juros compostos
6. **MasterMethodsPage** - Análise Bazin, Lynch & Garon

---

## 🪝 Custom Hooks

### `useAssets()`
Gerencia estado de ativos com persistência em LocalStorage.
```javascript
const { assets, setAssets, addAsset, updateAsset, deleteAsset } = useAssets();
```

### `useProventos()`
Gerencia estado de proventos com persistência.
```javascript
const { proventos, setProventos, addProvento, updateProvento, deleteProvento } = useProventos();
```

### `useTheme()`
Centraliza lógica de tema, modo escuro, privacidade e formatação.
```javascript
const { lang, isDarkMode, privacyMode, formatMoney, themeStyle, cardClass } = useTheme();
```

### `useUpdateQuotes()`
Integra atualização de cotações via Brapi.
```javascript
const { isUpdating, updateMsg, handleUpdateQuotes } = useUpdateQuotes();
```

---

## 🔧 Services

### `brapiService.js`
- `fetchBrapiQuotes()` - Busca cotações de ativos BR/FII
- `updateAssetPrices()` - Atualiza preços em tempo real

### `calculationService.js`
- `calculatePortfolioTotals()` - Calcula patrimônio, lucro, rentabilidade
- `calculateCompoundInterest()` - Simula juros compostos
- `exportPortfolioToCSV()` - Exporta carteira em CSV
- `downloadCSV()` - Faz download do arquivo

### `storageService.js`
- `assetsStorage.get/set` - Persiste ativos
- `proventosStorage.get/set` - Persiste proventos
- `clearAllStorage()` - Limpa dados

---

## 🎨 Constants e Configurações

### `translations.js`
Dicionário completo PT/EN com 60+ chaves de texto.

### `config.js`
- `BRAPI_TYPES` - Tipos de ativos suportados pela Brapi
- `ASSET_TYPES` - Tipos de ativos do formulário
- `STORAGE_KEYS` - Chaves do LocalStorage
- `THEME_STYLES` - Cores e estilos por tema
- `PIE_RADII` - Tamanhos do gráfico de rosca

---

## 🛠️ Utilitários

### `colors.js`
```javascript
getChartColor(index) // Gera cores únicas usando golden angle
```

### `formatters.js`
```javascript
formatMoney(value, privacyMode) // Formata moeda BRL
formatDate(dateString)           // Formata datas
parseCSVValue(val)               // Converte CSV
```

---

## 📊 App.jsx Refatorado (Novo)

O novo `App.jsx` agora é **limpo e enxuto** (~200 linhas):

```javascript
export default function App() {
  // Estado com hooks
  const { assets, addAsset, updateAsset, deleteAsset } = useAssets();
  const { proventos, addProvento, updateProvento, deleteProvento } = useProventos();
  const { formatMoney, themeStyle, cardClass, isDarkMode } = useTheme();
  const { isUpdating, handleUpdateQuotes } = useUpdateQuotes();

  // Cálculos memoizados
  const totals = useMemo(() => calculatePortfolioTotals(assets, proventos), [assets, proventos]);

  // Renderização condicional de páginas
  return (
    <div className="min-h-screen flex">
      <Sidebar {...props} />
      <main>
        <KPICards {...props} />
        {activeTab === 'dashboard' && <DashboardPage {...props} />}
        {activeTab === 'carteira' && <PortfolioPage {...props} />}
        {/* ... outras páginas */}
      </main>
    </div>
  );
}
```

---

## ✨ Melhorias Implementadas

### 1. **Separação de Responsabilidades**
- ✅ Componentes focados em UI
- ✅ Services focados em lógica de negócio
- ✅ Hooks focados em gerenciamento de estado

### 2. **Reutilização de Código**
- ✅ Componentes pequenos e compostos
- ✅ Funções utilitárias centralizadas
- ✅ Constantes em um único lugar

### 3. **Persistência**
- ✅ LocalStorage automático via hooks
- ✅ Sem prop drilling desnecessário
- ✅ Estado sincronizado em tempo real

### 4. **Performance**
- ✅ useMemo para cálculos complexos
- ✅ useCallback para funções estáveis
- ✅ Componentes puros sem re-renders desnecessários

### 5. **Manutenibilidade**
- ✅ Estrutura intuitiva e escalável
- ✅ Fácil encontrar/adicionar features
- ✅ Código autodocumentado

### 6. **i18n (Internacionalização)**
- ✅ Sistema completo PT/EN
- ✅ Fácil adicionar novos idiomas
- ✅ Sem duplicação de strings

---

## 🚀 Como Usar

### Iniciar desenvolvimento
```bash
npm run dev
```

### Build para produção
```bash
npm run build
```

### Preview do build
```bash
npm run preview
```

---

## 📦 Dependências

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "lucide-react": "^0.483.0",
  "recharts": "^2.8.0",
  "tailwindcss": "^3.4.4"
}
```

---

## 🔄 Fluxo de Dados

```
App.jsx (Orquestrador)
  │
  ├─→ useAssets()          ─→ assetsStorage    ↔ LocalStorage
  ├─→ useProventos()       ─→ proventosStorage ↔ LocalStorage
  ├─→ useTheme()           ─→ Tema global
  ├─→ useUpdateQuotes()    ─→ brapiService    ↔ Brapi API
  │
  ├─→ calculatePortfolioTotals() → Services
  │
  └─→ Renderiza Páginas
      ├─ Dashboard    (PortfolioChart + PositionSummary)
      ├─ Portfolio    (AssetForm + AssetsTable)
      ├─ Rebalancer   (Sugestões)
      ├─ Proventos    (Formulário + Extrato)
      ├─ JurosCompostos (Simulador)
      └─ MetodosMestres (Análises)
```

---

## ✅ Checklist de Refatoração

- [x] Criar estrutura de pastas modular
- [x] Extrair constantes e traduções
- [x] Criar custom hooks reutilizáveis
- [x] Separar componentes menores
- [x] Criar services de lógica
- [x] Limpar App.jsx principal
- [x] Corrigir todas as importações
- [x] Manter design visual idêntico
- [x] Preservar funcionalidades 100%
- [x] Validar compilação

---

## 🎓 Padrões de Desenvolvimento

### Component Composition
Componentes pequenos e compostos para máxima reutilização.

### Custom Hooks
Lógica de estado extraída em hooks reutilizáveis.

### Service Layer
Lógica de negócio separada em services.

### Constants Management
Todas as constantes em um lugar centralizado.

### Utility Functions
Funções auxiliares organizadas por propósito.

---

## 📝 Notas

- Toda a **lógica visual é preservada** - nenhuma mudança em cores, componentes ou funcionalidades
- **Performance otimizada** com useMemo e useCallback
- **Fácil de adicionar features** - basta adicionar um novo componente/service
- **Pronto para produção** - estrutura profissional e escalável

---

**Desenvolvido por:** Arquiteto de Software Sênior & React Expert  
**Data:** Agosto 2026  
**Status:** ✅ Refatoração Completa e Validada
