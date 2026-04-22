from rest_framework import serializers
from .models import Task, TaskStep


class TaskStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskStep
        fields = ['id', 'title', 'is_done', 'order']


class TaskSerializer(serializers.ModelSerializer):
    steps = TaskStepSerializer(many=True, read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    assigned_to = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'subject', 'description',
            'deadline', 'priority', 'status', 'task_type',
            'raw_input', 'ai_generated',
            'recommended_start', 'estimated_minutes',
            'missed_reminders', 'points_awarded',
            'created_by', 'assigned_to',
            'created_at', 'updated_at',
            'steps',
        ]
        read_only_fields = ['created_by', 'ai_generated', 'points_awarded', 'missed_reminders']


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'subject', 'description', 'deadline', 'priority', 'task_type', 'assigned_to', 'estimated_minutes']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)