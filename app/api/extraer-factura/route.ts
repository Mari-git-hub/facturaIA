import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    // Descargar imagen desde Supabase
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            },
            {
              type: 'text',
              text: `Analiza esta imagen de factura y responde SOLO con un JSON puro sin markdown ni explicaciones:
{
  "proveedor": "nombre de la empresa o tienda",
  "fecha": "fecha en formato YYYY-MM-DD",
  "monto": número total sin símbolos,
  "categoria": "una de estas opciones exactas: Alimentación, Transporte, Combustible, Servicios, Compras de Oficina, Salud, Otros"
}
Si no encuentras un dato usa null.`
            }
          ]
        }
      ]
    });

    const text = response.choices[0].message.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const datos = JSON.parse(clean);

    return NextResponse.json({ success: true, datos });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}