export type OpenAIModel =
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'o1'
  | 'o1-mini'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo';

interface GenerateAnnouncementHtmlRequest {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  type: 'system' | 'welfare' | 'training' | 'general';
  start_date?: string;
  end_date?: string;
  youtube_embed_url?: string;
  model?: OpenAIModel;
}

export const generateAnnouncementHtmlWithAI = async (
  data: GenerateAnnouncementHtmlRequest
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const priorityLabels = {
    high: 'สำคัญมาก',
    medium: 'ปานกลาง',
    low: 'ทั่วไป'
  };

  const typeLabels = {
    system: 'ระบบ',
    welfare: 'สวัสดิการ',
    training: 'การอบรม',
    general: 'ทั่วไป'
  };

  const prompt = `สร้างไฟล์ HTML สวยงามสำหรับประกาศดังนี้:

หัวข้อ: ${data.title}
เนื้อหา: ${data.content}

กรุณาสร้าง HTML ที่:
1. มีการออกแบบที่สวยงาม ทันสมัย และเป็นมืออาชีพ
2. ใช้ gradient สีสันสดใส
3. มี animation เยอะๆ
4. รองรับ responsive design
5. ใช้ฟอนต์ที่เหมาะกับภาษาไทย (Sarabun หรือ Prompt)
9. ใช้ CSS ที่ทันสมัย 
10. เพิ่มเอฟเฟกต์พิเศษที่อลังการ

ส่งคืนเฉพาะโค้ด HTML เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม`;

  try {
    const selectedModel = data.model || 'gpt-4o-mini';

    // ตรวจสอบประเภทของ model
    const isO1Model = selectedModel.startsWith('o1');
    const isGPT5Model = selectedModel.startsWith('gpt-5');
    const isNewModel = isO1Model || isGPT5Model;

    // Models ที่รองรับ temperature แบบปรับได้ (ไม่ใช่ o1 และ GPT-5)
    const supportsCustomTemperature = !isO1Model && !isGPT5Model;

    const requestBody: any = {
      model: selectedModel,
      messages: isO1Model
        ? [
          {
            role: 'user',
            content: prompt
          }
        ]
        : [
          {
            role: 'system',
            content: 'คุณเป็นผู้เชี่ยวชาญด้านการออกแบบ HTML/CSS ที่สร้างหน้าเว็บที่สวยงามและทันสมัย'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
    };

    // เพิ่ม temperature เฉพาะ models ที่รองรับการปรับค่า
    // o1 series: ไม่รองรับ temperature
    // GPT-5 series: รองรับเฉพาะค่า default (1) เท่านั้น
    if (supportsCustomTemperature) {
      requestBody.temperature = 0.7;
    }

    // ใช้ max_completion_tokens สำหรับ models ใหม่, max_tokens สำหรับ models เก่า
    // สำหรับ GPT-5 และ o1 ที่มี reasoning tokens ต้องเพิ่ม tokens ให้มากขึ้น
    if (isNewModel) {
      // GPT-5 และ o1 ใช้ reasoning tokens มาก ต้องเพิ่ม max_completion_tokens
      requestBody.max_completion_tokens = 16000; // เพิ่มเป็น 16000 เพื่อให้มี tokens เหลือสำหรับ output
    } else {
      requestBody.max_tokens = 4000;
    }

    console.log('Sending request to OpenAI with model:', selectedModel);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Response:', errorText);

      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error?.message || `API Error: ${response.status} - ${errorText}`);
      } catch (parseError) {
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('OpenAI API Response:', result);
    console.log('Choices:', result.choices);
    console.log('First choice:', result.choices?.[0]);
    console.log('Message:', result.choices?.[0]?.message);
    console.log('Content:', result.choices?.[0]?.message?.content);

    // ตรวจสอบว่ามี choices และ message
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('Invalid response structure:', result);
      throw new Error('Invalid response from OpenAI API');
    }

    const message = result.choices[0].message;
    let html = message.content;

    // GPT-5 อาจส่ง content ในรูปแบบอื่น เช่น refusal หรือ text
    if (!html) {
      console.error('No content in message:', message);
      console.error('Complete response:', JSON.stringify(result, null, 2));

      // ตรวจสอบว่ามี refusal หรือไม่
      if (message.refusal) {
        throw new Error(`Model refused to generate: ${message.refusal}`);
      }

      throw new Error('No HTML content generated - Model returned empty content. This might be a GPT-5 API issue. Try using GPT-4o or GPT-4o-mini instead.');
    }

    html = html.trim();

    // Remove markdown code blocks if present
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');

    console.log('Generated HTML length:', html.length);

    return html;
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};
