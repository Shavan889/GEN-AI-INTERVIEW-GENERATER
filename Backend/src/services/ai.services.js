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
    model: "gemini-2.5-flash",
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
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    textContent.split(/\r?\n/).forEach((line) => {
      const headings = [
        "SUMMARY",
        "PROFESSIONAL SUMMARY",
        "TECHNICAL SKILLS",
        "SKILLS",
        "EXPERIENCE",
        "WORK EXPERIENCE",
        "PROJECTS",
        "EDUCATION",
        "CERTIFICATIONS",
      ];

      if (!line.trim()) {
        doc.moveDown(0.5);
        return;
      }

      if (headings.some((heading) => line.toUpperCase().includes(heading))) {
        doc.moveDown(0.8);

        doc.font("Helvetica-Bold").fontSize(15).fillColor("#000000").text(line);

        doc.moveDown(0.2);

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

        doc.moveDown(0.4);
      } else {
        doc.font("Helvetica").fontSize(11).fillColor("#000000").text(line, {
          lineGap: 4,
          align: "left",
        });
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

  const prompt = `
Create a modern ATS-friendly MERN Stack Developer resume.

Candidate Information:

Resume:
${resume}

Self Description:
${selfDescription}

Target Job Description:
${jobDescription}

Requirements:

- Create a professional software engineer resume.
- Keep the resume concise and recruiter-friendly.
- Create a strong professional summary.
- Highlight MERN Stack expertise.
- Highlight React.js, Node.js, Express.js, MongoDB, Socket.IO, JWT, REST APIs.
- Add a Technical Skills section.
- Add Experience section.
- Add Projects section.
- Add Education section.
- Use achievement-oriented bullet points.
- Use strong action verbs.
- Mention technologies used in every project.
- Focus on impact and accomplishments.
- ATS friendly but visually structured.
- Avoid generic AI-generated wording.

Format:

NAME

Contact Information

PROFESSIONAL SUMMARY

TECHNICAL SKILLS

EXPERIENCE

PROJECTS

EDUCATION

Return JSON:

{
  "resumeText": "complete formatted resume text"
}
`;

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
        model: "gemini-3-flash-preview",
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
