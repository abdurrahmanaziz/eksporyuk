-- CreateTable
CREATE TABLE "BroadcastCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "templateId" TEXT,
    "templateType" TEXT,
    "targetType" TEXT NOT NULL,
    "targetRoles" JSONB,
    "targetMembershipIds" JSONB,
    "targetGroupIds" JSONB,
    "targetCourseIds" JSONB,
    "targetEventIds" JSONB,
    "targetTransactionStatus" JSONB,
    "targetTransactionType" JSONB,
    "customUserIds" JSONB,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "emailCtaText" TEXT,
    "emailCtaLink" TEXT,
    "whatsappMessage" TEXT,
    "whatsappCtaText" TEXT,
    "whatsappCtaLink" TEXT,
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BroadcastLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "failedAt" DATETIME,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BroadcastLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BroadcastCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OneSignalTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "targetType" TEXT NOT NULL DEFAULT 'all',
    "targetValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OneSignalAutoNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "targetType" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "linkUrl" TEXT NOT NULL,
    "linkText" TEXT DEFAULT 'Lihat Selengkapnya',
    "targetRoles" JSONB NOT NULL,
    "targetMemberships" JSONB,
    "targetProvinces" JSONB,
    "placement" TEXT NOT NULL DEFAULT 'DASHBOARD',
    "displayType" TEXT NOT NULL DEFAULT 'CAROUSEL',
    "backgroundColor" TEXT DEFAULT '#3B82F6',
    "textColor" TEXT DEFAULT '#FFFFFF',
    "buttonColor" TEXT DEFAULT '#FFFFFF',
    "buttonTextColor" TEXT DEFAULT '#3B82F6',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewLimit" INTEGER,
    "clickLimit" INTEGER,
    "dailyBudget" INTEGER,
    "createdBy" TEXT NOT NULL,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "sponsorName" TEXT,
    "sponsorLogo" TEXT,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalBudgetUsed" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BannerView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bannerId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BannerView_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BannerClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bannerId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BannerClick_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AffiliateProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "shortLink" TEXT NOT NULL,
    "shortLinkUsername" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "commissionRate" DECIMAL NOT NULL DEFAULT 10,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "applicationNotes" TEXT,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "whatsapp" TEXT,
    "motivation" TEXT,
    "approvedAt" DATETIME,
    "welcomeShown" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" DATETIME,
    "trainingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "trainingCompletedAt" DATETIME,
    "firstLinkCreated" BOOLEAN NOT NULL DEFAULT false,
    "firstLinkCreatedAt" DATETIME,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "profileCompletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AffiliateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AffiliateProfile" ("affiliateCode", "approvedAt", "commissionRate", "createdAt", "id", "isActive", "shortLink", "shortLinkUsername", "tier", "totalClicks", "totalConversions", "totalEarnings", "updatedAt", "userId") SELECT "affiliateCode", "approvedAt", "commissionRate", "createdAt", "id", "isActive", "shortLink", "shortLinkUsername", "tier", "totalClicks", "totalConversions", "totalEarnings", "updatedAt", "userId" FROM "AffiliateProfile";
