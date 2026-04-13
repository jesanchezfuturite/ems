export const prerender = false;

import type { APIContext } from 'astro';

export async function POST({ request }: APIContext) {
  try {
    const data = await request.json();
    const { nombre, telefono, correo, motivo } = data;

    if (!nombre || !telefono || !correo || !motivo) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Faltan campos obligatorios'
      }), { status: 400 });
    }

    // Configuración de Brevo (Soporte Vercel process.env + import.meta.env)
    const apiKey = import.meta.env.BREVO_API_KEY || process.env.BREVO_API_KEY;
    
    // Leemos el sender predeterminado para leads si existe, si no, uno por defecto
    const senderStr = import.meta.env.BREVO_SENDER_DEFAULT || process.env.BREVO_SENDER_DEFAULT;
    let sender = { name: "Web Leads", email: "no_reply@ongoing.mx" };
    try {
      if (senderStr) sender = JSON.parse(senderStr);
    } catch (e) {
      console.error("Error parseando el sender de Brevo", e);
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Nuevo Contacto desde el Sitio Web</h2>
        <p>Has recibido un nuevo mensaje de contacto.</p>
        <table border="0" cellpadding="8" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 8px;">
          <tr>
            <td style="width: 150px; font-weight: bold;">Nombre:</td>
            <td>${nombre}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Teléfono:</td>
            <td>${telefono}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Correo:</td>
            <td><a href="mailto:${correo}">${correo}</a></td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Motivo:</td>
            <td>${motivo}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
          Este correo fue generado automáticamente por la plataforma web.
        </p>
      </div>
    `;

    const payload = {
      sender,
      to: [
        {
          //email: "contacto@espmedicassur.com",
          email: "sandra.gonzalez@futurite.com",
          name: "Contacto Esp Médicas Sur"
        }
      ],
      replyTo: {
        email: correo,
        name: nombre
      },
      subject: `Nuevo Lead Web - ${motivo.toUpperCase()} - ${nombre}`,
      htmlContent: htmlContent
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error de Brevo:", errorData);
      return new Response(JSON.stringify({
        success: false,
        message: 'Error al procesar el correo con el proveedor',
        data: errorData
      }), { status: response.status });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensaje enviado correctamente'
    }), { status: 200 });

  } catch (error) {
    console.error("Error interno del servidor:", error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error interno del servidor'
    }), { status: 500 });
  }
}
