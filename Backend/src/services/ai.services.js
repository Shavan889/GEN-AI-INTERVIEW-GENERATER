const { GoogleGenAI, Behavior } = require("@google/genai");
const z = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

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
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: interviewReportJsonSchema,
    },
  });

  const data = JSON.parse(response.text);
  return interviewReportSchema.parse(data);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
  });
  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      ),
  });

  const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
