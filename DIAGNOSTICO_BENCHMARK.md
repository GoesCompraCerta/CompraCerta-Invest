# Diagnóstico Técnico do Benchmark

## Escopo da auditoria

Este relatório analisa exclusivamente o comportamento atual de `BenchmarkChart.jsx`. Nenhum arquivo de código foi alterado para produzir este diagnóstico.

O sintoma analisado é:

- A linha da Poupança aparece.
- A linha do CDI não aparece.
- A linha Minha Carteira não aparece.

O relatório separa fatos confirmados pela leitura do código de hipóteses que somente podem ser confirmadas observando as respostas reais no navegador.

## 1. Códigos de séries do Banco Central usados

O componente usa exatamente duas séries do SGS:

```text
Série 11: usada pelo código como cdi
Série 196: usada pelo código como poupanca
```

Não são usadas as séries 12 ou 4390.

A chamada é montada dentro de `getData` por meio da função `requestSeries`:

```js
requestSeries(11)
requestSeries(196)
```

A URL-base usada é:

```text
https://api.bcb.gov.br/dados/serie/bcdata.sgs
```

Para a série 11, a URL lógica é semelhante a:

```text
https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json&dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA
```

Para a série 196:

```text
https://api.bcb.gov.br/dados/serie/bcdata.sgs.196/dados?formato=json&dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA
```

O período solicitado atualmente é de aproximadamente 12 meses. A data inicial é calculada assim:

```js
const startDate = new Date(endDate);
startDate.setMonth(startDate.getMonth() - 12);
```

Portanto, o limite de dez anos não é atingido no fluxo atual.

O código também possui uma função `buildDateChunks` que divide períodos longos em blocos de cinco anos. Porém, como o período atual é de somente um ano, normalmente apenas um bloco é criado.

### Observação sobre o significado da série 11

O código chama a série 11 de `cdi`, mas essa associação precisa ser auditada. A implementação não usa a série 12 nem a série 4390. Portanto, mesmo quando a linha aparece, o indicador pode não representar o CDI acumulado esperado pelo produto.

Esse é um problema semântico da escolha da série, separado de um eventual problema de renderização.

## 2. Proxy CORS e `encodeURIComponent`

O proxy usado é:

```js
const SGS_PROXY_URL = 'https://api.allorigins.win/raw?url=';
```

A URL oficial do Banco Central é codificada antes de ser anexada ao proxy:

```js
fetch(`${SGS_PROXY_URL}${encodeURIComponent(sourceUrl)}`, {
  headers: { Accept: 'application/json' }
})
```

Portanto, o código atual confirma que:

- O proxy `allorigins.win` está sendo usado.
- `encodeURIComponent(sourceUrl)` está sendo aplicado.
- A requisição envia `Accept: application/json`.
- A chamada é feita para as séries 11 e 196.

As requisições das duas séries são executadas com:

```js
Promise.allSettled([
  requestSeries(11),
  requestSeries(196)
])
```

Isso significa que a falha do CDI não interrompe a Poupança. Cada série pode terminar separadamente.

## 3. O que acontece quando a API falha

Cada série é convertida para array vazio quando sua promessa é rejeitada:

```js
cdi: results[0].status === 'fulfilled'
  ? results[0].value
  : [],

poupanca: results[1].status === 'fulfilled'
  ? results[1].value
  : []
```

Assim, se o proxy retornar 406, 400, 500, erro de rede ou JSON inválido para a série 11, o resultado final será:

```js
cdi: []
```

A aplicação não preserva o erro original nessa etapa. O status da resposta não é guardado no objeto retornado por `getData`. Consequentemente, depois da falha não é possível saber pela estrutura final se a causa foi:

- bloqueio do proxy;
- status HTTP de erro;
- JSON inválido;
- array vazio;
- falha de rede.

Todos esses casos acabam parecendo apenas um array vazio para as etapas seguintes.

## 4. Filtros que podem descartar dados

A função `aggregateMonthlyRates` transforma os dados do SGS em taxas mensais.

Ela espera que cada item tenha exatamente:

```js
item.data
item.valor
```

A taxa é convertida assim:

```js
const rate = Number(String(item.valor).replace(',', '.')) / 100;
```

Depois há um filtro implícito:

```js
if (!Number.isFinite(rate)) return;
```

Se `item.valor` não existir, estiver vazio ou não puder ser convertido em número, o item é descartado.

