# # views.py
# from concurrent.futures.process import _ResultItem
# from decimal import Decimal, InvalidOperation
# import json
# import re
# import logging
# from datetime import datetime
# from django.http import JsonResponse
# from django.views import View
# from django.contrib.auth import authenticate, login, logout
# from django.contrib.auth.hashers import make_password, check_password
# from django.core.mail import send_mail
# from django.conf import settings
# from django.utils import timezone
# from django.utils.crypto import get_random_string
# from django.db import transaction
# from django.db.models import Count, Q, Sum
# from store.settings import SEASIDE_URL, ADMIN_EMAIL
# from rest_framework import serializers, status
# from rest_framework.views import APIView
# from rest_framework.response import Response
# import boto3
# from store.settings import *
# from rest_framework.parsers import MultiPartParser 
# from botocore.exceptions import ClientError

# from .models import (
#     AuthUser, 
#     RestaurantCategory, 
#     RestaurantCustomer, 
#     RestaurantMenuitem, 
#     RestaurantOrders, 
#     RestaurantOrderitem, 
#     RestaurantPasswordresettoken, 
#     RestaurantInquiry
# )

# # Get logger instance
# logger = logging.getLogger(__name__)


# class SignUpView(View):

#     def post(self, request):
#         try:
#             data = json.loads(request.body)

#             # Validate required fields
#             required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
#             for field in required_fields:
#                 if field not in data or not data[field]:
#                     return JsonResponse({
#                         'error': f'{field} is required'
#                     }, status=400)

#             username = data.get('username', f"{data['first_name']} {data['last_name']}")
#             email = data['email']
#             password = data['password']
#             first_name = data['first_name']
#             last_name = data['last_name']
#             phone = data['phone']
#             address = data.get('address', '')

#             # ------------------------------
#             # 1️⃣ Validate email format
#             # ------------------------------
#             email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
#             if not re.match(email_pattern, email):
#                 return JsonResponse({'error': 'Invalid email format'}, status=400)

#             # ------------------------------
#             # 2️⃣ Validate password strength
#             # ------------------------------
#             if len(password) < 6:
#                 return JsonResponse({'error': 'Password must be at least 6 characters long'}, status=400)

#             # ------------------------------
#             # 3️⃣ Validate phone number
#             # ------------------------------
#             phone_pattern = r'^\d+$'  # digits only
#             if not re.match(phone_pattern, phone):
#                 return JsonResponse({'error': 'Phone number must contain digits only'}, status=400)

#             # Optional: check length (10 digits typical for India)
#             if len(phone) != 10:
#                 return JsonResponse({'error': 'Phone number must be exactly 10 digits'}, status=400)

#             # ------------------------------
#             # 4️⃣ Check duplicates
#             # ------------------------------
#             if AuthUser.objects.filter(username=username).exists():
#                 return JsonResponse({'error': 'Username already exists'}, status=400)

#             if AuthUser.objects.filter(email=email).exists():
#                 return JsonResponse({'error': 'Email already registered'}, status=400)

#             # ------------------------------
#             # 5️⃣ Create user
#             # ------------------------------
#             hashed_password = make_password(password)
#             user = AuthUser.objects.create(
#                 username=username,
#                 email=email,
#                 password=hashed_password,
#                 first_name=first_name,
#                 last_name=last_name,
#                 is_active=1,
#                 is_staff=0,
#                 is_superuser=0,
#                 date_joined=timezone.now()
#             )

#             # ------------------------------
#             # 6️⃣ Create customer profile
#             # ------------------------------
#             customer = RestaurantCustomer.objects.create(
#                 name=f"{first_name} {last_name}",
#                 email=email,
#                 phone=phone,
#                 address=address,
#                 created_at=timezone.now()
#             )

#             return JsonResponse({
#                 'message': 'User registered successfully',
#                 'user_id': user.id,
#                 'customer_id': customer.id,
#                 'username': username,
#                 'email': email
#             }, status=201)

#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON data'}, status=400)
#         except Exception as e:
#             return JsonResponse({'error': f'Registration failed: {str(e)}'}, status=500)
                  
# class LoginView(View):

#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             if not data.get('username') or not data.get('password'):
#                 return JsonResponse({'error': 'Username and password are required'}, status=400)
            
#             username = data['username']
#             password = data['password']
            
#             user = None
#             if '@' in username:
#                 # Login with email
#                 try:
#                     user = AuthUser.objects.get(email=username)
#                 except AuthUser.DoesNotExist:
#                     return JsonResponse({'error': 'Invalid email or password'}, status=401)
#             else:
#                 # Login with username
#                 try:
#                     user = AuthUser.objects.get(username=username)
#                 except AuthUser.DoesNotExist:
#                     return JsonResponse({'error': 'Invalid username or password'}, status=401)
            
#             # Manual password verification
#             if user and check_password(password, user.password) and user.is_active:
#                 # No session creation - simple authentication only
#                 customer = self.get_or_create_customer(user)
                
#                 return JsonResponse({
#                     'message': 'Login successful',
#                     'user_id': user.id,
#                     'username': user.username,
#                     'email': user.email,
#                     'first_name': user.first_name,
#                     'last_name': user.last_name,
#                     'customer_id': customer.id,
#                     'customer_name': customer.name,
#                     'phone': customer.phone,
#                     'address': customer.address
#                 })
            
#             return JsonResponse({'error': 'Invalid username/email or password'}, status=401)
            
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON data'}, status=400)
#         except Exception as e:
#             return JsonResponse({'error': f'Login failed: {str(e)}'}, status=500)

#     def get_or_create_customer(self, user):
#         """Get or create a customer profile"""
#         try:
#             customer = RestaurantCustomer.objects.get(email=user.email)
#         except RestaurantCustomer.DoesNotExist:
#             # Create customer profile if it doesn't exist
#             customer = RestaurantCustomer.objects.create(
#                 name=f"{user.first_name} {user.last_name}",
#                 email=user.email,
#                 phone='',
#                 address='',
#                 created_at=timezone.now()
#             )
#         return customer
    
# class LogoutView(View):
#     """User logout API"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
#             username = data['username']
#             return JsonResponse({
#                 'message': 'Logout successful'
#             })
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'error': 'Invalid JSON'
#             }, status=400)
            
#         except KeyError:
#             return JsonResponse({
#                 'error': 'Username is required'
#             }, status=400)

# class ForgotPasswordView(View):
#     """Send password reset email"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             if 'email' not in data or not data['email']:
#                 return JsonResponse({
#                     'error': 'Email is required'
#                 }, status=400)
            
#             email = data['email'].strip().lower()
            
#             # Validate email format
#             email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
#             if not re.match(email_pattern, email):
#                 return JsonResponse({
#                     'error': 'Invalid email format'
#                 }, status=400)
            
#             try:
#                 user = AuthUser.objects.get(email=email)
#             except AuthUser.DoesNotExist:
#                 return JsonResponse({
#                     'message': 'If the email exists, a password reset link has been sent'
#                 })
            
#             # Generate reset token
#             reset_token = get_random_string(50)
            
#             # Save token to database - using only existing fields
#             RestaurantPasswordresettoken.objects.create(
#                 user=user,
#                 token=reset_token,
#                 created_at=timezone.now(),
#                 is_used=0  # 0 for false, since it's an IntegerField
#             )
            
#             # Prepare email content
#             reset_link = f"{SEASIDE_URL}/reset-password?token={reset_token}"
            
#             print("Reset link:", reset_link)
            
#             email_subject = "Password Reset - Seaside Restaurant"
#             email_message = f"""
#             Hi {user.first_name},
            
#             You requested to reset your password for your Seaside Restaurant account.
            
#             Click the link below to reset your password:
#             {reset_link}
            
#             This link will expire in 10 minutes.
            
#             If you didn't request this, please ignore this email.
            
#             Thanks,
#             Seaside Restaurant Team
#             """
            
#             # Send email
#             try:
#                 send_mail(
#                     email_subject,
#                     email_message,
#                     settings.DEFAULT_FROM_EMAIL,
#                     [email],
#                     fail_silently=False,
#                 )
                
#                 return JsonResponse({
#                     'message': 'Password reset email sent successfully'
#                 })
                
#             except Exception as email_error:
#                 return JsonResponse({
#                     'message': 'Email service not configured. Use this token for testing.',
#                     'reset_token': reset_token,
#                     'reset_link': reset_link
#                 })
                
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'error': f'Failed to send reset email: {str(e)}'
#             }, status=500)           
                        
# class ResetPasswordView(View):
#     """Verify reset token and allow password reset"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
#             token = data.get('token')
#             new_password = data.get('new_password')
            
#             if not token or not new_password:
#                 return JsonResponse({'error': 'Token and new password are required'}, status=400)
            
#             try:
#                 # Find the token
#                 reset_token = RestaurantPasswordresettoken.objects.get(
#                     token=token,
#                     is_used=0  # Not used yet
#                 )
                
#                 # Check if token is expired (1 hour limit)
#                 token_age = timezone.now() - reset_token.created_at
#                 if token_age.total_seconds() > 3600:  # 1 hour in seconds
#                     return JsonResponse({'error': 'Reset token has expired'}, status=400)
                
#                 # Update user's password - manually hash and set it
#                 user = reset_token.user
                
#                 # Method 1: Use Django's make_password (recommended)
#                 # from django.contrib.auth.hashers import make_password
#                 user.password = make_password(new_password)
#                 user.save()
                
#                 # Mark token as used
#                 reset_token.is_used = 1
#                 reset_token.save()
                
#                 return JsonResponse({'message': 'Password reset successfully'})
                
#             except RestaurantPasswordresettoken.DoesNotExist:
#                 return JsonResponse({'error': 'Invalid or expired reset token'}, status=400)
                
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)

# class ChangePasswordView(View):
#     """Change password for logged-in user"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             # Get user ID from request (since we're using session-less auth)
#             user_id = data.get('user_id')
#             if not user_id:
#                 return JsonResponse({
#                     'error': 'User ID is required'
#                 }, status=401)
            
#             required_fields = ['current_password', 'new_password']
#             for field in required_fields:
#                 if field not in data:
#                     return JsonResponse({
#                         'error': f'{field} is required'
#                     }, status=400)
            
#             current_password = data['current_password']
#             new_password = data['new_password']
            
#             # Get user from database
#             try:
#                 user = AuthUser.objects.get(id=user_id, is_active=1)
#             except AuthUser.DoesNotExist:
#                 return JsonResponse({
#                     'error': 'User not found'
#                 }, status=401)
            
#             # Validate current password using check_password
#             # from django.contrib.auth.hashers import check_password
#             if not check_password(current_password, user.password):
#                 return JsonResponse({
#                     'error': 'Current password is incorrect'
#                 }, status=400)
            
#             # Validate new password
#             if len(new_password) < 6:
#                 return JsonResponse({
#                     'error': 'New password must be at least 6 characters long'
#                 }, status=400)
            
#             # Check if new password is different
#             if check_password(new_password, user.password):
#                 return JsonResponse({
#                     'error': 'New password must be different from current password'
#                 }, status=400)
            
#             # Change password using make_password
#             # from django.contrib.auth.hashers import make_password
#             user.password = make_password(new_password)
#             user.save()
            
#             return JsonResponse({
#                 'message': 'Password changed successfully'
#             })
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'error': f'Password change failed: {str(e)}'
#             }, status=500)
            

# # Categories             
# class CategoryListView(View):
#     """Get all categories"""
    
#     def get(self, request):
#         # categories = RestaurantCategory.objects.all()
#         categories = RestaurantCategory.objects.filter(status=1)
#         data = []
#         for category in categories:
#             data.append({
#                 'id': category.id,
#                 'name': category.name,
#                 'description': category.description,
#             })
#         return JsonResponse({'categories': data})


# # Categories             

# class CategoryCreateView(View):
#     """Create a new category"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             # Validate required fields
#             if 'name' not in data or not data['name']:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Category name is required'
#                 }, status=400)
            
#             name = data['name'].strip()
#             description = data.get('description', '').strip()
            
#             # Check if category already exists
#             if RestaurantCategory.objects.filter(name__iexact=name).exists():
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Category with this name already exists'
#                 }, status=400)
            
#             # Create new category
#             category = RestaurantCategory.objects.create(
#                 name=name,
#                 description=description,
#                 status=1,
#                 created_at=timezone.now()
#             )
            
#             return JsonResponse({
#                 'success': True,
#                 'message': 'Category created successfully',
#                 'category': {
#                     'id': category.id,
#                     'name': category.name,
#                     'description': category.description,
#                     'created_at': category.created_at.isoformat() if category.created_at else None
#                 }
#             }, status=201)
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to create category: {str(e)}'
#             }, status=500)


# class CategoryDeleteView(View):
#     """Update an existing category's status to 0 using POST"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             # Validate required field
#             if 'category_id' not in data or not data['category_id']:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Category ID is required'
#                 }, status=400)
            
#             category_id = data['category_id']
            
#             # Get category by ID
#             try:
#                 category = RestaurantCategory.objects.get(id=category_id)
#             except RestaurantCategory.DoesNotExist:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Category not found'
#                 }, status=404)
            
#             category_name = category.name
#             category.status = 0
#             category.save()
            
#             return JsonResponse({
#                 'success': True,
#                 'message': f'Category "{category_name}" status updated to inactive'
#             })
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except ValueError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Category ID must be a valid number'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to update category status: {str(e)}'
#             }, status=500)


# class DeletedCategoryListView(View):
#     """Get all categories"""
    
#     def get(self, request):
#         # categories = RestaurantCategory.objects.all()
#         categories = RestaurantCategory.objects.filter(status=0)
#         data = []
#         for category in categories:
#             data.append({
#                 'id': category.id,
#                 'name': category.name,
#                 'description': category.description,
#             })
#         return JsonResponse({'categories': data})


# class UpdatedeletedcategoriesView(View):
#     """Update an existing category's status to 1 using POST"""    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             # Validate required field
#             if 'category_id' not in data or not data['category_id']:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Category ID is required'
#                 }, status=400)
            
#             category_id = data['category_id']
            
#             # Get category by ID
#             try:
#                 category = RestaurantCategory.objects.get(id=category_id)
#             except RestaurantCategory.DoesNotExist:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Category not found'
#                 }, status=404)
            
#             category_name = category.name
#             category.status = 1
#             category.save()
            
#             return JsonResponse({
#                 'success': True,
#                 'message': f'Category "{category_name}" status updated to inactive'
#             })
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except ValueError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Category ID must be a valid number'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to update category status: {str(e)}'
#             }, status=500)



# #Menu Management
# class MenuItemListView(View):  #get all items with categeories complete menu
#     """Get all categories with their menu items including multiple pricing"""
    
#     def get(self, request):
#         try:
#             # categories = RestaurantCategory.objects.all().order_by('name')
#             categories = RestaurantCategory.objects.filter(status=1).order_by('id')
            
#             categories_data = []
#             for category in categories:
#                 items = RestaurantMenuitem.objects.filter(category=category,status=1).order_by('id')
                
#                 items_data = []
#                 for item in items:
#                     is_available, availability_message = self.check_availability(item)
                    
#                     # Handle pricing based on pricing_type
#                     pricing_data = self.get_pricing_data(item)
                    
#                     item_data = {
#                         'id': item.id,
#                         'name': item.name,
#                         'description': item.description,
#                         'category_id': item.category_id,
#                         'category_name': category.name,
#                         'image': item.image,
#                         'is_vegetarian': bool(item.is_vegetarian),
#                         'is_available': bool(item.is_available),
#                         'created_at': item.created_at.isoformat() if item.created_at else None,
#                         'availability_schedule': item.availability_schedule,
#                         'pricing_type': item.pricing_type,
#                         'pricing': pricing_data
#                     }
                    
#                     if not is_available and availability_message:
#                         item_data['availability_message'] = availability_message
                    
#                     items_data.append(item_data)
                
#                 if items_data:
#                     categories_data.append({
#                         'id': category.id,
#                         'name': category.name,
#                         'description': category.description,
#                         'items': items_data,
#                         'items_count': len(items_data)
#                     })
            
