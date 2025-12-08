/*
  Warnings:

  - You are about to drop the `DiscussionReply` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscussionReplyLike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Feature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MembershipFeature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserFeature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `authorId` on the `CourseDiscussion` table. All the data in the column will be lost.
  - You are about to drop the column `replyCount` on the `CourseDiscussion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,courseId]` on the table `CourseEnrollment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `CourseDiscussion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CourseEnrollment_courseId_userId_key";

-- DropIndex
DROP INDEX "DiscussionReply_authorId_idx";

-- DropIndex
DROP INDEX "DiscussionReply_discussionId_idx";

-- DropIndex
DROP INDEX "DiscussionReplyLike_replyId_userId_key";

-- DropIndex
DROP INDEX "DiscussionReplyLike_userId_idx";

-- DropIndex
DROP INDEX "DiscussionReplyLike_replyId_idx";

-- DropIndex
DROP INDEX "Feature_isActive_idx";

-- DropIndex
DROP INDEX "Feature_category_idx";

-- DropIndex
DROP INDEX "Feature_name_key";

-- DropIndex
DROP INDEX "MembershipFeature_membershipId_featureId_key";

-- DropIndex
DROP INDEX "MembershipFeature_featureId_idx";

-- DropIndex
DROP INDEX "MembershipFeature_membershipId_idx";

-- DropIndex
DROP INDEX "UserFeature_userId_featureId_key";

-- DropIndex
DROP INDEX "UserFeature_featureId_idx";

-- DropIndex
DROP INDEX "UserFeature_userId_idx";

-- DropIndex
DROP INDEX "UserFeature_transactionId_key";

-- AlterTable
ALTER TABLE "PostComment" ADD COLUMN "contentFormatted" JSONB;
ALTER TABLE "PostComment" ADD COLUMN "images" JSONB;
ALTER TABLE "PostComment" ADD COLUMN "mentionedUsers" JSONB;
ALTER TABLE "PostComment" ADD COLUMN "reactionsCount" JSONB;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "legalityDoc" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "nibDoc" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "invoiceNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "mailketingLists" JSONB;
ALTER TABLE "User" ADD COLUMN "mailketingSubscriberId" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiscussionReply";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiscussionReplyLike";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Feature";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MembershipFeature";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserFeature";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AffiliateMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT,
    "content" TEXT,
    "thumbnailUrl" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MembershipReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "membershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'AFTER_PURCHASE',
    "delayAmount" INTEGER NOT NULL,
    "delayUnit" TEXT NOT NULL DEFAULT 'days',
    "specificDate" DATETIME,
    "preferredTime" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Jakarta',
    "avoidWeekends" BOOLEAN NOT NULL DEFAULT false,
    "daysOfWeek" JSONB,
    "channels" JSONB NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "emailCTA" TEXT,
    "emailCTALink" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappMessage" TEXT,
    "whatsappCTA" TEXT,
    "whatsappCTALink" TEXT,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushTitle" TEXT,
    "pushBody" TEXT,
    "pushIcon" TEXT,
    "pushClickAction" TEXT,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inAppTitle" TEXT,
    "inAppBody" TEXT,
    "inAppLink" TEXT,
    "conditions" JSONB,
    "stopIfCondition" JSONB,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stopOnAction" BOOLEAN NOT NULL DEFAULT false,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MembershipReminder_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reminderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "failedAt" DATETIME,
    "subject" TEXT,
    "body" TEXT,
    "ctaLink" TEXT,
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "mailketingId" TEXT,
    "whatsappId" TEXT,
    "pushId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReminderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReminderLog_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "MembershipReminder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "templateData" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReminderTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMembership_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventMembership_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LessonFile_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "CourseLesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'DIRECT',
    "name" TEXT,
    "avatar" TEXT,
    "user1Id" TEXT,
    "user2Id" TEXT,
    "groupId" TEXT,
    "lastMessageAt" DATETIME,
    "lastMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatRoom_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" DATETIME,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TypingIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isTyping" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "TypingIndicator_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subscriptionType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "enableEmail" BOOLEAN NOT NULL DEFAULT true,
    "enableWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "enablePush" BOOLEAN NOT NULL DEFAULT true,
    "enableInApp" BOOLEAN NOT NULL DEFAULT true,
    "isAutoSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "enableAllEmail" BOOLEAN NOT NULL DEFAULT true,
    "enableAllWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "enableAllPush" BOOLEAN NOT NULL DEFAULT true,
    "enableAllInApp" BOOLEAN NOT NULL DEFAULT true,
    "chatNotifications" BOOLEAN NOT NULL DEFAULT true,
    "commentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "postNotifications" BOOLEAN NOT NULL DEFAULT true,
    "courseNotifications" BOOLEAN NOT NULL DEFAULT true,
    "eventNotifications" BOOLEAN NOT NULL DEFAULT true,
    "transactionNotifications" BOOLEAN NOT NULL DEFAULT true,
    "followerNotifications" BOOLEAN NOT NULL DEFAULT true,
    "achievementNotifications" BOOLEAN NOT NULL DEFAULT true,
    "systemNotifications" BOOLEAN NOT NULL DEFAULT true,
    "affiliateNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableQuietHours" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MembershipDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "minimumLevel" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MembershipDocument_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentDownloadLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "membershipLevel" TEXT NOT NULL,
    "downloadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "adminVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "DocumentDownloadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DocumentDownloadLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MembershipDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "likedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BuyerLike_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuyerLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseNote_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "moderatedBy" TEXT,
    "moderatedAt" DATETIME,
    "moderationNote" TEXT,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseReview_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseReviewHelpful" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseReviewHelpful_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseReviewHelpful_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "CourseReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT,
    "textColor" TEXT NOT NULL DEFAULT '#1F2937',
    "layout" TEXT NOT NULL DEFAULT 'MODERN',
    "logoUrl" TEXT,
    "signatureUrl" TEXT,
    "backgroundImage" TEXT,
    "borderStyle" TEXT,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "titleFontSize" TEXT NOT NULL DEFAULT '3xl',
    "mentorName" TEXT,
    "directorName" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showSignature" BOOLEAN NOT NULL DEFAULT true,
    "showQrCode" BOOLEAN NOT NULL DEFAULT true,
    "showBorder" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Story_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupResource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupResource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "originalPrice" DECIMAL,
    "features" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplierMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL NOT NULL,
    "paymentId" TEXT,
    "paymentMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierMembership_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SupplierPackage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "bio" TEXT,
    "businessCategory" TEXT,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "legalityDoc" TEXT,
    "nibDoc" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" DATETIME,
    "suspendedBy" TEXT,
    "suspendReason" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "totalChats" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "images" JSONB,
    "documents" JSONB,
    "category" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "price" TEXT,
    "minOrder" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupQuiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "timeLimit" INTEGER,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "rewardPoints" INTEGER NOT NULL DEFAULT 10,
    "rewardBadgeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupQuiz_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupQuiz_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroupQuiz_rewardBadgeId_fkey" FOREIGN KEY ("rewardBadgeId") REFERENCES "BadgeDefinition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupQuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" JSONB NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "GroupQuiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupQuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 0,
    "percentage" REAL NOT NULL DEFAULT 0,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "timeSpent" INTEGER,
    CONSTRAINT "GroupQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "GroupQuiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupQuizAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupQuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "GroupQuizAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupQuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GroupQuizQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "category" TEXT NOT NULL DEFAULT 'PARTICIPATION',
    "conditions" JSONB,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "groupId" TEXT,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedBy" TEXT,
    "reason" TEXT,
    CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBadge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPoints_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PointTransaction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "target" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "rewardPoints" INTEGER NOT NULL DEFAULT 50,
    "rewardBadgeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupChallenge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChallengProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "rank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChallengProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "GroupChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentFormatted" JSONB,
    "images" JSONB,
    "videos" JSONB,
    "documents" JSONB,
    "type" TEXT NOT NULL DEFAULT 'POST',
    "scheduledAt" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "publishedPostId" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduledPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AffiliateChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetValue" DECIMAL NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardValue" DECIMAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "membershipId" TEXT,
    "productId" TEXT,
    "courseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AffiliateChallenge_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AffiliateChallenge_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AffiliateChallenge_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AffiliateChallenge" ("createdAt", "description", "endDate", "id", "isActive", "rewardType", "rewardValue", "startDate", "targetType", "targetValue", "title", "updatedAt") SELECT "createdAt", "description", "endDate", "id", "isActive", "rewardType", "rewardValue", "startDate", "targetType", "targetValue", "title", "updatedAt" FROM "AffiliateChallenge";
DROP TABLE "AffiliateChallenge";
ALTER TABLE "new_AffiliateChallenge" RENAME TO "AffiliateChallenge";
CREATE INDEX "AffiliateChallenge_startDate_endDate_idx" ON "AffiliateChallenge"("startDate", "endDate");
CREATE INDEX "AffiliateChallenge_membershipId_idx" ON "AffiliateChallenge"("membershipId");
CREATE INDEX "AffiliateChallenge_productId_idx" ON "AffiliateChallenge"("productId");
CREATE INDEX "AffiliateChallenge_courseId_idx" ON "AffiliateChallenge"("courseId");
CREATE TABLE "new_AffiliateChallengeProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challengeId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "currentValue" DECIMAL NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" DATETIME,
    "rewardStatus" TEXT NOT NULL DEFAULT 'NOT_CLAIMED',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AffiliateChallengeProgress_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateChallengeProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "AffiliateChallenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateChallengeProgress_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AffiliateChallengeProgress" ("affiliateId", "challengeId", "claimedAt", "completed", "completedAt", "createdAt", "currentValue", "id", "rewardClaimed", "updatedAt") SELECT "affiliateId", "challengeId", "claimedAt", "completed", "completedAt", "createdAt", "currentValue", "id", "rewardClaimed", "updatedAt" FROM "AffiliateChallengeProgress";
DROP TABLE "AffiliateChallengeProgress";
ALTER TABLE "new_AffiliateChallengeProgress" RENAME TO "AffiliateChallengeProgress";
CREATE INDEX "AffiliateChallengeProgress_affiliateId_idx" ON "AffiliateChallengeProgress"("affiliateId");
CREATE INDEX "AffiliateChallengeProgress_challengeId_idx" ON "AffiliateChallengeProgress"("challengeId");
CREATE INDEX "AffiliateChallengeProgress_rewardStatus_idx" ON "AffiliateChallengeProgress"("rewardStatus");
CREATE UNIQUE INDEX "AffiliateChallengeProgress_challengeId_affiliateId_key" ON "AffiliateChallengeProgress"("challengeId", "affiliateId");
CREATE TABLE "new_AffiliateLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "affiliateId" TEXT,
    "productId" TEXT,
    "membershipId" TEXT,
    "courseId" TEXT,
    "supplierId" TEXT,
    "code" TEXT NOT NULL,
    "shortCode" TEXT,
    "fullUrl" TEXT,
    "couponCode" TEXT,
    "linkType" TEXT NOT NULL DEFAULT 'CHECKOUT',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AffiliateLink_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateLink_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AffiliateLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateLink_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateLink_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AffiliateLink" ("affiliateId", "clicks", "code", "conversions", "couponCode", "courseId", "createdAt", "expiresAt", "fullUrl", "id", "isActive", "isArchived", "linkType", "membershipId", "productId", "shortCode", "updatedAt", "userId") SELECT "affiliateId", "clicks", "code", "conversions", "couponCode", "courseId", "createdAt", "expiresAt", "fullUrl", "id", "isActive", "isArchived", "linkType", "membershipId", "productId", "shortCode", "updatedAt", "userId" FROM "AffiliateLink";
DROP TABLE "AffiliateLink";
ALTER TABLE "new_AffiliateLink" RENAME TO "AffiliateLink";
CREATE UNIQUE INDEX "AffiliateLink_code_key" ON "AffiliateLink"("code");
CREATE UNIQUE INDEX "AffiliateLink_shortCode_key" ON "AffiliateLink"("shortCode");
CREATE INDEX "AffiliateLink_userId_idx" ON "AffiliateLink"("userId");
CREATE INDEX "AffiliateLink_affiliateId_idx" ON "AffiliateLink"("affiliateId");
CREATE INDEX "AffiliateLink_code_idx" ON "AffiliateLink"("code");
CREATE INDEX "AffiliateLink_shortCode_idx" ON "AffiliateLink"("shortCode");
CREATE TABLE "new_Buyer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productName" TEXT,
    "productSpecs" TEXT,
    "quantity" TEXT,
    "shippingTerms" TEXT,
    "destinationPort" TEXT,
    "paymentTerms" TEXT,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "businessType" TEXT,
    "productsInterest" TEXT,
    "annualImport" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "rating" REAL DEFAULT 0,
    "totalDeals" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "notes" TEXT,
    "addedBy" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Buyer_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Buyer" ("addedBy", "address", "annualImport", "businessType", "city", "companyName", "contactPerson", "country", "createdAt", "email", "id", "isVerified", "notes", "phone", "productsInterest", "rating", "tags", "totalDeals", "updatedAt", "verifiedAt", "verifiedBy", "viewCount", "website") SELECT "addedBy", "address", "annualImport", "businessType", "city", "companyName", "contactPerson", "country", "createdAt", "email", "id", "isVerified", "notes", "phone", "productsInterest", "rating", "tags", "totalDeals", "updatedAt", "verifiedAt", "verifiedBy", "viewCount", "website" FROM "Buyer";
DROP TABLE "Buyer";
ALTER TABLE "new_Buyer" RENAME TO "Buyer";
CREATE INDEX "Buyer_country_idx" ON "Buyer"("country");
CREATE INDEX "Buyer_isVerified_idx" ON "Buyer"("isVerified");
CREATE INDEX "Buyer_addedBy_idx" ON "Buyer"("addedBy");
CREATE INDEX "Buyer_likeCount_idx" ON "Buyer"("likeCount");
CREATE INDEX "Buyer_productName_idx" ON "Buyer"("productName");
CREATE TABLE "new_BuyerView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BuyerView_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuyerView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BuyerView" ("buyerId", "id", "userId", "viewedAt") SELECT "buyerId", "id", "userId", "viewedAt" FROM "BuyerView";
DROP TABLE "BuyerView";
ALTER TABLE "new_BuyerView" RENAME TO "BuyerView";
CREATE INDEX "BuyerView_userId_viewedAt_idx" ON "BuyerView"("userId", "viewedAt");
CREATE INDEX "BuyerView_buyerId_idx" ON "BuyerView"("buyerId");
CREATE TABLE "new_Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentName" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "completionDate" DATETIME NOT NULL,
    "certificateTemplateId" TEXT,
    "pdfUrl" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "verificationUrl" TEXT,
    CONSTRAINT "Certificate_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "CertificateTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("certificateNumber", "completedAt", "completionDate", "courseId", "courseName", "id", "isValid", "issuedAt", "pdfUrl", "studentName", "userId", "verificationUrl") SELECT "certificateNumber", "completedAt", "completionDate", "courseId", "courseName", "id", "isValid", "issuedAt", "pdfUrl", "studentName", "userId", "verificationUrl" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");
CREATE INDEX "Certificate_certificateNumber_idx" ON "Certificate"("certificateNumber");
CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "Certificate"("userId", "courseId");
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "checkoutSlug" TEXT,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT,
    "price" DECIMAL NOT NULL,
    "originalPrice" DECIMAL,
    "mentorCommissionPercent" REAL NOT NULL DEFAULT 50,
    "duration" INTEGER,
    "level" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "submittedForReviewAt" DATETIME,
    "reviewedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "monetizationType" TEXT NOT NULL DEFAULT 'FREE',
    "groupId" TEXT,
    "reminders" JSONB,
    "enrollmentCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL NOT NULL DEFAULT 0,
    "formLogo" TEXT,
    "formBanner" TEXT,
    "formDescription" TEXT,
    "certificateTemplateId" TEXT,
    "mailketingListId" TEXT,
    "mailketingListName" TEXT,
    "autoAddToList" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "CertificateTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("checkoutSlug", "createdAt", "description", "duration", "enrollmentCount", "formBanner", "formDescription", "formLogo", "groupId", "id", "isPublished", "level", "mentorCommissionPercent", "mentorId", "originalPrice", "price", "publishedAt", "rating", "reminders", "slug", "thumbnail", "title", "updatedAt") SELECT "checkoutSlug", "createdAt", "description", "duration", "enrollmentCount", "formBanner", "formDescription", "formLogo", "groupId", "id", "isPublished", "level", "mentorCommissionPercent", "mentorId", "originalPrice", "price", "publishedAt", "rating", "reminders", "slug", "thumbnail", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE UNIQUE INDEX "Course_checkoutSlug_key" ON "Course"("checkoutSlug");
CREATE INDEX "Course_mentorId_idx" ON "Course"("mentorId");
CREATE INDEX "Course_isPublished_idx" ON "Course"("isPublished");
CREATE INDEX "Course_status_idx" ON "Course"("status");
CREATE INDEX "Course_monetizationType_idx" ON "Course"("monetizationType");
CREATE TABLE "new_CourseDiscussion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "isMarkedSolved" BOOLEAN NOT NULL DEFAULT false,
    "solvedBy" TEXT,
    "solvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseDiscussion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CourseDiscussion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseDiscussion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseDiscussion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CourseDiscussion" ("content", "courseId", "createdAt", "id", "isMarkedSolved", "solvedAt", "solvedBy", "title", "updatedAt", "viewCount") SELECT "content", "courseId", "createdAt", "id", "isMarkedSolved", "solvedAt", "solvedBy", "title", "updatedAt", "viewCount" FROM "CourseDiscussion";
DROP TABLE "CourseDiscussion";
ALTER TABLE "new_CourseDiscussion" RENAME TO "CourseDiscussion";
CREATE INDEX "CourseDiscussion_courseId_idx" ON "CourseDiscussion"("courseId");
CREATE INDEX "CourseDiscussion_userId_idx" ON "CourseDiscussion"("userId");
CREATE INDEX "CourseDiscussion_lessonId_idx" ON "CourseDiscussion"("lessonId");
CREATE INDEX "CourseDiscussion_parentId_idx" ON "CourseDiscussion"("parentId");
CREATE INDEX "CourseDiscussion_isMarkedSolved_idx" ON "CourseDiscussion"("isMarkedSolved");
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "avatar" TEXT,
    "coverImage" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PUBLIC',
    "ownerId" TEXT NOT NULL,
    "bannedWords" JSONB,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "postingSettings" JSONB,
    "allowRichText" BOOLEAN NOT NULL DEFAULT true,
    "allowMedia" BOOLEAN NOT NULL DEFAULT true,
    "allowPolls" BOOLEAN NOT NULL DEFAULT true,
    "allowEvents" BOOLEAN NOT NULL DEFAULT true,
    "allowScheduling" BOOLEAN NOT NULL DEFAULT true,
    "allowReactions" BOOLEAN NOT NULL DEFAULT true,
    "allowMentions" BOOLEAN NOT NULL DEFAULT true,
    "moderatesPosts" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "slug" TEXT,
    CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("avatar", "bannedWords", "coverImage", "createdAt", "description", "id", "isActive", "name", "ownerId", "requireApproval", "type", "updatedAt") SELECT "avatar", "bannedWords", "coverImage", "createdAt", "description", "id", "isActive", "name", "ownerId", "requireApproval", "type", "updatedAt" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");
CREATE INDEX "Group_ownerId_idx" ON "Group"("ownerId");
CREATE INDEX "Group_type_idx" ON "Group"("type");
CREATE TABLE "new_Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "checkoutSlug" TEXT,
    "checkoutTemplate" TEXT DEFAULT 'modern',
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "originalPrice" DECIMAL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "affiliateCommissionRate" DECIMAL NOT NULL DEFAULT 30,
    "features" JSONB NOT NULL,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isMostPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "salesPageUrl" TEXT,
    "alternativeUrl" TEXT,
    "reminders" JSONB,
    "formLogo" TEXT,
    "formBanner" TEXT,
    "formDescription" TEXT,
    "mailketingListId" TEXT,
    "mailketingListName" TEXT,
    "autoAddToList" BOOLEAN NOT NULL DEFAULT true,
    "autoRemoveOnExpire" BOOLEAN NOT NULL DEFAULT false,
    "showInGeneralCheckout" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Membership" ("affiliateCommissionRate", "alternativeUrl", "checkoutSlug", "checkoutTemplate", "commissionType", "createdAt", "description", "discount", "duration", "features", "formBanner", "formDescription", "formLogo", "id", "isActive", "isBestSeller", "isMostPopular", "isPopular", "name", "originalPrice", "price", "reminders", "salesPageUrl", "slug", "updatedAt") SELECT "affiliateCommissionRate", "alternativeUrl", "checkoutSlug", "checkoutTemplate", "commissionType", "createdAt", "description", "discount", "duration", "features", "formBanner", "formDescription", "formLogo", "id", "isActive", "isBestSeller", "isMostPopular", "isPopular", "name", "originalPrice", "price", "reminders", "salesPageUrl", "slug", "updatedAt" FROM "Membership";
DROP TABLE "Membership";
ALTER TABLE "new_Membership" RENAME TO "Membership";
CREATE UNIQUE INDEX "Membership_slug_key" ON "Membership"("slug");
CREATE UNIQUE INDEX "Membership_checkoutSlug_key" ON "Membership"("checkoutSlug");
CREATE INDEX "Membership_duration_idx" ON "Membership"("duration");
CREATE INDEX "Membership_isActive_idx" ON "Membership"("isActive");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    "reactions" JSONB,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "id", "isRead", "readAt", "receiverId", "senderId") SELECT "content", "createdAt", "id", "isRead", "readAt", "receiverId", "senderId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");
CREATE INDEX "Message_roomId_idx" ON "Message"("roomId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "postId" TEXT,
    "commentId" TEXT,
    "eventId" TEXT,
    "courseId" TEXT,
    "groupId" TEXT,
    "transactionId" TEXT,
    "link" TEXT,
    "redirectUrl" TEXT,
    "image" TEXT,
    "icon" TEXT,
    "channels" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    "isClicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" DATETIME,
    "metadata" JSONB,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorAvatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "isRead", "link", "message", "readAt", "title", "type", "userId") SELECT "createdAt", "id", "isRead", "link", "message", "readAt", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_sourceType_sourceId_idx" ON "Notification"("sourceType", "sourceId");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "groupId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'POST',
    "content" TEXT NOT NULL,
    "contentFormatted" JSONB,
    "images" JSONB,
    "videos" JSONB,
    "documents" JSONB,
    "linkPreview" JSONB,
    "location" JSONB,
    "pollData" JSONB,
    "eventData" JSONB,
    "quoteStyle" JSONB,
    "taggedUsers" JSONB,
    "metadata" JSONB,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" DATETIME,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "reactionsCount" JSONB,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("approvalStatus", "authorId", "commentsCount", "content", "createdAt", "expiresAt", "groupId", "id", "images", "isPinned", "likesCount", "metadata", "sharesCount", "type", "updatedAt") SELECT "approvalStatus", "authorId", "commentsCount", "content", "createdAt", "expiresAt", "groupId", "id", "images", "isPinned", "likesCount", "metadata", "sharesCount", "type", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_groupId_idx" ON "Post"("groupId");
CREATE INDEX "Post_type_idx" ON "Post"("type");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_isScheduled_scheduledAt_idx" ON "Post"("isScheduled", "scheduledAt");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "checkoutSlug" TEXT,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "price" DECIMAL NOT NULL,
    "originalPrice" DECIMAL,
    "thumbnail" TEXT,
    "images" JSONB,
    "salesPageUrl" TEXT,
    "externalSalesUrl" TEXT,
    "reminders" JSONB,
    "category" TEXT,
    "tags" JSONB,
    "productType" TEXT NOT NULL DEFAULT 'DIGITAL',
    "productStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "accessLevel" TEXT NOT NULL DEFAULT 'PUBLIC',
    "eventDate" DATETIME,
    "eventEndDate" DATETIME,
    "eventDuration" INTEGER,
    "eventUrl" TEXT,
    "meetingId" TEXT,
    "meetingPassword" TEXT,
    "eventVisibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "eventPassword" TEXT,
    "maxParticipants" INTEGER,
    "reminderSent7Days" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent3Days" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent1Day" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent1Hour" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent15Min" BOOLEAN NOT NULL DEFAULT false,
    "enableUpsale" BOOLEAN NOT NULL DEFAULT true,
    "upsaleTargetMemberships" TEXT,
    "upsaleDiscount" INTEGER NOT NULL DEFAULT 0,
    "upsaleMessage" TEXT,
    "commissionType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "affiliateCommissionRate" DECIMAL NOT NULL DEFAULT 30,
    "mentorCommission" DECIMAL NOT NULL DEFAULT 30,
    "groupId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "formLogo" TEXT,
    "formBanner" TEXT,
    "formDescription" TEXT,
    "mailketingListId" TEXT,
    "mailketingListName" TEXT,
    "autoAddToList" BOOLEAN NOT NULL DEFAULT true,
    "seoMetaTitle" TEXT,
    "seoMetaDescription" TEXT,
    "seoKeywords" TEXT,
    "ctaButtonText" TEXT,
    "faqs" JSONB,
    "testimonials" JSONB,
    "bonuses" JSONB,
    "downloadableFiles" JSONB,
    "trackingPixels" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("affiliateCommissionRate", "category", "checkoutSlug", "commissionType", "createdAt", "creatorId", "description", "externalSalesUrl", "formBanner", "formDescription", "formLogo", "groupId", "id", "images", "isActive", "isFeatured", "mentorCommission", "name", "originalPrice", "price", "reminders", "salesPageUrl", "shortDescription", "slug", "soldCount", "stock", "tags", "thumbnail", "updatedAt") SELECT "affiliateCommissionRate", "category", "checkoutSlug", "commissionType", "createdAt", "creatorId", "description", "externalSalesUrl", "formBanner", "formDescription", "formLogo", "groupId", "id", "images", "isActive", "isFeatured", "mentorCommission", "name", "originalPrice", "price", "reminders", "salesPageUrl", "shortDescription", "slug", "soldCount", "stock", "tags", "thumbnail", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_checkoutSlug_key" ON "Product"("checkoutSlug");
CREATE INDEX "Product_creatorId_idx" ON "Product"("creatorId");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "revenueEnabled" BOOLEAN NOT NULL DEFAULT true,
    "affiliateCommissionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mentorCommissionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "paymentExpiryHours" INTEGER NOT NULL DEFAULT 72,
    "followUpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "followUp1HourEnabled" BOOLEAN NOT NULL DEFAULT true,
    "followUp24HourEnabled" BOOLEAN NOT NULL DEFAULT true,
    "followUp48HourEnabled" BOOLEAN NOT NULL DEFAULT true,
    "followUpMessage1Hour" TEXT DEFAULT 'Halo {name}, pembayaran Anda sebesar Rp {amount} masih menunggu. Segera selesaikan dalam {timeLeft}. Link: {paymentUrl}',
    "followUpMessage24Hour" TEXT DEFAULT 'Reminder: Pembayaran Anda akan kadaluarsa dalam {timeLeft}. Segera bayar sebelum terlambat!',
    "followUpMessage48Hour" TEXT DEFAULT 'Last chance! Pembayaran Anda akan dibatalkan otomatis jika tidak diselesaikan dalam {timeLeft}.',
    "mailkitingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mailkitingApiKey" TEXT,
    "starsenderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "starsenderApiKey" TEXT,
    "onesignalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "onesignalAppId" TEXT,
    "onesignalApiKey" TEXT,
    "pusherEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pusherAppId" TEXT,
    "pusherKey" TEXT,
    "pusherSecret" TEXT,
    "pusherCluster" TEXT DEFAULT 'ap1',
    "challengeRewardAutoApprove" BOOLEAN NOT NULL DEFAULT false,
    "challengeRewardAutoApproveLimit" DECIMAL DEFAULT 500000,
    "siteTitle" TEXT DEFAULT 'Eksporyuk',
    "siteDescription" TEXT DEFAULT 'Platform Ekspor Indonesia',
    "siteLogo" TEXT,
    "siteFavicon" TEXT,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "secondaryColor" TEXT DEFAULT '#1F2937',
    "headerText" TEXT,
    "footerText" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "whatsappNumber" TEXT,
    "instagramUrl" TEXT,
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "customCss" TEXT,
    "customJs" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "defaultLanguage" TEXT DEFAULT 'id',
    "bannerImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("affiliateCommissionEnabled", "createdAt", "followUp1HourEnabled", "followUp24HourEnabled", "followUp48HourEnabled", "followUpEnabled", "followUpMessage1Hour", "followUpMessage24Hour", "followUpMessage48Hour", "id", "mailkitingApiKey", "mailkitingEnabled", "mentorCommissionEnabled", "onesignalApiKey", "onesignalAppId", "onesignalEnabled", "paymentExpiryHours", "pusherAppId", "pusherCluster", "pusherEnabled", "pusherKey", "pusherSecret", "revenueEnabled", "starsenderApiKey", "starsenderEnabled", "updatedAt") SELECT "affiliateCommissionEnabled", "createdAt", "followUp1HourEnabled", "followUp24HourEnabled", "followUp48HourEnabled", "followUpEnabled", "followUpMessage1Hour", "followUpMessage24Hour", "followUpMessage48Hour", "id", "mailkitingApiKey", "mailkitingEnabled", "mentorCommissionEnabled", "onesignalApiKey", "onesignalAppId", "onesignalEnabled", "paymentExpiryHours", "pusherAppId", "pusherCluster", "pusherEnabled", "pusherKey", "pusherSecret", "revenueEnabled", "starsenderApiKey", "starsenderEnabled", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AffiliateMaterial_type_idx" ON "AffiliateMaterial"("type");

-- CreateIndex
CREATE INDEX "AffiliateMaterial_category_idx" ON "AffiliateMaterial"("category");

-- CreateIndex
CREATE INDEX "AffiliateMaterial_isActive_idx" ON "AffiliateMaterial"("isActive");

-- CreateIndex
CREATE INDEX "MembershipReminder_membershipId_idx" ON "MembershipReminder"("membershipId");

-- CreateIndex
CREATE INDEX "MembershipReminder_triggerType_idx" ON "MembershipReminder"("triggerType");

-- CreateIndex
CREATE INDEX "MembershipReminder_sequenceOrder_idx" ON "MembershipReminder"("sequenceOrder");

-- CreateIndex
CREATE INDEX "MembershipReminder_isActive_idx" ON "MembershipReminder"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipReminder_membershipId_title_key" ON "MembershipReminder"("membershipId", "title");

-- CreateIndex
CREATE INDEX "ReminderLog_reminderId_idx" ON "ReminderLog"("reminderId");

-- CreateIndex
CREATE INDEX "ReminderLog_userId_idx" ON "ReminderLog"("userId");

-- CreateIndex
CREATE INDEX "ReminderLog_channel_idx" ON "ReminderLog"("channel");

-- CreateIndex
CREATE INDEX "ReminderLog_status_idx" ON "ReminderLog"("status");

-- CreateIndex
CREATE INDEX "ReminderLog_scheduledAt_idx" ON "ReminderLog"("scheduledAt");

-- CreateIndex
CREATE INDEX "ReminderLog_sentAt_idx" ON "ReminderLog"("sentAt");

-- CreateIndex
CREATE INDEX "ReminderTemplate_category_idx" ON "ReminderTemplate"("category");

-- CreateIndex
CREATE INDEX "ReminderTemplate_createdBy_idx" ON "ReminderTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "EventMembership_productId_idx" ON "EventMembership"("productId");

-- CreateIndex
CREATE INDEX "EventMembership_membershipId_idx" ON "EventMembership"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "EventMembership_productId_membershipId_key" ON "EventMembership"("productId", "membershipId");

-- CreateIndex
CREATE INDEX "EventGroup_productId_idx" ON "EventGroup"("productId");

-- CreateIndex
CREATE INDEX "EventGroup_groupId_idx" ON "EventGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "EventGroup_productId_groupId_key" ON "EventGroup"("productId", "groupId");

-- CreateIndex
CREATE INDEX "LessonFile_lessonId_idx" ON "LessonFile"("lessonId");

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "PostReaction"("postId");

-- CreateIndex
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_userId_type_key" ON "PostReaction"("postId", "userId", "type");

-- CreateIndex
CREATE INDEX "CommentReaction_commentId_idx" ON "CommentReaction"("commentId");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "CommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_type_key" ON "CommentReaction"("commentId", "userId", "type");

-- CreateIndex
CREATE INDEX "ChatRoom_user1Id_user2Id_idx" ON "ChatRoom"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "ChatRoom_groupId_idx" ON "ChatRoom"("groupId");

-- CreateIndex
CREATE INDEX "ChatRoom_lastMessageAt_idx" ON "ChatRoom"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE INDEX "ChatParticipant_roomId_idx" ON "ChatParticipant"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_roomId_userId_key" ON "ChatParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "TypingIndicator_roomId_idx" ON "TypingIndicator"("roomId");

-- CreateIndex
CREATE INDEX "TypingIndicator_expiresAt_idx" ON "TypingIndicator"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_roomId_userId_key" ON "TypingIndicator"("roomId", "userId");

-- CreateIndex
CREATE INDEX "NotificationSubscription_userId_idx" ON "NotificationSubscription"("userId");

-- CreateIndex
CREATE INDEX "NotificationSubscription_targetId_idx" ON "NotificationSubscription"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSubscription_userId_subscriptionType_targetId_key" ON "NotificationSubscription"("userId", "subscriptionType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "MembershipDocument_category_idx" ON "MembershipDocument"("category");

-- CreateIndex
CREATE INDEX "MembershipDocument_minimumLevel_idx" ON "MembershipDocument"("minimumLevel");

-- CreateIndex
CREATE INDEX "MembershipDocument_isActive_idx" ON "MembershipDocument"("isActive");

-- CreateIndex
CREATE INDEX "MembershipDocument_createdAt_idx" ON "MembershipDocument"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentDownloadLog_userId_idx" ON "DocumentDownloadLog"("userId");

-- CreateIndex
CREATE INDEX "DocumentDownloadLog_documentId_idx" ON "DocumentDownloadLog"("documentId");

-- CreateIndex
CREATE INDEX "DocumentDownloadLog_downloadedAt_idx" ON "DocumentDownloadLog"("downloadedAt");

-- CreateIndex
CREATE INDEX "DocumentDownloadLog_adminVerified_idx" ON "DocumentDownloadLog"("adminVerified");

-- CreateIndex
CREATE INDEX "BuyerLike_userId_idx" ON "BuyerLike"("userId");

-- CreateIndex
CREATE INDEX "BuyerLike_buyerId_idx" ON "BuyerLike"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerLike_userId_buyerId_key" ON "BuyerLike"("userId", "buyerId");

-- CreateIndex
CREATE INDEX "CourseNote_userId_idx" ON "CourseNote"("userId");

-- CreateIndex
CREATE INDEX "CourseNote_courseId_idx" ON "CourseNote"("courseId");

-- CreateIndex
CREATE INDEX "CourseNote_lessonId_idx" ON "CourseNote"("lessonId");

-- CreateIndex
CREATE INDEX "CourseReview_courseId_idx" ON "CourseReview"("courseId");

-- CreateIndex
CREATE INDEX "CourseReview_userId_idx" ON "CourseReview"("userId");

-- CreateIndex
CREATE INDEX "CourseReview_rating_idx" ON "CourseReview"("rating");

-- CreateIndex
CREATE INDEX "CourseReview_isApproved_idx" ON "CourseReview"("isApproved");

-- CreateIndex
CREATE INDEX "CourseReview_createdAt_idx" ON "CourseReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseReview_userId_courseId_key" ON "CourseReview"("userId", "courseId");

-- CreateIndex
CREATE INDEX "CourseReviewHelpful_reviewId_idx" ON "CourseReviewHelpful"("reviewId");

-- CreateIndex
CREATE INDEX "CourseReviewHelpful_userId_idx" ON "CourseReviewHelpful"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseReviewHelpful_reviewId_userId_key" ON "CourseReviewHelpful"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "CertificateTemplate_isActive_idx" ON "CertificateTemplate"("isActive");

-- CreateIndex
CREATE INDEX "CertificateTemplate_isDefault_idx" ON "CertificateTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "Story_groupId_idx" ON "Story"("groupId");

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Story_expiresAt_idx" ON "Story"("expiresAt");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- CreateIndex
CREATE INDEX "StoryView_storyId_idx" ON "StoryView"("storyId");

-- CreateIndex
CREATE INDEX "StoryView_userId_idx" ON "StoryView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_storyId_userId_key" ON "StoryView"("storyId", "userId");

-- CreateIndex
CREATE INDEX "GroupResource_groupId_idx" ON "GroupResource"("groupId");

-- CreateIndex
CREATE INDEX "GroupResource_uploaderId_idx" ON "GroupResource"("uploaderId");

-- CreateIndex
CREATE INDEX "GroupResource_createdAt_idx" ON "GroupResource"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPackage_slug_key" ON "SupplierPackage"("slug");

-- CreateIndex
CREATE INDEX "SupplierPackage_type_idx" ON "SupplierPackage"("type");

-- CreateIndex
CREATE INDEX "SupplierPackage_isActive_idx" ON "SupplierPackage"("isActive");

-- CreateIndex
CREATE INDEX "SupplierPackage_displayOrder_idx" ON "SupplierPackage"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierMembership_userId_key" ON "SupplierMembership"("userId");

-- CreateIndex
CREATE INDEX "SupplierMembership_userId_idx" ON "SupplierMembership"("userId");

-- CreateIndex
CREATE INDEX "SupplierMembership_packageId_idx" ON "SupplierMembership"("packageId");

-- CreateIndex
CREATE INDEX "SupplierMembership_isActive_idx" ON "SupplierMembership"("isActive");

-- CreateIndex
CREATE INDEX "SupplierMembership_endDate_idx" ON "SupplierMembership"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_userId_key" ON "SupplierProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_slug_key" ON "SupplierProfile"("slug");

-- CreateIndex
CREATE INDEX "SupplierProfile_userId_idx" ON "SupplierProfile"("userId");

-- CreateIndex
CREATE INDEX "SupplierProfile_slug_idx" ON "SupplierProfile"("slug");

-- CreateIndex
CREATE INDEX "SupplierProfile_isVerified_idx" ON "SupplierProfile"("isVerified");

-- CreateIndex
CREATE INDEX "SupplierProfile_isSuspended_idx" ON "SupplierProfile"("isSuspended");

-- CreateIndex
CREATE INDEX "SupplierProfile_province_idx" ON "SupplierProfile"("province");

-- CreateIndex
CREATE INDEX "SupplierProfile_city_idx" ON "SupplierProfile"("city");

-- CreateIndex
CREATE INDEX "SupplierProfile_businessCategory_idx" ON "SupplierProfile"("businessCategory");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_slug_key" ON "SupplierProduct"("slug");

-- CreateIndex
CREATE INDEX "SupplierProduct_supplierId_idx" ON "SupplierProduct"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierProduct_status_idx" ON "SupplierProduct"("status");

-- CreateIndex
CREATE INDEX "SupplierProduct_slug_idx" ON "SupplierProduct"("slug");

-- CreateIndex
CREATE INDEX "SupplierProduct_category_idx" ON "SupplierProduct"("category");

-- CreateIndex
CREATE INDEX "SupplierProduct_createdAt_idx" ON "SupplierProduct"("createdAt");

-- CreateIndex
CREATE INDEX "GroupQuiz_groupId_idx" ON "GroupQuiz"("groupId");

-- CreateIndex
CREATE INDEX "GroupQuiz_creatorId_idx" ON "GroupQuiz"("creatorId");

-- CreateIndex
CREATE INDEX "GroupQuiz_isActive_idx" ON "GroupQuiz"("isActive");

-- CreateIndex
CREATE INDEX "GroupQuiz_startDate_endDate_idx" ON "GroupQuiz"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "GroupQuizQuestion_quizId_idx" ON "GroupQuizQuestion"("quizId");

-- CreateIndex
CREATE INDEX "GroupQuizAttempt_quizId_idx" ON "GroupQuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "GroupQuizAttempt_userId_idx" ON "GroupQuizAttempt"("userId");

-- CreateIndex
CREATE INDEX "GroupQuizAttempt_isPassed_idx" ON "GroupQuizAttempt"("isPassed");

-- CreateIndex
CREATE INDEX "GroupQuizAnswer_attemptId_idx" ON "GroupQuizAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "GroupQuizAnswer_questionId_idx" ON "GroupQuizAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_slug_key" ON "BadgeDefinition"("slug");

-- CreateIndex
CREATE INDEX "BadgeDefinition_category_idx" ON "BadgeDefinition"("category");

-- CreateIndex
CREATE INDEX "BadgeDefinition_isActive_idx" ON "BadgeDefinition"("isActive");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_groupId_idx" ON "UserBadge"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_groupId_key" ON "UserBadge"("userId", "badgeId", "groupId");

-- CreateIndex
CREATE INDEX "UserPoints_userId_idx" ON "UserPoints"("userId");

-- CreateIndex
CREATE INDEX "UserPoints_groupId_idx" ON "UserPoints"("groupId");

-- CreateIndex
CREATE INDEX "UserPoints_points_idx" ON "UserPoints"("points");

-- CreateIndex
CREATE UNIQUE INDEX "UserPoints_userId_groupId_key" ON "UserPoints"("userId", "groupId");

-- CreateIndex
CREATE INDEX "PointTransaction_userId_idx" ON "PointTransaction"("userId");

-- CreateIndex
CREATE INDEX "PointTransaction_groupId_idx" ON "PointTransaction"("groupId");

-- CreateIndex
CREATE INDEX "PointTransaction_type_idx" ON "PointTransaction"("type");

-- CreateIndex
CREATE INDEX "PointTransaction_createdAt_idx" ON "PointTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "GroupChallenge_groupId_idx" ON "GroupChallenge"("groupId");

-- CreateIndex
CREATE INDEX "GroupChallenge_isActive_idx" ON "GroupChallenge"("isActive");

-- CreateIndex
CREATE INDEX "GroupChallenge_startDate_endDate_idx" ON "GroupChallenge"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ChallengProgress_challengeId_idx" ON "ChallengProgress"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengProgress_userId_idx" ON "ChallengProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengProgress_challengeId_userId_key" ON "ChallengProgress"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "ScheduledPost_authorId_idx" ON "ScheduledPost"("authorId");

-- CreateIndex
CREATE INDEX "ScheduledPost_groupId_idx" ON "ScheduledPost"("groupId");

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledAt_idx" ON "ScheduledPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledPost_status_idx" ON "ScheduledPost"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "PostComment_createdAt_idx" ON "PostComment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_invoiceNumber_key" ON "Transaction"("invoiceNumber");
