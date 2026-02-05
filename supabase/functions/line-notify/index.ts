// Supabase Edge Function: ส่ง LINE Push Message แจ้งเตือน
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN")!
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Welfare type labels in Thai
const welfareTypeLabels: Record<string, string> = {
  wedding: "สวัสดิการงานสมรส",
  training: "ค่าอบรมภายนอก",
  childbirth: "ค่าคลอดบุตร",
  funeral: "ค่าช่วยเหลืองานศพ",
  glasses: "ค่าตัดแว่นสายตา",
  dental: "ค่ารักษาทัตกรรม",
  fitness: "ค่าออกกำลังกาย",
  medical: "ของเยี่ยมกรณีเจ็บป่วย",
  advance: "เบิกเงินทดลอง (ฝ่ายขาย)",
  "general-advance": "เบิกเงินทดลองทั่วไป",
  "expense-clearing": "ปรับปรุงค่าใช้จ่าย (ฝ่ายขาย)",
  "general-expense-clearing": "ปรับปรุงค่าใช้จ่ายทั่วไป",
  "employment-approval": "ขออนุมัติจ้างงาน",
  internal_training: "อบรมภายใน",
}

// Status labels in Thai
const statusLabels: Record<string, string> = {
  pending_manager: "รอหัวหน้าอนุมัติ",
  pending_hr: "รอ HR อนุมัติ",
  pending_accounting: "รอบัญชีอนุมัติ",
  pending_special_approval: "รออนุมัติโดย กรรมการผู้จัดการ",
  completed: "อนุมัติเรียบร้อย",
  rejected_manager: "หัวหน้าปฏิเสธ",
  rejected_hr: "HR ปฏิเสธ",
  rejected_accounting: "บัญชีปฏิเสธ",
  rejected_special_approval: "ผู้บริหารปฏิเสธ",
}

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://vibrant-welfare-hub.vercel.app"