#             return JsonResponse({
#                 'success': True,
#                 'categories': categories_data,
#                 'total_categories': len(categories_data),
#                 'total_items': sum(cat['items_count'] for cat in categories_data)
#             })
            
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to fetch menu data: {str(e)}'
#             }, status=500)
    
#     def get_pricing_data(self, item):
#         """Extract pricing information based on pricing_type"""
#         if item.pricing_type == 'single':
#             return {
#                 'type': 'single',
#                 'price': float(item.price) if item.price else None,
#                 'display_price': f"₹{item.price}" if item.price else "Price not available"
#             }
#         else:
#             # Multiple pricing from price_variations JSON
#             variations = item.price_variations or {}
#             price_list = []
            
#             for variation_name, price_value in variations.items():
#                 price_list.append({
#                     'size': variation_name,
#                     'price': float(price_value),
#                     'display_price': f"₹{price_value}"
#                 })
            
#             return {
#                 'type': 'multiple',
#                 'variations': price_list,
#                 'starting_from': f"₹{min(variations.values())}" if variations else "Price not available"
#             }
    
#     def check_availability(self, item):
#         """Check availability (same as before)"""
#         if not item.is_available:
#             return False, "Item is currently unavailable"
        
#         if not item.availability_schedule:
#             return True, None
        
#         # Your existing availability check logic here
#         return True, None
    
 
# class MenuWithCategoriesView(View):  #get the items in a singel category
#     """Get all menu items with optional category filter - Updated for new pricing structure"""
    
#     def get(self, request):
#         try:
#             items = RestaurantMenuitem.objects.filter(status=1,category__status=1)
#             category_id = request.GET.get('category')
            
#             if category_id:
#                 items = items.filter(category_id=category_id,)

#             data = []
#             for item in items:
#                 # Get pricing data based on pricing_type
#                 pricing_data = self.get_pricing_data(item)
                
#                 item_data = {
#                     'id': item.id,
#                     'name': item.name,
#                     'description': item.description,
#                     'category_id': item.category_id,
#                     'category': item.category.name,
#                     'image': item.image,
#                     'is_vegetarian': bool(item.is_vegetarian),
#                     'is_available': bool(item.is_available),
#                     'pricing_type': item.pricing_type,
#                     'pricing': pricing_data,
#                     'availability_schedule': item.availability_schedule
#                 }
                
#                 # Add availability message if needed
#                 is_available, availability_message = self.check_availability(item)
                
#                 if not is_available and availability_message:
#                     item_data['availability_message'] = availability_message
                
#                 data.append(item_data)
            
#             return JsonResponse({
#                 'success': True,
#                 'menu_items': data,
#                 'total_items': len(data),
#                 'filters': {
#                     'category_id': category_id
#                 }
#             })
            
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to fetch menu items: {str(e)}'
#             }, status=500)
    
#     def get_pricing_data(self, item):
#         """Extract pricing information based on pricing_type"""
#         if item.pricing_type == 'single':
#             return {
#                 'type': 'single',
#                 'price': float(item.price) if item.price else None,
#                 'display_price': f"₹{item.price}" if item.price else "Price not available"
#             }
#         else:
#             # Multiple pricing from price_variations JSON
#             variations = item.price_variations or {}
#             price_list = []
            
#             for variation_name, price_value in variations.items():
#                 price_list.append({
#                     'variation': variation_name,
#                     'price': float(price_value),
#                     'display_price': f"₹{price_value}"
#                 })
            
#             # Sort by price (optional)
#             price_list.sort(key=lambda x: x['price'])
            
#             return {
#                 'type': 'multiple',
#                 'variations': price_list,
#                 'starting_from': f"₹{min(variations.values())}" if variations else "Price not available",
#                 'min_price': min(variations.values()) if variations else None,
#                 'max_price': max(variations.values()) if variations else None
#             }
    
#     def check_availability(self, item):
#         """Check item availability"""
#         if not item.is_available:
#             return False, "Item is currently unavailable"
        
#         if not item.availability_schedule:
#             return True, None
        
#         # Add your availability schedule logic here if needed
#         return True, None


# class MenuItemDetailView(View):    #get single item by id
#     """Get single menu item by ID - Updated for new pricing structure"""
    
#     def get(self, request):
#         try:
#             item_id = request.GET.get('item_id')
            
#             if not item_id:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'item_id parameter is required'
#                 }, status=400)
            
#             # Get the menu item object from database
#             # item = RestaurantMenuitem.objects.get(id=item_id,status=1,category__status=1)
#             item = RestaurantMenuitem.objects.get(id=item_id,status=1,category__status=1)

            
#             # Get pricing data based on pricing_type
#             pricing_data = self.get_pricing_data(item)
            
#             # Check availability
#             is_available, availability_message = self.check_availability(item)
            
#             data = {
#                 'id': item.id,
#                 'name': item.name,
#                 'description': item.description,
#                 'category_id': item.category_id,
#                 'category': item.category.name,
#                 'image': item.image,
#                 'is_vegetarian': bool(item.is_vegetarian),
#                 'is_available': bool(item.is_available),
#                 'pricing_type': item.pricing_type,
#                 'pricing': pricing_data,
#                 'availability_schedule': item.availability_schedule,
#                 'created_at': item.created_at.isoformat() if item.created_at else None
#             }
            
#             # Add availability message if item is not available
#             if not is_available and availability_message:
#                 data['availability_message'] = availability_message
            
#             return JsonResponse({
#                 'success': True,
#                 'menu_item': data
#             })
            
#         except RestaurantMenuitem.DoesNotExist:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Menu item not found'
#             }, status=404)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to fetch menu item: {str(e)}'
#             }, status=500)
    
#     def get_pricing_data(self, item):
#         """Extract pricing information based on pricing_type"""
#         if item.pricing_type == 'single':
#             return {
#                 'type': 'single',
#                 'price': float(item.price) if item.price else None,
#                 'display_price': f"₹{item.price}" if item.price else "Price not available"
#             }
#         else:
#             # Multiple pricing from price_variations JSON
#             variations = item.price_variations or {}
#             price_list = []
            
#             for variation_name, price_value in variations.items():
#                 price_list.append({
#                     'variation': variation_name,
#                     'price': float(price_value),
#                     'display_price': f"₹{price_value}"
#                 })
            
#             # Sort by price
#             price_list.sort(key=lambda x: x['price'])
            
#             return {
#                 'type': 'multiple',
#                 'variations': price_list,
#                 'starting_from': f"₹{min(variations.values())}" if variations else "Price not available",
#                 'min_price': min(variations.values()) if variations else None,
#                 'max_price': max(variations.values()) if variations else None
#             }
    
#     def check_availability(self, item):
#         """Check item availability"""
#         if not item.is_available:
#             return False, "Item is currently unavailable"
        
#         if not item.availability_schedule:
#             return True, None
        
#         # Add your availability schedule logic here if needed
#         return True, None
    



# class MenuSearchView(View):  #search by name only
#     """Search menu items by name - Simplified version"""
    
#     def get(self, request):
#         try:
#             query = request.GET.get('q', '').strip()
            
#             if not query:
#                 return JsonResponse({
#                     'success': True,
#                     'results': [],
#                     'total_results': 0,
#                     'query': '',
#                     'message': 'Please enter a search term'
#                 })
            
#             # Simple search - name only (remove description search to simplify)
#             items = RestaurantMenuitem.objects.filter(name__icontains=query,status=1,category__status=1)
            
#             # Apply availability filter if requested
#             available_only = request.GET.get('available', 'true').lower() in ['true', '1', 'yes']
#             if available_only:
#                 items = items.filter(is_available=True)
            
#             # Simple ordering by name
#             items = items.order_by('name')
            
#             results = []
#             for item in items:
#                 pricing_data = self.get_pricing_data(item)
#                 is_available, availability_message = self.check_availability(item)
                
#                 result_item = {
#                     'id': item.id,
#                     'name': item.name,
#                     'description': item.description,
#                     'category_id': item.category_id,
#                     'category': item.category.name,
#                     'image': item.image,
#                     'is_vegetarian': bool(item.is_vegetarian),
#                     'is_available': bool(item.is_available),
#                     'pricing_type': item.pricing_type,
#                     'pricing': pricing_data,
#                     'match_type': 'name'  # Since we're only searching by name
#                 }
                
#                 if not is_available and availability_message:
#                     result_item['availability_message'] = availability_message
                
#                 results.append(result_item)
            
#             return JsonResponse({
#                 'success': True,
#                 'results': results,
#                 'total_results': len(results),
#                 'query': query,
#                 'filters': {
#                     'available_only': available_only
#                 }
#             })
            
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to search menu items: {str(e)}'
#             }, status=500)
    
#     def get_pricing_data(self, item):
#         """Extract pricing information based on pricing_type"""
#         if item.pricing_type == 'single':
#             return {
#                 'type': 'single',
#                 'price': float(item.price) if item.price else None,
#                 'display_price': f"₹{item.price}" if item.price else "Price not available"
#             }
#         else:
#             variations = item.price_variations or {}
#             price_list = []
            
#             for variation_name, price_value in variations.items():
#                 price_list.append({
#                     'variation': variation_name,
#                     'price': float(price_value),
#                     'display_price': f"₹{price_value}"
#                 })
            
#             price_list.sort(key=lambda x: x['price'])
            
#             return {
#                 'type': 'multiple',
#                 'variations': price_list,
#                 'starting_from': f"₹{min(variations.values())}" if variations else "Price not available",
#                 'min_price': min(variations.values()) if variations else None,
#                 'max_price': max(variations.values()) if variations else None
#             }
    
#     def check_availability(self, item):
#         """Check item availability"""
#         if not item.is_available:
#             return False, "Item is currently unavailable"
        
#         if not item.availability_schedule:
#             return True, None
        
#         return True, None


# class OrderCreateView(View): #new order with multiple pricing
#     """Create new order with support for multiple pricing variations"""
    
#     @transaction.atomic
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             # Validate customer_id presence (from login response)
#             if 'customer_id' not in data:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'customer_id is required'
#                 }, status=400)
            
#             # Get customer by customer_id
#             try:
#                 customer = RestaurantCustomer.objects.get(id=data['customer_id'])
#             except RestaurantCustomer.DoesNotExist:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Customer not found'
#                 }, status=404)
            
#             # Calculate total and validate items
#             total_amount = 0
#             order_items = data['items']
#             validated_items = []
            
#             for item_data in order_items:
#                 menu_item = RestaurantMenuitem.objects.get(id=item_data['menu_item_id'],status=1,category__status=1)
                
#                 # Validate item availability
#                 if not menu_item.is_available:
#                     return JsonResponse({
#                         'success': False,
#                         'error': f"Item '{menu_item.name}' is currently unavailable"
#                     }, status=400)
                
#                 # Get price based on pricing type and selected variation
#                 item_price = self.get_item_price(menu_item, item_data)
#                 if item_price is None:
#                     return JsonResponse({
#                         'success': False,
#                         'error': f"Invalid variation selected for '{menu_item.name}'"
#                     }, status=400)
                
#                 quantity = item_data['quantity']
#                 item_total = item_price * quantity
#                 total_amount += item_total
                
#                 validated_items.append({
#                     'menu_item': menu_item,
#                     'quantity': quantity,
#                     'price': item_price,
#                     'selected_variation': item_data.get('selected_variation'),
#                     'special_instructions': item_data.get('special_instructions', '')
#                 })
            
#             # Create order
#             order = RestaurantOrders.objects.create(
#                 customer=customer,
#                 total_amount=total_amount,
#                 delivery_address=data.get('delivery_address', customer.address),
#                 phone=data.get('phone', customer.phone),
#                 status='pending',
#                 order_date=timezone.now()
#             )
            
#             # Create order items
#             for item_data in validated_items:
#                 RestaurantOrderitem.objects.create(
#                     order=order,
#                     menu_item=item_data['menu_item'],
#                     quantity=item_data['quantity'],
#                     price=item_data['price']
#                     # Note: selected_variation and special_instructions fields don't exist in your model
#                     # You'll need to add these fields to the model if you want to store them
#                 )
            
#             # Prepare order summary for response
#             order_summary = self.get_order_summary(order, validated_items)
            
#             return JsonResponse({
#                 'success': True,
#                 'message': 'Order created successfully',
#                 'order_id': order.id,
#                 'order_number': f"ORD{order.id:06d}",
#                 'total_amount': float(total_amount),
#                 'order_summary': order_summary
#             })
            
#         except RestaurantMenuitem.DoesNotExist:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'One or more menu items not found'
#             }, status=404)
#         except KeyError as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Missing required field: {str(e)}'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to create order: {str(e)}'
#             }, status=500)
    
#     def get_item_price(self, menu_item, item_data):
#         """Get price based on pricing type and selected variation"""
#         if menu_item.pricing_type == 'single':
#             # For single pricing, use the price field
#             return menu_item.price if menu_item.price else Decimal('0.00')
        
#         else:  # multiple pricing
#             selected_variation = item_data.get('selected_variation')
#             if not selected_variation:
#                 return None
            
#             variations = menu_item.price_variations or {}
#             if selected_variation in variations:
#                 return Decimal(str(variations[selected_variation]))
            
#             return None
    
#     def get_order_summary(self, order, items):
#         """Generate order summary for response"""
#         order_items = []
        
#         for item_data in items:
#             menu_item = item_data['menu_item']
#             item_summary = {
#                 'id': menu_item.id,
#                 'name': menu_item.name,
#                 'quantity': item_data['quantity'],
#                 'unit_price': float(item_data['price']),
#                 # 'total_price': float(item_data['price'] * item_data['quantity']),
#                 'total_price': int(item_data['price'] * item_data['quantity']),
#                 'selected_variation': item_data.get('selected_variation'),
#                 'special_instructions': item_data.get('special_instructions', '')
#             }
#             order_items.append(item_summary)
        
#         return {
#             'order_id': order.id,
#             'order_number': f"ORD{order.id:06d}",
#             'customer_name': order.customer.name,
#             'customer_phone': order.phone,
#             'delivery_address': order.delivery_address,
#             # 'total_amount': float(order.total_amount),
#             'total_amount': int(order.total_amount),
#             'status': order.status,
#             'order_date': order.order_date.isoformat() if order.order_date else None,
#             'items': order_items
#         }


# class CustomerOrdersView(View): # get all orders for a customer_id
#     """Get all orders for a customer by customer_id"""
    
#     def get(self, request):
#         customer_id = request.GET.get('customer_id')
#         if not customer_id:
#             return JsonResponse({'error': 'customer_id parameter required'}, status=400)
        
#         try:
#             # Validate customer exists
#             customer = RestaurantCustomer.objects.get(id=customer_id)
            
#             # Optimized query with prefetch_related to avoid N+1 problem
#             orders = RestaurantOrders.objects.filter(customer=customer)\
#                 .prefetch_related('restaurantorderitem_set__menu_item')\
#                 .order_by('-order_date')
            
#             data = []
#             for order in orders:
#                 order_items = order.restaurantorderitem_set.all()
#                 items_count = order_items.count()
                
#                 # Get item details for the order
#                 items_summary = []
#                 for item in order_items:
#                     items_summary.append({
#                         'id': item.menu_item.id,
#                         'name': item.menu_item.name,
#                         'quantity': item.quantity,
#                         'price': float(item.price),
#                         'selected_variation': getattr(item, 'selected_variation', None),
#                         'special_instructions': getattr(item, 'special_instructions', '')
#                     })
                
#                 data.append({
#                     'order_id': order.id,
#                     'order_number': f"ORD{order.id:06d}",
#                     'total_amount': float(order.total_amount),
#                     'status': order.status,
#                     'order_date': order.order_date.isoformat() if order.order_date else None,
#                     'delivery_address': order.delivery_address,
#                     'items_count': items_count,
#                     'items': items_summary
#                 })
            
#             return JsonResponse({
#                 'success': True,
#                 'customer_id': customer.id,
#                 'customer_name': customer.name,
#                 'total_orders': len(data),
#                 'orders': data
#             })
            
#         except RestaurantCustomer.DoesNotExist:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Customer not found'
#             }, status=404)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to fetch orders: {str(e)}'
#             }, status=500)


# class OrderDetailView(View): #get single order by id
#     """Get order details by ID"""
    
