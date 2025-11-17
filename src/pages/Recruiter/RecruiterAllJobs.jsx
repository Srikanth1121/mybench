import React, { useEffect, useState, useContext } from "react";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { RecruiterContext } from "../../context/RecruiterContext";

const RecruiterAllJobs = () => {
  const recruiter = useContext(RecruiterContext);

  const [jobs, setJobs] = useState([]);

  if (!recruiter) {
    return <div className="p-4">Loading...</div>;
  }

  const recruiterCountry = recruiter.country;

  useEffect(() => {
    if (!recruiterCountry) return;

    let q;

    // -----------------------------------------------
    // INDIA RECRUITER → show INDIA jobs only
    // -----------------------------------------------
    if (recruiterCountry === "India") {
      q = query(
        collection(db, "jobs"),
        where("country", "==", "India"),
        where("status", "==", "Active"),
        where("visibility", "in", ["recruiters", "both"]),
        orderBy("createdAt", "desc")
      );
    }

    // -----------------------------------------------
    // USA RECRUITER → show USA jobs only
    // -----------------------------------------------
    else if (recruiterCountry === "USA") {
      q = query(
        collection(db, "jobs"),
        where("country", "==", "USA"),
        where("status", "==", "Active"),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(list);
    });

    return () => unsubscribe();
  }, [recruiterCountry]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">All Jobs ({recruiterCountry})</h1>

      <div className="space-y-3">
        {jobs.length === 0 && (
          <p>No active jobs available for {recruiterCountry}.</p>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="border p-3 rounded shadow-sm bg-white"
          >
            <h3 className="text-lg font-semibold">{job.jobTitle}</h3>

            <p className="text-sm text-gray-600">
              {job.company}
            </p>

            <p className="text-sm">{job.jobLocation}</p>
            <p className="text-sm">Type: {job.jobType}</p>

            {recruiterCountry === "India" && (
              <p className="text-xs text-gray-500 mt-1">
                Visible to: {job.visibility}
              </p>
            )}

            <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecruiterAllJobs;