DROP TABLE "AffiliateProfile";
ALTER TABLE "new_AffiliateProfile" RENAME TO "AffiliateProfile";
CREATE UNIQUE INDEX "AffiliateProfile_userId_key" ON "AffiliateProfile"("userId");
CREATE UNIQUE INDEX "AffiliateProfile_affiliateCode_key" ON "AffiliateProfile"("affiliateCode");
CREATE UNIQUE INDEX "AffiliateProfile_shortLink_key" ON "AffiliateProfile"("shortLink");
CREATE UNIQUE INDEX "AffiliateProfile_shortLinkUsername_key" ON "AffiliateProfile"("shortLinkUsername");
CREATE INDEX "AffiliateProfile_affiliateCode_idx" ON "AffiliateProfile"("affiliateCode");
CREATE INDEX "AffiliateProfile_userId_idx" ON "AffiliateProfile"("userId");
CREATE INDEX "AffiliateProfile_shortLinkUsername_idx" ON "AffiliateProfile"("shortLinkUsername");
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
    "affiliateOnly" BOOLEAN NOT NULL DEFAULT false,
    "isAffiliateTraining" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_certificateTemplateId_fkey" FOREIGN KEY ("certificateTemplateId") REFERENCES "CertificateTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("approvedAt", "approvedBy", "autoAddToList", "certificateTemplateId", "checkoutSlug", "createdAt", "description", "duration", "enrollmentCount", "formBanner", "formDescription", "formLogo", "groupId", "id", "isPublished", "level", "mailketingListId", "mailketingListName", "mentorCommissionPercent", "mentorId", "monetizationType", "originalPrice", "price", "publishedAt", "rating", "rejectedAt", "rejectionReason", "reminders", "reviewedBy", "slug", "status", "submittedForReviewAt", "thumbnail", "title", "updatedAt") SELECT "approvedAt", "approvedBy", "autoAddToList", "certificateTemplateId", "checkoutSlug", "createdAt", "description", "duration", "enrollmentCount", "formBanner", "formDescription", "formLogo", "groupId", "id", "isPublished", "level", "mailketingListId", "mailketingListName", "mentorCommissionPercent", "mentorId", "monetizationType", "originalPrice", "price", "publishedAt", "rating", "rejectedAt", "rejectionReason", "reminders", "reviewedBy", "slug", "status", "submittedForReviewAt", "thumbnail", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE UNIQUE INDEX "Course_checkoutSlug_key" ON "Course"("checkoutSlug");
CREATE INDEX "Course_mentorId_idx" ON "Course"("mentorId");
CREATE INDEX "Course_isPublished_idx" ON "Course"("isPublished");
CREATE INDEX "Course_status_idx" ON "Course"("status");
CREATE INDEX "Course_monetizationType_idx" ON "Course"("monetizationType");
CREATE TABLE "new_EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "roleTarget" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "variables" JSONB,
    "metadata" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EmailTemplate" ("body", "createdAt", "id", "isActive", "name", "subject", "updatedAt", "variables") SELECT "body", "createdAt", "id", "isActive", "name", "subject", "updatedAt", "variables" FROM "EmailTemplate";
