// api/sendEmail.js
import emailjs from 'emailjs-com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, status } = req.body;

  try {
    const response = await emailjs.send(
      'service_2ou30aj',       // Your EmailJS Service ID
      'template_5917lcw',      // Your EmailJS Template ID
      { name, email, status },  // Template parameters
      'LlsSdIav_cNQzD4rI'      // Your EmailJS Public Key
    );
    return res.status(200).json({ message: 'Email sent', response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
