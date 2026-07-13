-- CreateTable
CREATE TABLE "Church" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pastor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pastor_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SingleProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "churchId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "gender" TEXT NOT NULL,
    "height" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "occupation" TEXT,
    "education" TEXT,
    "bio" TEXT,
    "faithBackground" TEXT,
    "interests" TEXT,
    "lookingFor" TEXT,
    "languages" TEXT,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "pastorNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SingleProfile_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SingleProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Pastor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileShare_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "SingleProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileShare_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "Pastor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "Pastor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pastor_email_key" ON "Pastor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileShare_profileId_sharedWithId_key" ON "ProfileShare"("profileId", "sharedWithId");