#     def get(self, request, order_id):
#         try:
#             order = RestaurantOrders.objects.get(id=order_id)
#             order_items = RestaurantOrderitem.objects.filter(order=order)
            
#             items_data = []
#             for item in order_items:
#                 items_data.append({
#                     'menu_item': item.menu_item.name,
#                     'quantity': item.quantity,
#                     'price': float(item.price),
#                     'subtotal': float(item.quantity * item.price)
#                 })
            
#             data = {
#                 'id': order.id,
#                 'customer': order.customer.name,
#                 'total_amount': float(order.total_amount),
#                 'status': order.status,
#                 'order_date': order.order_date.isoformat() if order.order_date else None,
#                 'delivery_address': order.delivery_address,
#                 'phone': order.phone,
#                 'items': items_data
#             }
#             return JsonResponse({'order': data})
            
#         except RestaurantOrders.DoesNotExist:
#             return JsonResponse({'error': 'Order not found'}, status=404)


# #inquiry
# class InquiryCreateView(View):   #new inquiry with email notification
#     """Handle contact form submissions"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             # Validate required fields
#             required_fields = ['name', 'phone', 'message']
#             for field in required_fields:
#                 if field not in data or not data[field].strip():
#                     return JsonResponse({
#                         'success': False,
#                         'error': f'{field.replace("_", " ").title()} is required'
#                     }, status=400)
            
#             name = data['name'].strip()
#             phone = data['phone'].strip()
#             email = data.get('email', '').strip()
#             message = data['message'].strip()
            
#             # Validate phone number format
#             if not self.is_valid_phone(phone):
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Please enter a valid phone number'
#                 }, status=400)

#             # Validate email if provided
#             if email and not self.is_valid_email(email):
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Please enter a valid email address'
#                 }, status=400)
            
#             # Create inquiry record
#             inquiry = RestaurantInquiry.objects.create(
#                 name=name,
#                 phone=phone,
#                 email=email if email else None,
#                 message=message,
#                 status='new',
#                 created_at=timezone.now()
#             )
            
#             # Send notification email to admin
#             try:
#                 self.send_notification_email(inquiry)
#             except Exception as email_error:
#                 # Log the error but don't fail the request
#                 print(f"Email notification failed: {email_error}")
            
#             return JsonResponse({
#                 'success': True,
#                 'message': 'Thank you for your message! We will get back to you soon.',
#                 'inquiry_id': inquiry.id
#             }, status=201)
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to submit inquiry: {str(e)}'
#             }, status=500)
    
#     def is_valid_phone(self, phone):
#         """Basic phone number validation"""
#         # Remove any non-digit characters
#         clean_phone = ''.join(filter(str.isdigit, phone))
#         return len(clean_phone) >= 10
    
#     def is_valid_email(self, email):
#         """Email validation"""
#         import re
#         if not email:
#             return True  # Email is optional, so empty is valid
#         pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
#         return re.match(pattern, email) is not None
    
#     def send_notification_email(self, inquiry):
#         """Send email notification to admin"""
#         subject = f"New Restaurant Inquiry from {inquiry.name}"
        
#         message = f"""
#         New restaurant inquiry received:
        
#         Name: {inquiry.name}
#         Phone: {inquiry.phone}
#         Email: {inquiry.email or 'Not provided'}
        
#         Message:
#         {inquiry.message}
        
#         Received: {inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S')}
        
#         Inquiry ID: {inquiry.id}
#         """
        
#         # Send email to admin
#         send_mail(
#             subject=subject,
#             message=message.strip(),
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             recipient_list=[ADMIN_EMAIL],  # Use the admin email from settings
#             fail_silently=False,  # Set to True if you don't want exceptions raised
#         )

     
# class RestaurantInquiryAPIView(View):
#     def get(self, request):
#         """
#         Get all inquiries
#         """
#         inquiries = RestaurantInquiry.objects.all().order_by('-created_at')
#         inquiries_data = [
#             {
#                 'id': inquiry.id,
#                 'name': inquiry.name,
#                 'phone': inquiry.phone,
#                 'email': inquiry.email,
#                 'message': inquiry.message,
#                 'status': inquiry.status,
#                 'created_at': inquiry.created_at,
#                 'updated_at': inquiry.updated_at
#             }
#             for inquiry in inquiries
#         ]
#         return JsonResponse(inquiries_data, safe=False)


# class RestaurantInquiryStatusUpdateAPIView(View):
#     def post(self, request):
#         """
#         Update the status of an inquiry by ID
#         """
#         try:
#             # Parse JSON data
#             if request.body:
#                 data = json.loads(request.body)
#             else:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Request body is required'
#                 }, status=400)
            
#             inquiry_id = data.get('id')
#             new_status = data.get('status')
            
#             if not inquiry_id or not new_status:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'id and status are required'
#                 }, status=400)
            
#             # Validate status against model's choices
#             valid_statuses = [choice[0] for choice in RestaurantInquiry.INQUIRY_STATUS_CHOICES]
#             if new_status not in valid_statuses:
#                 return JsonResponse({
#                     'success': False,
#                     'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
#                 }, status=400)
            
#             try:
#                 inquiry = RestaurantInquiry.objects.get(pk=inquiry_id)
#             except RestaurantInquiry.DoesNotExist:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Inquiry not found'
#                 }, status=404)
            
#             inquiry.status = new_status
#             inquiry.updated_at = timezone.now()  
#             inquiry.save()
            
#             return JsonResponse({
#                 'success': True,
#                 'data': {
#                     'id': inquiry.id,
#                     'name': inquiry.name,
#                     'phone': inquiry.phone,
#                     'email': inquiry.email,
#                     'message': inquiry.message,
#                     'status': inquiry.status,
#                     'created_at': inquiry.created_at,
#                     'updated_at': inquiry.updated_at
#                 }
#             })
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON format'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'An error occurred: {str(e)}'
#             }, status=500)
            

# # Customer creation
# class CustomerCreateView(View):  # Customer creation
#     """Create new customer"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
#             customer = RestaurantCustomer.objects.create(
#                 name=data['name'],
#                 email=data['email'],
#                 phone=data['phone'],
#                 address=data['address'],
#                 created_at=timezone.now()
#             )
#             return JsonResponse({
#                 'message': 'Customer created successfully',
#                 'customer_id': customer.id
#             })
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=400)


# #Dashboard
# class AdminDashboardView(View):
#     """Get dashboard statistics"""
    
#     def get(self, request):

#         try:
#             # Today's metrics
#             today = timezone.now().date()
#             today_orders = RestaurantOrders.objects.filter(order_date__date=today)
#             today_revenue = today_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
#             # Total metrics
#             total_orders = RestaurantOrders.objects.count()
#             total_customers = RestaurantCustomer.objects.count()
#             total_menu_items = RestaurantMenuitem.objects.filter(status=1).count()
#             # total_menu_items = RestaurantMenuitem.objects.count()
            
#             # Recent orders (last 10)
#             recent_orders = RestaurantOrders.objects.select_related('customer')\
#                 .prefetch_related('restaurantorderitem_set__menu_item')\
#                 .order_by('-order_date')[:10]
            
#             recent_orders_data = []
#             for order in recent_orders:
#                 recent_orders_data.append({
#                     'order_id': order.id,
#                     'order_number': f"ORD{order.id:06d}",
#                     'customer_name': order.customer.name,
#                     'total_amount': float(order.total_amount),
#                     'status': order.status,
#                     'order_date': order.order_date.isoformat()
#                 })
            
#             # Status counts
#             status_counts = {
#                 'pending': RestaurantOrders.objects.filter(status='pending').count(),
#                 'confirmed': RestaurantOrders.objects.filter(status='confirmed').count(),
#                 'preparing': RestaurantOrders.objects.filter(status='preparing').count(),
#                 'out_for_delivery': RestaurantOrders.objects.filter(status='out_for_delivery').count(),
#                 'delivered': RestaurantOrders.objects.filter(status='delivered').count(),
#                 'cancelled': RestaurantOrders.objects.filter(status='cancelled').count()
#             }
            
#             return JsonResponse({
#                 'success': True,
#                 'stats': {
#                     'today_orders': today_orders.count(),
#                     'today_revenue': float(today_revenue),
#                     'total_orders': total_orders,
#                     'total_customers': total_customers,
#                     'total_menu_items': total_menu_items,
#                     'status_counts': status_counts
#                 },
#                 'recent_orders': recent_orders_data
#             })
            
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to fetch dashboard data: {str(e)}'
#             }, status=500)

# # Get all orders with filtering and search
# class AdminOrdersView(View):
#     """Get all orders with filtering and search"""
    
#     def get(self, request):
#         try:
#             # Filter parameters
#             status = request.GET.get('status')
#             date_from = request.GET.get('date_from')
#             date_to = request.GET.get('date_to')
#             search = request.GET.get('search')
            
#             # Start with base queryset
#             orders = RestaurantOrders.objects.select_related('customer')\
#                 .prefetch_related('restaurantorderitem_set__menu_item')\
#                 .order_by('-order_date')
            
#             # Base queryset for counts (without expensive prefetch)
#             count_queryset = RestaurantOrders.objects.all()
                        
#             valid_statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']

#             # Define apply_filters function with proper parameter passing
#             def apply_filters(qs, filter_status, filter_date_from, filter_date_to, filter_search):
#                 if filter_status and filter_status in valid_statuses:
#                     qs = qs.filter(status=filter_status)
                    
#                 if filter_date_from:
#                     try:
#                         datetime.strptime(filter_date_from, '%Y-%m-%d')
#                         qs = qs.filter(order_date__date__gte=filter_date_from)
#                     except ValueError:
#                         pass  # Skip invalid date filters
                    
#                 if filter_date_to:
#                     try:
#                         datetime.strptime(filter_date_to, '%Y-%m-%d')
#                         qs = qs.filter(order_date__date__lte=filter_date_to)
#                     except ValueError:
#                         pass  # Skip invalid date filters
                
#                 if filter_search:
#                     filter_search = filter_search.strip()
#                     if filter_search:
#                         if filter_search.upper().startswith('ORD'):
#                             search_id = filter_search[3:].lstrip('0')
#                             try:
#                                 order_id = int(search_id) if search_id else 0
#                                 qs = qs.filter(id=order_id)
#                             except ValueError:
#                                 qs = qs.none()
#                         else:
#                             qs = qs.filter(
#                                 Q(customer__name__icontains=filter_search) |
#                                 Q(customer__phone__icontains=filter_search) |
#                                 Q(delivery_address__icontains=filter_search) |
#                                 Q(phone__icontains=filter_search)
#                             )
#                 return qs

#             # Apply filters to both querysets with proper parameters
#             orders = apply_filters(orders, status, date_from, date_to, search)
#             count_queryset = apply_filters(count_queryset, status, date_from, date_to, search)

#             # Get status counts in a single database query (more efficient)
#             status_counts_query = count_queryset.values('status').annotate(count=Count('id'))
#             status_counts = {status_val: 0 for status_val in valid_statuses}
            
#             for item in status_counts_query:
#                 if item['status'] in status_counts:
#                     status_counts[item['status']] = item['count']
            
#             # Total orders count
#             total_orders_count = count_queryset.count()
            
#             # Process orders data
#             orders_data = []
#             for order in orders:
#                 order_items = order.restaurantorderitem_set.all()
#                 items_summary = []
                
#                 for item in order_items:
#                     items_summary.append({
#                         'id': item.menu_item.id,
#                         'name': item.menu_item.name,
#                         'quantity': item.quantity,
#                         'price': float(item.price),
#                         'selected_variation': item.selected_variation or '',
#                         'special_instructions': item.special_instructions or ''
#                     })
                
#                 orders_data.append({
#                     'order_id': order.id,
#                     'order_number': f"ORD{order.id:06d}",
#                     'customer_name': order.customer.name,
#                     'customer_phone': order.customer.phone,
#                     'total_amount': float(order.total_amount),
#                     'status': order.status,
#                     'order_date': order.order_date.isoformat() if order.order_date else None,
#                     'delivery_address': order.delivery_address,
#                     'phone': order.phone,
#                     'items_count': order_items.count(),
#                     'items': items_summary
#                 })
            
#             return JsonResponse({
#                 'success': True,
#                 'total_orders': total_orders_count,
#                 'status_counts': status_counts,
#                 'filtered_orders': len(orders_data),
#                 'orders': orders_data,
#                 'valid_statuses': valid_statuses
#             })
            
#         except Exception as e:
#             import traceback
#             # Correct logger usage
#             logger.error(f"Error fetching orders: {str(e)}\n{traceback.format_exc()}")
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Failed to fetch orders. Please try again later.'
#             }, status=500)


# #order status update
# class UpdateOrderStatusView(View):
#     """Update order status"""
    
#     def post(self, request):
#         try:
#             # Parse JSON data
#             if request.body:
#                 data = json.loads(request.body)
#             else:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Request body is required'
#                 }, status=400)
            
#             order_identifier = data.get('order_id')  # Can be "ORD000002" or numeric ID
#             new_status = data.get('status')
            
#             if not order_identifier or not new_status:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'order_id and status are required'
#                 }, status=400)
            
#             valid_statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
#             if new_status not in valid_statuses:
#                 return JsonResponse({
#                     'success': False,
#                     'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
#                 }, status=400)
            
#             # Try to find the order by different methods
#             order = None
            
#             # Method 1: Check if it's an order number (ORD000002 format)
#             if isinstance(order_identifier, str) and order_identifier.upper().startswith('ORD'):
#                 try:
#                     order_id_str = order_identifier[3:].lstrip('0')
#                     order_id = int(order_id_str) if order_id_str else 0
#                     if order_id > 0:
#                         order = RestaurantOrders.objects.get(id=order_id)
#                 except (ValueError, RestaurantOrders.DoesNotExist):
#                     order = None
            
#             # Method 2: Try as direct numeric ID
#             if order is None:
#                 try:
#                     order_id = int(order_identifier)
#                     order = RestaurantOrders.objects.get(id=order_id)
#                 except (ValueError, RestaurantOrders.DoesNotExist):
#                     order = None
            
#             # Method 3: If still not found, try searching by partial match
#             if order is None and isinstance(order_identifier, str):
#                 try:
#                     # Remove any non-numeric characters and try again
#                     numeric_id = ''.join(filter(str.isdigit, order_identifier))
#                     if numeric_id:
#                         order_id = int(numeric_id)
#                         order = RestaurantOrders.objects.get(id=order_id)
#                 except (ValueError, RestaurantOrders.DoesNotExist):
#                     order = None
            
#             if order is None:
#                 return JsonResponse({
#                     'success': False,
#                     'error': f'Order not found: {order_identifier}'
#                 }, status=404)
            
#             # Update the order status
#             old_status = order.status
#             order.status = new_status
#             order.save()
            
#             return JsonResponse({
#                 'success': True,
#                 'message': f'Order status updated from {old_status} to {new_status}',
#                 'order_id': order.id,
#                 'order_number': f"ORD{order.id:06d}",
#                 'old_status': old_status,
#                 'new_status': new_status,
#                 'status': new_status
#             })
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON format'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to update order status: {str(e)}'
#             }, status=500)


# #admin creation
# class createowner(View):
#     """User registration/signup API"""
    
#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
#             for field in required_fields:
#                 if field not in data or not data[field]:
#                     return JsonResponse({
#                         'error': f'{field} is required'
#                     }, status=400)
            
#             username = data.get('username', data['first_name'] + ' ' + data['last_name'])  # Adding space between first and last name


#             email = data['email']
#             password = data['password']
#             first_name = data['first_name']
#             last_name = data['last_name']
#             phone = data['phone']
#             address = data.get('address', '')
            
#             # Validate email format
#             email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
#             if not re.match(email_pattern, email):
#                 return JsonResponse({
#                     'error': 'Invalid email format'
#                 }, status=400)
            
#             # Validate password strength
#             if len(password) < 6:
#                 return JsonResponse({
#                     'error': 'Password must be at least 6 characters long'
#                 }, status=400)
            
#             # Check if username already exists
#             if AuthUser.objects.filter(username=username).exists():
#                 return JsonResponse({
#                     'error': 'Username already exists'
#                 }, status=400)
            
#             # Check if email already exists
#             if AuthUser.objects.filter(email=email).exists():
#                 return JsonResponse({
#                     'error': 'Email already registered'
#                 }, status=400)
            
