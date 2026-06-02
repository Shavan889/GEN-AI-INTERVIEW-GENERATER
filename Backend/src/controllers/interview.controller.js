const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.services");
const InterviewReportModel = require("../models/interviewReport.model");

/**
 * Helper function to parse PDF with fallback for different module exports
 */
async function parsePdfBuffer(buffer) {
  try {
    // Try direct function call
    if (typeof pdfParse === 'function') {
      return await pdfParse(buffer);
    }
    // Try with .default property
    if (pdfParse.default && typeof pdfParse.default === 'function') {
      return await pdfParse.default(buffer);
    }
    throw new Error("pdf-parse module is not properly exported");
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
    console.error("Error details:", error.message);
    
    return res.status(500).json({
      message: "Failed to generate interview report.",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
