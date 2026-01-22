// Supabase Edge Function: ส่ง Email ผ่าน Microsoft Graph API (Outlook 365)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Microsoft Graph API Configuration
const TENANT_ID = Deno.env.get("AZURE_TENANT_ID")!
const CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID")!
const CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET")!
const SENDER_EMAIL = Deno.env.get("OUTLOOK_SENDER_EMAIL")! // เช่น noreply@icpladda.com

// Welfare type labels in Thai
const welfareTypeLabels: Record<string, string> = {
  wedding: "ค่าแต่งงาน",
  training: "ค่าอบรม",
  childbirth: "ค่าคลอดบุตร",
  funeral: "ค่าช่วยเหลืองานศพ",
  glasses: "ค่าตัดแว่น",
  dental: "ค่าทำฟัน",
  fitness: "ค่าออกกำลังกาย",
  medical: "ค่าเยี่ยมกรณีเจ็บป่วย",
  advance: "เบิกเงินทดลอง",
  "general-advance": "เบิกเงินทดลองทั่วไป",
  "expense-clearing": "ปรับปรุงค่าใช้จ่าย",
}

// Status labels in Thai
const statusLabels: Record<string, string> = {
  pending_manager: "รอหัวหน้าอนุมัติ",
  pending_hr: "รอ HR อนุมัติ",
  pending_accounting: "รอบัญชีอนุมัติ",
  completed: "อนุมัติครบถ้วน",
  rejected: "ถูกปฏิเสธ",
}

// Get Microsoft Graph API Access Token
async function getAccessToken(): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error_description}`)
  }

  return data.access_token
}

// Send email via Microsoft Graph API
async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const graphUrl = `https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`

  const emailMessage = {
    message: {
      subject: subject,
      body: {
        contentType: "HTML",
        content: htmlBody,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    },
    saveToSentItems: true,
  }

  const response = await fetch(graphUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailMessage),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }
}

// Generate email HTML template
function generateEmailHTML(
  employeeName: string,
  requestType: string,
  amount: number,
  status: string,
  oldStatus: string,
  notes?: string
): string {
  const typeLabel = welfareTypeLabels[requestType] || requestType
  const statusLabel = statusLabels[status] || status

  let statusColor = "#3b82f6" // blue default
  let statusIcon = "📋"
  let title = "อัปเดตสถานะคำร้อง"

  switch (status) {
    case "pending_hr":
      statusColor = "#f59e0b" // amber
      statusIcon = "✅"
      title = "คำร้องได้รับการอนุมัติจากหัวหน้า"
      break
    case "pending_accounting":
      statusColor = "#8b5cf6" // purple
      statusIcon = "✅"
      title = "คำร้องได้รับการอนุมัติจาก HR"
      break
    case "completed":
      statusColor = "#22c55e" // green
      statusIcon = "🎉"
      title = "คำร้องได้รับการอนุมัติครบถ้วน"
      break
    case "rejected":
      statusColor = "#ef4444" // red
      statusIcon = "❌"
      title = "คำร้องถูกปฏิเสธ"
      break
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${statusColor}; padding: 30px; text-align: center;">
              <span style="font-size: 48px;">${statusIcon}</span>
              <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px;">${title}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                สวัสดีคุณ <strong>${employeeName}</strong>,
              </p>

              <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                คำร้องสวัสดิการของคุณมีการอัปเดตสถานะ:
              </p>

              <!-- Request Details Box -->
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="5" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; width: 40%;">ประเภทสวัสดิการ:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${typeLabel}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">จำนวนเงิน:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600;">${amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">สถานะปัจจุบัน:</td>
                        <td style="color: ${statusColor}; font-size: 14px; font-weight: 600;">${statusLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${notes ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>หมายเหตุ:</strong> ${notes}
                </p>
              </div>
              ` : ""}

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://welfare.icpladda.com/welfare-dashboard"
                       style="background-color: ${statusColor}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                      ดูรายละเอียดเพิ่มเติม
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                ระบบสวัสดิการพนักงาน ICP Ladda Co., Ltd.
              </p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">
                อีเมลนี้ถูกส่งอัตโนมัติ กรุณาอย่าตอบกลับ
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  try {
    const {
      employee_email,
      employee_name,
      request_type,
      amount,
      status,
      old_status,
      notes,
    } = await req.json()

    // Validate required fields
    if (!employee_email || !request_type || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get access token
    const accessToken = await getAccessToken()

    // Generate email content
    const typeLabel = welfareTypeLabels[request_type] || request_type
    const statusLabel = statusLabels[status] || status
    const subject = `[ระบบสวัสดิการ] ${typeLabel} - ${statusLabel}`

    const htmlBody = generateEmailHTML(
      employee_name || "พนักงาน",
      request_type,
      amount || 0,
      status,
      old_status,
      notes
    )

    // Send email
    await sendEmail(accessToken, employee_email, subject, htmlBody)

    console.log(`Email sent successfully to ${employee_email}`)

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error sending email:", error)

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
