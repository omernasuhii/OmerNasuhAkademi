import { admin, getDb } from "../firebaseAdmin";

export async function executeSubscriptionReminders(options?: {
  studentId?: string;
  parentPhone?: string;
  force?: boolean;
}) {
  const db = getDb();
  let processedCount = 0;
  let reminderCount = 0;
  let errorCount = 0;
  const processedStudents: string[] = [];

  try {
    const now = new Date();
    const studentsSnap = await db.collection("users").where("role", "==", "student").get();

    for (const doc of studentsSnap.docs) {
      const student = doc.data();
      const currentStudentId = doc.id;

      if (options?.studentId && currentStudentId !== options.studentId) {
        continue;
      }

      processedCount++;
      const expiryDateStr = student.subscriptionExpiresAt || student.packageExpiresAt;
      if (!expiryDateStr) continue;

      const expiryDate = new Date(expiryDateStr);
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if ((diffDays <= 3 && diffDays >= -2) || options?.force) {
        reminderCount++;
        processedStudents.push(currentStudentId);

        await db.collection("subscription_reminder_logs").add({
          studentId: currentStudentId,
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          daysLeft: diffDays,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    return {
      success: true,
      processedCount,
      reminderCount,
      errorCount,
      processedStudents,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    console.error("[Subscription Reminder Service Error]", err);
    return {
      success: false,
      error: err?.message || err,
      processedCount,
      reminderCount,
      errorCount: errorCount + 1
    };
  }
}
