const { GoogleGenAI, Behavior } = require("@google/genai");
const z = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const PDFDocument = require("pdfkit");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
      }),
    )
    .min(4),
  behavioralQuestions: z
    .array(
      z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
      }),
    )
    .min(3),
  skillGaps: z
    .array(
      z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .min(2),
  preparationPlan: z
    .array(
      z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string()).min(1),
      }),
    )
    .min(5),
  title: z.string(),
});

const interviewReportJsonSchema = {
  type: "object",
  properties: {
    matchScore: { type: "number", minimum: 0, maximum: 100 },
    technicalQuestions: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
        additionalProperties: false,
      },
    },
    behavioralQuestions: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
        additionalProperties: false,
      },
    },
    skillGaps: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["skill", "severity"],
        additionalProperties: false,
      },
    },
    preparationPlan: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        properties: {
          day: { type: "number" },
          focus: { type: "string" },
          tasks: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
        },
        required: ["day", "focus", "tasks"],
        additionalProperties: false,
      },
    },
    title: { type: "string" },
  },
  required: [
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title",
  ],
  additionalProperties: false,
};

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate a JSON interview report for a candidate with the following details:\n- Resume: ${resume}\n- Self Description: ${selfDescription}\n- Job Description: ${jobDescription}\n\nReturn only valid JSON that matches the requested structure. Provide at least:\n- 4 technical questions\n- 3 behavioral questions\n- 2 skill gaps\n- 5 days of preparation plan\nInclude question intention and answer guidance for each question.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: interviewReportJsonSchema,
    },
  });

  const data = JSON.parse(response.text);
  return interviewReportSchema.parse(data);
}

async function generatePdfFromText(textContent) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Times-Roman").fontSize(12);

    textContent.split(/\r?\n/).forEach((line) => {
      if (line.trim() === "") {
        doc.moveDown(0.5);
      } else {
        doc.text(line, { lineGap: 4 });
      }
    });

    doc.end();
  });
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    resumeText: z
      .string()
      .describe(
        "The plain text content of the resume ready to be converted into a PDF",
      ),
  });

  const prompt = `Generate a professional resume for a candidate using the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Return a JSON object with a single field named "resumeText". The value should be the full resume content as plain text, formatted with line breaks and sections so it can be converted directly into a PDF.

The resume should be concise, ATS-friendly, and written in a professional tone that matches the job role.`;

  try {
    console.log("Calling Gemini AI to generate resume text...");

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Gemini API call timed out after 60 seconds")),
        60000,
      ),
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: zodToJsonSchema(resumePdfSchema),
        },
      }),
      timeoutPromise,
    ]);

    console.log("Gemini API response received");
    const jsonContent = JSON.parse(response.text);

    console.log("Converting text to PDF...");
    const pdfBuffer = await generatePdfFromText(jsonContent.resumeText);

    return pdfBuffer;
  } catch (error) {
    console.error("Error in generateResumePdf:", error);
    throw error;
  }
}

module.exports = { generateInterviewReport, generateResumePdf };
