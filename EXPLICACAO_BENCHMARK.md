# Explicação Técnica do Benchmark

Este documento descreve o comportamento atual do benchmark e as fórmulas existentes no projeto. Ele foi escrito para permitir uma revisão manual do raciocínio, sem alterar automaticamente o código.

## 1. VISÃO GERAL

O benchmark atual compara três linhas percentuais:

- **Minha Carteira:** calculada a partir do patrimônio atual, do valor investido e de snapshots salvos no `localStorage`.
- **CDI:** série oficial 11 do Banco Central, buscada pelo proxy CORS.
- **Poupança:** série oficial 196 do Banco Central, também buscada pelo proxy CORS.

O componente não busca histórico de preços de ativos na Brapi. A carteira só possui evolução histórica quando existem snapshots anteriores salvos na chave local:

```text
goes_compra_certa_benchmark_portfolio
```

Cada snapshot possui, conceitualmente, esta estrutura:

```js
{
  baselineValue: 10000,
  baselineDate: '2026-01-15',
  points: [
    { date: '2026-01-15', value: 0 },
    { date: '2026-02-15', value: 2.35 }
  ]
}
```

`baselineValue` é o patrimônio usado como base inicial. `baselineDate` é a data do primeiro ponto. Cada item de `points` representa a evolução percentual da carteira em uma data.

Quando o usuário sincroniza o benchmark:

1. O sistema lê `totals.patrimonio` e `totals.investido`.
2. Lê o snapshot anterior do `localStorage`.
3. Se não houver snapshot válido, usa o patrimônio atual como base e cria o primeiro ponto com `0%` na data atual.
4. Se houver snapshot válido, calcula a evolução atual em relação ao patrimônio-base.
5. Busca CDI e Poupança no Banco Central.
6. Constrói uma linha do tempo comum.
7. Mantém o último valor conhecido de cada série até a próxima observação, porque CDI, Poupança e carteira podem ter frequências diferentes.

O botão **Atualizar Benchmark** repete esse processo manualmente.

## 2. MATEMÁTICA DETALHADA (PASSO A PASSO)

### 2.1. Evolução percentual da carteira

No componente, a evolução da carteira é calculada pela fórmula:

```text
rentabilidadeCarteira = ((patrimonioAtual / patrimonioBase) - 1) * 100
```

Onde:

- `patrimonioAtual` é `totals.patrimonio`.
- `patrimonioBase` é `stored.baselineValue`, quando existe um snapshot válido.
- Se não existe snapshot válido, `patrimonioBase` recebe o patrimônio atual.
- O resultado é percentual porque o valor decimal do retorno é multiplicado por `100`.

Exemplo:

```text
patrimonioBase = R$ 10.000,00
patrimonioAtual = R$ 10.800,00

retorno = ((10800 / 10000) - 1) * 100
retorno = (1,08 - 1) * 100
retorno = 8%
```

No primeiro cadastro, o componente força o valor para `0%`, porque não existe comparação histórica anterior.

Também existe uma trava de segurança:

```text
-100% <= rentabilidadeCarteira <= 500%
```

Qualquer valor menor que `-100%` é convertido para `-100%`. Qualquer valor maior que `500%` é convertido para `500%`. Isso evita que um patrimônio-base corrompido gere um pico absurdo no gráfico.

### 2.2. Conversão das taxas do Banco Central

O SGS retorna valores percentuais em texto, por exemplo:

```json
{
  "data": "01/02/2026",
  "valor": "0.85"
}
```

O código faz duas conversões:

```js
Number(String(item.valor).replace(',', '.'))
```

Passo a passo:

1. `String(item.valor)` garante que o valor seja tratado como texto.
2. `.replace(',', '.')` converte a notação decimal brasileira para a notação entendida pelo JavaScript.
3. `Number(...)` transforma o texto em número.

Assim:

```text
"0,85" -> "0.85" -> 0.85
```

O valor `0.85` representa uma taxa percentual de `0,85%`, não `85%`.

Para aplicar essa taxa como fator decimal, o cálculo usa:

```text
1 + taxa / 100
```

Portanto:

```text
0,85% -> 0,0085 -> fator 1,0085
0,50% -> 0,0050 -> fator 1,0050
```

### 2.3. Juros compostos do CDI e da Poupança no benchmark

O componente começa cada linha em `0%` na data inicial:

```text
valorAcumuladoInicial = 0
```

Para cada observação do SGS, ele aplica:

```text
valorNovo = ((1 + valorAnterior / 100) * (1 + taxa / 100) - 1) * 100
```

A fórmula é equivalente a:

```text
fatorNovo = fatorAnterior * (1 + taxa / 100)
fatorNovo = fatorNovo * (1 + taxa / 100)
retornoPercentual = (fatorNovo - 1) * 100
```

Exemplo com duas taxas mensais de `0,85%`:

```text
mês 0: 0%

mês 1:
((1 + 0 / 100) * (1 + 0,85 / 100) - 1) * 100
= 0,85%

mês 2:
((1 + 0,85 / 100) * (1 + 0,85 / 100) - 1) * 100
= 1,707225%
```