Os registros também são agrupados pelo mês obtido de `item.data`:

```js
const month = item.data.split('/').reverse().join('-').slice(0, 7);
```

Essa linha pressupõe que a data sempre esteja no formato:

```text
dd/MM/yyyy
```

Se a API retornar uma data em outro formato, o agrupamento pode produzir uma chave incorreta ou um resultado sem utilidade.

Quando o fator mensal é criado, os registros do mesmo mês são compostos:

```js
const current = monthly.get(month) || 1;
monthly.set(month, current * (1 + rate));
```

No final, o fator vira taxa:

```js
rate: factor - 1
```

Portanto, valores inválidos, datas inesperadas e campos ausentes podem fazer a série terminar vazia antes de chegar ao Recharts.

## 5. Estrutura de dados enviada ao Recharts

A função `formatData` monta um array de pontos mensais. O formato pretendido é:

```js
{
  date: '2025-01-01',
  carteira: 5.2,
  cdi: 4.1,
  poupanca: 3.8
}
```

A função ordena o resultado por data crescente:

```js
return months.sort((first, second) => (
  first.date.localeCompare(second.date)
));
```

A linha da carteira é criada sempre que `formatData` chega ao loop, porque o objeto começa com:

```js
const point = {
  date: getDate(pointDate),
  carteira: Number((portfolioReturn * progress).toFixed(4))
};
```

Já `cdi` e `poupanca` são condicionais:

```js
if (monthlyCdi.length > 0) {
  point.cdi = ...;
}

if (monthlySavings.length > 0) {
  point.poupanca = ...;
}
```

Logo, o array pode ser parcialmente formado:

```js
[
  { date: '2025-01-01', carteira: 0, poupanca: 0.0 },
  { date: '2025-02-01', carteira: 1.2, poupanca: 0.5 }
]
```

Nesse exemplo, não existe a chave `cdi` em nenhum ponto.

O componente decide quais linhas renderizar com:

```jsx
SERIES
  .filter(({ key }) => data.some((point) => point[key] != null))
  .map(...)
```

Consequência direta:

- Se algum ponto possui `cdi`, a linha do CDI é criada.
- Se nenhum ponto possui `cdi`, a linha do CDI nem chega a ser criada.
- O mesmo vale para `carteira` e `poupanca`.

O eixo X usa corretamente:

```jsx
<XAxis dataKey="date" />
```

O formato visual `MM/YY` é aplicado pelo `tickFormatter`:

```js
const formatAxisDate = (date) => (
  `${date.slice(5, 7)}/${date.slice(2, 4)}`
);
```

## 6. Por que a linha da Poupança pode aparecer

Se a série 196 responder com um array válido contendo itens como:

```json
[
  {
    "data": "01/01/2025",
    "valor": "0.5"
  }
]
```

então `aggregateMonthlyRates(poupanca)` produz registros mensais válidos. `formatData` adiciona a propriedade `poupanca` em seus pontos e o filtro de renderização encontra essa chave.

O Recharts então recebe uma linha com `dataKey="poupanca"`.

Isso é consistente com o sintoma relatado: a Poupança aparece enquanto o CDI não aparece quando somente a série 11 falha ou é descartada pelo parser.

## 7. Por que a linha do CDI pode desaparecer

A sequência provável é:

1. `requestSeries(11)` chama a URL da série 11 pelo proxy.
2. O proxy ou o Banco Central retorna erro, array vazio ou JSON incompatível.
3. `Promise.allSettled` marca a promessa como rejeitada, ou a resposta chega sem registros utilizáveis.
4. `getData` transforma o resultado em `cdi: []`.
5. `aggregateMonthlyRates(cdi)` recebe array vazio.
6. `monthlyCdi.length` fica igual a zero.
7. `formatData` não adiciona a propriedade `cdi` a nenhum ponto.
8. O filtro do Recharts não encontra nenhum ponto com `point.cdi`.
9. A linha do CDI não é montada no JSX.

A série 196 pode completar o mesmo fluxo sem erro, por isso a Poupança permanece visível.

## 8. Por que a linha da Minha Carteira pode desaparecer

Pelo código atual, a linha da carteira não depende diretamente da existência de ativos na chave lida do `localStorage`.

O componente lê:

```js
const ASSET_STORAGE_KEYS = [
  'minha-carteira',
  'goes_compra_certa_assets'
];
```

