import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import env from '../../config/env';
import { TenantInfo } from '../municipalFiscalEngine';

@Injectable()
export class DiagnosticoService {
  private readonly logger = new Logger(DiagnosticoService.name);

  async gerarDiagnostico(summary: any, tenant: TenantInfo, ano: number = 2026, userPrompt?: string) {
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return {
        success: true,
        provedor: 'Motor Fiscal Heurístico Local (Fallback)',
        timestamp: new Date().toISOString(),
        diagnostico: `### Parecer Técnico Preliminar da Fazenda Municipal — ${tenant.nomePrefeitura} (Exercício ${ano})
* **Receita Corrente Líquida (RCL)**: Monitoramento contínuo em conformidade com a LRF (LC 101/2000).
* **Despesa Total com Pessoal (DTP)**: Monitoramento rigoroso dos limites de alerta (48,60%), prudencial (51,30%) e legal (54,00%).
* **Educação (MDE) & Saúde (ASPS)**: Aderência aos pisos de 25% e 15% calculados sobre a arrecadação de impostos.
* **Nota Técnica**: Para análises preditivas generativas ao vivo com Gemini 2.5 Flash, configure a chave \`GEMINI_API_KEY\` no arquivo .env.`,
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é um Auditor Fiscal Chefe e Especialista em Contabilidade Pública Brasileira e LRF (Lei de Responsabilidade Fiscal).
Elabore um parecer executivo e analítico detalhado para o Prefeito e Secretário de Finanças da ${tenant.nomePrefeitura} (${tenant.uf}) - Código IBGE: ${tenant.codigoIbge} para o exercício de ${ano}.

Dados Contábeis e Fiscais Oficiais (Siconfi / Tesouro Nacional):
${JSON.stringify(summary, null, 2)}

${userPrompt ? `Pergunta específica do gestor: "${userPrompt}"` : ''}

Diretrizes de resposta obrigatórias:
1. Resumo Executivo da Saúde Financeira do Município.
2. Análise da Receita (Arrecadação própria vs Transferências Constitucionais).
3. Pessoal e Limites LRF (DTP vs RCL): Avalie se está abaixo do Alerta (48,6%), Prudencial (51,3%) ou Legal (54%).
4. Aplicação Obrigatória em Educação (Mínimo 25%) e Saúde (Mínimo 15%).
5. Recomendações Estratégicas e Medidas Preventivas para os próximos trimestres.

Use formatação Markdown profissional com títulos, listas e ênfase em dados numéricos em R$. Seja direto, objetivo e rigoroso tecnicamente.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return {
        success: true,
        provedor: 'Google Gemini 2.5 Flash (Oficial)',
        timestamp: new Date().toISOString(),
        diagnostico: response.text,
      };
    } catch (err: any) {
      this.logger.error('Erro ao chamar API do Gemini:', err);
      return {
        success: false,
        error: err.message,
        provedor: 'Fallback Local',
        timestamp: new Date().toISOString(),
        diagnostico: `### Parecer Fiscal de Contingência — ${tenant.nomePrefeitura}
Houve uma indisponibilidade temporária na comunicação com a API Gemini (${err.message}).
Os indicadores fiscais continuam operando normalmente via motor contábil local.`,
      };
    }
  }
}
