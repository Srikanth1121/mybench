// src/pages/Candidate/ApplicationDetails.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase/config";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { useParams } from "react-router-dom";

export default function ApplicationDetails() {
  const { appId } = useParams();
  const [app, setApp] = useState(null);
  const [job, setJob] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const aSnap = await getDoc(doc(db, "applications", appId));
        if (!aSnap.exists()) { if (mounted) setApp(null); setLoading(false); return; }
        const a = { id: aSnap.id, ...aSnap.data() };
        if (mounted) setApp(a);
        if (a.jobDocId) {
          const jSnap = await getDoc(doc(db, "jobs", a.jobDocId));
          if (jSnap.exists() && mounted) setJob({ id: jSnap.id, ...jSnap.data() });
        }
      } catch (err) {
        console.error("Load application error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [appId]);

  // realtime comments
  useEffect(() => {
    const commentsRef = collection(db, "applications", appId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error("Comments snapshot err:", err));
    return () => unsub();
  }, [appId]);

  const send = async () => {
    if (!auth.currentUser) { alert("Please login"); return; }
    if (!text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "applications", appId, "comments"), {
        senderId: auth.currentUser.uid,
        message: text.trim(),
        createdAt: serverTimestamp(),
      });

      // notify recruiter (if present)
      if (app?.recruiterId) {
        await addDoc(collection(db, "notifications"), {
          type: "message",
          applicationId: appId,
          jobDocId: app.jobDocId || null,
          recruiterId: app.recruiterId,
          candidateId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          read: false,
        });
      }

      setText("");
    } catch (err) {
      console.error("Send message error:", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!app) return <div className="p-6">Application not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Application — {job?.jobTitle || "Job"}</h2>

        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="text-sm text-slate-600">Status: <strong>{app.status}</strong></div>
          <div className="text-xs text-slate-400 mt-1">Applied: {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleString() : "—"}</div>
        </div>

        <div className="bg-white rounded-lg border p-4 mb-4">
          <h3 className="font-medium">Conversation</h3>
          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
            {comments.map(c => (
              <div key={c.id} className={`p-3 rounded ${c.senderId === auth.currentUser.uid ? "bg-indigo-50 ml-auto max-w-[80%]" : "bg-slate-100"}`}>
                <div className="text-sm">{c.message}</div>
                <div className="text-xs text-slate-400 mt-1">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : ""}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Message recruiter..." className="flex-1 px-3 py-2 border rounded" />
            <button disabled={sending} onClick={send} className="px-4 py-2 bg-indigo-600 text-white rounded">{sending ? "Sending..." : "Send"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
