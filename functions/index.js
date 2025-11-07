const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * One-time migration function
 * Converts all Firestore users with role = "company-admin"
 * into role = "companyadmin"
 */
exports.fixCompanyAdminRoles = functions.https.onRequest(async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("role", "==", "company-admin").get();

    if (snapshot.empty) {
      return res.status(200).json({ message: "✅ No users found with 'company-admin' role." });
    }

    let count = 0;
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const ref = usersRef.doc(doc.id);
      batch.update(ref, { role: "companyadmin" });
      count++;
    });

    await batch.commit();
    return res.status(200).json({ message: `✅ Updated ${count} user(s) from 'company-admin' to 'companyadmin'.` });
  } catch (error) {
    console.error("Error updating roles:", error);
    return res.status(500).json({ error: error.message });
  }
});
