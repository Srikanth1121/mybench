// src/pages/CandidateSearch/CandidateTable.jsx
import React, { useState } from "react";
import "./CandidateTable.css";

import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function CandidateTable({ candidates = [] }) {
  const [revealed, setRevealed] = useState({}); // which rows are currently revealed in UI
  const [pendingUnlock, setPendingUnlock] = useState(null); // candidate pending confirmation
  const [processing, setProcessing] = useState(false); // disable buttons during ops

  // helper: format masked email (e.g. jo***@gmail.com)
  const maskedEmail = (email = "") => {
    if (!email) return "—";
    const [local, domain] = email.split("@");
    if (!domain) return "****";
    const visible = local.slice(0, Math.min(3, local.length));
    return `${visible}***@${domain}`;
  };

  // helper: masked phone (last 4 visible)
  const maskedPhone = (phone = "") => {
    if (!phone) return "—";
    const digits = phone.replace(/\D/g, "");
    const last = digits.slice(-4);
    return `***-***-${last}`;
  };

  // click handler for View Profile button
  const onViewClick = async (candidate) => {
    // if already revealed (UI toggle) just toggle hide
    if (revealed[candidate.id]) {
      setRevealed((p) => ({ ...p, [candidate.id]: false }));
      return;
    }

    // check user login
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("Please sign in to unlock candidate contact.");
      return;
    }

    setProcessing(true);
    try {
      // check DB if already unlocked for this recruiter
      const unlockRef = doc(db, "users", uid, "unlockedCandidates", candidate.id);
      const snap = await getDoc(unlockRef);

      if (snap.exists()) {
        // already unlocked → reveal immediately
        setRevealed((p) => ({ ...p, [candidate.id]: true }));
        setProcessing(false);
        return;
      }

      // not unlocked → check credits
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const credits = userSnap.exists() ? (userSnap.data().credits || 0) : 0;

      if (credits < 10) {
        alert("Not enough credits to unlock contact (requires 10 credits).");
        setProcessing(false);
        return;
      }

      // ask user to confirm unlock — use confirmation modal state
      setPendingUnlock({ candidate, credits });
    } catch (err) {
      console.error("Error checking unlock:", err);
      alert("Unable to check unlock status. See console.");
    } finally {
      setProcessing(false);
    }
  };

  // confirm and perform unlock (deduct credits + save unlocked doc)
  const confirmUnlock = async () => {
  if (!pendingUnlock) return;

  const candidate = pendingUnlock.candidate;
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    alert("Please sign in to unlock candidate contact.");
    setPendingUnlock(null);
    return;
  }

  setProcessing(true);
  try {
    // STEP 1 — Fresh credit check
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const currentCredits = userSnap.exists() ? (userSnap.data().credits || 0) : 0;

    if (currentCredits < 10) {
      alert("Not enough credits to unlock this contact.");
      setPendingUnlock(null);
      setProcessing(false);
      return;
    }

    // STEP 2 — Deduct credits FIRST
    await updateDoc(userRef, {
      credits: currentCredits - 10,
    });

    // STEP 3 — Save unlocked candidate record
    const unlockRef = doc(db, "users", uid, "unlockedCandidates", candidate.id);
    await setDoc(unlockRef, {
      unlockedAt: new Date(),
      candidateId: candidate.id,
    });

    // STEP 4 — Reveal in UI
    setRevealed((prev) => ({
      ...prev,
      [candidate.id]: true,
    }));

  } catch (err) {
    console.error("Error unlocking candidate:", err);
    alert("Failed to unlock candidate. Credits were NOT deducted.");
  } finally {
    setPendingUnlock(null);
    setProcessing(false);
  }
};


  // cancel unlock modal
  const cancelUnlock = () => {
    setPendingUnlock(null);
  };

  // render skills as chips (handles array or comma string)
  const renderSkills = (skills) => {
    if (!skills) return <span className="muted">—</span>;
    if (Array.isArray(skills)) {
      return skills.map((s, i) => (
        <span key={i} className="skill-chip">{s}</span>
      ));
    }
    // comma separated or plain string
    return skills
      .toString()
      .split(",")
      .map((s, i) => <span key={i} className="skill-chip">{s.trim()}</span>);
  };

  return (
    <div className="table-container">
      <table className="excel-table">
        <thead>
  <tr>
   <th style={{ width: "160px" }}>Name</th>
<th style={{ width: "140px" }}>Source</th>
<th style={{ width: "160px" }}>Email</th>
<th style={{ width: "120px" }}>Phone</th>
<th style={{ width: "90px" }}>Location</th>
<th style={{ width: "70px" }}>Exp</th>
<th style={{ width: "140px" }}>CTC</th>
<th style={{ width: "100px" }}>Action</th>

  </tr>
</thead>

<tbody>
  {candidates.map((c) => {
    const isRevealed = revealed[c.id];

    return (
      <tr key={c.id}>
        
        {/* NAME */}
        <td>{c.fullName || c.name}</td>

        {/* SOURCE */}
        <td>
          {c.recruiterId ? (
            <span className="bench-tag">Bench Candidate</span>
          ) : (
            <span className="direct-tag">Direct Candidate</span>
          )}

          {c.recruiterId && (
            <div className="recruiter-info">
              <div className="rec-line"><strong>R.Name:</strong> {c.recruiterName || "—"}</div>
              <div className="rec-line"><strong>Email:</strong> {c.recruiterEmail || "—"}</div>
              <div className="rec-line"><strong>Phone:</strong> {c.recruiterPhone || "—"}</div>
            </div>
          )}
        </td>

        {/* EMAIL */}
        <td>
          {isRevealed ? (
            <span className="clear">{c.email}</span>

          ) : (
            <span className="blur">{maskedEmail(c.email)}</span>

          )}
        </td>

        {/* PHONE */}
        <td>
          {isRevealed ? (
            <span className="clear-text">{c.mobile}</span>
          ) : (
            <span className="blur-text">{maskedPhone(c.mobile)}</span>
          )}
        </td>

        {/* LOCATION */}
        <td>{c.state || "—"}</td>


        {/* EXPERIENCE */}
        <td>{c.experience ? `${c.experience} yrs` : "—"}</td>

        {/* CTC */}
        <td>
          {c.currentCTC && c.currentCTCType
            ? `${c.currentCTC} / ${c.currentCTCType}`
            : "—"}
        </td>

        {/* ACTION */}
        <td>
          <button
            className="view-btn"
            onClick={() => onViewClick(c)}
            disabled={processing || isRevealed}
          >
            {isRevealed ? "Unlocked" : "View Details"}
          </button>
        </td>

      </tr>
    );
  })}
</tbody>

      </table>

      {/* Confirmation Modal (simple inline modal) */}
      {pendingUnlock && (
        <div className="ct-modal-backdrop">
          <div className="ct-modal">
            <h3>Unlock contact details?</h3>
            <p>
              Unlock <strong>{pendingUnlock.candidate.fullName || pendingUnlock.candidate.name}</strong>'s contact details for <strong>10 credits</strong>?
            </p>

            <div className="ct-modal-actions">
              <button className="ct-btn ct-btn-cancel" onClick={cancelUnlock} disabled={processing}>
                Cancel
              </button>
              <button className="ct-btn ct-btn-confirm" onClick={confirmUnlock} disabled={processing}>
                {processing ? "Processing..." : "Unlock (10 credits)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
