-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: store
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.22.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `is_superuser` tinyint(1) DEFAULT '0',
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) DEFAULT NULL,
  `last_name` varchar(150) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `is_staff` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `date_joined` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'',NULL,0,'johndoe','John','Doe','john.doe@example.com',0,1,'2025-09-22 06:50:27'),(2,'',NULL,0,'johnd','John','Doe','john.doe@exame.com',0,1,'2025-09-22 06:51:03'),(3,'pbkdf2_sha256$600000$v6WTX5tZQFB7VOYRqO1fGT$JUdapmZcCs7vyh+Pb/7aIkMiUhAYzm+BakD6ZV2LOOM=',NULL,0,'john','John','Doe','john.do@exame.com',0,1,'2025-09-22 06:55:27'),(4,'pbkdf2_sha256$600000$8EEZAgX8XlbxufTbJbdGaR$oL51Xmlw9na8RqWSEaQCytMDhkUcnzSs2VcnKuicR5s=',NULL,0,'jhn','John','Doe','jon.do@exame.com',0,1,'2025-09-22 06:55:39'),(5,'pbkdf2_sha256$600000$F1Z7qlHtr0i5Au4yB1mlch$INMLF71gIORKQyZBfPh20vVC6eHM3LwYtZAUa0hP86Y=',NULL,0,'JhnDe','Jhn','De','jon.d@exame.com',0,1,'2025-09-22 07:01:08'),(6,'pbkdf2_sha256$600000$7U8YvqYckgnJH4UGvrNAQK$YCsfMgt2FeZIGD2Nene3cWIzbvKqngBaxHoFb05w+TY=',NULL,0,'Jhn De','Jhn','De','jon.d@exme.com',0,1,'2025-09-22 07:02:27'),(7,'pbkdf2_sha256$600000$45fQpNzLTRmP2YwMcQrgBk$kZMYsgGBWbtIHetO4f9ZsUenNmCicQ7f1QbJLBRgDKM=',NULL,0,'ss De','ss','De','ss.d@exme.com',0,1,'2025-09-24 07:04:33'),(8,'pbkdf2_sha256$600000$gdACdIBU9OVGWPOA7sB8Rh$AvA5GhhVOtsV6Ew1nfNAlPpvmmxzN5pB1Vhx9BTP5/Y=',NULL,0,'de De','de','De','devops2.depl@gmail.com',0,1,'2025-09-24 08:09:23'),(9,'pbkdf2_sha256$600000$W6WgtvXhTjxcxBnbCccsVW$Atd9KadIh4gz0fDsT+b7glaXhhecpn2o8O3VIL4TbsI=',NULL,0,'e e','e','e','devops.depl@gmail.com',0,1,'2025-09-24 08:35:55');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_category`
--

DROP TABLE IF EXISTS `restaurant_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_category`
--

LOCK TABLES `restaurant_category` WRITE;
/*!40000 ALTER TABLE `restaurant_category` DISABLE KEYS */;
INSERT INTO `restaurant_category` VALUES (1,'Special Burgers','Gourmet burgers with unique flavors and premium ingredients','2025-09-22 14:39:54'),(2,'Momos','Delicious steamed or fried dumplings with various fillings','2025-09-22 14:39:54'),(3,'Fried Chicken','Crispy, golden fried chicken with special seasonings','2025-09-22 14:39:54'),(4,'Wings','Spicy and flavorful chicken wings with various sauces','2025-09-22 14:39:54'),(5,'Pizza','Freshly baked pizzas with a variety of toppings','2025-09-22 14:39:54'),(6,'Snacks','Quick and tasty snack options','2025-09-22 14:39:54'),(7,'Rolls','Delicious wraps and rolls with various fillings','2025-09-22 14:39:54'),(8,'Cakes','Beautiful and delicious cakes for every occasion','2025-09-22 14:39:54'),(9,'Occasion Cakes','Special cakes for birthdays, anniversaries, and celebrations','2025-09-22 14:39:54'),(10,'Pastry','Flaky and buttery pastries with sweet fillings','2025-09-22 14:39:54'),(11,'Jar Cake','Individual serving cakes in convenient jars','2025-09-22 14:39:54'),(12,'Cupcakes','Mini cakes with creative frostings and decorations','2025-09-22 14:39:54'),(13,'Desserts','Sweet treats and indulgent desserts','2025-09-22 14:39:54'),(14,'Sundaes','Ice cream sundaes with various toppings and sauces','2025-09-22 14:39:54'),(15,'Shakes','Creamy and refreshing milkshakes','2025-09-22 14:39:54'),(16,'Starter','Appetizers and beginning course dishes','2025-09-22 14:39:54');
/*!40000 ALTER TABLE `restaurant_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_customer`
--

DROP TABLE IF EXISTS `restaurant_customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `address` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_customer`
--

LOCK TABLES `restaurant_customer` WRITE;
/*!40000 ALTER TABLE `restaurant_customer` DISABLE KEYS */;
INSERT INTO `restaurant_customer` VALUES (1,'John Doe','john.do@exame.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 06:55:27'),(2,'John Doe','jon.do@exame.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 06:55:39'),(3,'Jhn De','jon.d@exame.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 07:01:08'),(4,'Jhn De','jon.d@exme.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 07:02:27'),(5,'ss De','ss.d@exme.com','+1234567890','123 Main Street, City, State, 12345','2025-09-24 07:04:33'),(6,'de De','devops2.depl@gmail.com','+1234567890','123 Main Street, City, State, 12345','2025-09-24 08:09:23'),(7,'e e','devops.depl@gmail.com','+1234567890','123 Main Street, City, State, 12345','2025-09-24 08:35:55');
/*!40000 ALTER TABLE `restaurant_customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_inquiry`
--

DROP TABLE IF EXISTS `restaurant_inquiry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_inquiry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','in_progress','resolved') DEFAULT 'new',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_inquiry`
--

