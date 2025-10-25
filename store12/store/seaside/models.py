from django.db import models
from django.contrib.auth.models import User


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.IntegerField(blank=True, null=True)
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    email = models.CharField(max_length=254, blank=True, null=True)
    is_staff = models.IntegerField(blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    date_joined = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'auth_user'

    def __str__(self):
        return self.username


class RestaurantCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    status = models.IntegerField(default=1)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'restaurant_category'

    def __str__(self):
        return self.name


class RestaurantCustomer(models.Model):
    name = models.CharField(max_length=100)
    email = models.CharField(max_length=254)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'restaurant_customer'

    def __str__(self):
        return f"{self.name} ({self.email})"


class RestaurantMenuitem(models.Model):
    PRICING_TYPES = (
        ('single', 'Single Price'),
        ('multiple', 'Multiple Prices'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.IntegerField(blank=True, null=True)
    category = models.ForeignKey(RestaurantCategory, models.DO_NOTHING)
    image = models.CharField(max_length=255, blank=True, null=True)
    is_vegetarian = models.IntegerField(blank=True, null=True)
    is_available = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    availability_schedule = models.JSONField(blank=True, null=True)
    pricing_type = models.CharField(max_length=10, choices=PRICING_TYPES, default='single')
    price_variations = models.JSONField(blank=True, null=True)
    status = models.IntegerField(default=1)

    class Meta:
        managed = False
        db_table = 'restaurant_menuitem'

    def __str__(self):
        return self.name


class RestaurantOrders(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('out_for_delivery', 'Out for Delivery'),
    ]
    
    customer = models.ForeignKey(RestaurantCustomer, models.DO_NOTHING)
    total_amount = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=ORDER_STATUS_CHOICES, blank=True, null=True)
    order_date = models.DateTimeField(blank=True, null=True)
    delivery_address = models.TextField()
    phone = models.CharField(max_length=15)

    class Meta:
        managed = False
        db_table = 'restaurant_orders'

    def __str__(self):
        return f"Order #{self.id} - {self.customer.name}"


class RestaurantOrderitem(models.Model):
    order = models.ForeignKey(RestaurantOrders, models.DO_NOTHING)
    menu_item = models.ForeignKey(RestaurantMenuitem, models.DO_NOTHING)
    quantity = models.IntegerField()
    price = models.IntegerField(blank=True, null=True)
    selected_variation = models.CharField(max_length=100, blank=True, null=True)
    special_instructions = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'restaurant_orderitem'

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"


class RestaurantPasswordresettoken(models.Model):
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    token = models.CharField(unique=True, max_length=100)
    created_at = models.DateTimeField(blank=True, null=True)
    is_used = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'restaurant_passwordresettoken'

    def __str__(self):
        return f"Reset token for {self.user.username}"


class RestaurantInquiry(models.Model):
    INQUIRY_STATUS_CHOICES = [
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]
    
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=100, blank=True, null=True)
    message = models.CharField(max_length=200, blank=True, null=True)
    status = models.CharField(max_length=11, choices=INQUIRY_STATUS_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'restaurant_inquiry'

    def __str__(self):
        return f"Inquiry from {self.name}"