#             hashed_password = make_password(password)
            
#             # Create user with hashed password
#             user = AuthUser.objects.create(
#                 username=username,
#                 email=email,
#                 password=hashed_password,
#                 first_name=first_name,
#                 last_name=last_name,
#                 is_active=1,
#                 is_staff=1,
#                 is_superuser=1,
#                 date_joined=timezone.now()
#             )
            
#             return JsonResponse({
#                 'message': 'User registered successfully',
#                 'user_id': user.id,
#                 'username': username,
#                 'email': email
#             }, status=201)
            
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'error': f'Registration failed: {str(e)}'
#             }, status=500)

# #admin login
# class OwnerLogin(View):

#     def post(self, request):
#         try:
#             data = json.loads(request.body)
            
#             if not data.get('username') or not data.get('password'):
#                 return JsonResponse({'error': 'Username and password are required'}, status=400)
            
#             username = data['username']
#             password = data['password']
            
#             user = None
#             if '@' in username:
#                 # Login with email
#                 try:
#                     user = AuthUser.objects.get(email=username)
#                     print(f"User found by email: {user.username}, is_active: {user.is_active}, is_staff: {user.is_staff}, is_superuser: {user.is_superuser}")
#                 except AuthUser.DoesNotExist:
#                     print(f"User with email {username} not found")
#                     return JsonResponse({'error': 'Invalid email or password'}, status=401)
#             else:
#                 # Login with username
#                 try:
#                     user = AuthUser.objects.get(username=username)
#                     print(f"User found by username: {user.username}, is_active: {user.is_active}, is_staff: {user.is_staff}, is_superuser: {user.is_superuser}")
#                 except AuthUser.DoesNotExist:
#                     print(f"User with username {username} not found")
#                     return JsonResponse({'error': 'Invalid username or password'}, status=401)
            
#             # Debug password check and user status
#             if user:
#                 password_correct = check_password(password, user.password)
#                 print(f"Password correct: {password_correct}")
#                 print(f"User status - active: {user.is_active}, staff: {user.is_staff}, superuser: {user.is_superuser}")
                
#                 if password_correct and user.is_active and user.is_staff and user.is_superuser:
#                     return JsonResponse({
#                         'message': 'Login successful',
#                         'user_id': user.id,
#                         'username': user.username,
#                         'email': user.email,
#                         'first_name': user.first_name,
#                         'last_name': user.last_name,
#                         'is_staff': user.is_staff,
#                         'is_superuser': user.is_superuser
#                     })
#                 else:
#                     print("Login failed due to:")
#                     if not password_correct:
#                         print("- Incorrect password")
#                     if not user.is_active:
#                         print("- User inactive")
#                     if not user.is_staff:
#                         print("- User not staff")
 

            
#             return JsonResponse({'error': 'Invalid username/email or password'}, status=401)
            
#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON data'}, status=400)
#         except Exception as e:
#             print(f"Exception: {str(e)}")
#             return JsonResponse({'error': f'Login failed: {str(e)}'}, status=500)
            


# # get all menu with filters by categories and is_vegetarian and is_available
# # class GetAllMenuItemsView(View):
# #     """Get all menu items with filtering"""
    
# #     def get(self, request):
# #         try:
# #             # Get query parameters
# #             category_id = request.GET.get('category_id')
# #             available_only = request.GET.get('available_only')
# #             vegetarian_only = request.GET.get('vegetarian_only')
            
# #             # category_id = request.GET.get('category_id')
# #             # available_only = request.GET.get('available_only')
# #             # vegetarian_only = request.GET.get('vegetarian_only')
            
# #             # menu_items = RestaurantMenuitem.objects.all().order_by('name')
# #             # menu_items = RestaurantMenuitem.objects.filter(status=1).order_by('name')
# #             # menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('name')

            
# #             # # Apply filters
# #             # if category_id:
# #             #     menu_items = menu_items.filter(category_id=category_id,status=1)
# #             # if available_only:
# #             #     menu_items = menu_items.filter(is_available=1,status=1)
# #             # if vegetarian_only:
# #             #     menu_items = menu_items.filter(is_vegetarian=1,status=1)
            
            
# #             menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('id')

# #             # Apply filters
# #             if category_id:
# #                 menu_items = menu_items.filter(category_id=category_id)
# #             if available_only:
# #                 menu_items = menu_items.filter(is_available=True)
# #             if vegetarian_only:
# #                 menu_items = menu_items.filter(is_vegetarian=True)

# #             available_only = request.GET.get('available', 'true').lower() in ['true', '1', 'yes']
            
# #             if available_only:
# #                 items = items.filter(is_available=True)
                    
# #             items_data = []
# #             for item in menu_items:
                
# #                 is_available, availability_message = self.check_availability(item)

# #                 items_data.append({
# #                     'id': item.id,
# #                     'name': item.name,
# #                     'description': item.description,
# #                     'price': float(item.price) if item.price else None,
# #                     'pricing_type': item.pricing_type,
# #                     'price_variations': item.price_variations or {},
# #                     'is_available': bool(item.is_available),
# #                     'is_vegetarian': bool(item.is_vegetarian),
# #                     'category_id': item.category.id,
# #                     'category_name': item.category.name,
# #                     'image': item.image,
# #                     'created_at': item.created_at.isoformat() if item.created_at else None
# #                 })
# #                 if not is_available and availability_message:
# #                     result_item['availability_message'] = availability_message
                
# #                 results.append(result_item)
# #             # is_available, availability_message = self.check_availability(item)
# #             # if not is_available and availability_message:
# #             #                     result_item['availability_message'] = availability_message
            
# #             def check_availability(self, item):
# #                 """Check item availability"""
# #                 if not item.is_available:
# #                     return False, "Item is currently unavailable"
                
# #                 if not item.availability_schedule:
# #                     return True, None
                
# #                 return True, None


# #             return JsonResponse({
# #                 'success': True,
# #                 'total_items': len(items_data),
# #                 'menu_items': items_data
# #             })
            
# #         except Exception as e:
# #             return JsonResponse({
# #                 'success': False,
# #                 'error': f'Failed to fetch menu items: {str(e)}'
# #             }, status=500)
            
# # get availability
# class GetAllMenuItemsView(View):
#     """Get all menu items with filtering"""
    
#     def get(self, request):
#         try:
#             # Get query parameters
#             category_id = request.GET.get('category_id')
#             available_only = request.GET.get('available_only')
#             vegetarian_only = request.GET.get('vegetarian_only')
            
#             menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('id')

#             # Apply filters
#             if category_id:
#                 menu_items = menu_items.filter(category_id=category_id)
#             if available_only:
#                 menu_items = menu_items.filter(is_available=True)
#             if vegetarian_only:
#                 menu_items = menu_items.filter(is_vegetarian=True)
                    
#             items_data = []
#             for item in menu_items:
#                 is_available, availability_message = self.check_availability(item)

#                 item_data = {
#                     'id': item.id,
#                     'name': item.name,
#                     'description': item.description,
#                     'price': float(item.price) if item.price else None,
#                     'pricing_type': item.pricing_type,
#                     'price_variations': item.price_variations or {},
#                     'is_available': is_available,  # Use the result from check_availability
#                     'is_vegetarian': bool(item.is_vegetarian),
#                     'category_id': item.category.id,
#                     'category_name': item.category.name,
#                     'image': item.image,
#                     'created_at': item.created_at.isoformat() if item.created_at else None
#                 }
                
#                 # Add availability message if item is not available
#                 if not is_available and availability_message:
#                     item_data['availability_message'] = availability_message
                
#                 items_data.append(item_data)

#             return JsonResponse({
#                 'success': True,
#                 'total_items': len(items_data),
#                 'menu_items': items_data
#             })
            
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to fetch menu items: {str(e)}'
#             }, status=500)

#     def check_availability(self, item):
#         """Check item availability"""
#         if not item.is_available:
#             return False, "Item is currently unavailable"
        
#         if hasattr(item, 'availability_schedule') and item.availability_schedule:
#             pass
            
#         return True, None

# # admin get all menu items view
# class AdminGetAllMenuItemsView(View):
#     """Get all menu items with filtering"""
    
#     def get(self, request):
#         try:
#             # Get query parameters
#             category_id = request.GET.get('category_id')
#             available_only = request.GET.get('available_only')
#             vegetarian_only = request.GET.get('vegetarian_only')
            
#             # menu_items = RestaurantMenuitem.objects.all().order_by('name')
#             # menu_items = RestaurantMenuitem.objects.filter(status=1).order_by('name')
#             # menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('name')

            
#             # # Apply filters
#             # if category_id:
#             #     menu_items = menu_items.filter(category_id=category_id,status=1)
#             # if available_only:
#             #     menu_items = menu_items.filter(is_available=1,status=1)
#             # if vegetarian_only:
#             #     menu_items = menu_items.filter(is_vegetarian=1,status=1)
            
            
#             menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('id')

#             # Apply filters
#             if category_id:
#                 menu_items = menu_items.filter(category_id=category_id)
#             if available_only:
#                 menu_items = menu_items.filter(is_available=True)
#             if vegetarian_only:
#                 menu_items = menu_items.filter(is_vegetarian=True)
                    
#             items_data = []
#             for item in menu_items:
#                 items_data.append({
#                     'id': item.id,
#                     'name': item.name,
#                     'description': item.description,
#                     'price': float(item.price) if item.price else None,
#                     'pricing_type': item.pricing_type,
#                     'price_variations': item.price_variations or {},
#                     'is_available': bool(item.is_available),
#                     'is_vegetarian': bool(item.is_vegetarian),
#                     'category_id': item.category.id,
#                     'category_name': item.category.name,
#                     'image': item.image,
#                     'created_at': item.created_at.isoformat() if item.created_at else None
#                 })
            
#             return JsonResponse({
#                 'success': True,
#                 'total_items': len(items_data),
#                 'menu_items': items_data
#             })
            
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to fetch menu items: {str(e)}'
#             }, status=500)
    

# # class GetAllMenuItemsView(View):
# #     """Get all menu items with filtering"""
    
# #     def get(self, request):
# #         try:
# #             # Get query parameters
# #             category_id = request.GET.get('category_id')
# #             available_only = request.GET.get('available_only', 'true').lower() == 'true'
# #             vegetarian_only = request.GET.get('vegetarian_only', 'false').lower() == 'true'
            
# #             # menu_items = RestaurantMenuitem.objects.all().order_by('name')
# #             # menu_items = RestaurantMenuitem.objects.filter(status=1).order_by('name')
# #             # menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('name')

            
# #             # # Apply filters
# #             # if category_id:
# #             #     menu_items = menu_items.filter(category_id=category_id,status=1)
# #             # if available_only:
# #             #     menu_items = menu_items.filter(is_available=1,status=1)
# #             # if vegetarian_only:
# #             #     menu_items = menu_items.filter(is_vegetarian=1,status=1)
            
            
# #             menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('name')

# #             # Apply filters
# #             if category_id:
# #                 menu_items = menu_items.filter(category_id=category_id)
# #             if available_only:
# #                 menu_items = menu_items.filter(is_available=True)
# #             if vegetarian_only:
# #                 menu_items = menu_items.filter(is_vegetarian=True)
                    
# #             items_data = []
# #             for item in menu_items:
# #                 items_data.append({
# #                     'id': item.id,
# #                     'name': item.name,
# #                     'description': item.description,
# #                     'price': float(item.price) if item.price else None,
# #                     'pricing_type': item.pricing_type,
# #                     'price_variations': item.price_variations or {},
# #                     'is_available': bool(item.is_available),
# #                     'is_vegetarian': bool(item.is_vegetarian),
# #                     'category_id': item.category.id,
# #                     'category_name': item.category.name,
# #                     'image': item.image,
# #                     'created_at': item.created_at.isoformat() if item.created_at else None
# #                 })
            
# #             return JsonResponse({
# #                 'success': True,
# #                 'total_items': len(items_data),
# #                 'menu_items': items_data
# #             })
            
# #         except Exception as e:
# #             return JsonResponse({
# #                 'success': False,
# #                 'error': f'Failed to fetch menu items: {str(e)}'
# #             }, status=500)
    

# #create menu item  with category id and image url
# class CreateMenuItemView(View):
#     """Create new menu item with image URL (Admin only)"""

#     def post(self, request):
#         try:
#             data = json.loads(request.body)

#             # Validate required fields
#             required_fields = ['name', 'description', 'category_id', 'pricing_type', 'image']
#             for field in required_fields:
#                 if field not in data or not str(data[field]).strip():
#                     return JsonResponse({
#                         'success': False,
#                         'error': f'{field} is required'
#                     }, status=400)

#             # menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('name')
#             # category = RestaurantCategory.objects.filter(id=data['category_id'], status=1).get()
#             # category = RestaurantCategory.objects.get(id=data['category_id'])



#             # Validate category exists
#             try:
#                 category = RestaurantCategory.objects.filter(id=data['category_id'], status=1).get()
#             except RestaurantCategory.DoesNotExist:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Category not found'
#                 }, status=400)

#             # Validate pricing type
#             if data['pricing_type'] not in ['single', 'multiple']:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'pricing_type must be either "single" or "multiple"'
#                 }, status=400)

#             # Validate price fields based on pricing type
#             if data['pricing_type'] == 'single':
#                 if 'price' not in data:
#                     return JsonResponse({
#                         'success': False,
#                         'error': 'Price is required for single pricing type'
#                     }, status=400)
#                 if data['price'] <= 0:
#                     return JsonResponse({
#                         'success': False,
#                         'error': 'Price must be greater than 0'
#                     }, status=400)

#             if data['pricing_type'] == 'multiple':
#                 if 'price_variations' not in data:
#                     return JsonResponse({
#                         'success': False,
#                         'error': 'Price variations are required for multiple pricing type'
#                     }, status=400)
#                 if not isinstance(data['price_variations'], dict) or not data['price_variations']:
#                     return JsonResponse({
#                         'success': False,
#                         'error': 'Price variations must be a non-empty object'
#                     }, status=400)
#                 # Validate each price in variations
#                 for variation, price in data['price_variations'].items():
#                     if price <= 0:
#                         return JsonResponse({
#                             'success': False,
#                             'error': f'Price for "{variation}" must be greater than 0'
#                         }, status=400)

#             # Validate image URL format
#             image_url = data['image'].strip()
#             if not (image_url.startswith('http://') or
#                     image_url.startswith('https://') or
#                     image_url.startswith('/') or
#                     image_url.startswith('data:image')):
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Image must be a valid URL, file path, or base64 data URL'
#                 }, status=400)

#             # Create menu item
#             menu_item = RestaurantMenuitem.objects.create(
#                 name=data['name'].strip(),
#                 description=data['description'].strip(),
#                 category=category,
#                 pricing_type=data['pricing_type'],
#                 price=Decimal(str(data.get('price'))) if data.get('price') else None,
#                 price_variations=data.get('price_variations', {}),
#                 is_available=bool(data.get('is_available', True)),
#                 is_vegetarian=bool(data.get('is_vegetarian', False)),
#                 image=image_url,  # ✅ Always required
#                 status=1,
#                 availability_schedule=data.get('availability_schedule'),
#                 created_at=timezone.now()
#             )

#             # Prepare response data
#             response_data = {
#                 'id': menu_item.id,
#                 'name': menu_item.name,
#                 'description': menu_item.description,
#                 'pricing_type': menu_item.pricing_type,
#                 'price_variations': menu_item.price_variations or {},
#                 'is_available': bool(menu_item.is_available),
#                 'is_vegetarian': bool(menu_item.is_vegetarian),
#                 'category_id': menu_item.category.id,
#                 'category_name': menu_item.category.name,
#                 'image': menu_item.image,
#                 'created_at': menu_item.created_at.isoformat() if menu_item.created_at else None
#             }

#             # Add price field for single pricing
#             if menu_item.pricing_type == 'single' and menu_item.price:
#                 response_data['price'] = float(menu_item.price)

#             return JsonResponse({
#                 'success': True,
#                 'message': 'Menu item created successfully',
#                 'menu_item': response_data
#             }, status=201)