DROP TABLE "EmailTemplate";
ALTER TABLE "new_EmailTemplate" RENAME TO "EmailTemplate";
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");
CREATE INDEX "EmailTemplate_roleTarget_idx" ON "EmailTemplate"("roleTarget");
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");
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
    "affiliateAutoApprove" BOOLEAN NOT NULL DEFAULT false,
    "siteTitle" TEXT DEFAULT 'Eksporyuk',
    "siteDescription" TEXT DEFAULT 'Platform Ekspor Indonesia',
    "siteLogo" TEXT,
    "siteFavicon" TEXT,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "secondaryColor" TEXT DEFAULT '#1F2937',
    "buttonPrimaryBg" TEXT DEFAULT '#3B82F6',
    "buttonPrimaryText" TEXT DEFAULT '#FFFFFF',
    "buttonSecondaryBg" TEXT DEFAULT '#6B7280',
    "buttonSecondaryText" TEXT DEFAULT '#FFFFFF',
    "buttonSuccessBg" TEXT DEFAULT '#10B981',
    "buttonSuccessText" TEXT DEFAULT '#FFFFFF',
    "buttonDangerBg" TEXT DEFAULT '#EF4444',
    "buttonDangerText" TEXT DEFAULT '#FFFFFF',
    "buttonBorderRadius" TEXT DEFAULT '0.5rem',
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
    "paymentBankAccounts" JSONB DEFAULT [],
    "paymentXenditChannels" JSONB DEFAULT [],
    "paymentEnableManual" BOOLEAN NOT NULL DEFAULT true,
    "paymentEnableXendit" BOOLEAN NOT NULL DEFAULT true,
    "paymentSandboxMode" BOOLEAN NOT NULL DEFAULT false,
    "paymentAutoActivation" BOOLEAN NOT NULL DEFAULT true,
    "paymentMinAmount" INTEGER NOT NULL DEFAULT 10000,
    "paymentMaxAmount" INTEGER NOT NULL DEFAULT 100000000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("affiliateCommissionEnabled", "bannerImage", "buttonBorderRadius", "buttonDangerBg", "buttonDangerText", "buttonPrimaryBg", "buttonPrimaryText", "buttonSecondaryBg", "buttonSecondaryText", "buttonSuccessBg", "buttonSuccessText", "challengeRewardAutoApprove", "challengeRewardAutoApproveLimit", "contactEmail", "contactPhone", "createdAt", "customCss", "customJs", "defaultLanguage", "facebookUrl", "followUp1HourEnabled", "followUp24HourEnabled", "followUp48HourEnabled", "followUpEnabled", "followUpMessage1Hour", "followUpMessage24Hour", "followUpMessage48Hour", "footerText", "headerText", "id", "instagramUrl", "linkedinUrl", "mailkitingApiKey", "mailkitingEnabled", "maintenanceMode", "mentorCommissionEnabled", "onesignalApiKey", "onesignalAppId", "onesignalEnabled", "paymentExpiryHours", "primaryColor", "pusherAppId", "pusherCluster", "pusherEnabled", "pusherKey", "pusherSecret", "revenueEnabled", "secondaryColor", "siteDescription", "siteFavicon", "siteLogo", "siteTitle", "starsenderApiKey", "starsenderEnabled", "updatedAt", "whatsappNumber") SELECT "affiliateCommissionEnabled", "bannerImage", "buttonBorderRadius", "buttonDangerBg", "buttonDangerText", "buttonPrimaryBg", "buttonPrimaryText", "buttonSecondaryBg", "buttonSecondaryText", "buttonSuccessBg", "buttonSuccessText", "challengeRewardAutoApprove", "challengeRewardAutoApproveLimit", "contactEmail", "contactPhone", "createdAt", "customCss", "customJs", "defaultLanguage", "facebookUrl", "followUp1HourEnabled", "followUp24HourEnabled", "followUp48HourEnabled", "followUpEnabled", "followUpMessage1Hour", "followUpMessage24Hour", "followUpMessage48Hour", "footerText", "headerText", "id", "instagramUrl", "linkedinUrl", "mailkitingApiKey", "mailkitingEnabled", "maintenanceMode", "mentorCommissionEnabled", "onesignalApiKey", "onesignalAppId", "onesignalEnabled", "paymentExpiryHours", "primaryColor", "pusherAppId", "pusherCluster", "pusherEnabled", "pusherKey", "pusherSecret", "revenueEnabled", "secondaryColor", "siteDescription", "siteFavicon", "siteLogo", "siteTitle", "starsenderApiKey", "starsenderEnabled", "updatedAt", "whatsappNumber" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER_FREE',
    "avatar" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "locationVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME,
    "lastActiveAt" DATETIME,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFounder" BOOLEAN NOT NULL DEFAULT false,
    "isCoFounder" BOOLEAN NOT NULL DEFAULT false,
    "affiliateMenuEnabled" BOOLEAN NOT NULL DEFAULT false,
    "revenueSharePercent" REAL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
    "oneSignalPlayerId" TEXT,
    "oneSignalSubscribedAt" DATETIME,
    "oneSignalTags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "referredById" TEXT,
    "mailketingLists" JSONB,
    "mailketingSubscriberId" TEXT,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatar", "bio", "createdAt", "email", "emailNotifications", "emailVerified", "id", "isActive", "isCoFounder", "isFounder", "isOnline", "lastActiveAt", "lastSeenAt", "mailketingLists", "mailketingSubscriberId", "name", "password", "phone", "referredById", "revenueSharePercent", "role", "updatedAt", "username", "whatsapp", "whatsappNotifications") SELECT "avatar", "bio", "createdAt", "email", "emailNotifications", "emailVerified", "id", "isActive", "isCoFounder", "isFounder", "isOnline", "lastActiveAt", "lastSeenAt", "mailketingLists", "mailketingSubscriberId", "name", "password", "phone", "referredById", "revenueSharePercent", "role", "updatedAt", "username", "whatsapp", "whatsappNotifications" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_province_idx" ON "User"("province");
