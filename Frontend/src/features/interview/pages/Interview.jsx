import React, { useState, useEffect } from "react";
import "../style/interview.scss";
import { useInterview } from "./../hooks/useInterview";
import { useNavigate, useParams } from "react-router";

const Interview = () => {
  const [activeTab, setActiveTab] = useState("technical");
  const [openQuestion, setOpenQuestion] = useState(0);

  // const report = {
  //   matchScore: 88,

  //   technicalQuestions: [
  //     {
  //       question:
  //         "Explain the Node.js event loop and how it handles asynchronous I/O operations.",
  //       intention:
  //         "To assess understanding of asynchronous architecture and non-blocking execution.",
  //       answer:
  //         "Explain phases of event loop, callback queue, microtasks, and how Node delegates async tasks to libuv.",
  //     },

  //     {
  //       question:
  //         "How do you optimize a MongoDB aggregation pipeline for high-volume data?",
  //       intention: "To test database optimization and indexing knowledge.",
  //       answer:
  //         "Talk about indexing, early filtering using $match, reducing payload size, and using explain().",
  //     },

  //     {
  //       question:
  //         "Can you describe the Cache-Aside pattern and when you would use Redis in a Node.js application?",
  //       intention:
  //         "To evaluate caching strategies and distributed systems knowledge.",
  //       answer:
  //         "Explain lazy loading cache, Redis usage for reducing DB load, and cache invalidation strategies.",
  //     },

  //     {
  //       question:
  //         "What are the challenges of migrating a monolithic application to a modular service-based architecture?",
  //       intention: "To assess scalability and architecture understanding.",
  //       answer:
  //         "Mention service communication, data consistency, deployment complexity, and monitoring.",
  //     },
  //   ],

  //   behavioralQuestions: [
  //     {
  //       question:
  //         "Tell me about a time you solved a critical production issue.",
  //       intention:
  //         "To evaluate debugging approach and calmness under pressure.",
  //       answer:
  //         "Use STAR method and explain the situation, actions, and final outcome.",
  //     },

  //     {
  //       question:
  //         "Describe a situation where you had to learn a new technology quickly.",
  //       intention: "To test adaptability and learning ability.",
  //       answer:
  //         "Mention quick research, implementation, and practical application.",
  //     },
  //   ],

  //   skillGaps: [
  //     {
  //       skill: "Message Queues (Kafka/RabbitMQ)",
  //       severity: "high",
  //     },

  //     {
  //       skill: "Advanced Docker & CI/CD Pipelines",
  //       severity: "medium",
  //     },

  //     {
  //       skill: "Distributed Systems Design",
  //       severity: "medium",
  //     },

  //     {
  //       skill: "Production-level Redis management",
  //       severity: "low",
  //     },
  //   ],

  //   preparationPlan: [
  //     {
  //       day: 1,
  //       focus: "Advanced React Optimization",
  //       tasks: [
  //         "Revise React.memo",
  //         "Study useMemo/useCallback",
  //         "Practice rendering optimization",
  //       ],
  //     },

  //     {
  //       day: 2,
  //       focus: "Node.js & Event Loop",
  //       tasks: [
  //         "Revise async architecture",
  //         "Practice streams",
  //         "Understand clustering",
  //       ],
  //     },

  //     {
  //       day: 3,
  //       focus: "MongoDB Performance",
  //       tasks: [
  //         "Aggregation pipelines",
  //         "Indexing strategies",
  //         "Query optimization",
  //       ],
  //     },

  //     {
  //       day: 4,
  //       focus: "System Design Basics",
  //       tasks: ["Redis caching", "Scalability concepts", "Rate limiting"],
  //     },

  //     {
  //       day: 5,
  //       focus: "Mock Interviews",
  //       tasks: [
  //         "Behavioral questions",
  //         "Technical mock rounds",
  //         "Resume explanation",
  //       ],
  //     },
  //   ],
  // };

  const { report, getReportById, loading, getResumePdf } = useInterview();
  const { interviewId } = useParams();
  const param = new URLSearchParams(window.location.search);

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    }
  }, [interviewId]);

  if (loading || !report) {
    return (
      <main>
        <div className="loader-container">
          <div className="loader"></div>
          <h1>Loading...</h1>
        </div>
      </main>
    );
  }

  const currentQuestions =
    activeTab === "technical"
      ? report.technicalQuestions
      : report.behavioralQuestions;

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "high":
        return "severity-high";

      case "medium":
        return "severity-medium";

      case "low":
        return "severity-low";

      default:
        return "";
    }
  };

  return (
    <main className="interview-page">
      <div className="interview-layout">
        {/* LEFT SIDEBAR */}

        <aside className="left-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-heading">SECTIONS</h3>

            <div className="sidebar-nav">
              <button
                className={`nav-item ${
                  activeTab === "technical" ? "active" : ""
                }`}
                onClick={() => setActiveTab("technical")}
              >
                Technical Questions
              </button>

              <button
                className={`nav-item ${
                  activeTab === "behavioral" ? "active" : ""
                }`}
                onClick={() => setActiveTab("behavioral")}
              >
                Behavioral Questions
              </button>

              <button
                className={`nav-item ${
                  activeTab === "roadmap" ? "active" : ""
                }`}
                onClick={() => setActiveTab("roadmap")}
              >
                Road Map
              </button>
            </div>
          </div>
          <div className="">
            <button
              onClick={() => {
                getResumePdf(interviewId);
              }}
              className="button primary-button"
            >
              Download AI generated Resume 🤖
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <section className="interview-main">
          <div className="content-top">
            <h1>
              {activeTab === "technical"
                ? "Technical Questions"
                : activeTab === "behavioral"
                  ? "Behavioral Questions"
                  : "Preparation Roadmap"}
            </h1>

            {activeTab !== "roadmap" && (
              <span className="question-count">
                {currentQuestions.length} questions
              </span>
            )}
          </div>

          {activeTab !== "roadmap" ? (
            <div className="questions-container">
              {currentQuestions.map((q, index) => (
                <div className="question-card" key={index}>
                  <div
                    className="question-header"
                    onClick={() =>
                      setOpenQuestion(openQuestion === index ? null : index)
                    }
                  >
                    <div className="question-left">
                      <span className="question-number">Q{index + 1}</span>

                      <h3 className="question-text">{q.question}</h3>
                    </div>

                    <span className="expand-icon">
                      {openQuestion === index ? "−" : "+"}
                    </span>
                  </div>

                  {openQuestion === index && (
                    <div className="question-body">
                      <div className="detail-section">
                        <h4>INTENTION</h4>
                        <p>{q.intention}</p>
                      </div>

                      <div className="detail-section">
                        <h4>HOW TO ANSWER</h4>
                        <p>{q.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="roadmap-container">
              {report.preparationPlan.map((item) => (
                <div className="roadmap-card" key={item.day}>
                  <div className="roadmap-header">
                    <span>DAY {item.day}</span>

                    <h3>{item.focus}</h3>
                  </div>

                  <ul>
                    {item.tasks.map((task, idx) => (
                      <li key={idx}>{task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT SIDEBAR */}

        <aside className="right-sidebar">
          <div className="match-card">
            <h3>MATCH SCORE</h3>

            <div className="score-circle">
              <span className="score-number">{report.matchScore}</span>

              <span className="score-percent">%</span>
            </div>

            <p className="score-text">Strong match for this role</p>
          </div>

          <div className="skill-card">
            <h3>SKILL GAPS</h3>

            <div className="skills-list">
              {report.skillGaps.map((gap, index) => (
                <div
                  key={index}
                  className={`skill-pill ${getSeverityClass(gap.severity)}`}
                >
                  {gap.skill}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Interview;