#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON data'
#             }, status=400)
#         except InvalidOperation:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid price format'
#             }, status=400)
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to create menu item: {str(e)}'
#             }, status=500)
            
        
# #update the menu item
# class UpdateMenuItemView(View):
#     """Update menu item by ID (Admin only)"""

#     def post(self, request):
#         """
#         Update menu item by ID - item_id should be in request body
#         """
#         # Step 1: Parse JSON data
#         try:
#             data = json.loads(request.body)
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON data in request body'
#             }, status=400)

#         # Step 2: Validate item_id
#         item_id = data.get("item_id")
#         try:
#             item_id = int(item_id)
#             if item_id <= 0:
#                 raise ValueError("Invalid ID")
#         except (ValueError, TypeError):
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid item ID. Must be a positive number.'
#             }, status=400)

#         # Step 3: Remove item_id from update data to avoid conflicts
#         update_data = {k: v for k, v in data.items() if k != "item_id"}

#         # Step 4: Ensure there’s something to update
#         if not update_data:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'No fields provided for update'
#             }, status=400)


#         # Step 5: Get menu item or return error
#         try:
#             # menu_item = RestaurantMenuitem.objects.get(id=item_id)
#             menu_item = RestaurantMenuitem.objects.filter(id=item_id,category__status=1).get()

#         except RestaurantMenuitem.DoesNotExist:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Menu item with ID {item_id} does not exist'
#             }, status=404)

#         # Step 6: Update fields
#         updated_fields = []
#         basic_fields = [
#             'name', 'description', 'price', 'image',
#             'pricing_type', 'is_available', 'is_vegetarian',
#             'price_variations', 'availability_schedule'
#         ]

#         for field in basic_fields:
#             if field in update_data:
#                 if field in ['is_available', 'is_vegetarian']:
#                     setattr(menu_item, field, bool(update_data[field]))
#                 else:
#                     setattr(menu_item, field, update_data[field])
#                 updated_fields.append(field)

#         # Update category if provided
#         if 'category_id' in update_data:
#             try:
#                 # category = RestaurantCategory.objects.get(id=update_data['category_id'])
#                 category = RestaurantCategory.objects.filter(id=update_data['category_id'], status=1).get()
#                 menu_item.category = category
#                 updated_fields.append('category_id')
#             except RestaurantCategory.DoesNotExist:
#                 return JsonResponse({
#                     'success': False,
#                     'error': 'Invalid category ID provided'
#                 }, status=400)

#         # Step 7: Save changes
#         try:
#             menu_item.save()
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Database error: {str(e)}'
#             }, status=500)

#         # Step 8: Return success response
#         return JsonResponse({
#             'success': True,
#             'message': 'Menu item updated successfully',
#             'item_id': item_id,
#             'updated_fields': updated_fields,
#             'menu_item': {
#                 'id': menu_item.id,
#                 'name': menu_item.name,
#                 'description': menu_item.description,
#                 'price': str(menu_item.price) if menu_item.price else None,
#                 'category': menu_item.category.name if menu_item.category else None,
#                 'is_available': bool(menu_item.is_available),
#                 'is_vegetarian': bool(menu_item.is_vegetarian),
#                 'image': menu_item.image
#             }
#         })         

# #delete the menu item
# class DeleteMenuItemView(View):
#     """Delete menu item by ID (Admin only)"""

#     def post(self, request):
#         """
#         Delete menu item by ID - item_id should be in request body
#         """
#         # Step 1: Parse JSON data
#         try:
#             data = json.loads(request.body)
#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid JSON data in request body'
#             }, status=400)

#         # Step 2: Validate item_id
#         item_id = data.get("item_id")
#         try:
#             item_id = int(item_id)
#             if item_id <= 0:
#                 raise ValueError("Invalid ID")
#         except (ValueError, TypeError):
#             return JsonResponse({
#                 'success': False,
#                 'error': 'Invalid item ID. Must be a positive number.'
#             }, status=400)

#         # Step 3: Get menu item or return error
#         try:
#             menu_item = RestaurantMenuitem.objects.get(id=item_id)
#         except RestaurantMenuitem.DoesNotExist:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Menu item with ID {item_id} does not exist'
#             }, status=404)

#         try:
#             menu_item.status = 0
#             menu_item.save()
#         except Exception as e:
#             return JsonResponse({
#                 'success': False,
#                 'error': f'Failed to delete menu item: {str(e)}'
#             }, status=500)


#         # Step 5: Return success response
#         return JsonResponse({
#             'success': True,
#             'message': f'Menu item with ID {item_id} deleted successfully'
#         })

# # File upload to S3
# class FileUploadSerializer(serializers.Serializer):
#     file = serializers.FileField()
    
# # File upload view
# class FileUploadView(APIView):
#     parser_classes = (MultiPartParser,)  # Handles multipart form-data for video uploads

#     def post(self, request):
#         serializer = FileUploadSerializer(data=request.data)
#         if serializer.is_valid():
#             file = request.FILES.get('file')
#             if not file:
#                 return Response(
#                     {'error': 'No file provided in form-data'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
            
#             file_name = file.name
#             # Specify the S3 folder path
#             s3_folder = 'dishes/'
#             s3_key = f"{s3_folder}{file_name}"  # Store in dishes/ folder
            
#             # Validate file size (optional: enforce 200 MB limit)
#             max_size_mb = 200
#             if file.size > max_size_mb * 1024 * 1024:
#                 return Response(
#                     {'error': f'File size exceeds {max_size_mb} MB limit'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
            
#             # Initialize S3 client
#             try:
#                 s3_client = boto3.client(
#                     's3',
#                     aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
#                     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
#                     region_name=settings.AWS_S3_REGION_NAME
#                 )
                
#                 # Upload file to S3 with streaming for large files
#                 s3_client.upload_fileobj(
#                     file,
#                     settings.AWS_STORAGE_BUCKET_NAME,
#                     s3_key,
#                     ExtraArgs={
#                         'ContentType': file.content_type or 'video/mp4'  # Default to video/mp4 for videos
#                     }
#                 )
                
#                 # Generate S3 URL
#                 s3_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}"
                
#                 return Response({
#                     'file_name': file_name,
#                     's3_url': s3_url,
#                     'file_size': file.size,
#                     'folder': s3_folder
#                 }, status=status.HTTP_201_CREATED)
                
#             except ClientError as e:
#                 error_code = e.response['Error']['Code']
#                 error_message = e.response['Error']['Message']
#                 return Response(
#                     {'error': f"S3 Error: {error_code} - {error_message}"},
#                     status=status.HTTP_500_INTERNAL_SERVER_ERROR
#                 )
#             except Exception as e:
#                 return Response(
#                     {'error': f"Upload failed: {str(e)}"},
#                     status=status.HTTP_500_INTERNAL_SERVER_ERROR
#                 )
                
#         return Response(
#             serializer.errors,
#             status=status.HTTP_400_BAD_REQUEST
#         )
























































































# views.py
from concurrent.futures.process import _ResultItem
from decimal import Decimal, InvalidOperation
import json
import re
import logging
from datetime import datetime
from django.http import JsonResponse
from django.views import View
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.db import transaction
from django.db.models import Count, Q, Sum
from store.settings import SEASIDE_URL, ADMIN_EMAIL
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
import boto3
from store.settings import *
from rest_framework.parsers import MultiPartParser 
from botocore.exceptions import ClientError

from .models import (
    AuthUser, 
    RestaurantCategory, 
    RestaurantCustomer, 
    RestaurantMenuitem, 
    RestaurantOrders, 
    RestaurantOrderitem, 
    RestaurantPasswordresettoken, 
    RestaurantInquiry
)

# Get logger instance
logger = logging.getLogger(__name__)


class SignUpView(View):

    def post(self, request):
        try:
            data = json.loads(request.body)

            # Validate required fields
            required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
            for field in required_fields:
                if field not in data or not data[field]:
                    return JsonResponse({
                        'error': f'{field} is required'
                    }, status=400)

            username = data.get('username', f"{data['first_name']} {data['last_name']}")
            email = data['email']
            password = data['password']
            first_name = data['first_name']
            last_name = data['last_name']
            phone = data['phone']
            address = data.get('address', '')

            # ------------------------------
            # 1️⃣ Validate email format
            # ------------------------------
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return JsonResponse({'error': 'Invalid email format'}, status=400)

            # ------------------------------
            # 2️⃣ Validate password strength
            # ------------------------------
            if len(password) < 6:
                return JsonResponse({'error': 'Password must be at least 6 characters long'}, status=400)

            # ------------------------------
            # 3️⃣ Validate phone number
            # ------------------------------
            phone_pattern = r'^\d+$'  # digits only
            if not re.match(phone_pattern, phone):
                return JsonResponse({'error': 'Phone number must contain digits only'}, status=400)

            # Optional: check length (10 digits typical for India)
            if len(phone) != 10:
                return JsonResponse({'error': 'Phone number must be exactly 10 digits'}, status=400)

            # ------------------------------
            # 4️⃣ Check duplicates
            # ------------------------------
            if AuthUser.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)

            if AuthUser.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Email already registered'}, status=400)

            # ------------------------------
            # 5️⃣ Create user
            # ------------------------------
            hashed_password = make_password(password)
            user = AuthUser.objects.create(
                username=username,
                email=email,
                password=hashed_password,
                first_name=first_name,
                last_name=last_name,
                is_active=1,
                is_staff=0,
                is_superuser=0,
                date_joined=timezone.now()
            )

            # ------------------------------
            # 6️⃣ Create customer profile
            # ------------------------------
            customer = RestaurantCustomer.objects.create(
                name=f"{first_name} {last_name}",
                email=email,
                phone=phone,
                address=address,
                created_at=timezone.now()
            )

            return JsonResponse({
                'message': 'User registered successfully',
                'user_id': user.id,
                'customer_id': customer.id,
                'username': username,
                'email': email
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Registration failed: {str(e)}'}, status=500)
                  
class LoginView(View):

    def post(self, request):
        try:
            data = json.loads(request.body)
            
            if not data.get('username') or not data.get('password'):
                return JsonResponse({'error': 'Username and password are required'}, status=400)
            
            username = data['username']
            password = data['password']
            
            user = None
            if '@' in username:
                # Login with email
                try:
                    user = AuthUser.objects.get(email=username)
                except AuthUser.DoesNotExist:
                    return JsonResponse({'error': 'Invalid email or password'}, status=401)
            else:
                # Login with username
                try:
                    user = AuthUser.objects.get(username=username)
                except AuthUser.DoesNotExist:
                    return JsonResponse({'error': 'Invalid username or password'}, status=401)
            
            # Manual password verification
            if user and check_password(password, user.password) and user.is_active:
                # No session creation - simple authentication only
                customer = self.get_or_create_customer(user)
                
                return JsonResponse({
                    'message': 'Login successful',
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'customer_id': customer.id,
                    'customer_name': customer.name,
                    'phone': customer.phone,
                    'address': customer.address
                })
            
            return JsonResponse({'error': 'Invalid username/email or password'}, status=401)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Login failed: {str(e)}'}, status=500)

    def get_or_create_customer(self, user):
        """Get or create a customer profile"""
        try:
            customer = RestaurantCustomer.objects.get(email=user.email)
        except RestaurantCustomer.DoesNotExist:
            # Create customer profile if it doesn't exist
            customer = RestaurantCustomer.objects.create(
                name=f"{user.first_name} {user.last_name}",
                email=user.email,
                phone='',
                address='',
                created_at=timezone.now()
            )
        return customer
    
class LogoutView(View):
    """User logout API"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data['username']
            return JsonResponse({
                'message': 'Logout successful'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON'
            }, status=400)
            
        except KeyError:
            return JsonResponse({
                'error': 'Username is required'
            }, status=400)

class ForgotPasswordView(View):
    """Send password reset email"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            if 'email' not in data or not data['email']:
                return JsonResponse({
                    'error': 'Email is required'
                }, status=400)
            
            email = data['email'].strip().lower()
            
            # Validate email format
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return JsonResponse({
                    'error': 'Invalid email format'
                }, status=400)
            
            try:
                user = AuthUser.objects.get(email=email)
            except AuthUser.DoesNotExist:
                return JsonResponse({
                    'message': 'If the email exists, a password reset link has been sent'
                })
            
            # Generate reset token
            reset_token = get_random_string(50)
            
            # Save token to database - using only existing fields
            RestaurantPasswordresettoken.objects.create(
                user=user,
                token=reset_token,
                created_at=timezone.now(),
                is_used=0  # 0 for false, since it's an IntegerField
            )
            
            # Prepare email content
            reset_link = f"{SEASIDE_URL}/reset-password?token={reset_token}"
            
            print("Reset link:", reset_link)
            
            email_subject = "Password Reset - Seaside Restaurant"
            email_message = f"""
            Hi {user.first_name},
            
            You requested to reset your password for your Seaside Restaurant account.
            
            Click the link below to reset your password:
            {reset_link}
            
            This link will expire in 10 minutes.
            
            If you didn't request this, please ignore this email.
            
            Thanks,
            Seaside Restaurant Team
            """
            
            # Send email
            try:
                send_mail(
                    email_subject,
                    email_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                
                return JsonResponse({
                    'message': 'Password reset email sent successfully'
                })
                
            except Exception as email_error:
                return JsonResponse({
                    'message': 'Email service not configured. Use this token for testing.',
                    'reset_token': reset_token,
                    'reset_link': reset_link
                })
                
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': f'Failed to send reset email: {str(e)}'
            }, status=500)           
                        
class ResetPasswordView(View):
    """Verify reset token and allow password reset"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            token = data.get('token')
            new_password = data.get('new_password')
            
            if not token or not new_password:
                return JsonResponse({'error': 'Token and new password are required'}, status=400)
            
            try:
                # Find the token
                reset_token = RestaurantPasswordresettoken.objects.get(
                    token=token,
                    is_used=0  # Not used yet
                )
                
                # Check if token is expired (1 hour limit)
                token_age = timezone.now() - reset_token.created_at
                if token_age.total_seconds() > 3600:  # 1 hour in seconds
                    return JsonResponse({'error': 'Reset token has expired'}, status=400)
                
                # Update user's password - manually hash and set it
                user = reset_token.user
                
                # Method 1: Use Django's make_password (recommended)
                # from django.contrib.auth.hashers import make_password
                user.password = make_password(new_password)
                user.save()
                
                # Mark token as used
                reset_token.is_used = 1
                reset_token.save()
                
                return JsonResponse({'message': 'Password reset successfully'})
                
            except RestaurantPasswordresettoken.DoesNotExist:
                return JsonResponse({'error': 'Invalid or expired reset token'}, status=400)
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

class ChangePasswordView(View):
    """Change password for logged-in user"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # Get user ID from request (since we're using session-less auth)
            user_id = data.get('user_id')
            if not user_id:
                return JsonResponse({
                    'error': 'User ID is required'
                }, status=401)
            
            required_fields = ['current_password', 'new_password']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({
                        'error': f'{field} is required'
                    }, status=400)
            
            current_password = data['current_password']
            new_password = data['new_password']
            
            # Get user from database
            try:
                user = AuthUser.objects.get(id=user_id, is_active=1)
            except AuthUser.DoesNotExist:
                return JsonResponse({
                    'error': 'User not found'
                }, status=401)
            
            # Validate current password using check_password
            # from django.contrib.auth.hashers import check_password
            if not check_password(current_password, user.password):
                return JsonResponse({
                    'error': 'Current password is incorrect'
                }, status=400)
            
            # Validate new password
            if len(new_password) < 6:
                return JsonResponse({
                    'error': 'New password must be at least 6 characters long'
                }, status=400)
            
            # Check if new password is different
            if check_password(new_password, user.password):
                return JsonResponse({
                    'error': 'New password must be different from current password'
                }, status=400)
            
            # Change password using make_password
            # from django.contrib.auth.hashers import make_password
            user.password = make_password(new_password)
            user.save()
            
            return JsonResponse({
                'message': 'Password changed successfully'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': f'Password change failed: {str(e)}'
            }, status=500)
            

# Categories             
class CategoryListView(View):
    """Get all categories"""
    
    def get(self, request):
        # categories = RestaurantCategory.objects.all()
        categories = RestaurantCategory.objects.filter(status=1)
        data = []
        for category in categories:
            data.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
            })
        return JsonResponse({'categories': data})


