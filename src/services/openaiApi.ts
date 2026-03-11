const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper: เรียก OpenAI ผ่าน Supabase Edge Function (แก้ CORS)
const callOpenAIProxy = async (body: {
  messages: any[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
}) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge Function Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
};

export interface SlipAnalysisResult {
  sender: string;       // ผู้โอน
  receiver: string;     // ผู้รับ
  amount: string;       // จำนวนเงิน
  transferDate: string; // วันที่โอน
}

export const analyzeSlipImage = async (base64Image: string): Promise<SlipAnalysisResult> => {
  const result = await callOpenAIProxy({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'คุณเป็นผู้เชี่ยวชาญในการอ่านสลิปโอนเงินธนาคารไทย ให้ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'อ่านสลิปโอนเงินนี้แล้วตอบเป็น JSON format ดังนี้:\n{"sender":"ชื่อผู้โอน","receiver":"ชื่อผู้รับ","amount":"จำนวนเงิน","transferDate":"วันที่โอน"}\n\nถ้าอ่านไม่ได้หรือไม่มีข้อมูลให้ใส่ "-"'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 500,
    temperature: 0.1,
  });

  const content = result.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('No content from OpenAI Vision API');
  }

  // Parse JSON — ลอง extract JSON จาก response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  return JSON.parse(jsonMatch[0]) as SlipAnalysisResult;
};

export interface SenderMatchResult {
  matches: boolean;
  matchedName: string | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export const compareSlipSender = async (
  senderName: string,
  customerName: string,
  contactName?: string
): Promise<SenderMatchResult> => {
  const namesToCompare = contactName
    ? `1. "${customerName}" (ชื่อบริษัท/ลูกค้า)\n2. "${contactName}" (ชื่อกรรมการบริษัท)`
    : `1. "${customerName}" (ชื่อบริษัท/ลูกค้า)`;

  const result = await callOpenAIProxy({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'คุณเป็นผู้เชี่ยวชาญในการเปรียบเทียบชื่อภาษาไทย ให้ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม'
      },
      {
        role: 'user',
        content: `เปรียบเทียบชื่อผู้โอนเงินจากสลิป: "${senderName}"\nกับรายชื่อต่อไปนี้:\n${namesToCompare}\n\nพิจารณาว่าชื่อผู้โอนตรงกับชื่อใดหรือไม่ โดยอนุโลมชื่อย่อ คำนำหน้า (บริษัท, จำกัด, นาย, นาง, น.ส.) และตัวสะกดที่ใกล้เคียง\n\nตอบเป็น JSON: {"matches":true/false,"matchedName":"ชื่อที่ตรง หรือ null","confidence":"high/medium/low","reason":"เหตุผลสั้นๆ"}`
      }
    ],
    max_tokens: 200,
    temperature: 0.1,
  });

  const content = result.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('No content from OpenAI API');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse comparison result');
  }

  return JSON.parse(jsonMatch[0]) as SenderMatchResult;
};

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

    const messages = isO1Model
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
      ];

    const maxTokens = isNewModel ? 16000 : 4000;
    const temperature = supportsCustomTemperature ? 0.7 : undefined;

    console.log('Sending request to OpenAI via Edge Function with model:', selectedModel);

    const result = await callOpenAIProxy({
      model: selectedModel,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    console.log('OpenAI API Response:', result);

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
