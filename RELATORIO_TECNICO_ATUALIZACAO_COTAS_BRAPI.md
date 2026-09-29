# Relatório técnico: atualização individual de cotas pela Brapi

## 1. Escopo e resumo do fluxo

Este relatório descreve o fluxo atualmente implementado para atualizar individualmente um ativo na tabela **Ativos Cadastrados**. O caminho executado é:

`AssetsTable` -> `PortfolioPage` -> `App` -> `useUpdateQuotes` -> `fetchBrapiAssetData` -> Brapi -> `onUpdateAsset` -> `useAssets` -> `localStorage`.

A atualização individual não é uma chamada direta feita pelo componente visual da tabela. A tabela apenas dispara o callback recebido por propriedade; a regra de negócio está concentrada no hook `useUpdateQuotes`, e a comunicação HTTP está concentrada em `src/services/brapiService.js`.

## 2. Onde fica o botão e como a atualização é acionada

O botão está em `src/components/Portfolio/AssetsTable.jsx`, dentro do `assets.map((item) => ...)`, na coluna de ações de cada linha. O evento é:

```jsx
<button
  type="button"
  onClick={() => onUpdateQuote(item)}
  disabled={Boolean(updatingAssetId)}
  className="p-1.5 text-slate-400 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
  title={updatingAssetId === item.id ? t.atualizando : t.atualizarCotas}
  aria-label={updatingAssetId === item.id ? t.atualizando : t.atualizarCotas}
>
  <RefreshCw className={`w-3.5 h-3.5 ${updatingAssetId === item.id ? 'animate-spin text-emerald-400' : ''}`} />
</button>
```

Portanto, o clique passa o objeto completo do ativo (`item`) para `onUpdateQuote`. Enquanto qualquer atualização estiver em andamento, `updatingAssetId` é diferente de nulo e os botões ficam desabilitados. O ícone do ativo em processamento recebe a classe `animate-spin`.

No `PortfolioPage`, o callback da tabela é adaptado para incluir a função de sucesso (`onUpdateAsset`) que será usada depois que a API responder:

```jsx
<AssetsTable
  assets={totals.list}
  formatMoney={formatMoney}
  cardClass={cardClass}
  t={t}
  onEdit={handleEditAsset}
  onDelete={onDeleteAsset}
  onUpdateQuote={(item) => onUpdateQuote(item, onUpdateAsset)}
  updatingAssetId={updatingAssetId}
  onExport={handleExportExcel}
/>
```

No componente raiz `App`, a propriedade `onUpdateQuote` conecta a página ao hook:

```jsx
const { updatingAssetId, updateMsg, handleUpdateAsset } = useUpdateQuotes();

// ...

<PortfolioPage
  // ...
  onUpdateQuote={(asset, onSuccess) => handleUpdateAsset(asset, t, onSuccess)}
  updatingAssetId={updatingAssetId}
  updateMsg={updateMsg}
/>
```

A função efetivamente acionada após essa cadeia é `handleUpdateAsset(asset, t, onSuccess)`, exportada pelo hook `src/hooks/useUpdateQuotes.js`.

## 3. Função que faz a requisição à Brapi

A função individual chamada pelo hook é `fetchBrapiAssetData`. O trecho exato atualmente implementado é:

```js
export const fetchBrapiAssetData = async (ticker) => {
  const results = await fetchBrapiFundamentals([ticker]);
  const result = results.find((item) => item?.symbol?.toUpperCase() === ticker.toUpperCase()) || results[0];

  if (!result?.symbol || result.regularMarketPrice == null) {
    throw new Error('No asset data from Brapi');
  }

  const firstNumber = (...values) => {
    for (const candidate of values) {
      if (candidate == null || candidate === '') continue;
      const number = Number(candidate);
      if (Number.isFinite(number)) return number;
    }
    return null;
  };

  return {
    price: Number(result.regularMarketPrice),
    dividendYield: firstNumber(result.dividendYield),
    pL: firstNumber(result.priceEarnings, result.trailingPE),
    pVp: firstNumber(result.priceToBook),
    roe: firstNumber(result.returnOnEquity),
    lpa: firstNumber(result.earningsPerShare),
    vpa: firstNumber(result.bookValuePerShare),
    growthRate: firstNumber(result.earningsGrowth),
    roic: firstNumber(result.returnOnInvestedCapital),
    divEbitda: firstNumber(result.enterpriseValueEbitda)
  };
};
```

