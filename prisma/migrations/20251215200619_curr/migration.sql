-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "currencies_userId_idx" ON "currencies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_userId_code_key" ON "currencies"("userId", "code");

-- AddForeignKey
ALTER TABLE "currencies" ADD CONSTRAINT "currencies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
