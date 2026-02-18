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

  const prompt = `สร้างไฟล์ HTML สวยงามสำหรับประกาศของบริษัท ICP Ladda Co., Ltd. ดังนี้:

หัวข้อ: ${data.title}
เนื้อหา: ${data.content}
ระดับความสำคัญ: ${priorityLabels[data.priority]}
ประเภท: ${typeLabels[data.type]}
${data.start_date ? `วันที่เริ่ม: ${data.start_date}` : ''}
${data.end_date ? `วันที่สิ้นสุด: ${data.end_date}` : ''}
${data.youtube_embed_url ? `YouTube: ${data.youtube_embed_url}` : ''}

=== Corporate Identity (CI) ของบริษัท ICP Ladda ===
- สีหลัก (Primary): #004F9F (ICP Blue)
- สีรอง (Secondary): #0066CC (Light Blue)
- สีเข้ม (Dark): #003D7A
- สีเสริม: ขาว #FFFFFF, เทาอ่อน #F5F5F5
- โลโก้บริษัท: แสดงชื่อ "ICP Ladda" ที่ Header ด้วยสีหลัก
- ฟอนต์: ใช้ Google Fonts "Sarabun" สำหรับเนื้อหา และ "Kanit" สำหรับหัวข้อ

=== แนวทางการออกแบบ ===
1. Header: พื้นหลัง gradient จากสี #004F9F ไป #0066CC พร้อมชื่อบริษัท "ICP Ladda Co., Ltd." สีขาว
2. ใช้โทนสีน้ำเงิน #004F9F เป็นหลักทั้งหมด ห้ามใช้สีอื่นเป็นสีหลัก
3. ปุ่มและ accent ใช้สี #004F9F หรือ #0066CC
4. การ์ดเนื้อหา: พื้นขาว มี border-radius, box-shadow นุ่มนวล
5. มีการออกแบบที่สวยงาม ทันสมัย เป็นมืออาชีพ
6. รองรับ responsive design
7. ใช้ CSS animation เล็กน้อย (fade-in, slide-up) ไม่อลังการเกินไป
8. Footer: แสดง "ICP Ladda Co., Ltd." พร้อมที่อยู่ "42 อาคาร ไอ ซี พี ชั้น 5 ถนนสุรวงศ์ แขวงสี่พระยา เขตบางรัก กรุงเทพฯ 10500"
${data.youtube_embed_url ? '9. ฝัง YouTube video แบบ responsive (16:9 ratio)' : ''}

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
            content: 'คุณเป็นผู้เชี่ยวชาญด้านการออกแบบ HTML/CSS ของบริษัท ICP Ladda Co., Ltd. สร้างหน้าเว็บที่สวยงาม ทันสมัย โดยใช้สีน้ำเงิน #004F9F เป็นสีหลักเสมอ ฟอนต์ Kanit สำหรับหัวข้อ และ Sarabun สำหรับเนื้อหา'
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