CREATE INDEX "User_city_idx" ON "User"("city");
CREATE INDEX "User_district_idx" ON "User"("district");
CREATE TABLE "new_WhatsAppTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "roleTarget" TEXT,
    "message" TEXT NOT NULL,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "maxLength" INTEGER NOT NULL DEFAULT 1024,
    "variables" JSONB,
    "metadata" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WhatsAppTemplate" ("createdAt", "id", "isActive", "message", "name", "updatedAt", "variables") SELECT "createdAt", "id", "isActive", "message", "name", "updatedAt", "variables" FROM "WhatsAppTemplate";
DROP TABLE "WhatsAppTemplate";
ALTER TABLE "new_WhatsAppTemplate" RENAME TO "WhatsAppTemplate";
CREATE INDEX "WhatsAppTemplate_category_idx" ON "WhatsAppTemplate"("category");
CREATE INDEX "WhatsAppTemplate_roleTarget_idx" ON "WhatsAppTemplate"("roleTarget");
CREATE INDEX "WhatsAppTemplate_isActive_idx" ON "WhatsAppTemplate"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BroadcastCampaign_status_idx" ON "BroadcastCampaign"("status");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_type_idx" ON "BroadcastCampaign"("type");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_targetType_idx" ON "BroadcastCampaign"("targetType");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_createdById_idx" ON "BroadcastCampaign"("createdById");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_scheduledAt_idx" ON "BroadcastCampaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "BroadcastLog_campaignId_idx" ON "BroadcastLog"("campaignId");

-- CreateIndex
CREATE INDEX "BroadcastLog_userId_idx" ON "BroadcastLog"("userId");

-- CreateIndex
CREATE INDEX "BroadcastLog_status_idx" ON "BroadcastLog"("status");

-- CreateIndex
CREATE INDEX "BroadcastLog_channel_idx" ON "BroadcastLog"("channel");

-- CreateIndex
CREATE INDEX "OneSignalTemplate_name_idx" ON "OneSignalTemplate"("name");

-- CreateIndex
CREATE INDEX "OneSignalAutoNotification_trigger_idx" ON "OneSignalAutoNotification"("trigger");

-- CreateIndex
CREATE INDEX "OneSignalAutoNotification_enabled_idx" ON "OneSignalAutoNotification"("enabled");

-- CreateIndex
CREATE INDEX "Banner_placement_idx" ON "Banner"("placement");

-- CreateIndex
CREATE INDEX "Banner_isActive_idx" ON "Banner"("isActive");

-- CreateIndex
CREATE INDEX "Banner_startDate_endDate_idx" ON "Banner"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Banner_priority_idx" ON "Banner"("priority");

-- CreateIndex
CREATE INDEX "Banner_createdBy_idx" ON "Banner"("createdBy");

-- CreateIndex
CREATE INDEX "BannerView_bannerId_idx" ON "BannerView"("bannerId");

-- CreateIndex
CREATE INDEX "BannerView_userId_idx" ON "BannerView"("userId");

-- CreateIndex
CREATE INDEX "BannerView_sessionId_idx" ON "BannerView"("sessionId");

-- CreateIndex
CREATE INDEX "BannerView_viewedAt_idx" ON "BannerView"("viewedAt");

-- CreateIndex
CREATE INDEX "BannerClick_bannerId_idx" ON "BannerClick"("bannerId");

-- CreateIndex
CREATE INDEX "BannerClick_userId_idx" ON "BannerClick"("userId");

-- CreateIndex
CREATE INDEX "BannerClick_sessionId_idx" ON "BannerClick"("sessionId");

-- CreateIndex
CREATE INDEX "BannerClick_clickedAt_idx" ON "BannerClick"("clickedAt");
