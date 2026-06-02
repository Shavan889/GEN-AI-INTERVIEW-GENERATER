const pdfjsLib = require('pdfjs-dist');
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.services");
const InterviewReportModel = require("../models/interviewReport.model");

/**
 * Helper function to parse PDF using pdfjs-dist
 */
async function parsePdfBuffer(buffer) {
  try {
    console.log("Parsing PDF with pdfjs-dist, buffer size:", buffer.length);
    
    // Set worker path for pdfjs
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    // Convert Buffer to Uint8Array (pdfjs-dist requires Uint8Array)
    const uint8Array = new Uint8Array(buffer);
    console.log("Buffer converted to Uint8Array, size:", uint8Array.length);
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    console.log("PDF loaded, total pages:", pdf.numPages);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`Error extracting page ${pageNum}:`, pageError.message);
      }
    }
    
    console.log("✓ PDF parsed successfully, extracted text length:", fullText.length);
    
    return {
      text: fullText.trim() || 'PDF content could not be extracted',
      numpages: pdf.numPages
    };
    
  } catch (error) {
    console.error("PDF parsing error:", error.message);
    throw new Error(`Failed to parse PDF: ${error.message}`);
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