LOCK TABLES `restaurant_inquiry` WRITE;
/*!40000 ALTER TABLE `restaurant_inquiry` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_inquiry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_menuitem`
--

DROP TABLE IF EXISTS `restaurant_menuitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_menuitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `category_id` int NOT NULL,
  `image` varchar(255) DEFAULT '',
  `is_vegetarian` tinyint(1) DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `availability_schedule` json DEFAULT NULL,
  `pricing_type` enum('single','multiple') DEFAULT 'single',
  `price_variations` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `restaurant_menuitem_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `restaurant_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_menuitem`
--

LOCK TABLES `restaurant_menuitem` WRITE;
/*!40000 ALTER TABLE `restaurant_menuitem` DISABLE KEYS */;
INSERT INTO `restaurant_menuitem` VALUES (1,'Classic Cheeseburger','Beef patty with cheese, lettuce, tomato and special sauce',12.99,1,'burger1.jpg',0,1,'2025-09-24 15:15:49','{\"message\": \"Available all day, every day\", \"available_to\": \"23:00:00\", \"available_days\": [1, 2, 3, 4, 5, 6, 7], \"available_from\": \"11:00:00\"}','single',NULL),(2,'Veggie Supreme','Plant-based patty with avocado, lettuce and vegan mayo',10.99,1,'burger2.jpg',1,1,'2025-09-24 15:15:49','{\"message\": \"Available Monday to Friday, 9 AM to 9 PM\", \"available_to\": \"21:00:00\", \"available_days\": [1, 2, 3, 4, 5], \"available_from\": \"09:00:00\"}','single',NULL),(3,'Chicken Momos','Steamed dumplings with spicy chicken filling',8.99,2,'momos1.jpg',0,1,'2025-09-24 15:15:49','{\"message\": \"Available for lunch and dinner\", \"available_to\": \"22:00:00\", \"available_days\": [1, 2, 3, 4, 5, 6, 7], \"available_from\": \"12:00:00\"}','single',NULL),(4,'Veg Momos','Steamed dumplings with mixed vegetable filling',7.99,2,'momos2.jpg',1,1,'2025-09-24 15:15:49',NULL,'single',NULL),(5,'Crispy Fried Chicken','Golden fried chicken with special seasoning',15.99,3,'chicken1.jpg',0,1,'2025-09-24 15:15:49','{\"message\": \"Available weekends only, 2 PM to 11 PM\", \"available_to\": \"23:00:00\", \"available_days\": [6, 7], \"available_from\": \"14:00:00\"}','single',NULL),(6,'BBQ Chicken Wings','Smoky barbecue flavored chicken wings',11.99,4,'wings1.jpg',0,1,'2025-09-24 15:15:49','{\"message\": \"Available Monday to Friday\", \"available_days\": [1, 2, 3, 4, 5]}','single',NULL),(7,'Margherita Pizza','Classic pizza with tomato sauce and mozzarella',14.99,5,'pizza1.jpg',1,1,'2025-09-24 15:15:49','{\"message\": \"Available from 10 AM to 2 AM\", \"available_to\": \"02:00:00\", \"available_days\": [1, 2, 3, 4, 5, 6, 7], \"available_from\": \"10:00:00\"}','single',NULL),(8,'French Fries','Crispy golden fries with seasoning',4.99,6,'fries1.jpg',1,1,'2025-09-24 15:15:49',NULL,'single',NULL),(9,'Chicken Roll','Grilled chicken wrapped in paratha',9.99,7,'roll1.jpg',0,0,'2025-09-24 15:15:49','{\"message\": \"Temporarily unavailable\"}','single',NULL),(10,'Chocolate Cake','Rich chocolate cake with ganache',6.99,8,'cake1.jpg',1,1,'2025-09-24 15:15:49','{\"message\": \"Available from 8 AM to 8 PM\", \"available_to\": \"20:00:00\", \"available_days\": [1, 2, 3, 4, 5, 6, 7], \"available_from\": \"08:00:00\"}','single',NULL),(11,'Croissant','Buttery flaky pastry',3.99,10,'pastry1.jpg',1,1,'2025-09-24 15:15:49',NULL,'single',NULL),(12,'Chocolate Shake','Creamy chocolate milkshake',5.99,15,'shake1.jpg',1,1,'2025-09-24 15:15:49','{\"message\": \"Available all day\", \"available_to\": \"22:00:00\", \"available_days\": [1, 2, 3, 4, 5, 6, 7], \"available_from\": \"10:00:00\"}','single',NULL),(13,'Vanilla Cake','Classic vanilla flavor cake',NULL,1,'vanilla_cake.jpg',1,1,'2025-09-24 15:44:48',NULL,'multiple','{\"1kg\": 639, \"500g\": 449}'),(14,'Oreo Cake','Oreo cookie flavored cake',NULL,1,'oreo_cake.jpg',1,1,'2025-09-24 15:44:48',NULL,'multiple','{\"1kg\": 699, \"500g\": 509}'),(15,'Dark Chocolate Cake','Rich dark chocolate cake',NULL,1,'chocolate_cake.jpg',1,1,'2025-09-24 15:44:48',NULL,'multiple','{\"1kg\": 719, \"500g\": 529}'),(16,'Pineapple Cake','Fresh pineapple cake',NULL,1,'pineapple_cake.jpg',1,1,'2025-09-24 15:44:48',NULL,'multiple','{\"1kg\": 779, \"500g\": 549}'),(17,'Classic Veg Burger','Classic vegetable burger',NULL,9,'veg_burger.jpg',1,1,'2025-09-24 15:44:48',NULL,'multiple','{\"Jumbo\": 139, \"Regular\": 99}'),(18,'Paneer Burger','Paneer filled burger',NULL,9,'paneer_burger.jpg',1,1,'2025-09-24 15:44:48',NULL,'multiple','{\"Jumbo\": 189, \"Regular\": 139}'),(19,'Chicken Burger','Chicken filled burger',NULL,9,'chicken_burger.jpg',0,1,'2025-09-24 15:44:48',NULL,'multiple','{\"Jumbo\": 169, \"Regular\": 119}'),(20,'Mixed Veg Momo','Mixed vegetable momos',NULL,10,'veg_momo.jpg',1,1,'2025-09-24 15:44:48',NULL,'multiple','{\"Fried\": 89, \"Steam\": 79, \"Pan Fried\": 99}'),(21,'Chicken Momo','Chicken filled momos',NULL,10,'chicken_momo.jpg',0,1,'2025-09-24 15:44:48',NULL,'multiple','{\"Fried\": 109, \"Steam\": 99, \"Pan Fried\": 129}'),(22,'French Fries','Crispy golden fries',79.00,14,'fries.jpg',1,1,'2025-09-24 15:44:48',NULL,'single',NULL),(23,'Classic Black Forest Pastry','Chocolate pastry',79.00,2,'black_forest.jpg',1,1,'2025-09-24 15:44:48',NULL,'single',NULL),(24,'Butterscotch Pastry','Butterscotch flavored pastry',79.00,2,'butterscotch_pastry.jpg',1,1,'2025-09-24 15:44:48',NULL,'single',NULL);
/*!40000 ALTER TABLE `restaurant_menuitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_orderitem`
--

DROP TABLE IF EXISTS `restaurant_orderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_orderitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(8,2) NOT NULL,
  `selected_variation` varchar(100) DEFAULT NULL,
  `special_instructions` text,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `restaurant_orderitem_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `restaurant_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `restaurant_orderitem_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `restaurant_menuitem` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_orderitem`
--

LOCK TABLES `restaurant_orderitem` WRITE;
/*!40000 ALTER TABLE `restaurant_orderitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_orderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_orders`
--

DROP TABLE IF EXISTS `restaurant_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','delivered','cancelled') DEFAULT 'pending',
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `delivery_address` text NOT NULL,
  `phone` varchar(15) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `restaurant_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `restaurant_customer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_orders`
--

LOCK TABLES `restaurant_orders` WRITE;
/*!40000 ALTER TABLE `restaurant_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `restaurant_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurant_passwordresettoken`
--

DROP TABLE IF EXISTS `restaurant_passwordresettoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurant_passwordresettoken` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `restaurant_passwordresettoken_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_passwordresettoken`
--

LOCK TABLES `restaurant_passwordresettoken` WRITE;
/*!40000 ALTER TABLE `restaurant_passwordresettoken` DISABLE KEYS */;
INSERT INTO `restaurant_passwordresettoken` VALUES (1,7,'TdhEs2WiQYFw6nOxkHjd4TgTLxU8DdMrryXdqInwLAQSLrTuzK','2025-09-24 08:06:31',0),(2,8,'dmp4bJy3ApO39QH4qbQHovbtZk6UM43aOHueuXzsetlmmZfXny','2025-09-24 08:09:46',0),(3,8,'Kn8rkkkC3s5r3vneoTWBWGZIzWlUedqlJvIpa5nGIBk18tB7sB','2025-09-24 08:12:46',0),(4,8,'hlloQkX1EyPd9Hneu76dOaBK8L6dN7qGOROk90CSaJr7enMtBl','2025-09-24 08:15:11',1),(5,8,'6AjOxPOCdQxCoKOoSStQz0iKa8mwMiK6trY7i4SHItqZo7pp8E','2025-09-24 08:30:08',0);
/*!40000 ALTER TABLE `restaurant_passwordresettoken` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-24 18:47:36
