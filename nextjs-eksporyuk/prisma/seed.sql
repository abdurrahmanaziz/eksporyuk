-- Eksporyuk Test Users
-- Password untuk semua user: password123
-- Hash: $2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu

-- 1. FOUNDER
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phoneNumber`, `createdAt`, `updatedAt`)
VALUES 
('founder-001', 'founder@eksporyuk.com', 'Muhammad Founder', '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu', 'FOUNDER', '+62812345601', NOW(), NOW());

INSERT INTO `Wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`)
VALUES 
('wallet-founder', 'founder-001', 100000000, NOW(), NOW());

-- 2. CO_FOUNDER
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phoneNumber`, `createdAt`, `updatedAt`)
VALUES 
('cofounder-001', 'cofounder@eksporyuk.com', 'Ahmad Co-Founder', '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu', 'CO_FOUNDER', '+62812345602', NOW(), NOW());

INSERT INTO `Wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`)
VALUES 
('wallet-cofounder', 'cofounder-001', 50000000, NOW(), NOW());

-- 3. ADMIN
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phoneNumber`, `createdAt`, `updatedAt`)
VALUES 
('admin-001', 'admin@eksporyuk.com', 'Budi Administrator', '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu', 'ADMIN', '+62812345603', NOW(), NOW());

INSERT INTO `Wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`)
VALUES 
('wallet-admin', 'admin-001', 5000000, NOW(), NOW());

-- 4. MENTOR
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phoneNumber`, `createdAt`, `updatedAt`)
VALUES 
('mentor-001', 'mentor@eksporyuk.com', 'Siti Mentor', '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu', 'MENTOR', '+62812345604', NOW(), NOW());

INSERT INTO `Wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`)
VALUES 
('wallet-mentor', 'mentor-001', 3000000, NOW(), NOW());

INSERT INTO `MentorProfile` (`id`, `userId`, `bio`, `expertise`, `totalEarnings`, `createdAt`, `updatedAt`)
VALUES 
('mentorprofile-001', 'mentor-001', 'Mentor berpengalaman di bidang ekspor-impor', 'Export Documentation, International Trade', 15000000, NOW(), NOW());

-- 5. AFFILIATE
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phoneNumber`, `createdAt`, `updatedAt`)
VALUES 
('affiliate-001', 'affiliate@eksporyuk.com', 'Rina Affiliate', '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu', 'AFFILIATE', '+62812345605', NOW(), NOW());

INSERT INTO `Wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`)
VALUES 
('wallet-affiliate', 'affiliate-001', 2000000, NOW(), NOW());

INSERT INTO `AffiliateProfile` (`id`, `userId`, `commissionRate`, `totalEarnings`, `totalReferrals`, `createdAt`, `updatedAt`)
VALUES 
('affiliateprofile-001', 'affiliate-001', 15.0, 5000000, 25, NOW(), NOW());

-- 6. MEMBER_PREMIUM
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phoneNumber`, `createdAt`, `updatedAt`)
VALUES 
('premium-001', 'premium@eksporyuk.com', 'Dodi Premium Member', '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu', 'MEMBER_PREMIUM', '+62812345606', NOW(), NOW());

INSERT INTO `Wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`)
VALUES 
('wallet-premium', 'premium-001', 1000000, NOW(), NOW());

-- 7. MEMBER_FREE
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `phoneNumber`, `createdAt`, `updatedAt`)
VALUES 
('free-001', 'free@eksporyuk.com', 'Andi Free Member', '$2a$10$rQ9xVZm5X4kP8jQXZZ9YH.O6Y7Gk5dLjqvqJ0dX3PzZqHYxKjTBZu', 'MEMBER_FREE', '+62812345607', NOW(), NOW());

INSERT INTO `Wallet` (`id`, `userId`, `balance`, `createdAt`, `updatedAt`)
VALUES 
('wallet-free', 'free-001', 0, NOW(), NOW());