O segundo mês não é simplesmente `0,85% + 0,85%`, porque o segundo rendimento incide também sobre o rendimento acumulado do primeiro mês.

### 2.4. Fórmula de juros compostos do Simulador de Liberdade

O benchmark não usa o simulador de juros compostos. Porém, como o projeto possui uma função separada chamada `calculateCompoundInterest`, a fórmula dela precisa ser documentada para não misturar os dois cálculos.

Na função, as entradas são convertidas assim:

```js
const vInicial = Number(initialInvestment) || 0;
const vAporte = Number(monthlyDeposit) || 0;
const taxa = (Number(monthlyRate) || 0) / 100;
const anos = Number(periodYears) || 0;
const totalMeses = anos * 12;
```

Conversões:

- `initialInvestment` vira `vInicial`, o capital inicial em reais.
- `monthlyDeposit` vira `vAporte`, o aporte mensal em reais.
- `monthlyRate` é dividido por `100` e vira `taxa` decimal.
- `periodYears` vira `anos`.
- `anos * 12` vira o número total de meses.

A atualização mensal é:

```text
saldoNovo = saldoAnterior + (saldoAnterior * taxa) + aporteMensal
```

Ou, de forma fatorada:

```text
saldoNovo = saldoAnterior * (1 + taxa) + aporteMensal
```

O investimento acumulado é atualizado separadamente:

```text
investidoNovo = investidoAnterior + aporteMensal
```

Exemplo:

```text
saldo inicial = R$ 1.000,00
aporte mensal = R$ 500,00
rendimento mensal = 1%

taxa = 1 / 100 = 0,01

saldo após um mês:
1000 * (1 + 0,01) + 500
= 1010 + 500
= R$ 1.510,00
```

Após a simulação:

```text
jurosTotais = patrimonioFinal - investido
rendaMensalFinal = patrimonioFinal * taxa
```

### 2.5. Inflação: o que o projeto realmente faz

A inflação não é aplicada na fórmula principal de `calculateCompoundInterest`.

O campo `jcInflacaoAnual` é tratado na página do simulador e usado para calcular o poder de compra real:

```js
poderCompraReal = patrimonioFinal / Math.pow(1 + inflacao / 100, anos)
```

Fórmula matemática:

```text
poderCompraReal = patrimonioNominal / (1 + inflaçãoAnual / 100)^anos
```

Exemplo:

```text
patrimônio nominal = R$ 200.000,00
inflação anual = 4,5%
período = 10 anos

poder real = 200000 / (1 + 4,5 / 100)^10
poder real = 200000 / 1,045^10
```

A inflação não é somada ao rendimento. Ela também não é subtraída diretamente do rendimento. O código usa uma deflação composta do patrimônio nominal.

O projeto não usa a fórmula de Fisher para calcular uma taxa real. A fórmula de Fisher seria, aproximadamente:

```text
taxaReal = (1 + taxaNominal) / (1 + inflação) - 1
```

Essa fórmula não é usada atualmente no benchmark nem no simulador.

## 3. LÓGICA DE DADOS

### 3.1. Dados da carteira

A carteira não usa histórico de cotações externas para o benchmark. Ela usa os valores já calculados no sistema:

- `totals.patrimonio`: soma atual dos valores dos ativos.
- `totals.investido`: soma do custo de aquisição dos ativos.
- Snapshot local: histórico de sincronizações do benchmark.

O ponto inicial da carteira é criado assim:

```text
baselineValue = patrimonio atual no primeiro acesso
baselineDate = data do primeiro acesso
ponto inicial = 0%
```

Nas sincronizações seguintes, o retorno é calculado comparando o patrimônio atual com `baselineValue`.

Isso significa que a carteira não tem uma série histórica financeira real desde a data de cada compra. Ela tem uma série de snapshots criados pelo uso do botão ou pela montagem do componente.

### 3.2. Dados do CDI

O CDI é buscado na série oficial 11 do SGS:

```text
https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados
```

A URL é encapsulada no proxy:

```text
https://api.allorigins.win/raw?url={URL_DO_SGS_CODIFICADA}
```

A resposta é filtrada pelo intervalo entre `startDate` e `endDate`, convertida para números e acumulada com juros compostos.

### 3.3. Dados da Poupança

A Poupança é buscada na série oficial 196:

```text
https://api.bcb.gov.br/dados/serie/bcdata.sgs.196/dados
```

Ela passa pelo mesmo proxy, pelo mesmo parser e pelo mesmo cálculo de capitalização.

### 3.4. Fallback quando o Banco Central falha

Se a série 11 ou 196 falha, o código não deixa a série vazia. Ele cria uma série estimada mensal:

- CDI: `0,85%` ao mês.
- Poupança: `0,50%` ao mês.

Esses valores são aproximações fixas, não dados oficiais. Eles existem somente para manter o gráfico visualmente funcional quando o proxy ou o SGS estão indisponíveis.

### 3.5. CDI, Poupança e IFIX

O benchmark atual não usa IFIX. A implementação atual contém apenas:

- Minha Carteira.
- CDI.
- Poupança.