// สร้าง Flex Message สำหรับแจ้งเตือนสถานะ (CI: ICP Ladda)
function createFlexMessage(
  type: string,
  status: string,
  amount: number,
  userName: string,
  remainingBudget?: number,
  requestDate?: string
) {
  const isApproved = status === "completed"
  const isRejected = status.startsWith("rejected")

  // CI Colors
  const primaryBlue = "#004F9F"
  const successGreen = "#06C755"
  const errorRed = "#DC2626"
  const warningAmber = "#F59E0B"

  const statusColor = isApproved ? successGreen : isRejected ? errorRed : warningAmber
  const statusIcon = isApproved ? "✅" : isRejected ? "❌" : "⏳"
  const statusBgColor = isApproved ? "#ECFDF5" : isRejected ? "#FEF2F2" : "#FFFBEB"

  // Header text based on status
  const headerText = isApproved
    ? "อนุมัติเรียบร้อย"
    : isRejected
    ? "คำขอถูกปฏิเสธ"
    : "อัปเดตสถานะคำขอ"

  const dateStr = requestDate || new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return {
    type: "flex",
    altText: `${statusIcon} ${welfareTypeLabels[type] || type} - ${statusLabels[status] || status}`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "ICPL Welfare System",
                    color: "#FFFFFF",
                    size: "sm",
                    weight: "bold",
                  },
                ],
                flex: 4,
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: statusIcon,
                    size: "3xl",
                    align: "end",
                  },
                ],
                flex: 1,
              },
            ],
          },
          {
            type: "text",
            text: headerText,
            color: "#FFFFFF",
            size: "xl",
            weight: "bold",
            margin: "md",
          },
          {
            type: "text",
            text: welfareTypeLabels[type] || type,
            color: "#B3D4FC",
            size: "sm",
            margin: "sm",
          },
        ],
        backgroundColor: primaryBlue,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          // Status Badge
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: statusLabels[status] || status,
                    size: "sm",
                    color: statusColor,
                    weight: "bold",
                    align: "center",
                  },
                ],
                backgroundColor: statusBgColor,
                cornerRadius: "xl",
                paddingAll: "8px",
                paddingStart: "12px",
                paddingEnd: "12px",
              },
            ],
            margin: "none",
          },
          // Separator
          {
            type: "separator",
            margin: "lg",
          },
          // Detail rows
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              // ผู้เบิก
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "👤 ผู้เบิก",
                    size: "sm",
                    color: "#666666",
                    flex: 4,
                  },
                  {
                    type: "text",
                    text: userName,
                    size: "sm",
                    color: "#333333",
                    weight: "bold",
                    flex: 6,
                    align: "end",
                  },
                ],
              },
              // ประเภท
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "📝 ประเภท",
                    size: "sm",
                    color: "#666666",
                    flex: 4,
                  },
                  {
                    type: "text",
                    text: welfareTypeLabels[type] || type,
                    size: "sm",
                    color: "#333333",
                    flex: 6,
                    align: "end",
                    wrap: true,
                  },
                ],
              },
              // จำนวนที่เบิก
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "💰 จำนวนที่เบิก",
                    size: "sm",
                    color: "#666666",
                    flex: 5,
                  },
                  {
                    type: "text",
                    text: `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`,
                    size: "md",
                    color: primaryBlue,
                    weight: "bold",
                    flex: 5,
                    align: "end",
                  },
                ],
              },
              // จำนวนคงเหลือ (if provided)
              ...(remainingBudget !== undefined && remainingBudget !== null
                ? [
                    {
                      type: "box" as const,
                      layout: "horizontal" as const,
                      margin: "sm" as const,
                      contents: [
                        {
                          type: "text" as const,
                          text: "📊 งบคงเหลือ",
                          size: "sm" as const,
                          color: "#666666",
                          flex: 5,
                        },
                        {
                          type: "text" as const,
                          text: `฿${remainingBudget.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`,
                          size: "sm" as const,
                          color: remainingBudget > 0 ? successGreen : errorRed,
                          weight: "bold" as const,
                          flex: 5,
                          align: "end" as const,
                        },
                      ],
                    },
                  ]
                : []),
              // วันที่แจ้งเตือน
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "🕐 วันที่",
                    size: "sm",
                    color: "#666666",
                    flex: 4,
                  },
                  {
                    type: "text",
                    text: dateStr,
                    size: "xs",
                    color: "#999999",
                    flex: 6,
                    align: "end",
                  },
                ],
              },
            ],
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "📊 ตรวจสอบสถานะ",
              uri: `${FRONTEND_URL}/welfare-dashboard`,
            },
            style: "primary",
            color: primaryBlue,
            height: "sm",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ICP Ladda Co., Ltd.",
                size: "xxs",
                color: "#AAAAAA",
                align: "center",
              },
            ],
            margin: "md",
          },
        ],
        paddingAll: "15px",
        backgroundColor: "#F8FAFC",
      },
    },
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { employeeEmail, type, status, amount, userName, remainingBudget, requestDate } = await req.json()

    if (!employeeEmail || !type || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // ดึง line_user_id จาก Employee
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: employee, error: dbError } = await supabase
      .from("Employee")
      .select("line_user_id, line_display_name")
      .eq('"email_user"', employeeEmail)
      .single()

    if (dbError || !employee?.line_user_id) {
      return new Response(
        JSON.stringify({ error: "Employee not connected to LINE", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // ส่ง Flex Message
    const message = createFlexMessage(type, status, amount || 0, userName || "", remainingBudget, requestDate)

    const pushResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: employee.line_user_id,
        messages: [message],
      }),
    })

    if (!pushResponse.ok) {
      const errorText = await pushResponse.text()
      console.error("LINE push error:", errorText)
      return new Response(
        JSON.stringify({ error: "Failed to send LINE message", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, sentTo: employee.line_display_name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Unexpected error:", err)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
