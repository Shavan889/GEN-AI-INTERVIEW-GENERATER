import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewById,
  generateResumePdf,
} from "../services/interview.api";

import { useContext, useEffect } from "react";
import { InterviewContext } from "../interview.context";
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

      setReport(response.interviewReport);

      return response.interviewReport;
    } catch (err) {
      console.log(err);
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

      setReport(response.interviewReport);

      return response.interviewReport;
    } catch (err) {
      console.log(err);
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

      setReports(response.interviewReports);

      return response.interviewReports;
    } catch (err) {
      console.log(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf( {interviewReportId} )
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
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
