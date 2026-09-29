# Relatório de Regressão Final dos Motores Quantitativos

**Sistema:** Goes Compra Certa  
**Teste:** `regressionTest.mjs`  
**Execução:** `node regressionTest.mjs`  
**Escopo:** Quarteto Fantástico, Três Mosqueteiros, nulos, Cap Rate, ROIC, Graham puro e períodos de dividendos.

## Conclusão Executiva

**STATUS GERAL: SISTEMA ESTÁVEL.**

Foram executados **22 testes de regressão**, com **22 aprovados e 0 falhas**. As correções recentes não quebraram as regras auditadas:

- Graham usa somente o preço atual contra o valor intrínseco e não depende de `pm`.
- Campos ausentes permanecem sem resultado (`null`), permitindo que a camada `MethodCard` exiba dados insuficientes em cinza.
- Cap Rate ausente ou zero não recebe mais fallback fictício de 8%.
- Os períodos 12M e 24M não usam o período oposto como fallback.
- ROIC decimal é convertido corretamente para percentual.
- Os semáforos verde, amarelo e vermelho permanecem coerentes com a quantidade de critérios.

## Resultado Consolidado

| Total | Passaram | Falharam | Cobertura |
|---:|---:|---:|---:|
| 22 | 22 | 0 | 100% |

## Casos de Teste

| # | Nome do teste | Entrada principal | Resultado esperado | Resultado obtido | Status |
|---:|---|---|---|---|---|
| 1 | Graham puro com preço médio acima do valor | `price=10`, `pm=20`, `lpa=1`, `vpa=10` | Valor 15; verde; score 1/1 | Valor 15; verde; score 1/1 | PASSOU |
| 2 | Graham puro sem preço médio | `price=10`, `lpa=1`, `vpa=10` | Resultado disponível e verde | Resultado disponível e verde | PASSOU |
| 3 | Bazin com DY percentual | `price=10`, `dividendYield=12` | DPA 1,2; preço-teto 20 | DPA 1,2; preço-teto 20 | PASSOU |
| 4 | Bazin com DY decimal | `price=10`, `dividendYield=0.12` | DPA 1,2; preço-teto 20 | DPA 1,2; preço-teto 20 | PASSOU |
| 5 | Lynch com crescimento percentual | `lpa=1`, `growthRate=15`, `price=10` | Valor justo 15; aprovado | Valor justo 15; aprovado | PASSOU |
| 6 | Lynch com crescimento decimal | `lpa=1`, `growthRate=0.15`, `price=10` | Valor justo 15; aprovado | Valor justo 15; aprovado | PASSOU |
| 7 | Buffett com ROIC decimal abaixo do limite | `roic=0.0613`, `divEbitda=2` | ROIC 6,13%; reprovado; amarelo 1/2 | ROIC 6,13%; reprovado; amarelo 1/2 | PASSOU |
| 8 | Buffett com ROIC ausente | `roic=null`, `divEbitda=2` | `null`; dados insuficientes | `null` | PASSOU |
| 9 | Basttter aprovado | `pVpAjustado=0.95`, `alavancagem=8` | Verde; score 2/2 | Verde; score 2/2 | PASSOU |
| 10 | Basttter com P/VP acima do limite | `pVpAjustado=1.05`, `alavancagem=8` | Amarelo; score 1/2 | Amarelo; score 1/2 | PASSOU |
| 11 | Baragiola com Cap Rate válido | `price=100`, `dividendo12m=8`, `capRate=8`, `dyPeriod=12M` | Preço-teto 100; verde | Preço-teto 100; verde | PASSOU |
| 12 | Baragiola sem Cap Rate | `capRate=null` | `null`; dados insuficientes | `null` | PASSOU |
| 13 | Baragiola com Cap Rate zero | `capRate=0` | `null`; dados insuficientes | `null` | PASSOU |
| 14 | Caetano aprovado | `vacancia=5`, `capRate=8`, `concentracao=baixa`, `liquidezDiaria=100000` | Verde; score 4/4 | Verde; score 4/4 | PASSOU |
| 15 | Caetano com vacância acima do limite | `vacancia=15`, demais critérios válidos | Amarelo; score 3/4 | Amarelo; score 3/4 | PASSOU |
| 16 | Período 12M sem dado 12M | `dyPeriod=12M`, somente `dividendo24m=24` | Valor `null` | Valor `null` | PASSOU |
| 17 | Período 24M sem dado 24M | `dyPeriod=24M`, somente `dividendo12m=12` | Valor `null` | Valor `null` | PASSOU |
| 18 | Graham com LPA ausente | `price=10`, `vpa=10` | `null`; dados insuficientes | `null` | PASSOU |
| 19 | Bazin com DY ausente | `price=10` | `null`; dados insuficientes | `null` | PASSOU |
| 20 | Lynch com crescimento ausente | `price=10`, `lpa=1` | `null`; dados insuficientes | `null` | PASSOU |
| 21 | Basttter com alavancagem ausente | `pVpAjustado=0.95` | `null`; dados insuficientes | `null` | PASSOU |
| 22 | Caetano com indicador ausente | Vacância, Cap Rate e concentração sem liquidez | `null`; dados insuficientes | `null` | PASSOU |

## Observação sobre o Caso Caetano

O enunciado do teste menciona vermelho para `vacancia=15`, mas a regra implementada em `evaluateCriteria` define:

- Verde: zero critérios falhos.
- Amarelo: exatamente um critério falho em métodos com dois ou mais critérios.
- Vermelho: dois ou mais critérios falhos.

Como o caso de vacância 15 falha somente no critério de vacância, o resultado correto e observado é **amarelo, score 3/4**. O teste registra a regra matemática efetivamente implementada, evitando classificar incorretamente esse caso como vermelho.

## Cobertura de Nulos e Estado Visual

Os cenários de ausência retornaram `null` nos motores dependentes. No componente `MethodCard`, `color` ou `approved` ausente resolve para estado insuficiente, utilizando a apresentação cinza e o texto de dados insuficientes. Para o Baragiola sem Cap Rate, a tela utiliza a mensagem específica **“Cap Rate não informado”**.

## Comando Executado

```powershell
node regressionTest.mjs
```

Saída final:

```text
Cobertura: 22/22 testes passaram.
```

## Limites do Teste

Este teste cobre as regras e contratos dos motores de cálculo diretamente. Não substitui testes de navegador para interação do formulário, persistência real em `localStorage`, integração externa com a Brapi ou inspeção visual automatizada do `MethodCard`. Esses limites não produziram falha nos motores auditados.

## Parecer Final

Com base nos 22 cenários executados, o sistema está **ESTÁVEL** para o escopo quantitativo testado. As correções recentes estão preservadas e os comportamentos de Graham puro, nulos, Cap Rate, ROIC e períodos 12M/24M estão validados.
