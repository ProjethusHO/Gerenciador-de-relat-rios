import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
// Fix: Added TeamMember to the import from '../types' to resolve the 'Cannot find name' error.
import { Report, ReportContent, TeamMember } from '../types';

// Ensure the API key is available in the environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Helper to safely parse the report content string
const parseReportContent = (content: string): Partial<ReportContent> => {
  try {
    const parsed = JSON.parse(content);
    return typeof parsed === 'object' ? parsed : { relatorio: content };
  } catch (e) {
    return { relatorio: content }; // Fallback for legacy or non-JSON content
  }
};


export const generateReportDraft = async (title: string, authorName: string): Promise<string> => {
  if (!API_KEY) {
    return Promise.reject(new Error("API Key for Gemini is not configured."));
  }

  try {
    const prompt = `
      Você é um assistente especialista em documentação formal.
      Gere um rascunho de conteúdo para um relatório de processo interno, baseado no título do processo.
      O relatório é sobre: "${title}".
      O relator é: ${authorName}.
      Preencha os campos "assunto", "interessado", "ementa", "relatorio" e "parecer" com conteúdo formal, plausível e profissional.
      O campo "relatorio" deve ser o mais detalhado. O campo "ementa" deve ser um resumo curto.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 1,
        topK: 32,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assunto: { type: Type.STRING, description: "O assunto principal do relatório." },
            interessado: { type: Type.STRING, description: "A parte ou departamento interessado no processo." },
            ementa: { type: Type.STRING, description: "Um resumo conciso do conteúdo e da conclusão do relatório." },
            relatorio: { type: Type.STRING, description: "O corpo detalhado do relatório, descrevendo fatos, análises e contexto." },
            parecer: { type: Type.STRING, description: "A conclusão ou recomendação final do relator." },
          },
          required: ['assunto', 'interessado', 'ementa', 'relatorio', 'parecer'],
        },
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating draft with Gemini:", error);
    throw new Error("Falha ao gerar o rascunho. Por favor, tente novamente.");
  }
};

export const generateReportSummary = async (report: Report, teamMembers: string): Promise<string> => {
  if (!API_KEY) {
    return Promise.reject(new Error("API Key for Gemini is not configured."));
  }

  try {
    const content = parseReportContent(report.content);
    const commentsText = report.comments.map(c => `- ${c.text}`).join('\n');

    const prompt = `
      Você é um assistente de gestão de projetos. Sua tarefa é gerar um resumo conciso e informativo de um relatório concluído.
      
      Use as seguintes informações:
      - Título do Processo: ${report.title}
      - Ementa: ${content.ementa || 'Não fornecida.'}
      - Parecer Final: ${content.parecer || 'Não fornecido.'}
      - Conteúdo Principal: ${content.relatorio || 'Não fornecido.'}
      - Principais Discussões (comentários):
      ${commentsText || 'Nenhuma discussão registrada.'}
      - Membros Envolvidos: ${teamMembers}
      - Status Final: ${report.status}

      O resumo deve destacar:
      1. O objetivo principal do relatório.
      2. As principais conclusões ou resultados alcançados, com base na ementa e parecer.
      3. Quaisquer pontos de discussão ou desafios significativos que surgiram durante o processo.
      4. O resultado final e os próximos passos, se houver.

      Seja objetivo, profissional e estruture o resumo em parágrafos claros. O resumo será usado como um registro histórico oficial.
    `;
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;

  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    throw new Error("Falha ao gerar o resumo do relatório. Por favor, tente novamente.");
  }
};


export const extractMembersFromPdf = async (pdfBase64: string): Promise<{name: string, role: string}[]> => {
  if (!API_KEY) {
    return Promise.reject(new Error("API Key for Gemini is not configured."));
  }
  
  try {
    const prompt = `Analise este documento de convocação em PDF e extraia uma lista de novos membros da equipe. Para cada membro, identifique o nome completo e o cargo. Retorne os dados como um array de objetos JSON, cada um com as chaves "name" e "role". Se o documento não contiver essas informações, retorne um array vazio.`;
    
    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, pdfPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'O nome completo do membro da equipe.',
              },
              role: {
                type: Type.STRING,
                description: 'O cargo do membro da equipe.',
              },
            },
            required: ['name', 'role'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const suggestions = JSON.parse(jsonText);
    return suggestions;
    
  } catch (error) {
    console.error("Error extracting members from PDF with Gemini:", error);
    throw new Error("Falha ao extrair membros do PDF. Verifique o arquivo e tente novamente.");
  }
};

export const getAISuggestion = async (text: string): Promise<{ type: 'correction' | 'continuation' | 'none'; textForDisplay?: string; textForReplacement?: string; originalText?: string } | null> => {
    if (!API_KEY) return Promise.reject(new Error("API Key not configured."));

    const context = text.slice(-250).replace(/<[^>]*>/g, ' '); // Get context, strip HTML
    if (context.trim().length < 20) return null;

    const prompt = `
        Sua tarefa é atuar como um assistente de redação visual e interativo. Analise o final do texto HTML fornecido, ignorando as tags HTML para a análise de conteúdo.

        1.  **Primeiro, determine se o texto termina com uma frase completa.** Uma frase completa termina com pontuação final ('.', '?', '!') e faz sentido gramaticalmente.
        2.  **Se NÃO terminar com uma frase completa**, você não deve fornecer uma sugestão. Responda com o JSON: \`{ "type": "none" }\`.
        3.  **Se terminar com uma frase completa:**
            a. **Verifique se há erros gramaticais ou de digitação na última frase.** Se encontrar um erro claro, sua ação é "correction".
            b. **Se a última frase estiver gramaticalmente correta**, sua ação é "continuation".

        **Formato de Saída (JSON Estruturado):**

        -   **Para "correction":**
            1.  \`"type": "correction"\`
            2.  \`"originalText"\`: O fragmento HTML original da frase que contém o erro.
            3.  \`"textForReplacement"\`: O fragmento HTML final e corrigido que substituirá o original.
            4.  \`"textForDisplay"\`: Um HTML de "diff" que mostra as alterações. Use \`<del style="color:red; text-decoration:line-through;">texto removido</del>\` para remoções e \`<ins style="color:blue; text-decoration:none;">texto adicionado</ins>\` para adições.

            *Exemplo de "correction":*
            \`{
              "type": "correction",
              "originalText": "<p>O relatorio está incorreto.</p>",
              "textForReplacement": "<p>O relatório está incorreto.</p>",
              "textForDisplay": "<p>O rela<del style=\\"color:red; text-decoration:line-through;\\">torio</del><ins style=\\"color:blue; text-decoration:none;\\">tório</ins> está incorreto.</p>"
            }\`

        -   **Para "continuation":**
            1.  \`"type": "continuation"\`
            2.  \`"textForReplacement"\`: O novo parágrafo HTML a ser adicionado.
            3.  \`"textForDisplay"\`: O mesmo que o "textForReplacement", mas envolto em tags \`<ins style="color:blue; text-decoration:none;">\` e \`</ins>\`.

            *Exemplo de "continuation":*
            \`{
              "type": "continuation",
              "textForReplacement": "<p>Diante do exposto, recomenda-se o arquivamento do processo.</p>",
              "textForDisplay": "<ins style=\\"color:blue; text-decoration:none;\\"><p>Diante do exposto, recomenda-se o arquivamento do processo.</p></ins>"
            }\`

        -   **Para "none":**
            \`{ "type": "none" }\`

        **Texto para análise:**
        "${context}"
    `;


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, description: 'Deve ser "correction", "continuation", ou "none"' },
                        textForDisplay: { type: Type.STRING, description: "Opcional. HTML com diff visual para exibição." },
                        textForReplacement: { type: Type.STRING, description: "Opcional. HTML final e limpo para substituição/adição." },
                        originalText: { type: Type.STRING, description: "Opcional. O texto HTML original a ser substituído na correção." }
                    },
                    required: ['type']
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error getting AI suggestion:", error);
        return null;
    }
};

export const generateTextContinuation = async (text: string): Promise<string> => {
    if (!API_KEY) return Promise.reject(new Error("API Key not configured."));
    const context = text.slice(-500).replace(/<[^>]*>/g, ' '); // Get context, strip HTML
    
    const prompt = `
        Você é um assistente de redação formal. Continue o seguinte texto de forma coesa e profissional, 
        gerando um novo parágrafo de conteúdo relevante em HTML (começando com a tag <p> e terminando com </p>).
        
        Texto para continuar:
        "${context}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Ensure a text response
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text continuation:", error);
        throw new Error("Falha ao gerar continuação do texto.");
    }
};


export const generateParecerInsights = async (report: Report, allUsers: TeamMember[]): Promise<string> => {
    if (!API_KEY) return Promise.reject(new Error("API Key for Gemini is not configured."));
    try {
        const content = parseReportContent(report.content);
        
        const commentsText = report.comments.map(c => {
            const author = allUsers.find(u => u.id === c.authorId)?.name || 'Desconhecido';
            return `- ${author}: "${c.text}"`;
        }).join('\n');

        const attachmentsText = report.attachments.map(a => `- ${a.name}`).join('\n');
        const reportAuthor = allUsers.find(u => u.id === report.authorId)?.name || 'Não especificado';
        const reportCreationDate = report.startedAt ? new Date(report.startedAt).toLocaleDateString('pt-BR') : 'Não iniciada';

        const prompt = `
# Decomposição e Especialização de Tarefa

**Objetivo Central:** Avaliação de Conformidade e Proposição de Melhorias para o parecer do relator.

**Contexto do Processo para Análise:**
- **Título do Processo:** ${report.title}
- **Autor do Relatório:** ${reportAuthor}
- **Data de Início:** ${reportCreationDate}
- **Ementa:** ${content.ementa || 'Não preenchida.'}
- **Relatório Principal:**
${(content.relatorio || 'Não preenchido.').replace(/<[^>]*>/g, ' ')}
- **Parecer do Relator (Atual):**
${(content.parecer || 'Ainda não redigido.').replace(/<[^>]*>/g, ' ')}
- **Discussões (Comentários):**
${commentsText || 'Nenhuma.'}
- **Documentos Anexados (Nomes):**
${attachmentsText || 'Nenhum.'}

---

**Instruções de Execução (Decomposição em Sub-tarefas e Roteamento):**

**Sub-tarefa 1: Extração de Fatos (Agente de Contexto/Análise de Dados):**
*   Analise minuciosamente todo o contexto do processo fornecido acima (Context Awareness).
*   Extraia e apresente de forma estruturada (em tópicos) todos os fatos relevantes e, mais importante, quaisquer inconsistências fáticas (contradições entre o relatório, comentários, anexos e o parecer) que possam invalidar as conclusões presentes no parecer do relator.

**Sub-tarefa 2: Avaliação de Conformidade Legal (Agente de Políticas/Especialista em Direito):**
*   Utilizando o resultado da Sub-tarefa 1, avalie o parecer do relator e as falhas documentais encontradas, especificamente à luz das boas práticas e políticas do direito administrativo brasileiro.
*   Especifique as falhas de conformidade legal (Policy Compliance), indicando os princípios ou regulamentos administrativos que foram violados ou negligenciados.

**Refinamento Colaborativo e Síntese (Clustering/Merge):**
*   Cruze as descobertas da Extração de Fatos e da Avaliação de Conformidade Legal.
*   Gere um briefing conciso e de alta precisão (Accuracy e Completeness), estruturado nos seguintes pontos:

---

**Formato de Saída (Briefing Executivo):**

**I. SÍNTESE DAS FALHAS:**
*   **Falhas Fatuais (Documentação):**
    *   [Liste aqui as inconsistências encontradas nos documentos e fatos.]
*   **Falhas Legais (Direito Administrativo Brasileiro):**
    *   [Liste aqui as violações de princípios ou regulamentos administrativos.]

**II. SUGESTÕES DE MELHORIAS:**
*   [Proponha sugestões detalhadas e acionáveis para corrigir o relatório e os procedimentos futuros, garantindo a adesão rigorosa às boas práticas administrativas.]
`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating parecer insights:", error);
        throw new Error("Falha ao gerar insights para o parecer.");
    }
};