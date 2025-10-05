import emailjs from "emailjs-com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, status } = req.body;

  const SERVICE_ID = "service_2ou30aj";
  const TEMPLATE_ID = "template_5917lcw";
  const PUBLIC_KEY = "LlsSdIav_cNQzD4rI";

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { name, email, status },
      PUBLIC_KEY
    );
    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send email", error: err });
  }
}
