import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import Navbar from "../components/Navbar";

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "reviews"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);

      const reviewData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReviews(reviewData);
    };

    fetchReviews();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">My Reviews</h2>

        {reviews.length === 0 ? (
          <p className="text-gray-600 text-center py-10">
            No reviews yet. Go to “New Review” to start!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-indigo-50 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-lg text-indigo-700 mb-2">
                  {r.summary}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Decision:{" "}
                  <span className="font-semibold text-indigo-800">
                    {r.recommendation?.decision}
                  </span>
                </p>
                <p className="text-gray-500 text-sm">
                  Submitted on {r.date ? new Date(r.date).toLocaleString() : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviewsPage;