# Categories             

class CategoryCreateView(View):
    """Create a new category"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            if 'name' not in data or not data['name']:
                return JsonResponse({
                    'success': False,
                    'error': 'Category name is required'
                }, status=400)
            
            name = data['name'].strip()
            description = data.get('description', '').strip()
            
            # Check if category already exists
            if RestaurantCategory.objects.filter(name__iexact=name).exists():
                return JsonResponse({
                    'success': False,
                    'error': 'Category with this name already exists'
                }, status=400)
            
            # Create new category
            category = RestaurantCategory.objects.create(
                name=name,
                description=description,
                status=1,
                created_at=timezone.now()
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Category created successfully',
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'description': category.description,
                    'created_at': category.created_at.isoformat() if category.created_at else None
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to create category: {str(e)}'
            }, status=500)


class CategoryDeleteView(View):
    """Update an existing category's status to 0 using POST"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # Validate required field
            if 'category_id' not in data or not data['category_id']:
                return JsonResponse({
                    'success': False,
                    'error': 'Category ID is required'
                }, status=400)
            
            category_id = data['category_id']
            
            # Get category by ID
            try:
                category = RestaurantCategory.objects.get(id=category_id)
            except RestaurantCategory.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Category not found'
                }, status=404)
            
            category_name = category.name
            category.status = 0
            category.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Category "{category_name}" status updated to inactive'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except ValueError:
            return JsonResponse({
                'success': False,
                'error': 'Category ID must be a valid number'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to update category status: {str(e)}'
            }, status=500)


class DeletedCategoryListView(View):
    """Get all categories"""
    
    def get(self, request):
        # categories = RestaurantCategory.objects.all()
        categories = RestaurantCategory.objects.filter(status=0)
        data = []
        for category in categories:
            data.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
            })
        return JsonResponse({'categories': data})


class UpdatedeletedcategoriesView(View):
    """Update an existing category's status to 1 using POST"""    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # Validate required field
            if 'category_id' not in data or not data['category_id']:
                return JsonResponse({
                    'success': False,
                    'error': 'Category ID is required'
                }, status=400)
            
            category_id = data['category_id']
            
            # Get category by ID
            try:
                category = RestaurantCategory.objects.get(id=category_id)
            except RestaurantCategory.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Category not found'
                }, status=404)
            
            category_name = category.name
            category.status = 1
            category.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Category "{category_name}" status updated to inactive'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except ValueError:
            return JsonResponse({
                'success': False,
                'error': 'Category ID must be a valid number'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to update category status: {str(e)}'
            }, status=500)



#Menu Management
class MenuItemListView(View):  #get all items with categeories complete menu
    """Get all categories with their menu items including multiple pricing"""
    
    def get(self, request):
        try:
            # categories = RestaurantCategory.objects.all().order_by('name')
            categories = RestaurantCategory.objects.filter(status=1).order_by('id')
            
            categories_data = []
            for category in categories:
                items = RestaurantMenuitem.objects.filter(category=category,status=1).order_by('id')
                
                items_data = []
                for item in items:
                    is_available, availability_message = self.check_availability(item)
                    
                    # Handle pricing based on pricing_type
                    pricing_data = self.get_pricing_data(item)
                    
                    item_data = {
                        'id': item.id,
                        'name': item.name,
                        'description': item.description,
                        'category_id': item.category_id,
                        'category_name': category.name,
                        'image': item.image,
                        'is_vegetarian': bool(item.is_vegetarian),
                        'is_available': bool(item.is_available),
                        'created_at': item.created_at.isoformat() if item.created_at else None,
                        'availability_schedule': item.availability_schedule,
                        'pricing_type': item.pricing_type,
                        'pricing': pricing_data
                    }
                    
                    if not is_available and availability_message:
                        item_data['availability_message'] = availability_message
                    
                    items_data.append(item_data)
                
                if items_data:
                    categories_data.append({
                        'id': category.id,
                        'name': category.name,
                        'description': category.description,
                        'items': items_data,
                        'items_count': len(items_data)
                    })
            
            return JsonResponse({
                'success': True,
                'categories': categories_data,
                'total_categories': len(categories_data),
                'total_items': sum(cat['items_count'] for cat in categories_data)
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to fetch menu data: {str(e)}'
            }, status=500)
    
    def get_pricing_data(self, item):
        """Extract pricing information based on pricing_type"""
        if item.pricing_type == 'single':
            return {
                'type': 'single',
                'price': int(item.price) if item.price else None,  # Changed to int
                'display_price': f"₹{item.price}" if item.price else "Price not available"
            }
        else:
            # Multiple pricing from price_variations JSON
            variations = item.price_variations or {}
            price_list = []
            
            for variation_name, price_value in variations.items():
                price_list.append({
                    'size': variation_name,
                    'price': int(price_value),  # Changed to int
                    'display_price': f"₹{price_value}"
                })
            
            return {
                'type': 'multiple',
                'variations': price_list,
                'starting_from': f"₹{min(variations.values())}" if variations else "Price not available"
            }
    
    def check_availability(self, item):
        """Check availability (same as before)"""
        if not item.is_available:
            return False, "Item is currently unavailable"
        
        if not item.availability_schedule:
            return True, None
        
        # Your existing availability check logic here
        return True, None
    
 
class MenuWithCategoriesView(View):  #get the items in a singel category
    """Get all menu items with optional category filter - Updated for new pricing structure"""
    
    def get(self, request):
        try:
            items = RestaurantMenuitem.objects.filter(status=1,category__status=1)
            category_id = request.GET.get('category')
            
            if category_id:
                items = items.filter(category_id=category_id,)

            data = []
            for item in items:
                # Get pricing data based on pricing_type
                pricing_data = self.get_pricing_data(item)
                
                item_data = {
                    'id': item.id,
                    'name': item.name,
                    'description': item.description,
                    'category_id': item.category_id,
                    'category': item.category.name,
                    'image': item.image,
                    'is_vegetarian': bool(item.is_vegetarian),
                    'is_available': bool(item.is_available),
                    'pricing_type': item.pricing_type,
                    'pricing': pricing_data,
                    'availability_schedule': item.availability_schedule
                }
                
                # Add availability message if needed
                is_available, availability_message = self.check_availability(item)
                
                if not is_available and availability_message:
                    item_data['availability_message'] = availability_message
                
                data.append(item_data)
            
            return JsonResponse({
                'success': True,
                'menu_items': data,
                'total_items': len(data),
                'filters': {
                    'category_id': category_id
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to fetch menu items: {str(e)}'
            }, status=500)
    
    def get_pricing_data(self, item):
        """Extract pricing information based on pricing_type"""
        if item.pricing_type == 'single':
            return {
                'type': 'single',
                'price': int(item.price) if item.price else None,  # Changed to int
                'display_price': f"₹{item.price}" if item.price else "Price not available"
            }
        else:
            # Multiple pricing from price_variations JSON
            variations = item.price_variations or {}
            price_list = []
            
            for variation_name, price_value in variations.items():
                price_list.append({
                    'variation': variation_name,
                    'price': int(price_value),  # Changed to int
                    'display_price': f"₹{price_value}"
                })
            
            # Sort by price (optional)
            price_list.sort(key=lambda x: x['price'])
            
            return {
                'type': 'multiple',
                'variations': price_list,
                'starting_from': f"₹{min(variations.values())}" if variations else "Price not available",
                'min_price': int(min(variations.values())) if variations else None,  # Changed to int
                'max_price': int(max(variations.values())) if variations else None  # Changed to int
            }
    
    def check_availability(self, item):
        """Check item availability"""
        if not item.is_available:
            return False, "Item is currently unavailable"
        
        if not item.availability_schedule:
            return True, None
        
        # Add your availability schedule logic here if needed
        return True, None


class MenuItemDetailView(View):    #get single item by id
    """Get single menu item by ID - Updated for new pricing structure"""
    
    def get(self, request):
        try:
            item_id = request.GET.get('item_id')
            
            if not item_id:
                return JsonResponse({
                    'success': False,
                    'error': 'item_id parameter is required'
                }, status=400)
            
            # Get the menu item object from database
            # item = RestaurantMenuitem.objects.get(id=item_id,status=1,category__status=1)
            item = RestaurantMenuitem.objects.get(id=item_id,status=1,category__status=1)

            
            # Get pricing data based on pricing_type
            pricing_data = self.get_pricing_data(item)
            
            # Check availability
            is_available, availability_message = self.check_availability(item)
            
            data = {
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'category_id': item.category_id,
                'category': item.category.name,
                'image': item.image,
                'is_vegetarian': bool(item.is_vegetarian),
                'is_available': bool(item.is_available),
                'pricing_type': item.pricing_type,
                'pricing': pricing_data,
                'availability_schedule': item.availability_schedule,
                'created_at': item.created_at.isoformat() if item.created_at else None
            }
            
            # Add availability message if item is not available
            if not is_available and availability_message:
                data['availability_message'] = availability_message
            
            return JsonResponse({
                'success': True,
                'menu_item': data
            })
            
        except RestaurantMenuitem.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Menu item not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to fetch menu item: {str(e)}'
            }, status=500)
    
    def get_pricing_data(self, item):
        """Extract pricing information based on pricing_type"""
        if item.pricing_type == 'single':
            return {
                'type': 'single',
                'price': int(item.price) if item.price else None,  # Changed to int
                'display_price': f"₹{item.price}" if item.price else "Price not available"
            }
        else:
            # Multiple pricing from price_variations JSON
            variations = item.price_variations or {}
            price_list = []
            
            for variation_name, price_value in variations.items():
                price_list.append({
                    'variation': variation_name,
                    'price': int(price_value),  # Changed to int
                    'display_price': f"₹{price_value}"
                })
            
            # Sort by price
            price_list.sort(key=lambda x: x['price'])
            
            return {
                'type': 'multiple',
                'variations': price_list,
                'starting_from': f"₹{min(variations.values())}" if variations else "Price not available",
                'min_price': int(min(variations.values())) if variations else None,  # Changed to int
                'max_price': int(max(variations.values())) if variations else None  # Changed to int
            }
    
    def check_availability(self, item):
        """Check item availability"""
        if not item.is_available:
            return False, "Item is currently unavailable"
        
        if not item.availability_schedule:
            return True, None
        
        # Add your availability schedule logic here if needed
        return True, None
    



class MenuSearchView(View):  #search by name only
    """Search menu items by name - Simplified version"""
    
    def get(self, request):
        try:
            query = request.GET.get('q', '').strip()
            
            if not query:
                return JsonResponse({
                    'success': True,
                    'results': [],
                    'total_results': 0,
                    'query': '',
                    'message': 'Please enter a search term'
                })
            
            # Simple search - name only (remove description search to simplify)
            items = RestaurantMenuitem.objects.filter(name__icontains=query,status=1,category__status=1)
            
            # Apply availability filter if requested
            available_only = request.GET.get('available', 'true').lower() in ['true', '1', 'yes']
            if available_only:
                items = items.filter(is_available=True)
            
            # Simple ordering by name
            items = items.order_by('name')
            
            results = []
            for item in items:
                pricing_data = self.get_pricing_data(item)
                is_available, availability_message = self.check_availability(item)
                
                result_item = {
                    'id': item.id,
                    'name': item.name,
                    'description': item.description,
                    'category_id': item.category_id,
                    'category': item.category.name,
                    'image': item.image,
                    'is_vegetarian': bool(item.is_vegetarian),
                    'is_available': bool(item.is_available),
                    'pricing_type': item.pricing_type,
                    'pricing': pricing_data,
                    'match_type': 'name'  # Since we're only searching by name
                }
                
                if not is_available and availability_message:
                    result_item['availability_message'] = availability_message
                
                results.append(result_item)
            
            return JsonResponse({
                'success': True,
                'results': results,
                'total_results': len(results),
                'query': query,
                'filters': {
                    'available_only': available_only
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to search menu items: {str(e)}'
            }, status=500)
    
    def get_pricing_data(self, item):
        """Extract pricing information based on pricing_type"""
        if item.pricing_type == 'single':
            return {
                'type': 'single',
                'price': int(item.price) if item.price else None,  # Changed to int
                'display_price': f"₹{item.price}" if item.price else "Price not available"
            }
        else:
            variations = item.price_variations or {}
            price_list = []
            
            for variation_name, price_value in variations.items():
                price_list.append({
                    'variation': variation_name,
                    'price': int(price_value),  # Changed to int
                    'display_price': f"₹{price_value}"
                })
            
            price_list.sort(key=lambda x: x['price'])
            
            return {
                'type': 'multiple',
                'variations': price_list,
                'starting_from': f"₹{min(variations.values())}" if variations else "Price not available",
                'min_price': int(min(variations.values())) if variations else None,  # Changed to int
                'max_price': int(max(variations.values())) if variations else None  # Changed to int
            }
    
    def check_availability(self, item):
        """Check item availability"""
        if not item.is_available:
            return False, "Item is currently unavailable"
        
        if not item.availability_schedule:
            return True, None
        
        return True, None


class OrderCreateView(View): #new order with multiple pricing
    """Create new order with support for multiple pricing variations"""
    
    @transaction.atomic
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # Validate customer_id presence (from login response)
            if 'customer_id' not in data:
                return JsonResponse({
                    'success': False,
                    'error': 'customer_id is required'
                }, status=400)
            
            # Get customer by customer_id
            try:
                customer = RestaurantCustomer.objects.get(id=data['customer_id'])
            except RestaurantCustomer.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Customer not found'
                }, status=404)
            
            # Calculate total and validate items
            total_amount = 0
            order_items = data['items']
            validated_items = []
            
            for item_data in order_items:
                menu_item = RestaurantMenuitem.objects.get(id=item_data['menu_item_id'],status=1,category__status=1)
                
                # Validate item availability
                if not menu_item.is_available:
                    return JsonResponse({
                        'success': False,
                        'error': f"Item '{menu_item.name}' is currently unavailable"
                    }, status=400)
                
                # Get price based on pricing type and selected variation
                item_price = self.get_item_price(menu_item, item_data)
                if item_price is None:
                    return JsonResponse({
                        'success': False,
                        'error': f"Invalid variation selected for '{menu_item.name}'"
                    }, status=400)
                
                quantity = item_data['quantity']
                item_total = item_price * quantity
                total_amount += item_total
                
                validated_items.append({
                    'menu_item': menu_item,
                    'quantity': quantity,
                    'price': item_price,
                    'selected_variation': item_data.get('selected_variation'),
                    'special_instructions': item_data.get('special_instructions', '')
                })
            
            # Create order
            order = RestaurantOrders.objects.create(
                customer=customer,
                total_amount=total_amount,
                delivery_address=data.get('delivery_address', customer.address),
                phone=data.get('phone', customer.phone),
                status='pending',
                order_date=timezone.now()
            )
            
            # Create order items
            for item_data in validated_items:
                RestaurantOrderitem.objects.create(
                    order=order,
                    menu_item=item_data['menu_item'],
                    quantity=item_data['quantity'],
                    price=item_data['price']
                    # Note: selected_variation and special_instructions fields don't exist in your model
                    # You'll need to add these fields to the model if you want to store them
                )
            
            # Prepare order summary for response
            order_summary = self.get_order_summary(order, validated_items)
            
            return JsonResponse({
                'success': True,
                'message': 'Order created successfully',
                'order_id': order.id,
                'order_number': f"ORD{order.id:06d}",
                'total_amount': int(total_amount),  # Changed to int
                'order_summary': order_summary
            })
            
        except RestaurantMenuitem.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'One or more menu items not found'
            }, status=404)
        except KeyError as e:
            return JsonResponse({
                'success': False,
                'error': f'Missing required field: {str(e)}'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to create order: {str(e)}'
            }, status=500)
    
    def get_item_price(self, menu_item, item_data):
        """Get price based on pricing type and selected variation"""
        if menu_item.pricing_type == 'single':
            # For single pricing, use the price field
            return menu_item.price if menu_item.price else Decimal('0.00')
        
        else:  # multiple pricing
            selected_variation = item_data.get('selected_variation')
            if not selected_variation:
                return None
            
            variations = menu_item.price_variations or {}
            if selected_variation in variations:
                return Decimal(str(variations[selected_variation]))
            
            return None
    
    def get_order_summary(self, order, items):
        """Generate order summary for response"""
        order_items = []
        
        for item_data in items:
            menu_item = item_data['menu_item']
            item_summary = {
                'id': menu_item.id,
                'name': menu_item.name,
                'quantity': item_data['quantity'],
                'unit_price': int(item_data['price']),  # Changed to int
                'total_price': int(item_data['price'] * item_data['quantity']),  # Changed to int
                'selected_variation': item_data.get('selected_variation'),
                'special_instructions': item_data.get('special_instructions', '')
            }
            order_items.append(item_summary)
        
        return {
            'order_id': order.id,
            'order_number': f"ORD{order.id:06d}",
            'customer_name': order.customer.name,
            'customer_phone': order.phone,
            'delivery_address': order.delivery_address,
            'total_amount': int(order.total_amount),  # Changed to int
            'status': order.status,
            'order_date': order.order_date.isoformat() if order.order_date else None,
            'items': order_items
        }


