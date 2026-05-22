const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.services");
const InterviewReportModel = require("../models/interviewReport.model");

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
    const resumeContent = await new pdfParse.PDFParse(
      Uint8Array.from(req.file.buffer),
    ).getText();
    const { selfDescription, jobDescription } = req.body;

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeContent.text,
      selfDescription,
      jobDescription,
    });

    const interviewReport = await InterviewReportModel.create({
      user: req.user.id,
      resume: resumeContent.text,
      selfDescription,
      jobDescription,
      ...interViewReportByAi,
    });

    return res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("Interview report generation failed:", error);
    return res.status(500).json({
      message: "Failed to generate interview report.",
      error: error.message,
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
  const { interviewReportId } = req.params;

  const interviewReport =
    await InterviewReportModel.findById(interviewReportId);

  if (!interviewReport) {
    return res.status(404).json({
      message: "interview report not found",
    });
  }

  const { resume, jobDescription, selfDescription } = interviewReport;

  const pdfBuffer = await generateResumePdf({
    resume,
    jobDescription,
    selfDescription,
  });

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
  });
  res.send(pdfBuffer);
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController
};
