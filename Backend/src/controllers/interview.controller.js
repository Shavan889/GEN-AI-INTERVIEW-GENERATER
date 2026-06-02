const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.services");
const InterviewReportModel = require("../models/interviewReport.model");

/**
 * Helper function to parse PDF with comprehensive fallback strategies
 */
async function parsePdfBuffer(buffer) {
  try {
    console.log("Attempting to parse PDF with buffer size:", buffer.length);
    console.log("pdfParse type:", typeof pdfParse);
    console.log("pdfParse constructor name:", pdfParse?.constructor?.name);
    
    let parseFunction = null;
    let result = null;
    
    // Strategy 1: Direct function call
    if (typeof pdfParse === 'function') {
      console.log("✓ Strategy 1: Using pdfParse as direct function");
      return await pdfParse(buffer);
    }
    
    // Strategy 2: Try .default property (ES6 export)
    if (pdfParse.default && typeof pdfParse.default === 'function') {
      console.log("✓ Strategy 2: Using pdfParse.default as function");
      return await pdfParse.default(buffer);
    }
    
    // Strategy 3: Check for PDFParser class
    if (pdfParse.PDFParser && typeof pdfParse.PDFParser === 'function') {
      console.log("✓ Strategy 3: Using PDFParser class");
      const parser = new pdfParse.PDFParser();
      return new Promise((resolve, reject) => {
        parser.on('pdfParser_dataReady', (data) => {
          resolve({ text: data.text, numpages: data.Pages?.length || 0 });
        });
        parser.on('pdfParser_dataError', (error) => {
          reject(error);
        });
        parser.parseBuffer(buffer);
      });
    }
    
    // Strategy 4: Try importing the parser directly
    try {
      console.log("✓ Strategy 4: Trying alternative require path");
      const PDFParser = require('pdf-parse/lib/PDFParser.js');
      if (typeof PDFParser === 'function') {
        return await PDFParser(buffer);
      }
    } catch (e) {
      console.log("Strategy 4 failed:", e.message);
    }
    
    // Strategy 5: Log what we actually have
    console.log("Available properties on pdfParse:", Object.keys(pdfParse || {}));
    throw new Error(`pdf-parse module export unrecognized. Type: ${typeof pdfParse}, Keys: ${Object.keys(pdfParse || {}).join(', ')}`);
    
  } catch (error) {
    console.error("PDF parsing error:", error.message);
    throw error;
  }
}

/**
 * @description Controller to generate interview report based on user's resume, self-description, and job description.
 */

async function generateInterViewReportController(req, res) {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({
      message:
        "Resume file is required. Upload a PDF under the multipart/form-data field name 'resume'.",
    });
  }

  try {
    console.log("Parsing resume PDF...");
    const resumeContent = await parsePdfBuffer(req.file.buffer);
    const resumeText = resumeContent.text;
    const { selfDescription, jobDescription } = req.body;

    if (!selfDescription || !jobDescription) {
      return res.status(400).json({
        message: "selfDescription and jobDescription are required fields.",
      });
    }

    console.log("Generating interview report...");
    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

    console.log("Creating interview report in database...");
    const interviewReport = await InterviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      ...interViewReportByAi,
    });

    console.log("Interview report created successfully:", interviewReport._id);
    return res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("Interview report generation failed:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Provide specific guidance for pdf-parse errors
    let userMessage = "Failed to generate interview report.";
    if (error.message && error.message.includes("pdf-parse")) {
      userMessage = "Failed to parse the uploaded PDF. Please ensure it's a valid PDF file.";
    }
    
    return res.status(500).json({
      message: userMessage,
      error: error.message,
      details: process.env.NODE_ENV === "development" ? {
        stack: error.stack,
        type: error.name,
        diagnostic: error.message.includes('pdf-parse') ? "PDF parsing issue - check logs" : null
      } : undefined,
    });
  }
}

/**
 * @description Controller to fetch a specific interview report by its ID.
 */

async function getInterviewReportByIdController(req, res) {
  const { interviewId } = req.params;
  const interviewReport = await InterviewReportModel.findOne({
    _id: interviewId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(404).json({
      message: "Interview report not found.",
    });
  }
  res.status(200).json({
    message: "Interview report fetched successfully",
    interviewReport,
  });
}
/**
 * @description Controller to fetch all interview reports of the logged-in user.
 */

async function getAllInterviewReportsController(req, res) {
  const interviewReports = await InterviewReportModel.find({
    user: req.user.id,
  })
    .sort({ createdAt: -1 })
    .select(
      "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestion -skillGaps -preparationPlan",
    );
  res.status(200).json({
    message: "Interview reports fetched successfully",
    interviewReports,
  });
}

/**
 * @description controller to generate resume PDF based on user self description, resume and job description
 */

async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;
    console.log("PDF Generation Request:", interviewReportId);

    const interviewReport =
      await InterviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      console.warn("Interview report not found:", interviewReportId);
      return res.status(404).json({
        message: "interview report not found",
      });
    }

    console.log("Found interview report, generating PDF...");
    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    console.log("PDF generated successfully, size:", pdfBuffer.length);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Resume PDF generation failed:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);

    const statusCode =
      error?.status === 503 || error?.code === 503 || error?.error?.code === 503
        ? 503
        : 500;

    return res.status(statusCode).json({
      message:
        statusCode === 503
          ? "Resume PDF service is currently unavailable. Please try again later."
          : "Failed to generate resume PDF.",
      error: error.message,
      details: error.stack,
    });
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController
};