class CustomerOrdersView(View): # get all orders for a customer_id
    """Get all orders for a customer by customer_id"""
    
    def get(self, request):
        customer_id = request.GET.get('customer_id')
        if not customer_id:
            return JsonResponse({'error': 'customer_id parameter required'}, status=400)
        
        try:
            # Validate customer exists
            customer = RestaurantCustomer.objects.get(id=customer_id)
            
            # Optimized query with prefetch_related to avoid N+1 problem
            orders = RestaurantOrders.objects.filter(customer=customer)\
                .prefetch_related('restaurantorderitem_set__menu_item')\
                .order_by('-order_date')
            
            data = []
            for order in orders:
                order_items = order.restaurantorderitem_set.all()
                items_count = order_items.count()
                
                # Get item details for the order
                items_summary = []
                for item in order_items:
                    items_summary.append({
                        'id': item.menu_item.id,
                        'name': item.menu_item.name,
                        'quantity': item.quantity,
                        'price': int(item.price),  # Changed to int
                        'selected_variation': getattr(item, 'selected_variation', None),
                        'special_instructions': getattr(item, 'special_instructions', '')
                    })
                
                data.append({
                    'order_id': order.id,
                    'order_number': f"ORD{order.id:06d}",
                    'total_amount': int(order.total_amount),  # Changed to int
                    'status': order.status,
                    'order_date': order.order_date.isoformat() if order.order_date else None,
                    'delivery_address': order.delivery_address,
                    'items_count': items_count,
                    'items': items_summary
                })
            
            return JsonResponse({
                'success': True,
                'customer_id': customer.id,
                'customer_name': customer.name,
                'total_orders': len(data),
                'orders': data
            })
            
        except RestaurantCustomer.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Customer not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to fetch orders: {str(e)}'
            }, status=500)


class OrderDetailView(View): #get single order by id
    """Get order details by ID"""
    
    def get(self, request, order_id):
        try:
            order = RestaurantOrders.objects.get(id=order_id)
            order_items = RestaurantOrderitem.objects.filter(order=order)
            
            items_data = []
            for item in order_items:
                items_data.append({
                    'menu_item': item.menu_item.name,
                    'quantity': item.quantity,
                    'price': int(item.price),  # Changed to int
                    'subtotal': int(item.quantity * item.price)  # Changed to int
                })
            
            data = {
                'id': order.id,
                'customer': order.customer.name,
                'total_amount': int(order.total_amount),  # Changed to int
                'status': order.status,
                'order_date': order.order_date.isoformat() if order.order_date else None,
                'delivery_address': order.delivery_address,
                'phone': order.phone,
                'items': items_data
            }
            return JsonResponse({'order': data})
            
        except RestaurantOrders.DoesNotExist:
            return JsonResponse({'error': 'Order not found'}, status=404)


#inquiry
class InquiryCreateView(View):   #new inquiry with email notification
    """Handle contact form submissions"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['name', 'phone', 'message']
            for field in required_fields:
                if field not in data or not data[field].strip():
                    return JsonResponse({
                        'success': False,
                        'error': f'{field.replace("_", " ").title()} is required'
                    }, status=400)
            
            name = data['name'].strip()
            phone = data['phone'].strip()
            email = data.get('email', '').strip()
            message = data['message'].strip()
            
            # Validate phone number format
            if not self.is_valid_phone(phone):
                return JsonResponse({
                    'success': False,
                    'error': 'Please enter a valid phone number'
                }, status=400)

            # Validate email if provided
            if email and not self.is_valid_email(email):
                return JsonResponse({
                    'success': False,
                    'error': 'Please enter a valid email address'
                }, status=400)
            
            # Create inquiry record
            inquiry = RestaurantInquiry.objects.create(
                name=name,
                phone=phone,
                email=email if email else None,
                message=message,
                status='new',
                created_at=timezone.now()
            )
            
            # Send notification email to admin
            try:
                self.send_notification_email(inquiry)
            except Exception as email_error:
                # Log the error but don't fail the request
                print(f"Email notification failed: {email_error}")
            
            return JsonResponse({
                'success': True,
                'message': 'Thank you for your message! We will get back to you soon.',
                'inquiry_id': inquiry.id
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to submit inquiry: {str(e)}'
            }, status=500)
    
    def is_valid_phone(self, phone):
        """Basic phone number validation"""
        # Remove any non-digit characters
        clean_phone = ''.join(filter(str.isdigit, phone))
        return len(clean_phone) >= 10
    
    def is_valid_email(self, email):
        """Email validation"""
        import re
        if not email:
            return True  # Email is optional, so empty is valid
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def send_notification_email(self, inquiry):
        """Send email notification to admin"""
        subject = f"New Restaurant Inquiry from {inquiry.name}"
        
        message = f"""
        New restaurant inquiry received:
        
        Name: {inquiry.name}
        Phone: {inquiry.phone}
        Email: {inquiry.email or 'Not provided'}
        
        Message:
        {inquiry.message}
        
        Received: {inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S')}
        
        Inquiry ID: {inquiry.id}
        """
        
        # Send email to admin
        send_mail(
            subject=subject,
            message=message.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ADMIN_EMAIL],  # Use the admin email from settings
            fail_silently=False,  # Set to True if you don't want exceptions raised
        )

     
class RestaurantInquiryAPIView(View):
    def get(self, request):
        """
        Get all inquiries
        """
        inquiries = RestaurantInquiry.objects.all().order_by('-created_at')
        inquiries_data = [
            {
                'id': inquiry.id,
                'name': inquiry.name,
                'phone': inquiry.phone,
                'email': inquiry.email,
                'message': inquiry.message,
                'status': inquiry.status,
                'created_at': inquiry.created_at,
                'updated_at': inquiry.updated_at
            }
            for inquiry in inquiries
        ]
        return JsonResponse(inquiries_data, safe=False)


class RestaurantInquiryStatusUpdateAPIView(View):
    def post(self, request):
        """
        Update the status of an inquiry by ID
        """
        try:
            # Parse JSON data
            if request.body:
                data = json.loads(request.body)
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Request body is required'
                }, status=400)
            
            inquiry_id = data.get('id')
            new_status = data.get('status')
            
            if not inquiry_id or not new_status:
                return JsonResponse({
                    'success': False,
                    'error': 'id and status are required'
                }, status=400)
            
            # Validate status against model's choices
            valid_statuses = [choice[0] for choice in RestaurantInquiry.INQUIRY_STATUS_CHOICES]
            if new_status not in valid_statuses:
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }, status=400)
            
            try:
                inquiry = RestaurantInquiry.objects.get(pk=inquiry_id)
            except RestaurantInquiry.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Inquiry not found'
                }, status=404)
            
            inquiry.status = new_status
            inquiry.updated_at = timezone.now()  
            inquiry.save()
            
            return JsonResponse({
                'success': True,
                'data': {
                    'id': inquiry.id,
                    'name': inquiry.name,
                    'phone': inquiry.phone,
                    'email': inquiry.email,
                    'message': inquiry.message,
                    'status': inquiry.status,
                    'created_at': inquiry.created_at,
                    'updated_at': inquiry.updated_at
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON format'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'An error occurred: {str(e)}'
            }, status=500)
            

# Customer creation
class CustomerCreateView(View):  # Customer creation
    """Create new customer"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            customer = RestaurantCustomer.objects.create(
                name=data['name'],
                email=data['email'],
                phone=data['phone'],
                address=data['address'],
                created_at=timezone.now()
            )
            return JsonResponse({
                'message': 'Customer created successfully',
                'customer_id': customer.id
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


#Dashboard
class AdminDashboardView(View):
    """Get dashboard statistics"""
    
    def get(self, request):

        try:
            # Today's metrics
            today = timezone.now().date()
            today_orders = RestaurantOrders.objects.filter(order_date__date=today)
            today_revenue = today_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            # Total metrics
            total_orders = RestaurantOrders.objects.count()
            total_customers = RestaurantCustomer.objects.count()
            total_menu_items = RestaurantMenuitem.objects.filter(status=1).count()
            # total_menu_items = RestaurantMenuitem.objects.count()
            
            # Recent orders (last 10)
            recent_orders = RestaurantOrders.objects.select_related('customer')\
                .prefetch_related('restaurantorderitem_set__menu_item')\
                .order_by('-order_date')[:10]
            
            recent_orders_data = []
            for order in recent_orders:
                recent_orders_data.append({
                    'order_id': order.id,
                    'order_number': f"ORD{order.id:06d}",
                    'customer_name': order.customer.name,
                    'total_amount': int(order.total_amount),  # Changed to int
                    'status': order.status,
                    'order_date': order.order_date.isoformat()
                })
            
            # Status counts
            status_counts = {
                'pending': RestaurantOrders.objects.filter(status='pending').count(),
                'confirmed': RestaurantOrders.objects.filter(status='confirmed').count(),
                'preparing': RestaurantOrders.objects.filter(status='preparing').count(),
                'out_for_delivery': RestaurantOrders.objects.filter(status='out_for_delivery').count(),
                'delivered': RestaurantOrders.objects.filter(status='delivered').count(),
                'cancelled': RestaurantOrders.objects.filter(status='cancelled').count()
            }
            
            return JsonResponse({
                'success': True,
                'stats': {
                    'today_orders': today_orders.count(),
                    'today_revenue': int(today_revenue),  # Changed to int
                    'total_orders': total_orders,
                    'total_customers': total_customers,
                    'total_menu_items': total_menu_items,
                    'status_counts': status_counts
                },
                'recent_orders': recent_orders_data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to fetch dashboard data: {str(e)}'
            }, status=500)

# Get all orders with filtering and search
class AdminOrdersView(View):
    """Get all orders with filtering and search"""
    
    def get(self, request):
        try:
            # Filter parameters
            status = request.GET.get('status')
            date_from = request.GET.get('date_from')
            date_to = request.GET.get('date_to')
            search = request.GET.get('search')
            
            # Start with base queryset
            orders = RestaurantOrders.objects.select_related('customer')\
                .prefetch_related('restaurantorderitem_set__menu_item')\
                .order_by('-order_date')
            
            # Base queryset for counts (without expensive prefetch)
            count_queryset = RestaurantOrders.objects.all()
                        
            valid_statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']

            # Define apply_filters function with proper parameter passing
            def apply_filters(qs, filter_status, filter_date_from, filter_date_to, filter_search):
                if filter_status and filter_status in valid_statuses:
                    qs = qs.filter(status=filter_status)
                    
                if filter_date_from:
                    try:
                        datetime.strptime(filter_date_from, '%Y-%m-%d')
                        qs = qs.filter(order_date__date__gte=filter_date_from)
                    except ValueError:
                        pass  # Skip invalid date filters
                    
                if filter_date_to:
                    try:
                        datetime.strptime(filter_date_to, '%Y-%m-%d')
                        qs = qs.filter(order_date__date__lte=filter_date_to)
                    except ValueError:
                        pass  # Skip invalid date filters
                
                if filter_search:
                    filter_search = filter_search.strip()
                    if filter_search:
                        if filter_search.upper().startswith('ORD'):
                            search_id = filter_search[3:].lstrip('0')
                            try:
                                order_id = int(search_id) if search_id else 0
                                qs = qs.filter(id=order_id)
                            except ValueError:
                                qs = qs.none()
                        else:
                            qs = qs.filter(
                                Q(customer__name__icontains=filter_search) |
                                Q(customer__phone__icontains=filter_search) |
                                Q(delivery_address__icontains=filter_search) |
                                Q(phone__icontains=filter_search)
                            )
                return qs

            # Apply filters to both querysets with proper parameters
            orders = apply_filters(orders, status, date_from, date_to, search)
            count_queryset = apply_filters(count_queryset, status, date_from, date_to, search)

            # Get status counts in a single database query (more efficient)
            status_counts_query = count_queryset.values('status').annotate(count=Count('id'))
            status_counts = {status_val: 0 for status_val in valid_statuses}
            
            for item in status_counts_query:
                if item['status'] in status_counts:
                    status_counts[item['status']] = item['count']
            
            # Total orders count
            total_orders_count = count_queryset.count()
            
            # Process orders data
            orders_data = []
            for order in orders:
                order_items = order.restaurantorderitem_set.all()
                items_summary = []
                
                for item in order_items:
                    items_summary.append({
                        'id': item.menu_item.id,
                        'name': item.menu_item.name,
                        'quantity': item.quantity,
                        'price': int(item.price),  # Changed to int
                        'selected_variation': item.selected_variation or '',
                        'special_instructions': item.special_instructions or ''
                    })
                
                orders_data.append({
                    'order_id': order.id,
                    'order_number': f"ORD{order.id:06d}",
                    'customer_name': order.customer.name,
                    'customer_phone': order.customer.phone,
                    'total_amount': int(order.total_amount),  # Changed to int
                    'status': order.status,
                    'order_date': order.order_date.isoformat() if order.order_date else None,
                    'delivery_address': order.delivery_address,
                    'phone': order.phone,
                    'items_count': order_items.count(),
                    'items': items_summary
                })
            
            return JsonResponse({
                'success': True,
                'total_orders': total_orders_count,
                'status_counts': status_counts,
                'filtered_orders': len(orders_data),
                'orders': orders_data,
                'valid_statuses': valid_statuses
            })
            
        except Exception as e:
            import traceback
            # Correct logger usage
            logger.error(f"Error fetching orders: {str(e)}\n{traceback.format_exc()}")
            return JsonResponse({
                'success': False,
                'error': 'Failed to fetch orders. Please try again later.'
            }, status=500)


#order status update
class UpdateOrderStatusView(View):
    """Update order status"""
    
    def post(self, request):
        try:
            # Parse JSON data
            if request.body:
                data = json.loads(request.body)
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Request body is required'
                }, status=400)
            
            order_identifier = data.get('order_id')  # Can be "ORD000002" or numeric ID
            new_status = data.get('status')
            
            if not order_identifier or not new_status:
                return JsonResponse({
                    'success': False,
                    'error': 'order_id and status are required'
                }, status=400)
            
            valid_statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
            if new_status not in valid_statuses:
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }, status=400)
            
            # Try to find the order by different methods
            order = None
            
            # Method 1: Check if it's an order number (ORD000002 format)
            if isinstance(order_identifier, str) and order_identifier.upper().startswith('ORD'):
                try:
                    order_id_str = order_identifier[3:].lstrip('0')
                    order_id = int(order_id_str) if order_id_str else 0
                    if order_id > 0:
                        order = RestaurantOrders.objects.get(id=order_id)
                except (ValueError, RestaurantOrders.DoesNotExist):
                    order = None
            
            # Method 2: Try as direct numeric ID
            if order is None:
                try:
                    order_id = int(order_identifier)
                    order = RestaurantOrders.objects.get(id=order_id)
                except (ValueError, RestaurantOrders.DoesNotExist):
                    order = None
            
            # Method 3: If still not found, try searching by partial match
            if order is None and isinstance(order_identifier, str):
                try:
                    # Remove any non-numeric characters and try again
                    numeric_id = ''.join(filter(str.isdigit, order_identifier))
                    if numeric_id:
                        order_id = int(numeric_id)
                        order = RestaurantOrders.objects.get(id=order_id)
                except (ValueError, RestaurantOrders.DoesNotExist):
                    order = None
            
            if order is None:
                return JsonResponse({
                    'success': False,
                    'error': f'Order not found: {order_identifier}'
                }, status=404)
            
            # Update the order status
            old_status = order.status
            order.status = new_status
            order.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Order status updated from {old_status} to {new_status}',
                'order_id': order.id,
                'order_number': f"ORD{order.id:06d}",
                'old_status': old_status,
                'new_status': new_status,
                'status': new_status
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON format'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to update order status: {str(e)}'
            }, status=500)