A requisição HTTP é realizada pela função chamada internamente, `fetchBrapiFundamentals`:

```js
export const fetchBrapiFundamentals = async (tickers) => {
  try {
    if (!tickers || tickers.length === 0) {
      throw new Error('No tickers provided');
    }

    const tickerString = tickers.join(',');
    const res = await fetch(buildBrapiUrl(`quote/${encodeURIComponent(tickerString)}`), {
      headers: { Accept: 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data?.results ?? data ?? [];
  } catch (error) {
    console.error('Brapi fundamentals error:', error);
    throw error;
  }
};
```

Como a atualização individual envia um único ticker em um array (`[ticker]`), o endpoint produzido normalmente tem este formato:

```text
https://brapi.dev/api/quote/ABEV3
```

Se o ticker precisar de codificação URL, ele é codificado por `encodeURIComponent`. O construtor completo da URL é:

```js
const buildBrapiUrl = (endpoint, params = {}) => {
  const query = new URLSearchParams(params);
  const apiKey = brapiApiKeyStorage.get();

  if (apiKey) query.set('token', apiKey);

  return `https://brapi.dev/api/${endpoint}?${query.toString()}`;
};
```

Assim, quando existe uma chave cadastrada, a URL recebe o parâmetro de consulta `token`, por exemplo:

```text
https://brapi.dev/api/quote/ABEV3?token=CHAVE_DA_BRAPI
```

A chave é obtida de `localStorage` pelo serviço `brapiApiKeyStorage`, usando a chave lógica `goes_compra_certa_brapi_api_key`. O valor é removido do armazenamento quando fica vazio; quando é salvo, passa por `trim()`.

A chamada usa `fetch`, não `axios`, e envia o cabeçalho `Accept: application/json`. A resposta HTTP é rejeitada quando `res.ok` é falso. Em caso de erro de rede, HTTP inválido ou ausência de resultados utilizáveis, o erro é relançado para o hook tratar.

## 4. Como o retorno é interpretado e convertido

A resposta esperada da Brapi contém uma coleção `results`. Para a atualização individual, o código procura primeiro o item cujo `symbol` corresponde ao ticker solicitado, ignorando diferenças entre maiúsculas e minúsculas. Se não encontrar correspondência exata, utiliza o primeiro resultado:

```js
const result = results.find((item) => item?.symbol?.toUpperCase() === ticker.toUpperCase()) || results[0];
```

O ativo só é aceito se possuir `symbol` e `regularMarketPrice` diferente de `null` ou `undefined`. A função `firstNumber` converte valores numéricos e escolhe o primeiro candidato finito. Isso permite, por exemplo, usar `priceEarnings` e, como alternativa, `trailingPE` para o P/L.

O mapeamento entre campos da Brapi e campos internos do ativo é:

| Campo interno | Campo retornado pela Brapi |
|---|---|
| `price` | `regularMarketPrice` |
| `dividendYield` | `dividendYield` |
| `pL` | `priceEarnings` ou `trailingPE` |
| `pVp` | `priceToBook` |
| `roe` | `returnOnEquity` |
| `lpa` | `earningsPerShare` |
| `vpa` | `bookValuePerShare` |
| `growthRate` | `earningsGrowth` |
| `roic` | `returnOnInvestedCapital` |
| `divEbitda` | `enterpriseValueEbitda` |

O retorno de `fetchBrapiAssetData` já é um objeto normalizado para o modelo de dados da aplicação. Não são atualizados todos os campos do ativo: dados como quantidade, preço médio, meta, dividendos de FIIs, vacância e patrimônio permanecem com os valores já cadastrados.

## 5. Como os dados são aplicados ao ativo e à interface

Depois de receber o objeto normalizado, o hook `useUpdateQuotes` monta apenas os campos atualizáveis:

```js
const mergedUpdates = {
  price: incoming.price ?? asset.price,
  dividendYield: preserveExistingValue(incoming.dividendYield, asset.dividendYield),
  pL: preserveExistingValue(incoming.pL, asset.pL),
  pVp: preserveExistingValue(incoming.pVp, asset.pVp),
  roe: preserveExistingValue(incoming.roe, asset.roe),
  lpa: preserveExistingValue(incoming.lpa, asset.lpa),
  vpa: preserveExistingValue(incoming.vpa, asset.vpa),
  growthRate: preserveExistingValue(incoming.growthRate, asset.growthRate),
  roic: preserveExistingValue(incoming.roic, asset.roic),
  divEbitda: preserveExistingValue(incoming.divEbitda, asset.divEbitda)
};
```

A função `preserveExistingValue` impede que um valor já existente seja substituído por `undefined`, `null` ou um valor que não possa ser convertido em número:

```js
const preserveExistingValue = (incomingValue, currentValue) => {
  if (incomingValue === undefined || incomingValue === null || Number.isNaN(Number(incomingValue))) {
    return currentValue;
  }

  return incomingValue;
};
```

Em seguida, o callback de sucesso atualiza o ativo pelo seu identificador:

```js
onSuccess(asset.id, mergedUpdates);
setUpdateMsg(`✓ ${asset.ticker} ${t.cotacaoAtualizada}`);
```

Esse callback é `updateAsset`, vindo do hook `useAssets`. Ele atualiza o estado de forma imutável, preservando os demais campos:

```js
const updateAsset = useCallback((assetId, updates) => {
  setAssets((prev) =>
    prev.map((a) => (a.id === assetId ? { ...a, ...updates } : a))
  );
}, []);
```

O `assets` atualizado é recebido novamente pela árvore de componentes. O `App` recalcula `totals` com `calculatePortfolioTotals(assets, proventos)`, e o `PortfolioPage` passa `totals.list` para `AssetsTable`. Por isso, a tabela passa a exibir a nova cotação e os valores derivados, como valor total, lucro/prejuízo, rentabilidade e percentual atual.

O feedback visual ocorre em três frentes:

1. `updatingAssetId` recebe o `id` do ativo e desabilita os botões de atualização enquanto a requisição está pendente.
2. O ícone `RefreshCw` do ativo em processamento gira com `animate-spin`.
3. `updateMsg` mostra uma mensagem de sucesso ou erro; a mensagem é limpa quatro segundos depois.

## 6. Como os dados são salvos

O hook `useAssets` observa a lista de ativos com `useEffect`:

```js
useEffect(() => {
  assetsStorage.set(assets);
}, [assets]);
```

A implementação do armazenamento serializa a lista inteira em JSON e grava no `localStorage`:

```js
set: (assets) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  } catch (error) {
    console.error('Error saving assets to storage:', error);
  }
}
```

A chave usada é `goes_compra_certa_assets`. Portanto, o salvamento não é feito diretamente pela função da Brapi nem pelo botão: ele ocorre automaticamente após a mudança de estado causada por `updateAsset`. Em uma nova abertura ou recarga da aplicação, `assetsStorage.get()` lê essa chave e reconstrói a lista inicial.

## 7. Tratamento de falhas e observações técnicas

No hook, qualquer erro da camada Brapi é capturado, registrado no console e convertido em uma mensagem de interface:

```js
try {
  const incoming = await fetchBrapiAssetData(asset.ticker);
  // montagem e aplicação dos dados
} catch (err) {
  console.error('Update quotes error:', err);
  setUpdateMsg(t.erroCotacoes);
} finally {
  setUpdatingAssetId(null);
  setTimeout(() => setUpdateMsg(''), 4000);
}
```

A função também encerra imediatamente se o ativo não tiver ticker ou se já houver uma atualização em andamento:

```js
if (!asset?.ticker || updatingAssetId) return;
```

Existe ainda uma função separada, `updateAssetPrices`, para atualização em lote. Ela filtra os tipos definidos em `BRAPI_TYPES` (`Ação BR`, `FII`, `ETF` e `BDR`) e utiliza `fetchBrapiQuotes`. Esse não é o caminho acionado pelo botão individual da tabela. No fluxo individual, não há filtro por tipo: o ticker é enviado diretamente à Brapi, e a operação depende de a API retornar um ativo válido com preço.

## Conclusão

A atualização individual começa no botão de refresh de cada linha de `AssetsTable`, percorre os callbacks de `PortfolioPage` e `App`, chama `handleUpdateAsset` no hook `useUpdateQuotes` e chega a `fetchBrapiAssetData` no serviço Brapi. A requisição usa `fetch` no endpoint `https://brapi.dev/api/quote/{ticker}`, adiciona opcionalmente a chave no parâmetro `token`, normaliza cotação e indicadores fundamentais, preserva os campos que não vierem válidos, aplica os dados ao ativo pelo `id`, recalcula os totais exibidos e persiste a lista atualizada em `localStorage`.
