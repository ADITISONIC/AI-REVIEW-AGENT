// src/components/ReviewList.tsx

import React from "react";

interface ReviewListProps {
  reviews: {
    id?: string;
    summary: string;
    recommendation: { decision: string; justification: string };
    scores: { overall: number; originality: number; clarity: number };
    date?: string;
  }[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (!reviews.length) {
    return (
      <div className="text-gray-500 text-center py-10">
        No reviews yet. Start reviewing abstracts!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-indigo-50 to-white hover:shadow-lg transition-all duration-200"
        >
          <h3 className="text-xl font-semibold text-indigo-700 mb-3">
            {review.summary}
          </h3>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium text-gray-700">Decision:</span>{" "}
              {review.recommendation.decision}
            </p>
            <p>
              <span className="font-medium text-gray-700">Overall:</span>{" "}
              {review.scores.overall}/5
            </p>
            <p>
              <span className="font-medium text-gray-700">Originality:</span>{" "}
              {review.scores.originality}/5
            </p>
            <p>
              <span className="font-medium text-gray-700">Clarity:</span>{" "}
              {review.scores.clarity}/5
            </p>
            <p className="text-gray-500 mt-3 text-xs">
              {review.date
                ? `Reviewed on ${new Date(review.date).toLocaleString()}`
                : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
