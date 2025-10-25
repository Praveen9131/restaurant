# urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ==================== AUTHENTICATION URLs ====================
    path('signup/', views.SignUpView.as_view(), name='signup'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Admin Authentication
    path('Owner-Login/', views.OwnerLogin.as_view(), name='OwnerLogin'),
    path('create-admin/', views.createowner.as_view(), name='create-admin'),


    # ==================== CATEGORY URLs ====================
    path('categories/', views.CategoryListView.as_view(), name='categories'),
    path('create-categories/', views.CategoryCreateView.as_view(), name='create-categories'),
    path('delete-categories/', views.CategoryDeleteView.as_view(), name='delete-category'),
    
    
    path('deletedcategories/', views.DeletedCategoryListView.as_view(), name='deletedcategories'),
    path('updatedeletedcategories/', views.UpdatedeletedcategoriesView.as_view(), name='deletedcategories'),

    

    # ==================== MENU ITEM URLs ====================
    path('complete-menu/', views.MenuItemListView.as_view(), name='complete-menu'),
    path('category-menu/', views.MenuWithCategoriesView.as_view(), name='category-menu'),
    path('menu-item/', views.MenuItemDetailView.as_view(), name='menu-item-by-itemid'),
    path('menu/search/', views.MenuSearchView.as_view(), name='search-menu'),
    path('GetAllMenu/', views.GetAllMenuItemsView.as_view(), name='GetAllMenu'),
    
    
    ####### Admin menu items view #######
    path('AdminGetAllMenu/', views.AdminGetAllMenuItemsView.as_view(), name='GetAllMenu'),

    
    
    # ==================== ADMIN MENU CRUD ====================
    path('createmenuitem/', views.CreateMenuItemView.as_view(), name='CreateMenuItem'),
    path('updatemenuitem/', views.UpdateMenuItemView.as_view(), name='UpdateMenuItem'),
    path('deletemenuitem/', views.DeleteMenuItemView.as_view(), name='deleteMenuItem'),

    

    # ==================== CUSTOMER URLs ====================
    path('customer/create/', views.CustomerCreateView.as_view(), name='create-customer'),
    
    

    # ==================== ORDER URLs ====================
    path('order/create/', views.OrderCreateView.as_view(), name='create-order'),
    path('customer_orders/', views.CustomerOrdersView.as_view(), name='customer-orders'),
    path('order/<int:order_id>/', views.OrderDetailView.as_view(), name='order-detailview'),
    path('UpdateOrderStatus/', views.UpdateOrderStatusView.as_view(), name='UpdateOrderStatus'),

    # ==================== INQUIRY URLs ====================
    path('inquirycreate/', views.InquiryCreateView.as_view(), name='inquirycreate'),
    path('inquirylist/', views.RestaurantInquiryAPIView.as_view(), name='inquirylist'),
    path('inquiryupdate/', views.RestaurantInquiryStatusUpdateAPIView.as_view(), name='inquiryupdate'),


    # ==================== DASHBOARD & ADMIN URLs ====================
    path('Dashboard/', views.AdminDashboardView.as_view(), name='Dashboard'),
    path('AdminOrdersView/', views.AdminOrdersView.as_view(), name='AdminOrdersView'),
    
    # ==================== FILE UPLOAD URLS ====================
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),
]