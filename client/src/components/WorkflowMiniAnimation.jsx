import React from 'react';
import './WorkflowMiniAnimation.css';

const WorkflowMiniAnimation = () => {
    return (
        <div className="workflow-card-container">
            <div className="workflow-track">
                {/* Step 1: Lost */}
                <div className="workflow-step step-1">
                    <div className="step-icon">🧾</div>
                    <div className="step-content">
                        <div className="step-title">Lost item</div>
                        <div className="step-subtitle">Reported</div>
                    </div>
                </div>

                <div className="workflow-arrow">➔</div>

                {/* Step 2: Found */}
                <div className="workflow-step step-2">
                    <div className="step-icon">🔔</div>
                    <div className="step-content">
                        <div className="step-title">Match</div>
                        <div className="step-subtitle">Found</div>
                    </div>
                </div>

                <div className="workflow-arrow">➔</div>

                {/* Step 3: Verified */}
                <div className="workflow-step step-3">
                    <div className="step-icon">✅</div>
                    <div className="step-content">
                        <div className="step-title">Meetup</div>
                        <div className="step-subtitle">OTP verified</div>
                    </div>
                </div>
            </div>
            {/* Optional shimmer line */}
            <div className="workflow-shimmer-line"></div>
        </div>
    );
};

export default WorkflowMiniAnimation;
