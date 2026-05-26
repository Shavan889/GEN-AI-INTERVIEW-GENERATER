import React, { useState, useRef } from "react";
import "../style/home.scss";
import { useInterview } from "./../hooks/useInterview";
import { useNavigate } from "react-router";
import { useAuth } from ".../../../src/features/auth/hooks/useAuth";

const Home = () => {
  const { handleLogout } = useAuth();
  const { loading, generateReport, reports } = useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const resumeInputRef = useRef();
  const navigate = useNavigate();

  const MAX_CHARS = 5600;

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  

  if (loading) {
    return (
      <main>
        <div className="loader-container">
          <div className="loader"></div>
          <h1>Loading your interview plan...</h1>
        </div>
      </main>
    );
  }

  const handleSelfDescriptionChange = (e) => {
    setSelfDescription(e.target.value);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("dragover");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragover");
    const file = e.dataTransfer.files?.[0];
    if (
      file &&
      (file.type === "application/pdf" || file.name.endsWith(".docx"))
    ) {
      setResumeFile(file);
    }
  };

  const handleFileZoneClick = () => {
    const fileInput = document.getElementById("resume");
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current.files[0];
    const data = await generateReport({
      jobDescription,
      selfDescription,
      resumeFile,
    });

    navigate(`/interview/${data._id}`);

    console.log({
      jobDescription,
      resumeFile,
      selfDescription,
    });
  };

  const isFormValid =
    jobDescription.trim() && (resumeFile || selfDescription.trim());

  return (
    <main className="interview-home">
      <section className="interview-container">
        {/* Header Section */}
        <div className="header-section">
         <div className="">
           <h1 className="main-title">
            Create Your Custom{" "}
            <span className="highlight-text">Interview Plan</span>
          </h1>
          <p className="subtitle">
            Let our AI analyze the job requirements and your unique profile to
            build a winning strategy.
          </p>
         </div>
        </div>

        <div className="logout-section">
          <button className="button primary-button logout" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Main Content */}
        <div className="interview-content">
          {/* Left Panel - Job Description */}
          <div className="panel left-panel">
            <div className="panel-header">
              <span className="panel-icon">📋</span>
              <h2 className="panel-title">Target Job Description</h2>
              <span className="required-badge">Required</span>
            </div>

            <div className="panel-body">
              <textarea
                id="jobDescription"
                name="jobDescription"
                className="textarea-input"
                placeholder="Paste the full job description here...&#10;Example: 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'"
                value={jobDescription}
                onChange={handleJobDescriptionChange}
                maxLength={MAX_CHARS}
              />
              <div className="char-counter">
                {jobDescription.length} / {MAX_CHARS} chars
              </div>
            </div>
          </div>

          {/* Right Panel - User Profile */}
          <div className="panel right-panel">
            <div className="panel-header">
              <span className="panel-icon">👤</span>
              <h2 className="panel-title">Your Profile</h2>
            </div>

            <div className="panel-body">
              {/* Resume Upload Section */}
              <div className="upload-section">
                <div className="section-header">
                  <label className="section-title">Upload Resume</label>
                  <span className="required-badge">Must Required</span>
                </div>

                <div
                  className="file-drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleFileZoneClick}
                >
                  {resumeFile ? (
                    <div className="file-preview">
                      <span className="file-icon">📄</span>
                      <p className="file-name">{resumeFile.name}</p>
                      <button
                        type="button"
                        className="change-file-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileZoneClick();
                        }}
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="file-prompt">
                      <span className="upload-icon">📤</span>
                      <p className="upload-text">
                        Click to upload or drag & drop
                      </p>
                      <p className="upload-subtext">PDF or DOCX Max 5MB</p>
                    </div>
                  )}
                  <input
                    ref={resumeInputRef}
                    hidden
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf,.docx"
                    onChange={handleResumeChange}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="divider">
                <span className="divider-text">OR</span>
              </div>

              {/* Self Description Section */}
              <div className="description-section">
                <label htmlFor="selfDescription" className="section-title">
                  Quick Self-Description
                </label>
                <textarea
                  id="selfDescription"
                  name="selfDescription"
                  className="textarea-input"
                  placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                  value={selfDescription}
                  onChange={handleSelfDescriptionChange}
                />
              </div>

              {/* Validation Message */}
              <div className="validation-message">
                <span className="info-icon">ℹ️</span>
                <p>
                  Either a Resume or a Self Description is required to generate
                  a personalized plan.
                </p>
              </div>

              {/* Generate Button */}
              <button
                className={`generate-button ${isFormValid ? "active" : "disabled"}`}
                onClick={handleGenerateReport}
                disabled={!isFormValid}
              >
                <span className="button-icon">✨</span>
                Generate My Interview Strategy
              </button>
            </div>
          </div>
        </div>
      

        {/*Recent Reports lists */}
        {reports.length > 0 && (
          <section className="recent-reports">
            <h2>🕘 My Recent Interview Plans</h2>
            <ul className="reports-list">
              {reports.map((report) => (
                <li
                  key={report._id}
                  className="report-item"
                  onClick={() => navigate(`/interview/${report._id}`)}
                >
                  <h3>{report.title || "Untitled Position"}</h3>
                  <p className="report-meta">
                    Generated on{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  <p
                    className={`match-score ${report.matchScore >= 80 ? "score--high" : report.matchScore >= 60 ? "score--mid" : "score--low"}`}
                  >
                    Match Score: {report.matchScore}%
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <div className="footer-section">
          <p className="footer-text">
            AI-Powered Strategy Generation • Approx 30s
          </p>
        </div>
      </section>
    </main>
  );
};

export default Home;
