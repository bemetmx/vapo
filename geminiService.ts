
import { GoogleGenAI, Type } from "@google/genai";
import { CalibrationReport } from "../types";

export const generateCalibrationObservations = async (report: CalibrationReport): Promise<string> => {
  // Always use a new instance as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analiza los siguientes datos de calibración de un vaporizador de anestesia (${report.equipmentData.agent})
  realizados a un flujo de gas constante de ${report.testFlow} L/min:
  
  Datos de Mediciones: ${JSON.stringify(report.measurements)}
  Tolerancias Finales: ${JSON.stringify(report.tolerances)}
  
  Considera que el estado "Recibido" muestra la deriva antes del mantenimiento.
  Genera un resumen técnico profesional en español (máximo 150 palabras) que incluya:
  1. Comparativa breve entre el estado recibido y el calibrado.
  2. Evaluación de la precisión a ${report.testFlow} L/min.
  3. Dictamen final: ¿El equipo garantiza la seguridad del paciente bajo estas condiciones?`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Use .text property directly
    return response.text || "No se pudo generar el análisis automático.";
  } catch (error) {
    console.error(error);
    return "Error en la conexión con el motor de IA.";
  }
};

// Added missing analyzeIncident function for Incident Management
export const analyzeIncident = async (description: string, equipment: string): Promise<any> => {
  // Creating a new instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza la siguiente incidencia técnica en un equipo médico (${equipment}): "${description}"`,
      config: {
        systemInstruction: "Eres un experto en bioingeniería y gestión de riesgos hospitalarios. Analiza incidentes y devuelve una evaluación en JSON que incluya urgencyScore (1-10), riskAssessment y suggestedAction.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgencyScore: {
              type: Type.NUMBER,
              description: 'Puntuación de urgencia de 1 a 10.',
            },
            riskAssessment: {
              type: Type.STRING,
              description: 'Breve evaluación del riesgo para el paciente o el personal.',
            },
            suggestedAction: {
              type: Type.STRING,
              description: 'Acción inmediata recomendada.',
            },
          },
          required: ["urgencyScore", "riskAssessment", "suggestedAction"],
        },
      },
    });

    // Extracting text output from response.text
    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Returning a fallback object to maintain UI stability
    return {
      urgencyScore: 5,
      riskAssessment: "Error en el análisis automático por IA.",
      suggestedAction: "Revisión técnica manual prioritaria."
    };
  }
};
