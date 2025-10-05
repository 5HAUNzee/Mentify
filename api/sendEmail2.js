export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, status } = req.body;

  const SERVICE_ID = "service_2ou30aj";
  const TEMPLATE_ID = "template_5917lcw";
  const PUBLIC_KEY = "LlsSdIav_cNQzD4rI"; // Your EmailJS public key

  try {
    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id: PUBLIC_KEY,
          template_params: { name, email, status },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`EmailJS error: ${response.statusText}`);
    }

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to send email", error: err.message });
  }
}
