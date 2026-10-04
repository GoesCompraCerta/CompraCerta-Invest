import React from 'react';
import LegalDocumentLayout from '../components/Common/LegalDocumentLayout';

const sectionClass = 'space-y-3';
const headingClass = 'text-lg font-black text-emerald-500';

export default function TermsOfUsePage({
  lang = 'pt',
  setLang = () => {},
  isDarkMode = true,
  setIsDarkMode = () => {},
  backHref = '/login'
}) {
  const pt = lang === 'pt';

  return (
    <LegalDocumentLayout
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      lang={lang}
      setLang={setLang}
    >
      <header className="space-y-3 border-b border-slate-500/20 pb-6">
        <a href={backHref} className="text-sm font-semibold text-emerald-500 hover:text-emerald-400">
          {pt ? 'Voltar ao sistema' : 'Back to the app'}
        </a>
        <h1 className="text-3xl font-black leading-tight">
          {pt ? 'Termos de Uso — CompraCerta-Invest' : 'Terms of Use — CompraCerta-Invest'}
        </h1>
        <p className="text-sm opacity-70">{pt ? 'Última atualização: Setembro de 2026.' : 'Last updated: September 2026.'}</p>
      </header>

      {pt ? (
        <>
          <section className={sectionClass}>
            <h2 className={headingClass}>1. Aceitação</h2>
            <p>Ao usar o CompraCerta-Invest, você concorda com estes Termos.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>2. Descrição do serviço</h2>
            <p>O CompraCerta-Invest é uma ferramenta de acompanhamento de investimentos. NÃO somos uma consultoria de investimentos. As informações e cálculos apresentados são de caráter educacional e não constituem recomendação de compra ou venda de ativos.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>3. Cadastro e conta</h2>
            <p>Para usar o serviço, você precisa criar uma conta com e-mail e senha.</p>
            <p>Você é responsável por:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Manter sua senha segura</li>
              <li>Fornecer informações precisas</li>
              <li>Usar o serviço de forma legal</li>
              <li>Não compartilhar sua conta com terceiros</li>
            </ul>
            <p>Você pode cancelar sua conta a qualquer momento através das configurações do sistema.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>4. Assinatura e pagamento</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Plano Gratuito (7 dias de trial)</li>
              <li>Plano PRO Mensal: R$ 19,99/mês</li>
              <li>Plano PRO Anual: R$ 191,88/ano</li>
              <li>O pagamento é processado pelo Mercado Pago.</li>
              <li>A assinatura é renovada automaticamente.</li>
              <li>Você pode cancelar a assinatura a qualquer momento através do painel do Mercado Pago.</li>
            </ul>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>5. Período de teste (trial)</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Novos usuários têm 7 dias de trial gratuito.</li>
              <li>Após o trial, o acesso é bloqueado a menos que você assine o plano PRO.</li>
              <li>O trial só pode ser usado uma vez por usuário.</li>
            </ul>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>6. Cancelamento</h2>
            <p><strong>Cancelamento da conta:</strong> Você pode cancelar sua conta a qualquer momento através das configurações do sistema. Ao cancelar, todos os seus dados serão excluídos permanentemente, conforme a LGPD.</p>
            <p><strong>Cancelamento da assinatura:</strong> A cobrança recorrente é processada pelo Mercado Pago. Para cancelar a assinatura, acesse o painel do Mercado Pago ou entre em contato com o suporte deles. O cancelamento da assinatura NÃO cancela automaticamente sua conta no CompraCerta-Invest.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>7. Reembolso</h2>
            <p>Reembolsos são processados pelo Mercado Pago, conforme a política deles. Para solicitar reembolso, entre em contato com o suporte do Mercado Pago.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>8. Limitação de responsabilidade</h2>
            <p>NÃO nos responsabilizamos por:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Decisões de investimento tomadas com base no sistema</li>
              <li>Perdas financeiras</li>
              <li>Interrupções do serviço</li>
              <li>Dados incorretos fornecidos por APIs externas</li>
            </ul>
            <p>O uso do sistema é por sua conta e risco.</p>
            <p><strong>8.1.</strong> O CompraCerta-Invest NÃO é uma consultoria de investimentos, NÃO faz recomendação de compra ou venda de ativos e NÃO é registrado na CVM (Comissão de Valores Mobiliários).</p>
            <p><strong>8.2.</strong> Os dados apresentados são de caráter EDUCACIONAL e INFORMATIVO. Investimentos envolvem RISCO, incluindo a possibilidade de perda total do capital.</p>
            <p><strong>8.3.</strong> A decisão final de investir é SEMPRE SUA. Consulte um profissional habilitado antes de tomar decisões financeiras.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>9. Propriedade intelectual</h2>
            <p>Todo o código, design e conteúdo do CompraCerta-Invest são de nossa propriedade.</p>
            <p>Você mantém a propriedade dos seus dados pessoais e financeiros inseridos no sistema.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>10. Privacidade</h2>
            <p>O tratamento dos seus dados é regido pela nossa Política de Privacidade. Consulte a <a className="font-semibold text-emerald-500" href="/privacy">Política de Privacidade</a> para mais detalhes.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>11. Alterações nos Termos</h2>
            <p>Podemos alterar estes Termos a qualquer momento. Recomendamos a verificação regular deste documento. O uso contínuo do serviço após alterações constitui aceitação dos novos Termos.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>12. Foro e contato</h2>
            <p>Estes Termos são regidos pelas leis brasileiras.</p>
            <p>Foro: Comarca de Cabo Frio/RJ.</p>
            <p>Contato: <a className="font-semibold text-emerald-500" href="mailto:goescompracerta@hotmail.com">goescompracerta@hotmail.com</a></p>
          </section>
        </>
      ) : (
        <>
          <section className={sectionClass}>
            <h2 className={headingClass}>1. Acceptance</h2>
            <p>By using CompraCerta-Invest, you agree to these Terms.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>2. Description of the service</h2>
            <p>CompraCerta-Invest is an investment tracking tool. We are NOT an investment advisory service. The information and calculations presented are educational and do not constitute a recommendation to buy or sell assets.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>3. Registration and account</h2>
            <p>To use the service, you must create an account with an email address and password.</p>
            <p>You are responsible for:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Keeping your password secure</li>
              <li>Providing accurate information</li>
              <li>Using the service lawfully</li>
              <li>Not sharing your account with third parties</li>
            </ul>
            <p>You may cancel your account at any time through the system settings.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>4. Subscription and payment</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Free Plan (7-day trial)</li>
              <li>Monthly PRO Plan: R$ 19.99/month</li>
              <li>Annual PRO Plan: R$ 191.88/year</li>
              <li>Payment is processed by Mercado Pago.</li>
              <li>The subscription renews automatically.</li>
              <li>You may cancel the subscription at any time through the Mercado Pago dashboard.</li>
            </ul>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>5. Trial period</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>New users receive a 7-day free trial.</li>
              <li>After the trial, access is blocked unless you subscribe to the PRO plan.</li>
              <li>The trial may only be used once per user.</li>
            </ul>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>6. Cancellation</h2>
            <p><strong>Account cancellation:</strong> You may cancel your account at any time through the system settings. Upon cancellation, all your data will be permanently deleted in accordance with the LGPD.</p>
            <p><strong>Subscription cancellation:</strong> Recurring billing is processed by Mercado Pago. To cancel your subscription, access the Mercado Pago dashboard or contact their support. Cancelling the subscription does NOT automatically cancel your CompraCerta-Invest account.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>7. Refunds</h2>
            <p>Refunds are processed by Mercado Pago according to their policy. To request a refund, contact Mercado Pago support.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>8. Limitation of liability</h2>
            <p>We are NOT responsible for:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Investment decisions made based on the system</li>
              <li>Financial losses</li>
              <li>Service interruptions</li>
              <li>Incorrect data provided by external APIs</li>
            </ul>
            <p>Use of the system is at your own risk.</p>
            <p><strong>8.1.</strong> CompraCerta-Invest is NOT an investment advisory service, does NOT recommend buying or selling assets, and is NOT registered with the CVM (Brazilian Securities and Exchange Commission).</p>
            <p><strong>8.2.</strong> The information presented is for EDUCATIONAL and INFORMATIONAL purposes. Investments involve RISK, including the possibility of losing all invested capital.</p>
            <p><strong>8.3.</strong> The final decision to invest is ALWAYS YOURS. Consult a qualified professional before making financial decisions.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>9. Intellectual property</h2>
            <p>All code, design, and content of CompraCerta-Invest are our property.</p>
            <p>You retain ownership of the personal and financial data you enter into the system.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>10. Privacy</h2>
            <p>The processing of your data is governed by our Privacy Policy. See the <a className="font-semibold text-emerald-500" href="/privacy">Privacy Policy</a> for more details.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>11. Changes to the Terms</h2>
            <p>We may change these Terms at any time. We recommend reviewing this document regularly. Continued use of the service after changes constitutes acceptance of the new Terms.</p>
          </section>
          <section className={sectionClass}>
            <h2 className={headingClass}>12. Jurisdiction and contact</h2>
            <p>These Terms are governed by Brazilian law.</p>
            <p>Jurisdiction: District of [your-city/state]</p>
            <p>Contact: <a className="font-semibold text-emerald-500" href="mailto:goescompracerta@hotmail.com">goescompracerta@hotmail.com</a></p>
          </section>
        </>
      )}
    </LegalDocumentLayout>
  );
}
