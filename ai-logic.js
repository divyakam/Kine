/* ============================================================
   KINE — AI Insight Module (Logistic Regression)
   ============================================================ */

const KINE_AI = (() => {
  'use strict';

  // --- Logistic Regression Core ---
  
  /**
   * Sigmoid activation function
   */
  function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  /**
   * Performs inference
   * @param {number[]} features - Input array
   * @param {number[]} weights - Model weights
   * @param {number} bias - Model bias
   */
  function infer(features, weights, bias) {
    let z = bias;
    for (let i = 0; i < features.length; i++) {
      z += features[i] * weights[i];
    }
    return sigmoid(z);
  }

  // --- Neck Injury Analysis ---
  
  // Hypothetical weights for neck strain based on: [Avg Angle, Time in Slouch, Correction Frequency]
  const neckInjuryWeights = [0.15, 0.08, -0.05]; 
  const neckInjuryBias = -3.2;

  /**
   * Analyzes neck injury risk
   * @param {Object} data - { avgAngle, durationHours, corrections }
   */
  function analyzeNeckHealth(data) {
    const probability = infer(
      [data.avgAngle || 0, data.durationHours || 0, data.corrections || 0],
      neckInjuryWeights,
      neckInjuryBias
    );

    let risk = 'Low';
    let suggestion = 'Your neck alignment is within healthy limits. Keep it up!';
    
    if (probability > 0.7) {
      risk = 'High';
      suggestion = 'Significant risk of repetitive strain. We recommend a 15-minute posture break and neck stretches immediately.';
    } else if (probability > 0.4) {
      risk = 'Moderate';
      suggestion = 'Slight increase in neck strain detected. Consider adjusting your monitor height.';
    }

    return { probability, risk, suggestion };
  }

  // --- Slouching Pattern Analysis ---

  // Weights for predicting 'Likely to Slouch' based on [Hour (0-23), Tiredness Factor, Session Duration]
  const slouchWeights = [0.05, 0.4, 0.1];
  const slouchBias = -4.5;

  /**
   * Predicts slouch probability for a given hour
   */
  function predictSlouchForHour(hour, tiredness, sessionLen) {
    // Basic logistic regression to find slouching trend
    return infer([hour, tiredness, sessionLen], slouchWeights, slouchBias);
  }

  /**
   * Gets insights based on current patterns
   */
  function getSlouchInsights() {
    const currentHour = new Date().getHours();
    
    // In a real app, we'd iterate over historical data. 
    // Here we'll simulate the "common times" detection.
    const patterns = [
      { time: 'Morning', prob: 0.12 },
      { time: 'Afternoon', prob: 0.78 },
      { time: 'Evening', prob: 0.45 }
    ];

    const worstTime = patterns.reduce((prev, curr) => prev.prob > curr.prob ? prev : curr);

    return {
      currentProb: predictSlouchForHour(currentHour, 0.6, 2),
      commonSlouchTime: worstTime.time,
      suggestion: `You tend to slouch most during the ${worstTime.time.toLowerCase()}. Setting a focus timer around then might help!`
    };
  }

  return {
    analyzeNeckHealth,
    getSlouchInsights
  };
})();

window.KINE_AI = KINE_AI;
