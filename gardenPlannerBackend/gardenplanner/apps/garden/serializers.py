from rest_framework import serializers
from django.contrib.auth.models import User

# Serializers will be implemented later
# For example:
# 
# class PlantSerializer(serializers.ModelSerializer):
#     pass
# 
# class GardenSerializer(serializers.ModelSerializer):
#     pass 

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    location = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'location']

    def create(self, validated_data):
        location = validated_data.pop('location', None)  # handle optional
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
        )
        # PROFILE MODEL IS NEEDED
        if location:
            user.profile.location = location  # assuming a profile model exists
            user.profile.save()
        return user
