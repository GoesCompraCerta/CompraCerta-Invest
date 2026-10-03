import React from 'react';
import LegalDocumentLayout from '../components/Common/LegalDocumentLayout';

const sectionClass = 'space-y-3';
const headingClass = 'text-lg font-black text-emerald-500';

export default function PrivacyPolicyPage({
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
          {pt ? 'Política de Privacidade — CompraCerta-Invest' : 'Privacy Policy — CompraCerta-Invest'}
        </h1>
        <p className="text-sm opacity-70">{pt ? 'Última atualização: Setembro de 2026.' : 'Last updated: September 2026.'}</p>
      </header>

      {pt ? (
        <>
          <p>O CompraCerta-Invest ("Plataforma", "nós" ou "nosso") valoriza a sua privacidade e o rigor na proteção dos seus dados pessoais. Esta Política de Privacidade descreve de forma transparente como coletamos, usamos, armazenamos e protegemos as suas informações, em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>
          <p>Ao utilizar o nosso aplicativo web e os módulos associados (Quarteto Fantástico, Três Mosqueteiros, Simulador e Rebalanceador), você concorda com as práticas descritas neste documento.</p>

          <section className={sectionClass}>
            <h2 className={headingClass}>1. Dados Coletados e Finalidade</h2>
            <p>Para o funcionamento adequado da plataforma e entrega da análise quantitativa de ativos (Ações, FIIs, ETFs e Criptoativos), podemos coletar os seguintes tipos de dados:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Dados de Cadastro e Autenticação:</strong> Caso utilize áreas logadas, coletamos seu e-mail e credenciais de acesso para gerenciar a sua conta e o período de acesso/testes (trial).</li>
              <li><strong>Dados de Navegação e Uso:</strong> Informações técnicas coletadas automaticamente (como endereço IP, tipo de navegador, logs de acesso e interações com a interface) para garantir a segurança da infraestrutura, prevenir fraudes e otimizar a performance do backend.</li>
              <li><strong>Dados Financeiros Inseridos pelo Usuário:</strong> Os ativos simulados, listas de favoritos ou configurações de carteira inseridos por você são processados para gerar os cálculos quantitativos, respeitando a privacidade das suas estratégias de investimento.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>2. Base Legal para o Tratamento de Dados (LGPD)</h2>
            <p>O tratamento dos seus dados pessoais pelo CompraCerta-Invest fundamenta-se nas seguintes hipóteses previstas pela LGPD:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Execução de Contrato:</strong> Para prover o acesso às ferramentas de triagem e funcionalidades do sistema contratadas ou solicitadas por você.</li>
              <li><strong>Legítimo Interesse:</strong> Para garantir a segurança da aplicação, melhoria contínua dos algoritmos quantitativos e estabilidade do backend.</li>
              <li><strong>Consentimento:</strong> Quando aplicável, mediante manifestação livre e expressa para o envio de comunicações ou processamento de dados específicos.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>3. Compartilhamento de Dados com Terceiros</h2>
            <p>O CompraCerta-Invest não comercializa dados pessoais de usuários. O compartilhamento ocorre estritamente nos seguintes cenários:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Provedores de Infraestrutura e APIs Externas:</strong> Para a obtenção de dados de cotação e mercado em tempo real (como cotações da B3 e mercados globais), o backend realiza requisições a provedores de dados oficiais e seguros, sem o envio de dados identificáveis de usuários para esses terceiros.</li>
              <li><strong>Obrigações Legais:</strong> Caso seja exigido por ordem judicial ou autoridade competente.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>4. Armazenamento e Segurança da Informação</h2>
            <p>Adotamos medidas técnicas, administrativas e de segurança da informação compatíveis com os padrões de mercado para proteger os seus dados contra acessos não autorizados, perda, alteração ou destruição.</p>
            <p>As chamadas de API e o tráfego de dados sensíveis passam por camadas de segurança em nosso backend centralizado.</p>
            <p>Os dados são armazenados pelo tempo necessário para cumprir as finalidades descritas nesta política, respeitando os prazos legais aplicáveis.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>5. Os Seus Direitos como Titular dos Dados (Art. 18 da LGPD)</h2>
            <p>Você, na qualidade de titular de dados, possui os seguintes direitos garantidos por lei:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Confirmação e Acesso:</strong> Saber se tratamos seus dados e solicitar cópia deles.</li>
              <li><strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
              <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> Aplicável a dados desnecessários ou tratados em desconformidade com a LGPD.</li>
              <li><strong>Portabilidade:</strong> Requisitar a transferência dos seus dados para outro fornecedor de serviço, quando aplicável. Como o CompraCerta-Invest é uma ferramenta de acompanhamento, a portabilidade pode ser exercida pelo download dos seus dados em formato JSON, disponível nas configurações do sistema.</li>
              <li><strong>Revogação do Consentimento:</strong> Retirar a autorização para o tratamento de dados a qualquer momento.</li>
            </ul>
            <p>Para exercer qualquer um desses direitos, entre em contato conosco através do e-mail: <a className="font-semibold text-emerald-500" href="mailto:goescompracerta@hotmail.com">goescompracerta@hotmail.com</a></p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>6. Alterações nesta Política de Privacidade</h2>
            <p>Reservamo-nos o direito de atualizar esta Política de Privacidade periodicamente para refletir melhorias tecnológicas ou exigências legais. Recomendamos a verificação regular deste documento.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>7. Cookies e Tecnologias Similares</h2>
            <p>Utilizamos cookies e armazenamento local (localStorage) para:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Manter sua sessão ativa (token JWT)</li>
              <li>Guardar suas preferências (tema, idioma)</li>
              <li>Guardar suas chaves de API (brapi, CoinGecko)</li>
            </ul>
            <p>Você pode desativar os cookies no seu navegador, mas isso pode afetar o funcionamento do sistema.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>8. Encarregado de Proteção de Dados (DPO)</h2>
            <p>O Encarregado de Proteção de Dados (DPO) do CompraCerta-Invest é:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Nome: Alexander Jorge Alves Ferreira Goes</li>
              <li>E-mail: <a className="font-semibold text-emerald-500" href="mailto:goescompracerta@hotmail.com">goescompracerta@hotmail.com</a></li>
            </ul>
          </section>
        </>
      ) : (
        <>
          <p>CompraCerta-Invest ("Platform", "we", or "our") values your privacy and is committed to protecting your personal data. This Privacy Policy transparently describes how we collect, use, store, and protect your information in accordance with Brazil's General Data Protection Law (LGPD - Law No. 13,709/2018).</p>
          <p>By using our web application and associated modules (Fantastic Four, Three Musketeers, Simulator, and Rebalancer), you agree to the practices described in this document.</p>

          <section className={sectionClass}>
            <h2 className={headingClass}>1. Data Collected and Purposes</h2>
            <p>To operate the platform and provide quantitative analysis of assets (stocks, real estate funds, ETFs, and crypto assets), we may collect the following types of data:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Registration and Authentication Data:</strong> If you use authenticated areas, we collect your email and login credentials to manage your account and trial period.</li>
              <li><strong>Browsing and Usage Data:</strong> Technical information collected automatically (such as IP address, browser type, access logs, and interface interactions) to secure our infrastructure, prevent fraud, and improve backend performance.</li>
              <li><strong>Financial Data You Enter:</strong> Simulated assets, watchlists, and portfolio settings are processed to generate quantitative calculations while respecting the privacy of your investment strategies.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>2. Legal Bases for Processing (LGPD)</h2>
            <p>CompraCerta-Invest processes your personal data under the following legal bases provided by the LGPD:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Performance of a Contract:</strong> To provide access to screening tools and system features you requested or subscribed to.</li>
              <li><strong>Legitimate Interest:</strong> To secure the application, continuously improve quantitative algorithms, and maintain backend stability.</li>
              <li><strong>Consent:</strong> Where applicable, based on your freely given and explicit consent to receive communications or for specific data processing.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>3. Sharing Data with Third Parties</h2>
            <p>CompraCerta-Invest does not sell users' personal data. Sharing occurs strictly in these circumstances:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Infrastructure Providers and External APIs:</strong> To obtain real-time market quotes (including B3 and global markets), the backend requests information from trusted data providers without sending identifiable user data to them.</li>
              <li><strong>Legal Obligations:</strong> When required by a court order or competent authority.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>4. Data Storage and Information Security</h2>
            <p>We adopt technical, administrative, and information-security measures consistent with market standards to protect your data against unauthorized access, loss, alteration, or destruction.</p>
            <p>API calls and sensitive data traffic pass through security layers in our centralized backend.</p>
            <p>Data is stored for as long as necessary to fulfill the purposes described in this policy, subject to applicable legal retention periods.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>5. Your Rights as a Data Subject (LGPD Article 18)</h2>
            <p>As a data subject, you have the following rights under the law:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Confirmation and Access:</strong> Ask whether we process your data and request a copy.</li>
              <li><strong>Correction:</strong> Request correction of incomplete, inaccurate, or outdated data.</li>
              <li><strong>Anonymization, Blocking, or Deletion:</strong> For unnecessary data or data processed in violation of the LGPD.</li>
              <li><strong>Portability:</strong> Request the transfer of your data to another service provider, where applicable. As CompraCerta-Invest is a tracking tool, portability may be exercised by downloading your data in JSON format, available in the system settings.</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent to data processing at any time.</li>
            </ul>
            <p>To exercise any of these rights, contact us at: <a className="font-semibold text-emerald-500" href="mailto:goescompracerta@hotmail.com">goescompracerta@hotmail.com</a></p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>6. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy periodically to reflect technology improvements or legal requirements. We recommend reviewing this document regularly.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>7. Cookies and Similar Technologies</h2>
            <p>We use cookies and local storage (localStorage) to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Keep your session active (JWT token)</li>
              <li>Store your preferences (theme and language)</li>
              <li>Store your API keys (brapi, CoinGecko)</li>
            </ul>
            <p>You may disable cookies in your browser, but this may affect how the system works.</p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>8. Data Protection Officer (DPO)</h2>
            <p>The CompraCerta-Invest Data Protection Officer (DPO) is:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Name: Alexander Jorge Alves Ferreira Goes</li>
              <li>Email: <a className="font-semibold text-emerald-500" href="mailto:goescompracerta@hotmail.com">goescompracerta@hotmail.com</a></li>
            </ul>
          </section>
        </>
      )}
    </LegalDocumentLayout>
  );
}
