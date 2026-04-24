from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'student'),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    linked_teacher_username = serializers.SerializerMethodField()

    def get_linked_teacher_username(self, obj):
        return obj.linked_teacher.username if obj.linked_teacher else None

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'linked_student', 'linked_teacher', 'linked_teacher_username']