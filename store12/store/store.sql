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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'',NULL,0,'johndoe','John','Doe','john.doe@example.com',0,1,'2025-09-22 06:50:27'),(2,'',NULL,0,'johnd','John','Doe','john.doe@exame.com',0,1,'2025-09-22 06:51:03'),(3,'pbkdf2_sha256$600000$v6WTX5tZQFB7VOYRqO1fGT$JUdapmZcCs7vyh+Pb/7aIkMiUhAYzm+BakD6ZV2LOOM=',NULL,0,'john','John','Doe','john.do@exame.com',0,1,'2025-09-22 06:55:27'),(4,'pbkdf2_sha256$600000$8EEZAgX8XlbxufTbJbdGaR$oL51Xmlw9na8RqWSEaQCytMDhkUcnzSs2VcnKuicR5s=',NULL,0,'jhn','John','Doe','jon.do@exame.com',0,1,'2025-09-22 06:55:39'),(5,'pbkdf2_sha256$600000$F1Z7qlHtr0i5Au4yB1mlch$INMLF71gIORKQyZBfPh20vVC6eHM3LwYtZAUa0hP86Y=',NULL,0,'JhnDe','Jhn','De','jon.d@exame.com',0,1,'2025-09-22 07:01:08'),(6,'pbkdf2_sha256$600000$7U8YvqYckgnJH4UGvrNAQK$YCsfMgt2FeZIGD2Nene3cWIzbvKqngBaxHoFb05w+TY=',NULL,0,'Jhn De','Jhn','De','jon.d@exme.com',0,1,'2025-09-22 07:02:27');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_customer`
--

LOCK TABLES `restaurant_customer` WRITE;
/*!40000 ALTER TABLE `restaurant_customer` DISABLE KEYS */;
INSERT INTO `restaurant_customer` VALUES (1,'John Doe','john.do@exame.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 06:55:27'),(2,'John Doe','jon.do@exame.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 06:55:39'),(3,'Jhn De','jon.d@exame.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 07:01:08'),(4,'Jhn De','jon.d@exme.com','+1234567890','123 Main Street, City, State, 12345','2025-09-22 07:02:27');
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
  `price` decimal(8,2) NOT NULL,
  `category_id` int NOT NULL,
  `image` varchar(255) DEFAULT '',
  `is_vegetarian` tinyint(1) DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `restaurant_menuitem_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `restaurant_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_menuitem`
--

LOCK TABLES `restaurant_menuitem` WRITE;
/*!40000 ALTER TABLE `restaurant_menuitem` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurant_passwordresettoken`
--

LOCK TABLES `restaurant_passwordresettoken` WRITE;
/*!40000 ALTER TABLE `restaurant_passwordresettoken` DISABLE KEYS */;
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

-- Dump completed on 2025-09-22 16:14:41
