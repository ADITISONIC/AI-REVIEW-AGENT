// src/pages/ReviewPage.tsx

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Loader2 } from "lucide-react";

// ✅ Define proper type interfaces
interface Review {
  summary: string;
  scores: {
    overall: number;
    originality: number;
    clarity: number;
  };
  justifications: {
    overall: string;
    originality: string;
    clarity: string;
  };
  recommendation: {
    decision: string;
    justification: string;
  };
}

const ReviewPage: React.FC = () => {
  const [abstract, setAbstract] = useState("");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null); // ✅ Proper type

  const analyzeAbstract = async () => {
    if (!abstract.trim()) {
      alert("Please enter an abstract first!");
      return;
    }
    setLoading(true);

    // Simulate AI review
    setTimeout(async () => {
      const generatedReview: Review = {
        summary:
          "This abstract discusses advanced AI techniques for text analysis.",
        scores: { overall: 4, originality: 5, clarity: 4 },
        justifications: {
          overall: "Strong conceptual clarity with practical implications.",
          originality: "Novel use of LLM reasoning layers.",
          clarity: "Well-structured and easy to follow.",
        },
        recommendation: {
          decision: "Accept",
          justification:
            "High originality and solid clarity justify acceptance.",
        },
      };

      setReview(generatedReview);

      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "reviews"), {
          userId: user.uid,
          abstract,
          ...generatedReview,
          date: new Date().toISOString(),
        });
      }

      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6">
          AI Abstract Review
        </h2>

        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          placeholder="Paste your research abstract here..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-700 mb-6"
        />

        <button
          onClick={analyzeAbstract}
          disabled={loading}
          className={`px-6 py-3 text-white font-semibold rounded-lg transition-all ${
            loading
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin w-5 h-5" /> Analyzing...
            </span>
          ) : (
            "Analyze Abstract"
          )}
        </button>

        {review && (
          <div className="mt-10 border-t pt-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Review Summary
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 p-5 rounded-xl">
                <h4 className="font-semibold text-indigo-700 mb-2">Summary</h4>
                <p className="text-gray-700">{review.summary}</p>
              </div>

              <div className="bg-indigo-50 p-5 rounded-xl">
                <h4 className="font-semibold text-indigo-700 mb-2">
                  Recommendation
                </h4>
                <p className="text-gray-800 font-semibold">
                  {review.recommendation.decision}
                </p>
                <p className="text-gray-600">
                  {review.recommendation.justification}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              {Object.entries(review.scores).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-white border border-indigo-100 shadow-sm rounded-xl py-4"
                >
                  <p className="font-semibold text-indigo-600 capitalize">
                    {key}
                  </p>
                  <p className="text-xl font-bold text-gray-800">{value}/5</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