#admin creation
class createowner(View):
    """User registration/signup API"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
            for field in required_fields:
                if field not in data or not data[field]:
                    return JsonResponse({
                        'error': f'{field} is required'
                    }, status=400)
            
            username = data.get('username', data['first_name'] + ' ' + data['last_name'])  # Adding space between first and last name


            email = data['email']
            password = data['password']
            first_name = data['first_name']
            last_name = data['last_name']
            phone = data['phone']
            address = data.get('address', '')
            
            # Validate email format
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, email):
                return JsonResponse({
                    'error': 'Invalid email format'
                }, status=400)
            
            # Validate password strength
            if len(password) < 6:
                return JsonResponse({
                    'error': 'Password must be at least 6 characters long'
                }, status=400)
            
            # Check if username already exists
            if AuthUser.objects.filter(username=username).exists():
                return JsonResponse({
                    'error': 'Username already exists'
                }, status=400)
            
            # Check if email already exists
            if AuthUser.objects.filter(email=email).exists():
                return JsonResponse({
                    'error': 'Email already registered'
                }, status=400)
            
            hashed_password = make_password(password)
            
            # Create user with hashed password
            user = AuthUser.objects.create(
                username=username,
                email=email,
                password=hashed_password,
                first_name=first_name,
                last_name=last_name,
                is_active=1,
                is_staff=1,
                is_superuser=1,
                date_joined=timezone.now()
            )
            
            return JsonResponse({
                'message': 'User registered successfully',
                'user_id': user.id,
                'username': username,
                'email': email
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': f'Registration failed: {str(e)}'
            }, status=500)

#admin login
class OwnerLogin(View):

    def post(self, request):
        try:
            data = json.loads(request.body)
            
            if not data.get('username') or not data.get('password'):
                return JsonResponse({'error': 'Username and password are required'}, status=400)
            
            username = data['username']
            password = data['password']
            
            user = None
            if '@' in username:
                # Login with email
                try:
                    user = AuthUser.objects.get(email=username)
                    print(f"User found by email: {user.username}, is_active: {user.is_active}, is_staff: {user.is_staff}, is_superuser: {user.is_superuser}")
                except AuthUser.DoesNotExist:
                    print(f"User with email {username} not found")
                    return JsonResponse({'error': 'Invalid email or password'}, status=401)
            else:
                # Login with username
                try:
                    user = AuthUser.objects.get(username=username)
                    print(f"User found by username: {user.username}, is_active: {user.is_active}, is_staff: {user.is_staff}, is_superuser: {user.is_superuser}")
                except AuthUser.DoesNotExist:
                    print(f"User with username {username} not found")
                    return JsonResponse({'error': 'Invalid username or password'}, status=401)
            
            # Debug password check and user status
            if user:
                password_correct = check_password(password, user.password)
                print(f"Password correct: {password_correct}")
                print(f"User status - active: {user.is_active}, staff: {user.is_staff}, superuser: {user.is_superuser}")
                
                if password_correct and user.is_active and user.is_staff and user.is_superuser:
                    return JsonResponse({
                        'message': 'Login successful',
                        'user_id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser
                    })
                else:
                    print("Login failed due to:")
                    if not password_correct:
                        print("- Incorrect password")
                    if not user.is_active:
                        print("- User inactive")
                    if not user.is_staff:
                        print("- User not staff")
 

            
            return JsonResponse({'error': 'Invalid username/email or password'}, status=401)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            print(f"Exception: {str(e)}")
            return JsonResponse({'error': f'Login failed: {str(e)}'}, status=500)
            


# get all menu with filters by categories and is_vegetarian and is_available
class GetAllMenuItemsView(View):
    """Get all menu items with filtering"""
    
    def get(self, request):
        try:
            # Get query parameters
            category_id = request.GET.get('category_id')
            available_only = request.GET.get('available_only')
            vegetarian_only = request.GET.get('vegetarian_only')
            
            menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('id')

            # Apply filters
            if category_id:
                menu_items = menu_items.filter(category_id=category_id)
            if available_only:
                menu_items = menu_items.filter(is_available=True)
            if vegetarian_only:
                menu_items = menu_items.filter(is_vegetarian=True)
                    
            items_data = []
            for item in menu_items:
                is_available, availability_message = self.check_availability(item)

                item_data = {
                    'id': item.id,
                    'name': item.name,
                    'description': item.description,
                    'price': int(item.price) if item.price else None,  # Changed to int
                    'pricing_type': item.pricing_type,
                    'price_variations': item.price_variations or {},
                    'is_available': is_available,  # Use the result from check_availability
                    'is_vegetarian': bool(item.is_vegetarian),
                    'category_id': item.category.id,
                    'category_name': item.category.name,
                    'image': item.image,
                    'created_at': item.created_at.isoformat() if item.created_at else None
                }
                
                # Add availability message if item is not available
                if not is_available and availability_message:
                    item_data['availability_message'] = availability_message
                
                items_data.append(item_data)

            return JsonResponse({
                'success': True,
                'total_items': len(items_data),
                'menu_items': items_data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to fetch menu items: {str(e)}'
            }, status=500)

    def check_availability(self, item):
        """Check item availability"""
        if not item.is_available:
            return False, "Item is currently unavailable"
        
        if hasattr(item, 'availability_schedule') and item.availability_schedule:
            pass
            
        return True, None

# admin get all menu items view
class AdminGetAllMenuItemsView(View):
    """Get all menu items with filtering"""
    
    def get(self, request):
        try:
            # Get query parameters
            category_id = request.GET.get('category_id')
            available_only = request.GET.get('available_only')
            vegetarian_only = request.GET.get('vegetarian_only')
            
            menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('id')

            # Apply filters
            if category_id:
                menu_items = menu_items.filter(category_id=category_id)
            if available_only:
                menu_items = menu_items.filter(is_available=True)
            if vegetarian_only:
                menu_items = menu_items.filter(is_vegetarian=True)
                    
            items_data = []
            for item in menu_items:
                items_data.append({
                    'id': item.id,
                    'name': item.name,
                    'description': item.description,
                    'price': int(item.price) if item.price else None,  # Changed to int
                    'pricing_type': item.pricing_type,
                    'price_variations': item.price_variations or {},
                    'is_available': bool(item.is_available),
                    'is_vegetarian': bool(item.is_vegetarian),
                    'category_id': item.category.id,
                    'category_name': item.category.name,
                    'image': item.image,
                    'created_at': item.created_at.isoformat() if item.created_at else None
                })
            
            return JsonResponse({
                'success': True,
                'total_items': len(items_data),
                'menu_items': items_data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to fetch menu items: {str(e)}'
            }, status=500)
    

#create menu item  with category id and image url
class CreateMenuItemView(View):
    """Create new menu item with image URL (Admin only)"""

    def post(self, request):
        try:
            data = json.loads(request.body)

            # Validate required fields
            required_fields = ['name', 'description', 'category_id', 'pricing_type', 'image']
            for field in required_fields:
                if field not in data or not str(data[field]).strip():
                    return JsonResponse({
                        'success': False,
                        'error': f'{field} is required'
                    }, status=400)

            # menu_items = RestaurantMenuitem.objects.filter(category__status=1).order_by('name')
            # category = RestaurantCategory.objects.filter(id=data['category_id'], status=1).get()
            # category = RestaurantCategory.objects.get(id=data['category_id'])



            # Validate category exists
            try:
                category = RestaurantCategory.objects.filter(id=data['category_id'], status=1).get()
            except RestaurantCategory.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Category not found'
                }, status=400)

            # Validate pricing type
            if data['pricing_type'] not in ['single', 'multiple']:
                return JsonResponse({
                    'success': False,
                    'error': 'pricing_type must be either "single" or "multiple"'
                }, status=400)

            # Validate price fields based on pricing type
            if data['pricing_type'] == 'single':
                if 'price' not in data:
                    return JsonResponse({
                        'success': False,
                        'error': 'Price is required for single pricing type'
                    }, status=400)
                if data['price'] <= 0:
                    return JsonResponse({
                        'success': False,
                        'error': 'Price must be greater than 0'
                    }, status=400)

            if data['pricing_type'] == 'multiple':
                if 'price_variations' not in data:
                    return JsonResponse({
                        'success': False,
                        'error': 'Price variations are required for multiple pricing type'
                    }, status=400)
                if not isinstance(data['price_variations'], dict) or not data['price_variations']:
                    return JsonResponse({
                        'success': False,
                        'error': 'Price variations must be a non-empty object'
                    }, status=400)
                # Validate each price in variations
                for variation, price in data['price_variations'].items():
                    if price <= 0:
                        return JsonResponse({
                            'success': False,
                            'error': f'Price for "{variation}" must be greater than 0'
                        }, status=400)

            # Validate image URL format
            image_url = data['image'].strip()
            if not (image_url.startswith('http://') or
                    image_url.startswith('https://') or
                    image_url.startswith('/') or
                    image_url.startswith('data:image')):
                return JsonResponse({
                    'success': False,
                    'error': 'Image must be a valid URL, file path, or base64 data URL'
                }, status=400)

            # Create menu item
            menu_item = RestaurantMenuitem.objects.create(
                name=data['name'].strip(),
                description=data['description'].strip(),
                category=category,
                pricing_type=data['pricing_type'],
                price=Decimal(str(data.get('price'))) if data.get('price') else None,
                price_variations=data.get('price_variations', {}),
                is_available=bool(data.get('is_available', True)),
                is_vegetarian=bool(data.get('is_vegetarian', False)),
                image=image_url,  # ✅ Always required
                status=1,
                availability_schedule=data.get('availability_schedule'),
                created_at=timezone.now()
            )

            # Prepare response data
            response_data = {
                'id': menu_item.id,
                'name': menu_item.name,
                'description': menu_item.description,
                'pricing_type': menu_item.pricing_type,
                'price_variations': menu_item.price_variations or {},
                'is_available': bool(menu_item.is_available),
                'is_vegetarian': bool(menu_item.is_vegetarian),
                'category_id': menu_item.category.id,
                'category_name': menu_item.category.name,
                'image': menu_item.image,
                'created_at': menu_item.created_at.isoformat() if menu_item.created_at else None
            }

            # Add price field for single pricing
            if menu_item.pricing_type == 'single' and menu_item.price:
                response_data['price'] = int(menu_item.price)  # Changed to int

            return JsonResponse({
                'success': True,
                'message': 'Menu item created successfully',
                'menu_item': response_data
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except InvalidOperation:
            return JsonResponse({
                'success': False,
                'error': 'Invalid price format'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to create menu item: {str(e)}'
            }, status=500)
            
        
#update the menu item
class UpdateMenuItemView(View):
    """Update menu item by ID (Admin only)"""

    def post(self, request):
        """
        Update menu item by ID - item_id should be in request body
        """
        # Step 1: Parse JSON data
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data in request body'
            }, status=400)

        # Step 2: Validate item_id
        item_id = data.get("item_id")
        try:
            item_id = int(item_id)
            if item_id <= 0:
                raise ValueError("Invalid ID")
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'error': 'Invalid item ID. Must be a positive number.'
            }, status=400)

        # Step 3: Remove item_id from update data to avoid conflicts
        update_data = {k: v for k, v in data.items() if k != "item_id"}

        # Step 4: Ensure there's something to update
        if not update_data:
            return JsonResponse({
                'success': False,
                'error': 'No fields provided for update'
            }, status=400)


        # Step 5: Get menu item or return error
        try:
            # menu_item = RestaurantMenuitem.objects.get(id=item_id)
            menu_item = RestaurantMenuitem.objects.filter(id=item_id,category__status=1).get()

        except RestaurantMenuitem.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Menu item with ID {item_id} does not exist'
            }, status=404)

        # Step 6: Update fields
        updated_fields = []
        basic_fields = [
            'name', 'description', 'price', 'image',
            'pricing_type', 'is_available', 'is_vegetarian',
            'price_variations', 'availability_schedule'
        ]

        for field in basic_fields:
            if field in update_data:
                if field in ['is_available', 'is_vegetarian']:
                    setattr(menu_item, field, bool(update_data[field]))
                else:
                    setattr(menu_item, field, update_data[field])
                updated_fields.append(field)

        # Update category if provided
        if 'category_id' in update_data:
            try:
                # category = RestaurantCategory.objects.get(id=update_data['category_id'])
                category = RestaurantCategory.objects.filter(id=update_data['category_id'], status=1).get()
                menu_item.category = category
                updated_fields.append('category_id')
            except RestaurantCategory.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid category ID provided'
                }, status=400)

        # Step 7: Save changes
        try:
            menu_item.save()
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Database error: {str(e)}'
            }, status=500)

        # Step 8: Return success response
        return JsonResponse({
            'success': True,
            'message': 'Menu item updated successfully',
            'item_id': item_id,
            'updated_fields': updated_fields,
            'menu_item': {
                'id': menu_item.id,
                'name': menu_item.name,
                'description': menu_item.description,
                'price': str(menu_item.price) if menu_item.price else None,
                'category': menu_item.category.name if menu_item.category else None,
                'is_available': bool(menu_item.is_available),
                'is_vegetarian': bool(menu_item.is_vegetarian),
                'image': menu_item.image
            }
        })         

#delete the menu item
class DeleteMenuItemView(View):
    """Delete menu item by ID (Admin only)"""

    def post(self, request):
        """
        Delete menu item by ID - item_id should be in request body
        """
        # Step 1: Parse JSON data
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data in request body'
            }, status=400)

        # Step 2: Validate item_id
        item_id = data.get("item_id")
        try:
            item_id = int(item_id)
            if item_id <= 0:
                raise ValueError("Invalid ID")
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'error': 'Invalid item ID. Must be a positive number.'
            }, status=400)

        # Step 3: Get menu item or return error
        try:
            menu_item = RestaurantMenuitem.objects.get(id=item_id)
        except RestaurantMenuitem.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Menu item with ID {item_id} does not exist'
            }, status=404)

        try:
            menu_item.status = 0
            menu_item.save()
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'Failed to delete menu item: {str(e)}'
            }, status=500)


        # Step 5: Return success response
        return JsonResponse({
            'success': True,
            'message': f'Menu item with ID {item_id} deleted successfully'
        })

# File upload to S3
class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    
# File upload view
class FileUploadView(APIView):
    parser_classes = (MultiPartParser,)  # Handles multipart form-data for video uploads

    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = request.FILES.get('file')
            if not file:
                return Response(
                    {'error': 'No file provided in form-data'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_name = file.name
            # Specify the S3 folder path
            s3_folder = 'dishes/'
            s3_key = f"{s3_folder}{file_name}"  # Store in dishes/ folder
            
            # Validate file size (optional: enforce 200 MB limit)
            max_size_mb = 200
            if file.size > max_size_mb * 1024 * 1024:
                return Response(
                    {'error': f'File size exceeds {max_size_mb} MB limit'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Initialize S3 client
            try:
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                )
                
                # Upload file to S3 with streaming for large files
                s3_client.upload_fileobj(
                    file,
                    settings.AWS_STORAGE_BUCKET_NAME,
                    s3_key,
                    ExtraArgs={
                        'ContentType': file.content_type or 'video/mp4'  # Default to video/mp4 for videos
                    }
                )
                
                # Generate S3 URL
                s3_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}"
                
                return Response({
                    'file_name': file_name,
                    's3_url': s3_url,
                    'file_size': file.size,
                    'folder': s3_folder
                }, status=status.HTTP_201_CREATED)
                
            except ClientError as e:
                error_code = e.response['Error']['Code']
                error_message = e.response['Error']['Message']
                return Response(
                    {'error': f"S3 Error: {error_code} - {error_message}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                return Response(
                    {'error': f"Upload failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )





