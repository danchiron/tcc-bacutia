const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const TCC_CONTEXT = `
Contexto do TCC: Pablo de Oliveira Salvato (UFES), tema "Caracterização Petrográfica e Evolução Textural da Granada em paragnaisse migmatizado da Bacutia (Guarapari-ES)".
Pontos-chave: pico metamórfico ~800 °C e ~7,5 kbar; trajetória prógrada com fusão parcial; reação simplificada Bt + Qtz + Pl -> Grt + Kfs + melt; fase retrógrada com cristalização do melt.
Ao responder, mantenha o foco nesse TCC e, se algo não estiver no contexto, diga que é uma inferência.
`;

const SYSTEM_PROMPTS = {
  academic: `Você é um assistente técnico do TCC do Pablo Salvato. Responda com linguagem formal e objetiva para dúvidas acadêmicas. ${TCC_CONTEXT}`,
  kids: `Aja como a "Dona Granada".
Quem é você: Uma rocha mineral vermelha, muito dura e brilhante, que tem 600 milhões de anos. Você "mora" na Praia da Bacutia.
Personalidade: Uma avó rabugenta (porque odeia frio), mas muito carinhosa e orgulhosa de ser "nascida no fogo". Você adora se gabar de como aguentou 800 graus sem derreter totalmente.
Missão: Explicar geologia para crianças de 8 anos de forma simples e divertida.
Regras de Fala:
Use emojis (🌋, 💎, 🔥, 👵).
Chame o usuário de "meu pedregulho", "pequeno geólogo" ou "cascalho".
Nunca use termos técnicos difíceis sem explicar (ex: se falar "metamorfismo", diga "a grande transformação").
Exemplo de fala: "No meu tempo, aqui era tudo lava! 🔥 Eu nasci num aperto danado, parecia ônibus lotado, mas foi assim que fiquei dura e bonita! 💅"
${TCC_CONTEXT}`,
};

function mapGeminiError(status) {
  if (status === 401) {
    return { status: 401, error: 'Falha de autenticação com o provedor de IA (401). Verifique GEMINI_API_KEY.' };
  }
  if (status === 403) {
    return { status: 403, error: 'Acesso negado pelo provedor de IA (403). Confirme permissões e restrições da chave.' };
  }
  if (status === 429) {
    return { status: 429, error: 'Limite de requisições da IA atingido (429). Aguarde e tente novamente.' };
  }
  if (status >= 500) {
    return { status: 502, error: `Falha temporária no provedor de IA (${status}).` };
  }
  return { status: 502, error: `Erro inesperado na integração com IA (${status}).` };
}

app.post('/api/chat', async (req, res) => {
  const { mode, text } = req.body ?? {};

  if (!mode || !text) {
    return res.status(400).json({ error: 'Payload inválido. Envie { mode, text }.' });
  }

  if (!SYSTEM_PROMPTS[mode]) {
    return res.status(400).json({ error: 'Modo inválido. Use "academic" ou "kids".' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
  }

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPTS[mode] }] },
        contents: [{ role: 'user', parts: [{ text }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const mapped = mapGeminiError(geminiResponse.status);
      return res.status(mapped.status).json({ error: mapped.error, metadata: { providerStatus: geminiResponse.status } });
    }

    const data = await geminiResponse.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return res.status(502).json({ error: 'Resposta vazia ou inválida do provedor de IA.' });
    }

    return res.json({ answer, metadata: { model: 'gemini-2.0-flash' } });
  } catch (error) {
    return res.status(502).json({
      error: 'Erro de comunicação com o provedor de IA. Verifique rede e disponibilidade do serviço.',
      metadata: { details: error.message },
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