Portanto, qualquer descrição anterior dizendo que este componente compara também com IFIX não corresponde ao código vigente.

Os valores de preços e dividendos dos ativos não são escolhidos pelo benchmark. Eles vêm da carteira já cadastrada e dos cálculos existentes em `calculationService.js`. O único dado explicitamente fictício no benchmark atual é o fallback de `0,85%` ao mês para CDI e `0,50%` ao mês para Poupança quando a API falha.

## 4. SUPOSIÇÕES E RISCOS

1. **Snapshot não é histórico real de mercado.** A carteira só evolui quando um novo snapshot é salvo. Se o usuário não abrir ou sincronizar o dashboard por meses, não existem pontos intermediários.

2. **O patrimônio-base pode não representar o primeiro aporte real.** O primeiro acesso usa o patrimônio existente naquele momento. Compras anteriores ao primeiro snapshot já ficam incorporadas na base.

3. **A carteira atual pode incluir novos aportes.** A fórmula `patrimonioAtual / patrimonioBase - 1` trata toda diferença como rentabilidade. Se o usuário fizer novos aportes, a linha pode atribuir o aporte ao rendimento.

4. **Resgates também são tratados como variação de patrimônio.** Retiradas podem parecer prejuízo, mesmo quando o investimento teve rentabilidade positiva.

5. **A trava de `500%` é uma proteção visual, não uma correção financeira.** Se o retorno real for maior que `500%`, o gráfico exibirá `500%`. Se o dado estiver errado, o erro é escondido em vez de corrigido na origem.

6. **A trava mínima de `-100%` é coerente com uma perda total de capital, mas não resolve dados inválidos.** Um valor negativo ou uma divisão incorreta ainda precisa ser investigado na fonte.

7. **O CDI e a Poupança têm frequências diferentes.** O CDI pode ter observações diárias e a Poupança normalmente mensais. O gráfico usa o último valor conhecido para preencher datas intermediárias.

8. **O preenchimento por último valor conhecido é uma convenção visual.** Ele não cria uma nova observação financeira. Apenas mantém a curva estável até a próxima taxa publicada.

9. **O fallback não é oficial.** Os valores fixos de `0,85%` e `0,50%` ao mês são estimativas. Eles não devem ser usados para análise financeira, auditoria ou decisão de investimento.

10. **O proxy CORS é uma dependência externa.** O serviço `allorigins.win` pode estar indisponível, limitar requisições ou modificar o comportamento da resposta.

11. **O parâmetro `Content-Type` não é usado no GET.** O código envia `Accept: application/json`. Como não há corpo na requisição, não há necessidade de declarar `Content-Type`.

12. **Não existe ajuste por inflação no benchmark.** As linhas são nominais. Comparar CDI, Poupança e carteira sem deflacionar todas as séries não é uma comparação de retorno real.

13. **Não existe cálculo de dividendos históricos da carteira no benchmark.** O patrimônio atual pode refletir os dados cadastrados, mas a série histórica não recompõe dividendos automaticamente.

## 5. PONTO DE REVISÃO

O ponto mais importante para revisar caso apareça um pico absurdo é a fórmula dentro da função `synchronize`:

```js
const currentValue = hasValidSnapshot
  ? clampPortfolioReturn(((patrimony / baseline) - 1) * 100)
  : 0;
```

Essa fórmula é matematicamente correta para comparar dois patrimônios sem aportes ou resgates. Porém, ela pode representar uma rentabilidade falsa quando:

- `baseline` foi salvo antes de um grande aporte;
- `patrimony` inclui dinheiro novo;
- o `localStorage` contém um `baselineValue` antigo ou inválido;
- os ativos foram editados sem registrar uma nova base;
- o patrimônio atual foi calculado com preço ou quantidade incorreta.

O segundo ponto crítico é o fallback:

```js
createEstimatedSeries(startDate, endDate, 0.85)
createEstimatedSeries(startDate, endDate, 0.5)
```

Essas linhas não representam dados oficiais. Elas são somente uma aproximação visual para manter o gráfico desenhado quando o SGS falha.

O terceiro ponto crítico é o alinhamento temporal:

```js
carteira: valueAtOrBefore(portfolioPoints, date),
cdi: valueAtOrBefore(cdi, date),
poupanca: valueAtOrBefore(poupanca, date)
```

Esse mecanismo resolve o problema de datas que não coincidem, mas assume que manter o último valor conhecido é a melhor interpolação. Para uma análise financeira rigorosa, seria necessário armazenar snapshots regulares da carteira e definir explicitamente como tratar aportes, resgates, dividendos, feriados e dias sem negociação.

Em resumo: o erro mais provável de um pico de mais de `1000%` não está na fórmula de juros compostos do benchmark. Está na interpretação de `patrimonioAtual / patrimonioBase` como rentabilidade quando houve alteração de capital, ou em um `baselineValue` incorreto no `localStorage`. O erro mais provável de indisponibilidade do Banco Central está na rede/proxy, e não na matemática das séries. O fallback impede que a interface quebre, mas troca dados oficiais por uma aproximação e deve ser identificado como tal em qualquer análise séria.