Mas o array `assets` retornado por essa leitura não participa da fórmula da carteira. O valor usado vem de:

```js
const patrimony = Number(totals.patrimonio) || 0;
const invested = Number(totals.investido) || 0;
```

A rentabilidade é calculada assim:

```js
const portfolioReturn = invested > 0
  ? ((patrimony / invested) - 1) * 100
  : 0;
```

Depois é distribuída por 13 pontos mensais:

```js
carteira: Number((portfolioReturn * progress).toFixed(4))
```

Portanto, o localStorage vazio, por si só, não explica o desaparecimento da carteira. A linha deveria ser criada se `formatData` gerar pelo menos dois pontos.

Há quatro condições que podem impedir a visualização da carteira:

### 8.1. O componente não chega ao estado de sucesso

Se `getData` ou `formatData` lançar uma exceção, o componente faz:

```js
setData([]);
setStatus('error');
```

Nesse caso, o gráfico não é renderizado.

### 8.2. Há menos de dois pontos

A renderização do gráfico exige:

```jsx
status === 'success' && data.length >= 2
```

Com menos de dois objetos, o componente mostra `Carregando dados...` em vez do gráfico.

### 8.3. O valor patrimonial não é válido

Se `totals.patrimonio` ou `totals.investido` não tiverem valores coerentes, a fórmula pode resultar em zero, `NaN` ou valores inesperados. O `Number(...) || 0` converte valores inválidos em zero.

### 8.4. A linha está fora do domínio visual

O eixo Y é configurado assim:

```jsx
<YAxis domain={[0, yMax]} />
```

Se `portfolioReturn` for negativo, a carteira pode conter valores abaixo de `0%`, mas o eixo começa em `0%`. Nesse caso, os pontos podem existir no array, mas a linha fica fora do domínio visual do gráfico.

Esse é um motivo especialmente forte para a carteira “sumir” sem que a propriedade `carteira` esteja ausente.

## 9. A API está retornando vazio ou o proxy está falhando?

Pela leitura estática do código, não é possível afirmar qual das duas coisas ocorreu em uma execução específica, porque o componente descarta o motivo original e mantém apenas arrays vazios.

O código confirma que há três possibilidades equivalentes depois de `getData`:

```text
1. Proxy ou API retornou erro HTTP.
2. Proxy respondeu JSON inválido.
3. Proxy respondeu array vazio ou registros inválidos.
```

Todas podem resultar em:

```js
cdi: []
```

Para a Poupança, o fato de a linha aparecer indica que a série 196 provavelmente produziu pelo menos um registro aproveitável durante a execução observada.

Para o CDI, o fato de a linha não aparecer é compatível com série 11 vazia, falha do proxy, formato de resposta diferente do esperado ou valores descartados por `Number.isFinite`.

## 10. O limite de dez anos é a causa?

Não parece ser a causa atual.

O componente solicita somente doze meses:

```js
startDate.setMonth(startDate.getMonth() - 12);
```

Além disso, possui uma divisão em blocos de cinco anos. Portanto, o intervalo enviado hoje não ultrapassa dez anos.

O limite de dez anos seria relevante apenas se outro trecho passasse a fornecer um intervalo superior a dez anos para `buildDateChunks`.

## 11. Conclusão: três pontos mais prováveis

### Prioridade 1: falha ou resposta inválida da série 11

A série 11 pode estar falhando no proxy, retornando array vazio ou retornando dados incompatíveis com o parser que espera `data` e `valor`. Quando isso ocorre, o código transforma o resultado em `cdi: []`, não cria a chave `cdi` e o filtro do Recharts não renderiza a linha.

### Prioridade 2: carteira fora do domínio do eixo Y

A carteira é calculada, mas o eixo usa:

```jsx
<YAxis domain={[0, yMax]} />
```

Se o retorno patrimonial for negativo, os pontos ficam abaixo do limite inferior do eixo. A propriedade `carteira` pode existir corretamente no array, mas a linha não aparece dentro da área visual.

### Prioridade 3: série 11 semanticamente inadequada para o CDI esperado

O código usa a série 11 e a chama de CDI. A série escolhida pode não representar o CDI acumulado desejado. Isso pode gerar valores inesperados, resposta vazia para o contexto esperado ou uma comparação financeiramente incorreta, mesmo quando a requisição tecnicamente funciona.

O limite de dez anos não está entre as três causas principais do estado atual, porque o componente solicita somente doze meses.
