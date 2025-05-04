from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerialiser(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    # all custom methods automatically applied when calling is_valid() inside view 
    # the methods that are validate_<fieldname>(self,value)
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        
    def validate_email(self,value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
    
