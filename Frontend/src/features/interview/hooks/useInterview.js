import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewById,
  generateResumePdf,
} from "../services/interview.api";

import { useContext, useEffect } from "react";
import { InterviewContext } from "../Interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

  // Generate Report
  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);

    let response = null;

    try {
      response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });

      console.log("Full API Response:", response);
      console.log("Interview Report Data:", response.interviewReport);

      if (!response || !response.interviewReport) {
        const errorMsg = response?.error || "Invalid response structure: missing interviewReport";
        throw new Error(errorMsg);
      }

      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (err) {
      console.error("Error in generateReport:", err);
      
      
      let userErrorMsg = "Failed to generate interview report.";
      if (err.response?.status === 500) {
        userErrorMsg = `Server Error: ${err.response?.data?.error || "Failed to generate report. Please check your input and try again."}`;
      } else if (err.response?.status === 400) {
        userErrorMsg = `Invalid Input: ${err.response?.data?.message || "Please ensure all fields are filled correctly."}`;
      } else if (err.response?.status === 401) {
        userErrorMsg = "Authentication failed. Please login again.";
      } else if (err.message) {
        userErrorMsg = err.message;
      }
      
      console.error("User-facing error:", userErrorMsg);
      alert(userErrorMsg);
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get Single Report
  const getReportById = async (interviewId) => {
    setLoading(true);

    let response = null;

    try {
      response = await getInterviewById(interviewId);
      
      if (!response || !response.interviewReport) {
        throw new Error("Invalid response structure: missing interviewReport");
      }

      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (err) {
      console.error("Error fetching report by ID:", err);
      
      let userErrorMsg = "Failed to fetch interview report.";
      if (err.response?.status === 404) {
        userErrorMsg = "Interview report not found.";
      } else if (err.response?.status === 500) {
        userErrorMsg = `Server Error: ${err.response?.data?.error || "Failed to fetch report. Please try again later."}`;
      }
      
      console.error("User-facing error:", userErrorMsg);
      alert(userErrorMsg);
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get All Reports
  const getReports = async () => {
    setLoading(true);

    let response = null;

    try {
      response = await getAllInterviewReports();

      console.log("Get all reports response:", response);

      if (!response || !response.interviewReports) {
        console.warn("Invalid response structure for getAllReports:", response);
        setReports([]);
        return [];
      }

      const reportsArray = Array.isArray(response.interviewReports) ? response.interviewReports : [];
      setReports(reportsArray);

      return reportsArray;
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            console.log("Starting PDF download for report:", interviewReportId);
            
            const response = await generateResumePdf( {interviewReportId} )
            
            console.log("PDF response received, creating blob...");
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
            console.log("PDF downloaded successfully");
        }
        catch (error) {
            console.error("Error downloading resume PDF:", error);
            
            let errorMsg = "Failed to download resume. ";
            if (error.response?.status === 503) {
                errorMsg = "⏳ Backend service is currently processing. This can take 30-60 seconds. Please try again in a moment or retry the download.";
            } else if (error.response?.status === 500) {
                const serverError = error.response?.data?.error || "Server error. Please try again later.";
                const details = error.response?.data?.details;
                errorMsg += `${serverError}${details ? `\nDetails: ${details}` : ""}`;
            } else if (error.response?.status === 504) {
                errorMsg = "⏱️ Request timed out. The PDF generation took too long. Please try again.";
            } else {
                errorMsg += error.response?.data?.error || error.message || "Please try again.";
            }
            
            console.error("Error details:", errorMsg);
            alert(errorMsg);
        } finally {
            setLoading(false)
        }
    }

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf
  };
};
